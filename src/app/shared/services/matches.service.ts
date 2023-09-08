import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  doc,
  collectionData,
  addDoc,
  deleteDoc,
  DocumentReference,
  Timestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';
import { IMatch } from '../interfaces/match.interface';
import { InfoBarService } from './info-bar.service';
import { FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class MatchesService implements OnDestroy {
  translateSub: Subscription;

  infoText = '';

  closeText = '';

  public matches$: Observable<any>;

  public playtime$: Observable<any>;

  protected collection: CollectionReference;

  matchesSub$ = new BehaviorSubject(undefined);

  constructor(
    protected db: Firestore,
    protected infoBar: InfoBarService,
    protected translateService: TranslateService
  ) {
    this.collection = collection(
      db,
      `${environment.prefix}Matches`
    ) as CollectionReference<IMatch>;
    this.matches$ = collectionData(this.collection).pipe(shareReplay(1));

    this.matches$.subscribe(this.matchesSub$);

    const playtimeCol = collection(
      db,
      `${environment.prefix}Playtime`
    ) as CollectionReference<IMatch>;
    this.playtime$ = collectionData(playtimeCol).pipe(shareReplay(1));

    this.getText();

    this.translateSub = this.translateService.onLangChange.subscribe(
      (_event: LangChangeEvent) => {
        this.getText();
      }
    );
  }

  ngOnDestroy(): void {
    this.translateSub.unsubscribe();
  }

  getText() {
    this.translateService
      .get('info')
      .pipe(take(1))
      .subscribe((res) => {
        this.infoText = res.saveMatch;
        this.closeText = res.close;
      });
  }

  private static getRoundInfos(
    team: string,
    form: FormGroup,
    type: 'win' | 'dominationTeamOne' | 'dominationTeamTwo'
  ): number {
    const rounds = [
      form.get(`rounds.one.${type}`).value,
      form.get(`rounds.two.${type}`).value,
      form.get(`rounds.three.${type}`).value,
    ];

    return rounds.filter((round) => {
      if (type === 'win') {
        return round === team;
      } else {
        return round;
      }
    }).length;
  }

  public async add(showingTeams: boolean, match: FormGroup): Promise<void> {
    const team1 = match.get('players.team1.teamId').value;
    const team2 = match.get('players.team2.teamId').value;

    const winTeam1 = MatchesService.getRoundInfos('team1', match, 'win');
    const winTeam2 = MatchesService.getRoundInfos('team2', match, 'win');

    const dominationsTeam1 = MatchesService.getRoundInfos(
      'team1',
      match,
      'dominationTeamOne'
    );
    const dominationsTeam2 = MatchesService.getRoundInfos(
      'team2',
      match,
      'dominationTeamTwo'
    );

    const defeats: DocumentReference[] = [];
    const dominations: DocumentReference[] = [];

    const teams = [
      doc(this.db, `${environment.prefix}Teams/${team1})}`),
      doc(this.db, `${environment.prefix}Teams/${team2})}`),
    ];

    const players = [
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team1.one').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team1.two').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team2.one').value.id}`
      ),
      doc(
        this.db,
        `${environment.prefix}Users/${match.get('players.team2.two').value.id}`
      ),
    ];

    const result = {
      [`${team1}`]: winTeam1,
      [`${team2}`]: winTeam2,
    };

    for (let i = 0; i < dominationsTeam1; i++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
    }

    for (let j = 0; j < dominationsTeam2; j++) {
      dominations.push(doc(this.db, `${environment.prefix}Teams/${team2}`));
      defeats.push(doc(this.db, `${environment.prefix}Teams/${team1}`));
    }

    const resultMatch: IMatch = {
      defeats,
      dominations,
      players,
      result,
      teams,
      type: `${winTeam1}:${winTeam2}`,
      date: Timestamp.now(),
    };

    return await addDoc(this.collection, resultMatch)
      .then(() => {
        this.infoBar.openCustomSnackBar(this.infoText, this.closeText, 5);
      })
      .catch((err) => {
        this.infoBar.openComponentSnackBar(5);
        console.log('ERROR', err);
      });
  }

  async delete(matchId) {
    await deleteDoc(doc(this.db, this.collection.path, matchId));
  }
}
