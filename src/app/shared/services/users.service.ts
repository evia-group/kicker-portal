import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  doc,
  deleteDoc,
  collectionSnapshots,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { IUser } from '../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  public users$: Observable<any>;

  protected collection: CollectionReference;

  constructor(protected db: Firestore) {
    this.collection = collection(
      this.db,
      `${environment.prefix}Users`
    ) as CollectionReference<IUser>;

    this.users$ = collectionSnapshots(this.collection).pipe(
      map((actions) => {
        return actions.map((a) => {
          const data = a.data() as IUser;
          const id = a.id;
          return { id, ...data };
        });
      }),
      shareReplay(1)
    );
  }

  async delete(userId) {
    await deleteDoc(doc(this.db, this.collection.path, userId));
  }
}
