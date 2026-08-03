import { Provider } from '@nestjs/common';
import { App, initializeApp } from 'firebase-admin/app';

export const FIREBASE_ADMIN_APP = Symbol('FIREBASE_ADMIN_APP');

export const firebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN_APP,
  useFactory: (): App => initializeApp(),
};
