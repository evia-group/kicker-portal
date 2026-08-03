import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guards the endpoint the physical kicker table hardware calls. Deliberately
 * separate from EntraAuthGuard: the table has no Entra identity, only a
 * static, long-lived key issued once during setup.
 */
@Injectable()
export class KickerApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-api-key'];
    const expected = process.env.KICKER_API_KEY;

    if (!expected) {
      throw new Error('KICKER_API_KEY is not set');
    }
    if (key !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
