import {Injectable} from '@angular/core';
import { Firestore, collection, CollectionReference, doc, 
  DocumentReference, updateDoc, setDoc, deleteDoc, writeBatch, 
  collectionSnapshots } from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {ITeam} from '../interfaces/user.interface';
import {environment} from '../../../environments/environment';
import { increment } from "firebase/firestore";

const increment_value = increment(1);

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

  public async add(id: string, players: string[], name: string) {
    const referencePlayer: DocumentReference[] = [
        doc(this.db, `Users/${players[0]}`), doc(this.db, `Users/${players[1]}`)
      ]
    ;
    const team: ITeam = {
      name,
      players: referencePlayer,
      wins: 0,
      losses: 0,
      stats: {
        '0:2': 0,
        '2:0': 0,
        '1:2': 0,
        '2:1': 0,
      },
      dominations: 0,
      defeats: 0
    };

    await updateDoc(doc(this.db, this.collection.path, id), {})
      .catch(async () => {
        await setDoc(doc(this.db, this.collection.path, id), team);
      });
  }

  public async delete(teamId) {
    await deleteDoc(doc(this.db, this.collection.path, teamId));
    // this.collection.doc(teamId).delete();
  }

  async incrementTeamStates(teamId: string, wins: boolean, losses: boolean, defeats: boolean, dominations: boolean, type: string) {
    const teamRef = doc(this.db, environment.prefix + 'Teams', teamId);

    const batch = writeBatch(this.db);
    batch.update(teamRef, {[`stats.${type}`]: increment_value});

    if(wins) batch.update(teamRef, {['wins']: increment_value});
    if(losses) batch.update(teamRef, {['losses']: increment_value});
    if(defeats) batch.update(teamRef, {['defeats']: increment_value});
    if(dominations) batch.update(teamRef, {['dominations']: increment_value});

    await batch.commit();
  }

  public async update(teamId: string, updateObject: any) {
    console.log('TeamUpdate', teamId, updateObject);
    await updateDoc(doc(this.db, this.collection.path, teamId), updateObject)
      .then(() => console.log('success'))
      .catch((err) => console.log('err', err));
  }
}