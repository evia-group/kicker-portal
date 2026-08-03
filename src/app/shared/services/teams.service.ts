import { Inject, Injectable } from '@angular/core';
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
import { ITeam } from '../interfaces/user.interface';
import { APP_CONFIG, AppConfig } from '../../core/app-config';
import { IPlayers } from '../interfaces/match.interface';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  public teams$: Observable<any>;

  protected collection: CollectionReference;

  constructor(
    protected db: Firestore,
    @Inject(APP_CONFIG) protected config: AppConfig
  ) {
    this.collection = collection(
      this.db,
      `${this.config.prefix}Teams`
    ) as CollectionReference<ITeam>;
    this.teams$ = collectionSnapshots(this.collection).pipe(
      map((actions) => {
        return actions.map((a) => {
          const data = a.data() as ITeam;
          const id = a.id;
          return { id, ...data };
        });
      }),
      shareReplay(1)
    );
  }

  public createTeamId(team): string {
    const sortetTeam: IPlayers[] = team.sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    const teamId = sortetTeam.map((player) => player.id).join('');

    return teamId;
  }

  public createTeamName(teamPlayers: IPlayers[]) {
    const sortedTeam = teamPlayers.sort((a, b) => a.id.localeCompare(b.id));
    const teamName = sortedTeam.map((player) => player.name).join(' - ');

    return teamName;
  }

  public async delete(teamId) {
    await deleteDoc(doc(this.db, this.collection.path, teamId));
  }
}
