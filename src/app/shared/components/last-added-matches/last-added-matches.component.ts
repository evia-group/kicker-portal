import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatchesService } from '../../services/matches.service';
import { IMatch, LastMatches } from '../../interfaces/match.interface';
import { TeamsService } from '../../services/teams.service';
import { combineLatestWith, Observable, Subscription } from 'rxjs';
import { ITeam, IUser } from '../../interfaces/user.interface';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-last-added-matches',
  templateUrl: './last-added-matches.component.html',
  styleUrls: ['./last-added-matches.component.scss'],
})
export class LastAddedMatchesComponent implements OnInit, OnDestroy {
  @Input()
  singleMode = false;

  numberOfMatchesToShow = 5;
  lastAddedMatches: LastMatches[] = [];
  subscription: Subscription;
  matchesAvailable = false;
  currentObservable: Observable<[IMatch[], ITeam[] | IUser[]]>;

  constructor(
    private matchesService: MatchesService,
    private teamsService: TeamsService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.currentObservable = this.singleMode
      ? this.matchesService.singleMatchesSub$.pipe(
          combineLatestWith(this.usersService.users$)
        )
      : this.matchesService.matchesSub$.pipe(
          combineLatestWith(this.teamsService.teams$)
        );

    this.subscription = this.currentObservable.subscribe(
      ([matches, entities]: [IMatch[], ITeam[] | IUser[]]) => {
        this.createLastMatchesList(matches, entities);
      }
    );
  }

  createLastMatchesList(matches: IMatch[], entities: ITeam[] | IUser[]) {
    const currentNumberOfMatches = Math.min(
      this.numberOfMatchesToShow,
      matches.length
    );
    const lastMatches = matches
      .sort((a, b) => {
        return b.date.toMillis() - a.date.toMillis();
      })
      .slice(0, currentNumberOfMatches);
    let lastMatchesStrings: LastMatches[] = lastMatches.map((match) => {
      const entityIds = Object.keys(match.result);
      const resultEntity1 = match.result[entityIds[0]];
      const resultEntity2 = match.result[entityIds[1]];
      const nameEntity1 = this.singleMode
        ? this.getUserNameById(entityIds[0], entities as IUser[])
        : this.getTeamNameById(entityIds[0], entities as ITeam[]);
      const nameEntity2 = this.singleMode
        ? this.getUserNameById(entityIds[1], entities as IUser[])
        : this.getTeamNameById(entityIds[1], entities as ITeam[]);
      return nameEntity1 && nameEntity2
        ? {
            team1: nameEntity1,
            team2: nameEntity2,
            result: resultEntity1 + ':' + resultEntity2,
            date: match.date.toDate(),
          }
        : null;
    });
    lastMatchesStrings = lastMatchesStrings.filter(Boolean);

    if (lastMatchesStrings.length === currentNumberOfMatches) {
      this.lastAddedMatches.length = 0;
      this.lastAddedMatches = lastMatchesStrings;
    }
    this.matchesAvailable = true;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getTeamNameById(teamId: string, teams: ITeam[]) {
    return teams
      .find((team) => team.id === teamId)
      ?.name.replace(/ -/g, '\u00A0-');
  }

  getUserNameById(userId: string, users: IUser[]) {
    return users.find((user) => user.id === userId)?.name;
  }
}
