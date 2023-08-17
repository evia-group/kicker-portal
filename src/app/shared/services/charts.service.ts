import { Injectable } from '@angular/core';
import { IMatch } from '../interfaces/match.interface';
import { AuthService } from './auth.service';
import { ILeaderboard } from '../interfaces/statistic.interface';
import {
  lossesTimeline,
  winsTimeline,
  twoZero,
  zeroTwo,
  twoOne,
  oneTwo,
  name,
} from '../global-variables';

@Injectable({
  providedIn: 'root',
})
export class ChartsService {
  matchesDataAvailable = false;
  selectedPlayer: string;
  selectedTeam: string;
  playerIds: string[] = [];
  playersWithMatches: { id: string; name: string }[] = [];
  teamsWithMatches: { id: string; name: string }[] = [];
  playerYearsList: number[];
  teamYearsList: number[];
  selectedYearPlayer: number;
  selectedYearTeam: number;
  doughnutDataPlayer: number[];
  doughnutDataTeam: number[];
  matchesChartDataPlayer: number[];
  matchesChartDataTeam: number[];

  constructor(private authService: AuthService) {}

  createStatisticData(matches: IMatch[], playersMap, teamsMap) {
    this.clearTimelines(playersMap, teamsMap);
    if (matches.length > 0) {
      this.matchesDataAvailable = true;
      this.selectedPlayer = undefined;
      this.selectedTeam = undefined;
      const loggedInUser = this.authService.user.uid;
      matches.sort((a, b) => a.date.toMillis() - b.date.toMillis());

      const playerIdsWithMatches: string[] = [];
      const teamIdsWithMatches: string[] = [];

      matches.forEach((match: IMatch) => {
        const matchTeams = Object.keys(match.result);
        const team1 = matchTeams[0];
        const team2 = matchTeams[1];
        const resultTeam1 = match.result[team1];

        const matchYear = match.date.toDate().getFullYear();
        const matchMonth = match.date.toDate().getMonth();
        const teamIds = Array.from(teamsMap.keys());

        this.playerIds = Array.from(playersMap.keys());
        const playersTeam1 = this.getPlayersOfTeam(team1);
        const playersTeam2 = this.getPlayersOfTeam(team2);

        if (teamIds.includes(team1) || teamIds.includes(team2)) {
          playersTeam1.forEach((player) => {
            if (!playerIdsWithMatches.includes(player)) {
              playerIdsWithMatches.push(player);
            }
          });

          playersTeam2.forEach((player) => {
            if (!playerIdsWithMatches.includes(player)) {
              playerIdsWithMatches.push(player);
            }
          });

          const winningTeam = resultTeam1 === 2 ? playersTeam1 : playersTeam2;
          const loosingTeam = resultTeam1 === 2 ? playersTeam2 : playersTeam1;

          winningTeam.forEach((player) => {
            this.updateTimeline(
              playersMap,
              player,
              matchYear,
              matchMonth,
              winsTimeline,
              lossesTimeline
            );
          });

          loosingTeam.forEach((player) => {
            this.updateTimeline(
              playersMap,
              player,
              matchYear,
              matchMonth,
              lossesTimeline,
              winsTimeline
            );
          });

          if (!teamIdsWithMatches.includes(team1) && teamIds.includes(team1)) {
            teamIdsWithMatches.push(team1);
          }

          if (!teamIdsWithMatches.includes(team2) && teamIds.includes(team2)) {
            teamIdsWithMatches.push(team2);
          }

          if (!this.selectedTeam) {
            if (
              (team1.startsWith(loggedInUser) ||
                team1.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team1)
            ) {
              this.selectedTeam = team1;
            } else if (
              (team2.startsWith(loggedInUser) ||
                team2.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team2)
            ) {
              this.selectedTeam = team2;
            }
          }

          if (resultTeam1 === 2) {
            this.updateTimeline(
              teamsMap,
              team1,
              matchYear,
              matchMonth,
              winsTimeline,
              lossesTimeline
            );
            this.updateTimeline(
              teamsMap,
              team2,
              matchYear,
              matchMonth,
              lossesTimeline,
              winsTimeline
            );
          } else {
            this.updateTimeline(
              teamsMap,
              team2,
              matchYear,
              matchMonth,
              winsTimeline,
              lossesTimeline
            );
            this.updateTimeline(
              teamsMap,
              team1,
              matchYear,
              matchMonth,
              lossesTimeline,
              winsTimeline
            );
          }
        }
      });

      if (playerIdsWithMatches.includes(loggedInUser)) {
        this.selectedPlayer = loggedInUser;
      } else {
        this.selectedPlayer = playerIdsWithMatches[0];
      }

      if (!this.selectedTeam) {
        this.selectedTeam = teamIdsWithMatches[0];
      }

      for (let i = 0; i < playerIdsWithMatches.length; i++) {
        const itemId = playerIdsWithMatches[i];
        this.playersWithMatches[i] = {
          id: itemId,
          name: playersMap.get(itemId)[name],
        };
      }

      for (let i = 0; i < teamIdsWithMatches.length; i++) {
        const itemId = teamIdsWithMatches[i];
        this.teamsWithMatches[i] = {
          id: itemId,
          name: teamsMap.get(itemId)[name],
        };
      }

      this.playerYearsList = this.setYearsList(this.selectedPlayer, playersMap);
      this.teamYearsList = this.setYearsList(this.selectedTeam, teamsMap);

      this.selectedYearPlayer =
        this.playerYearsList[this.playerYearsList.length - 1];
      this.selectedYearTeam = this.teamYearsList[this.teamYearsList.length - 1];
      this.doughnutDataPlayer = this.getDoughnutData(
        playersMap.get(this.selectedPlayer)
      );
      this.doughnutDataTeam = this.getDoughnutData(
        teamsMap.get(this.selectedTeam)
      );
      this.matchesChartDataPlayer = this.getMatchesChartData(
        playersMap.get(this.selectedPlayer),
        this.selectedYearPlayer
      );
      this.matchesChartDataTeam = this.getMatchesChartData(
        teamsMap.get(this.selectedTeam),
        this.selectedYearTeam
      );
    }
    return [
      playersMap,
      teamsMap,
      this.selectedPlayer,
      this.playersWithMatches,
      this.selectedYearPlayer,
      this.playerYearsList,
      this.matchesChartDataPlayer,
      this.doughnutDataPlayer,
      this.selectedTeam,
      this.teamsWithMatches,
      this.selectedYearTeam,
      this.teamYearsList,
      this.matchesChartDataTeam,
      this.doughnutDataTeam,
    ];
  }

