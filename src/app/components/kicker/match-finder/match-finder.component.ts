import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { MatchmakingService } from '../../../shared/services/matchmaking.service';
import {
  IProposal,
  IQueueEntry,
  MatchmakingSocketService,
} from '../../../shared/services/matchmaking-socket.service';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { InfoBarService } from '../../../shared/services/info-bar.service';

/** Diese Seite zeigt vorerst nur Kicker. Die Spielart-Umschaltung kommt mit den
 *  /darts-Routen. */
const GAME_TYPE_KEY = 'kicker';

@Component({
  selector: 'app-match-finder',
  templateUrl: './match-finder.component.html',
  styleUrls: ['./match-finder.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIcon,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    DatePipe,
    TranslatePipe,
  ],
})
export class MatchFinderComponent implements OnInit {
  private readonly matchmaking = inject(MatchmakingService);
  private readonly socket = inject(MatchmakingSocketService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly infoBar = inject(InfoBarService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Gesuchte Mannschaftsgroesse: 1 fuer Einzel, 2 fuer Doppel. */
  teamSize = 2;

  readonly entries = signal<IQueueEntry[]>([]);
  readonly proposal = signal<IProposal | null>(null);
  readonly busy = signal(false);

  /**
   * Der Ausgangszustand kommt per HTTP, Aenderungen danach ueber den Socket.
   * Trifft eine Socket-Nachricht ein, waehrend die HTTP-Antwort noch unterwegs
   * ist, darf die dann eintreffende aeltere Antwort den neueren Stand nicht
   * ueberschreiben.
   */
  private liveUpdateSeen = false;

  ngOnInit(): void {
    this.matchmaking
      .list(GAME_TYPE_KEY)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((snapshots) => {
        if (this.liveUpdateSeen) {
          return;
        }
        const own = snapshots.find((s) => s.gameTypeKey === GAME_TYPE_KEY);
        this.entries.set(own?.entries ?? []);
      });

    this.socket.queue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((snapshot) => {
        if (snapshot.gameTypeKey === GAME_TYPE_KEY) {
          this.liveUpdateSeen = true;
          this.entries.set(snapshot.entries);
        }
      });

    this.socket.proposal$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((proposal) => {
        // Der Kanal verteilt an alle. Angezeigt wird nur, was mich betrifft.
        if (
          proposal.gameTypeKey === GAME_TYPE_KEY &&
          proposal.players.some((p) => p.userId === this.currentUser.id)
        ) {
          this.proposal.set(proposal);
        }
      });

    this.socket.resolved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (this.proposal()?.proposalId !== event.proposalId) {
          return;
        }
        this.proposal.set(null);
        this.infoBar.openCustomSnackBar(
          this.translate.instant(`matchmaking.resolved.${event.status}`),
          '',
          4
        );
      });

    this.socket.tableFree$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((gameTypeKey) => {
        // Nur melden, wenn ich selbst warte. Sonst waere es eine Meldung ueber
        // etwas, das mich nichts angeht.
        if (gameTypeKey === GAME_TYPE_KEY && this.isInQueue()) {
          this.infoBar.openCustomSnackBar(
            this.translate.instant('matchmaking.tableFree'),
            '',
            6
          );
        }
      });
  }

  isInQueue(): boolean {
    const id = this.currentUser.id;
    return !!id && this.entries().some((entry) => entry.userId === id);
  }

  /** Wie viele noch fehlen, bis eine Paarung zustande kommt. */
  missingPlayers(): number {
    const sameSize = this.entries().filter(
      (entry) => entry.teamSize === this.teamSize
    ).length;
    return Math.max(0, this.teamSize * 2 - sameSize);
  }

  join(): void {
    this.busy.set(true);
    this.matchmaking.join(GAME_TYPE_KEY, this.teamSize).subscribe({
      next: () => this.busy.set(false),
      error: () => {
        this.busy.set(false);
        this.infoBar.openCustomSnackBar(
          this.translate.instant('matchmaking.joinFailed'),
          '',
          5,
          'alert-snackbar'
        );
      },
    });
  }

  leave(): void {
    this.busy.set(true);
    this.matchmaking.leave(GAME_TYPE_KEY).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }

  respond(response: 'accepted' | 'declined'): void {
    const current = this.proposal();
    if (!current) {
      return;
    }
    this.busy.set(true);
    this.matchmaking.respond(current.proposalId, response).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result.status === 'pending') {
          // Zugestimmt, es fehlen noch andere. Die Karte bleibt stehen, aber
          // ohne Aktionen.
          this.proposal.set({
            ...current,
            players: this.markOwnResponse(current),
          });
        }
      },
      error: () => this.busy.set(false),
    });
  }

  ownResponse(): string {
    const id = this.currentUser.id;
    return (
      this.proposal()?.players.find((p) => p.userId === id)?.response ??
      'pending'
    );
  }

  private markOwnResponse(proposal: IProposal) {
    return proposal.players.map((p) =>
      p.userId === this.currentUser.id ? { ...p, response: 'accepted' } : p
    );
  }
}
