import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {IUser} from '../interfaces/user.interface';
import * as firebase from 'firebase';
import { environment } from '../../../environments/environment';

const increment = firebase.firestore.FieldValue.increment(1);

@Injectable({
  providedIn: 'root',
})
export class UsersService {

  public users$: Observable<any>;

  protected collection: AngularFirestoreCollection;

  constructor(protected db: AngularFirestore) {

    this.collection = this.db.collection<IUser>(`${environment.prefix}Users`);
    this.users$ = this.collection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as IUser;
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }),
      shareReplay(1)
    );
  }

  add(user: IUser) {

    this.collection.doc(user.id).set(user);
  }

  delete(userId) {

    this.collection.doc(userId).delete();
  }

  incrementUserStates(userId: string, wins: boolean, losses: boolean, defeats: boolean, dominations: boolean, type: string) {
    const userReff = this.db.firestore.collection('Users').doc(userId);

    const batch = this.db.firestore.batch();
    batch.update(userReff, {[`stats.${type}`]: increment});

    if(wins) batch.update(userReff, {['wins']: increment});
    if(losses) batch.update(userReff, {['losses']: increment});
    if(defeats) batch.update(userReff, {['defeats']: increment});
    if(dominations) batch.update(userReff, {['dominations']: increment});

    batch.commit();
  }

  public update(userId: string, updateObject: any) {
    console.log('Userupdate', userId, updateObject);
    this.collection.doc(userId).update(updateObject)
      .then(() => console.log('success'))
      .catch((err) => console.log('err', err));
  }
}
