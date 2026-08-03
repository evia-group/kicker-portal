import { Global, Module } from '@nestjs/common';
import { firebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AdminGuard } from './admin.guard';

@Global()
@Module({
  providers: [firebaseAdminProvider, FirebaseAuthGuard, AdminGuard],
  exports: [firebaseAdminProvider, FirebaseAuthGuard, AdminGuard],
})
export class AuthModule {}
