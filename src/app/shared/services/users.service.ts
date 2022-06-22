import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  collectionSnapshots,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { IUser } from '../interfaces/user.interface';
// import firebase from 'firebase/compat/app';
import { environment } from '../../../environments/environment';
import { increment } from 'firebase/firestore';

const increment_value = increment(1);

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  public users$: Observable<any>;

  protected collection: CollectionReference;

  constructor(protected db: Firestore) {
    this.collection = collection(
      this.db,
      `${environment.prefix}Users`,
    ) as CollectionReference<IUser>;

    this.users$ = collectionSnapshots(this.collection).pipe(
      map((actions) => {
        return actions.map((a) => {
          const data = a.data() as IUser;
          const id = a.id;
          return { id, ...data };
        });
      }),
      shareReplay(1),
    );
  }

  async add(user: IUser) {
    await setDoc(doc(this.db, this.collection.path, user.id), user);
  }

  async delete(userId) {
    await deleteDoc(doc(this.db, this.collection.path, userId));
  }

  async incrementUserStates(
    userId: string,
    wins: boolean,
    losses: boolean,
    defeats: boolean,
    dominations: boolean,
    type: string,
  ) {
    const userReff = doc(this.db, environment.prefix + 'Users', userId);

    const batch = writeBatch(this.db);
    batch.update(userReff, { [`stats.${type}`]: increment_value });

    if (wins) batch.update(userReff, { ['wins']: increment_value });
    if (losses) batch.update(userReff, { ['losses']: increment_value });
    if (defeats) batch.update(userReff, { ['defeats']: increment_value });
    if (dominations)
      batch.update(userReff, { ['dominations']: increment_value });

    await batch.commit();
  }

  public async update(userId: string, updateObject: any) {
    console.log('Userupdate', userId, updateObject);
    await updateDoc(doc(this.db, this.collection.path), updateObject)
      .then(() => console.log('success'))
      .catch((err) => console.log('err', err));
  }
}
