import {Injectable} from '@angular/core';
import { Firestore, collection, CollectionReference, doc, 
  deleteDoc, collectionSnapshots } from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {ITeam} from '../interfaces/user.interface';
import {environment} from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class TeamsService {

  public teams$: Observable<any>;

  protected collection: CollectionReference;

  constructor(protected db: Firestore) {

    this.collection = collection(this.db, `${environment.prefix}Teams`) as CollectionReference<ITeam>;
    this.teams$ = collectionSnapshots(this.collection).pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.data() as ITeam;
          const id = a.id;
          return {id, ...data};
        });
      }),
      shareReplay(1)
    );
  }

  public async delete(teamId) {
    await deleteDoc(doc(this.db, this.collection.path, teamId));
  }

}