  clearTimelines(playersMap, teamsMap) {
    playersMap.forEach((player: ILeaderboard) => {
      const playerWinsTimeline = player[winsTimeline];
      if (playerWinsTimeline) {
        playerWinsTimeline.clear();
      }
      const playerLossesTimeline = player[lossesTimeline];
      if (playerLossesTimeline) {
        playerLossesTimeline.clear();
      }
    });
    teamsMap.forEach((team: ILeaderboard) => {
      const teamWinsTimeLine = team[winsTimeline];
      if (teamWinsTimeLine) {
        teamWinsTimeLine.clear();
      }
      const teamLossesTimeLine = team[lossesTimeline];
      if (teamLossesTimeLine) {
        teamLossesTimeLine.clear();
      }
    });
  }

  getPlayersOfTeam(teamId: string): string[] {
    let counter = 0;
    const teamPlayers: string[] = [];

    for (const playerId of this.playerIds) {
      if (teamId.startsWith(playerId) || teamId.endsWith(playerId)) {
        teamPlayers.push(playerId);
        counter++;
      }
      if (counter === 2) {
        break;
      }
    }
    return teamPlayers;
  }

  updateTimeline(
    dataMap: Map<string, ILeaderboard>,
    playerOrTeam: string,
    matchYear: number,
    matchMonth: number,
    mapId: string,
    otherId: string
  ) {
    if (dataMap.get(playerOrTeam)) {
      let actualTimeline = dataMap.get(playerOrTeam)[mapId].get(matchYear);
      if (actualTimeline) {
        actualTimeline[matchMonth]++;
      } else {
        actualTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        actualTimeline[matchMonth] = 1;
        const otherTimeline = dataMap.get(playerOrTeam)[otherId].get(matchYear);
        if (!otherTimeline) {
          dataMap
            .get(playerOrTeam)
            [otherId].set(matchYear, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
      }
      dataMap.get(playerOrTeam)[mapId].set(matchYear, actualTimeline);
    }
  }

  setYearsList(selectedData: string, dataMap: Map<string, ILeaderboard>) {
    const yearsList: number[] = Array.from(
      dataMap.get(selectedData)[winsTimeline].keys()
    );
    const lossesYearsList: number[] = Array.from(
      dataMap.get(selectedData)[lossesTimeline].keys()
    );
    lossesYearsList.forEach((year) => {
      if (!yearsList.includes(year)) {
        yearsList.push(year);
      }
    });
    yearsList.sort((a, b) => a - b);

    return yearsList;
  }

  getDoughnutData(data: ILeaderboard) {
    return [
      data.wins,
      data.losses,
      data.dominations,
      data.defeats,
      data[twoZero],
      data[twoOne],
      data[oneTwo],
      data[zeroTwo],
    ];
  }

  getMatchesChartData(data: ILeaderboard, selYear: number) {
    const wins = data[winsTimeline].get(selYear);
    const losses = data[lossesTimeline].get(selYear);
    const sum: number[] = [];

    for (let i = 0; i < wins.length; i++) {
      sum[i] = wins[i] + losses[i];
    }
    return sum;
  }
}
