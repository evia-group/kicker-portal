import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, DocumentReference, Reference} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {ITeam} from '../interfaces/user.interface';
import * as firebase from 'firebase';

const increment = firebase.firestore.FieldValue.increment(1);

@Injectable({
  providedIn: 'root',
})
export class TeamsService {

  public teams$: Observable<any>;

  protected collection: AngularFirestoreCollection;

  constructor(protected db: AngularFirestore) {

    this.collection = this.db.collection<ITeam>('Teams');
    this.teams$ = this.collection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as ITeam;
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }),
      shareReplay(1)
    );
  }

  public add(id: string, players: string[], name: string) {
    const referencePlayer: DocumentReference[] = [
        this.db.doc(`Users/${players[0]}`).ref, this.db.doc(`Users/${players[1]}`).ref
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

    this.collection.doc(id).update({})
      .catch(() => {
        this.collection.doc(id)
          .set(team);
      });
  }

  public delete(teamId) {

    this.collection.doc(teamId).delete();
  }

  incrementTeamStates(teamId: string, wins: boolean, losses: boolean, defeats: boolean, dominations: boolean, type: string) {
    const teamRef = this.db.firestore.collection('Teams').doc(teamId);

    const batch = this.db.firestore.batch();
    batch.update(teamRef, {[`stats.${type}`]: increment});

    if(wins) batch.update(teamRef, {['wins']: increment});
    if(losses) batch.update(teamRef, {['losses']: increment});
    if(defeats) batch.update(teamRef, {['defeats']: increment});
    if(dominations) batch.update(teamRef, {['dominations']: increment});

    batch.commit();
  }

  public update(teamId: string, updateObject: any) {
    console.log('TeamUpdate', teamId, updateObject);
    this.collection.doc(teamId).update(updateObject)
      .then(() => console.log('success'))
      .catch((err) => console.log('err', err));
  }
}
