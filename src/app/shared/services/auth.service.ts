import { Injectable } from '@angular/core';
import {
  User,
  GoogleAuthProvider,
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  signInWithPopup,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsersService } from './users.service';
import { IUser } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User;
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    private afAuth: Auth,
    public userSerice: UsersService,
    public router: Router
  ) {
    authState(afAuth).subscribe((user) => {
      if (user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.loggedIn.next(true);
        this.router.navigate(['/dashboard']);
      } else {
        localStorage.setItem('user', null);
        this.loggedIn.next(false);
        this.router.navigate(['/login']);
      }
    });
  }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.afAuth, email, password);
    this.loggedIn.next(true);
    await this.router.navigate(['/dashboard']);
  }

  async register(email: string, password: string, name: string) {
    await createUserWithEmailAndPassword(this.afAuth, email, password)
      .then((user) => {
        const newUser: IUser = {
          id: user.user.uid,
          name,
          wins: 0,
          losses: 0,
          defeats: 0,
          dominations: 0,
          stats: {
            '0:2': 0,
            '2:0': 0,
            '1:2': 0,
            '2:1': 0,
          },
        };
        this.userSerice.add(newUser);
      })
      .then(() =>
        onAuthStateChanged(this.afAuth, (user) => {
          if (!user.emailVerified) {
            sendEmailVerification(user);
            console.log('Email send to:', user.email);
          } else {
            console.log('Email is verified', user);
          }
        })
      );
  }

  async sendPasswordResetEmail(passwordResetEmail: string) {
    return await sendPasswordResetEmail(this.afAuth, passwordResetEmail);
  }

  async logout() {
    await signOut(this.afAuth);
    localStorage.removeItem('user');
    this.loggedIn.next(false);
    await this.router.navigate(['/login']);
  }

  async loginWithGoogle() {
    await signInWithPopup(this.afAuth, new GoogleAuthProvider());
    this.loggedIn.next(true);
    await this.router.navigate(['/dashboard']);
  }
}
