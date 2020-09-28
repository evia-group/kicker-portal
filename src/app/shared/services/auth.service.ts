import {Injectable} from '@angular/core';
import {auth, User} from 'firebase';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {UsersService} from './users.service';
import {IUser} from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user: User;
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(
    public afAuth: AngularFireAuth,
    public userSerice: UsersService,
    public router: Router,
  ) {
    this.afAuth.authState.subscribe(user => {
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
    await this.afAuth.signInWithEmailAndPassword(email, password);
    this.loggedIn.next(true);
    await this.router.navigate(['/dashboard']);
  }

  async register(email: string, password: string, name: string) {
    const user = await this.afAuth.createUserWithEmailAndPassword(email, password);
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
    await this.userSerice.add(newUser);
  }

  async sendPasswordResetEmail(passwordResetEmail: string) {
    return await this.afAuth.sendPasswordResetEmail(passwordResetEmail);
  }

  async logout() {
    await this.afAuth.signOut();
    localStorage.removeItem('user');
    this.loggedIn.next(false);
    await this.router.navigate(['/login']);
  }

  async loginWithGoogle() {
    await this.afAuth.signInWithPopup(new auth.GoogleAuthProvider());
    this.loggedIn.next(true);
    await this.router.navigate(['/dashboard']);
  }

}
