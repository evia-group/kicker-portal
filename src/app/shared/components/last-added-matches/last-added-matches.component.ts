import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatchesService } from '../../services/matches.service';
import { IMatch, LastMatches } from '../../interfaces/match.interface';
import { TeamsService } from '../../services/teams.service';
import { combineLatestWith, Subscription } from 'rxjs';
import { ITeam } from '../../interfaces/user.interface';

@Component({
  selector: 'app-last-added-matches',
  templateUrl: './last-added-matches.component.html',
  styleUrls: ['./last-added-matches.component.scss'],
})
export class LastAddedMatchesComponent implements OnInit, OnDestroy {
  numberOfMatchesToShow = 5;
  lastAddedMatches: LastMatches[] = [];
  subscription: Subscription;
  matchesAvailable = false;
  constructor(
    private matchesService: MatchesService,
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    this.subscription = this.matchesService.matchesSub$
      .pipe(combineLatestWith(this.teamsService.teams$))
      .subscribe(([matches, teams]: [IMatch[], ITeam[]]) => {
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
          const teamIds = Object.keys(match.result);
          const resultTeam1 = match.result[teamIds[0]];
          const resultTeam2 = match.result[teamIds[1]];
          const nameTeam1 = this.getTeamNameById(teamIds[0], teams);
          const nameTeam2 = this.getTeamNameById(teamIds[1], teams);
          return nameTeam1 && nameTeam2
            ? {
                team1: nameTeam1,
                team2: nameTeam2,
                result: resultTeam1 + ':' + resultTeam2,
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
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getTeamNameById(teamId: string, teams: ITeam[]) {
    return teams
      .find((team) => team.id === teamId)
      ?.name.replace(/ -/g, '\u00A0-');
  }
}
