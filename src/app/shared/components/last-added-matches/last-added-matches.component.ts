import { Component, OnInit } from '@angular/core';
import { MatchesService } from '../../services/matches.service';
import { IMatch } from '../../interfaces/match.interface';
import { TeamsService } from '../../services/teams.service';
import { combineLatestWith } from 'rxjs';
import { ITeam } from '../../interfaces/user.interface';

@Component({
  selector: 'app-last-added-matches',
  templateUrl: './last-added-matches.component.html',
  styleUrls: ['./last-added-matches.component.scss'],
})
export class LastAddedMatchesComponent implements OnInit {
  numberOfMatchesToShow = 5;
  lastAddedMatches = [];
  constructor(
    private matchesService: MatchesService,
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    this.matchesService.matchesSub$
      .pipe(combineLatestWith(this.teamsService.teams$))
      .subscribe((data: [IMatch[], ITeam[]]) => {
        this.lastAddedMatches.length = 0;
        const matches = data[0];
        const teams = data[1];
        if (this.numberOfMatchesToShow > matches.length) {
          this.numberOfMatchesToShow = matches.length;
        }
        matches.sort((a, b) => {
          return b.date.toMillis() - a.date.toMillis();
        });
        // console.log(data);
        const lastMatches = matches.slice(0, this.numberOfMatchesToShow);
        // console.log(lastMatches);
        lastMatches.forEach((match) => {
          const teamIds = Object.keys(match.result);
          const resultTeam1 = match.result[teamIds[0]];
          const resultTeam2 = match.result[teamIds[1]];
          const nameTeam1 = this.getTeamNameById(teamIds[0], teams);
          const nameTeam2 = this.getTeamNameById(teamIds[1], teams);
          if (nameTeam1 && nameTeam2) {
            this.lastAddedMatches.push({
              team1: nameTeam1,
              team2: nameTeam2,
              result: resultTeam1 + ':' + resultTeam2,
            });
          }
        });
      });
  }

  getTeamNameById(teamId: string, teams: ITeam[]) {
    const foundTeam = teams.find((team) => team.id === teamId);
    return foundTeam ? foundTeam.name : undefined;
  }
}
