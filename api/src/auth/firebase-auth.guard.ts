import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { users } from '../db/schema';
import { FIREBASE_ADMIN_APP } from './firebase-admin.provider';
import { AuthenticatedRequest } from './request-user.interface';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_ADMIN_APP) private readonly firebaseApp: App,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const decoded = await getAuth(this.firebaseApp)
      .verifyIdToken(token)
      .catch(() => {
        throw new UnauthorizedException('Invalid or expired token');
      });

    const displayName =
      (decoded.name as string | undefined) ?? decoded.email ?? decoded.uid;
    const user = await this.findOrProvisionUser(decoded.uid, displayName);
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

  private async findOrProvisionUser(firebaseUid: string, displayName: string) {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.legacyFirebaseUid, firebaseUid));

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        isAdmin: existing.isAdmin,
      };
    }

    const [created] = await this.db
      .insert(users)
      .values({ legacyFirebaseUid: firebaseUid, name: displayName })
      .returning();

    return { id: created.id, name: created.name, isAdmin: created.isAdmin };
  }
}
