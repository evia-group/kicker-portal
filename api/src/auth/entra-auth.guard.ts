import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { users } from '../db/schema';
import { AuthenticatedRequest } from './request-user.interface';

interface EntraTokenPayload extends JWTPayload {
  oid?: string;
  name?: string;
  preferred_username?: string;
}

const LOCAL_DEV_OID = 'local-dev';

@Injectable()
export class EntraAuthGuard implements CanActivate {
  private readonly authDisabled: boolean;
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer?: string;
  private readonly audience?: string;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {
    this.authDisabled = process.env.AUTH_DISABLED === 'true';
    if (this.authDisabled) {
      // eslint-disable-next-line no-console
      console.warn(
        '\n⚠️  AUTH_DISABLED=true - every request is authenticated as a ' +
          'fixed local-dev admin user, no token is checked. Never set this ' +
          'outside local development.\n',
      );
      return;
    }

    const tenantId = process.env.ENTRA_TENANT_ID;
    const audience = process.env.ENTRA_AUDIENCE;
    if (!tenantId) {
      throw new Error('ENTRA_TENANT_ID is not set');
    }
    if (!audience) {
      throw new Error('ENTRA_AUDIENCE is not set');
    }

    this.issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    this.audience = audience;
    this.jwks = createRemoteJWKSet(
      new URL(
        `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      ),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (this.authDisabled) {
      request.user = await this.findOrProvisionUser(
        LOCAL_DEV_OID,
        'Local Dev User',
        true,
      );
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const { payload } = await jwtVerify<EntraTokenPayload>(token, this.jwks!, {
      issuer: this.issuer,
      audience: this.audience,
    }).catch(() => {
      throw new UnauthorizedException('Invalid or expired token');
    });

    const oid = payload.oid;
    if (!oid) {
      throw new UnauthorizedException('Token is missing the oid claim');
    }

    const displayName = payload.name ?? payload.preferred_username ?? oid;
    const user = await this.findOrProvisionUser(oid, displayName);
    request.user = user;
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }

  /**
   * Entra's oid is unrelated to the legacy Firebase UID, so accounts
   * migrated from Firestore (matched via legacyFirebaseUid) only pick up
   * their history here if entra_oid was backfilled beforehand via the
   * UID-mapping step - otherwise this provisions a fresh, disconnected user.
   */
  private async findOrProvisionUser(
    entraOid: string,
    displayName: string,
    isAdmin = false,
  ) {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.entraOid, entraOid));

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        isAdmin: existing.isAdmin,
      };
    }

    const [created] = await this.db
      .insert(users)
      .values({ entraOid, name: displayName, isAdmin })
      .returning();

    return { id: created.id, name: created.name, isAdmin: created.isAdmin };
  }
}
