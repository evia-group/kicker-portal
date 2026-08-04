import { Global, Module } from '@nestjs/common';
import { EntraAuthGuard } from './entra-auth.guard';
import { AdminGuard } from './admin.guard';

@Global()
@Module({
  providers: [EntraAuthGuard, AdminGuard],
  exports: [EntraAuthGuard, AdminGuard],
})
export class AuthModule {}
