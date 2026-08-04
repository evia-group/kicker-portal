import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import webpush from 'web-push';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { notificationPreferences, pushSubscriptions } from '../db/schema';
import {
  CreatePushSubscriptionDto,
  UpdatePreferencesDto,
} from './dto/push.dto';

/** Welche Anlaesse es gibt. Entspricht den Spalten in notification_preferences. */
export type NotificationKind = 'proposalReceived' | 'tableFree';

/**
 * Nutzlast in der Form, die `SwPush` erwartet. Ohne die Verschachtelung unter
 * `notification` reicht Angular das Ereignis nicht an `SwPush.notificationClicks`
 * weiter, und ein Klick koennte nicht in die App springen.
 */
export interface PushPayload {
  title: string;
  body: string;
  /** Ziel des Klicks, relativ zum Anwendungsstamm. */
  url: string;
  /** Gleicher Tag ersetzt eine bestehende Meldung statt sie zu stapeln. */
  tag?: string;
  requireInteraction?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly configured: boolean;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    this.configured = !!(publicKey && privateKey && subject);
    if (!this.configured) {
      // Kein harter Fehler: die Anwendung soll auch ohne eingerichtetes Push
      // laufen, dann eben ohne Benachrichtigungen. Ein Absturz beim Start waere
      // hier die schlechtere Antwort.
      this.logger.warn(
        'VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY or VAPID_SUBJECT is missing - ' +
          'push notifications are disabled',
      );
      return;
    }

    webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  }

  async subscribe(
    userId: string,
    dto: CreatePushSubscriptionDto,
    userAgent?: string,
  ) {
    // Derselbe Endpunkt kann nach einem Nutzerwechsel am Geraet zu einem
    // anderen Nutzer gehoeren, deshalb Upsert auf den Endpunkt und nicht
    // einfach einfuegen.
    await this.db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userAgent: userAgent ?? null,
        },
      });

    return { status: 'subscribed' as const };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    this.logger.log(`Subscription removed on request by user ${userId}`);
    return { status: 'unsubscribed' as const };
  }

  async getPreferences(userId: string) {
    const [existing] = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Kein Eintrag heisst "alles an". Erst beim Abschalten entsteht eine Zeile,
    // damit nicht fuer jeden Nutzer eine angelegt werden muss.
    return existing ?? { userId, proposalReceived: true, tableFree: true };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const current = await this.getPreferences(userId);
    const merged = {
      userId,
      proposalReceived: dto.proposalReceived ?? current.proposalReceived,
      tableFree: dto.tableFree ?? current.tableFree,
    };

    await this.db
      .insert(notificationPreferences)
      .values(merged)
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          proposalReceived: merged.proposalReceived,
          tableFree: merged.tableFree,
        },
      });

    return merged;
  }

  /**
   * Schickt eine Meldung an alle Geraete der genannten Nutzer, sofern sie
   * diesen Anlass nicht abgeschaltet haben.
   *
   * Wirft nie: eine fehlgeschlagene Benachrichtigung darf den Vorgang nicht
   * abbrechen, der sie ausgeloest hat. Eine Paarung soll zustande kommen, auch
   * wenn ein Push-Dienst gerade nicht erreichbar ist.
   */
  async notify(
    userIds: string[],
    kind: NotificationKind,
    payload: PushPayload,
  ): Promise<{ sent: number; pruned: number }> {
    if (!this.configured || userIds.length === 0) {
      return { sent: 0, pruned: 0 };
    }

    const recipients = await this.filterByPreference(userIds, kind);
    if (recipients.length === 0) {
      return { sent: 0, pruned: 0 };
    }

    const subscriptions = await this.db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, recipients));

    const body = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-96x96.png',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction ?? false,
        data: { url: payload.url },
      },
    });

    const gone: string[] = [];
    let sent = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body,
          );
          sent++;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          // 404 und 410 heissen: dieses Geraet gibt es nicht mehr. Ohne das
          // Aufraeumen wachsen die abgelaufenen Endpunkte unbegrenzt und jeder
          // Versand wird langsamer.
          if (statusCode === 404 || statusCode === 410) {
            gone.push(subscription.endpoint);
          } else {
            this.logger.warn(
              `Push to ${subscription.endpoint.slice(0, 40)}... failed: ${
                statusCode ?? (error as Error).message
              }`,
            );
          }
        }
      }),
    );

    if (gone.length > 0) {
      await this.db
        .delete(pushSubscriptions)
        .where(inArray(pushSubscriptions.endpoint, gone));
      this.logger.log(`${gone.length} expired push subscriptions removed`);
    }

    if (sent > 0) {
      await this.db
        .update(pushSubscriptions)
        .set({ lastSeenAt: new Date() })
        .where(inArray(pushSubscriptions.userId, recipients));
    }

    return { sent, pruned: gone.length };
  }

  /** Nutzer, die diesen Anlass nicht abgeschaltet haben. */
  private async filterByPreference(
    userIds: string[],
    kind: NotificationKind,
  ): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(notificationPreferences)
      .where(inArray(notificationPreferences.userId, userIds));
    const byUser = new Map(rows.map((row) => [row.userId, row]));

    return userIds.filter((id) => {
      const preference = byUser.get(id);
      // Ohne Eintrag gilt "alles an", siehe getPreferences.
      return preference ? preference[kind] : true;
    });
  }
}
