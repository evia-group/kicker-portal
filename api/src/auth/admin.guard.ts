import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from './request-user.interface';

/** Must run after EntraAuthGuard so request.user is already populated. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }
    return true;
  }
}
