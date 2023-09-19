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
  // matchesDataAvailable = false;
  // selectedPlayer: string;
  // selectedTeam: string;
  // playerIds: string[] = [];
  // playersWithMatches: { id: string; name: string }[] = [];
  // teamsWithMatches: { id: string; name: string }[] = [];
  // playerYearsList: number[];
  // teamYearsList: number[];
  // selectedYearPlayer: number;
  // selectedYearTeam: number;
  // doughnutDataPlayer: number[];
  // doughnutDataTeam: number[];
  // matchesChartDataPlayer: number[];
  // matchesChartDataTeam: number[];

  constructor(private authService: AuthService) {}

  createStatisticPlayerData(matches: IMatch[], playersMap) {
    // let matchesDataAvailable = false;
    let selectedPlayer: string;
    let playerIds: string[] = [];
    const playersWithMatches: { id: string; name: string }[] = [];
    let playerYearsList: number[];
    let selectedYearPlayer: number;
    let doughnutDataPlayer: number[];
    let matchesChartDataPlayer: number[];
    this.clearTimeline(playersMap);
    if (matches.length > 0) {
      // matchesDataAvailable = true;
      selectedPlayer = undefined;
      const loggedInUser = this.authService.user.uid;
      matches.sort((a, b) => a.date.toMillis() - b.date.toMillis());

      const playerIdsWithMatches: string[] = [];

      matches.forEach((match: IMatch) => {
        const matchTeams = Object.keys(match.result);
        const team1 = matchTeams[0];
        const team2 = matchTeams[1];
        const resultTeam1 = match.result[team1];

        const matchYear = match.date.toDate().getFullYear();
        const matchMonth = match.date.toDate().getMonth();

        playerIds = Array.from(playersMap.keys());
        const playersTeam1 = this.getPlayersOfTeam(team1, playerIds);
        const playersTeam2 = this.getPlayersOfTeam(team2, playerIds);

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
      });

      if (playerIdsWithMatches.includes(loggedInUser)) {
        selectedPlayer = loggedInUser;
      } else {
        selectedPlayer = playerIdsWithMatches[0];
      }

      for (let i = 0; i < playerIdsWithMatches.length; i++) {
        const itemId = playerIdsWithMatches[i];
        playersWithMatches[i] = {
          id: itemId,
          name: playersMap.get(itemId)[name],
        };
      }

      playerYearsList = this.setYearsList(selectedPlayer, playersMap);

      selectedYearPlayer = playerYearsList[playerYearsList.length - 1];

      doughnutDataPlayer = this.getDoughnutData(playersMap.get(selectedPlayer));
      matchesChartDataPlayer = this.getMatchesChartData(
        playersMap.get(selectedPlayer),
        selectedYearPlayer
      );
    }
    return [
      playersMap,
      selectedPlayer,
      playersWithMatches,
      selectedYearPlayer,
      playerYearsList,
      matchesChartDataPlayer,
      doughnutDataPlayer,
    ];
  }

  createStatisticTeamData(matches: IMatch[], teamsMap) {
    // let matchesDataAvailable = false;
    let selectedTeam: string;
    const teamsWithMatches: { id: string; name: string }[] = [];
    let teamYearsList: number[];
    let selectedYearTeam: number;
    let doughnutDataTeam: number[];
    let matchesChartDataTeam: number[];
    this.clearTimeline(teamsMap);
    if (matches.length > 0) {
      // matchesDataAvailable = true;
      selectedTeam = undefined;
      const loggedInUser = this.authService.user.uid;
      matches.sort((a, b) => a.date.toMillis() - b.date.toMillis());

      const teamIdsWithMatches: string[] = [];

      matches.forEach((match: IMatch) => {
        const matchTeams = Object.keys(match.result);
        const team1 = matchTeams[0];
        const team2 = matchTeams[1];
        const resultTeam1 = match.result[team1];

        const matchYear = match.date.toDate().getFullYear();
        const matchMonth = match.date.toDate().getMonth();
        const teamIds = Array.from(teamsMap.keys());

        if (teamIds.includes(team1) || teamIds.includes(team2)) {
          if (!teamIdsWithMatches.includes(team1) && teamIds.includes(team1)) {
            teamIdsWithMatches.push(team1);
          }

          if (!teamIdsWithMatches.includes(team2) && teamIds.includes(team2)) {
            teamIdsWithMatches.push(team2);
          }

          if (!selectedTeam) {
            if (
              (team1.startsWith(loggedInUser) ||
                team1.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team1)
            ) {
              selectedTeam = team1;
            } else if (
              (team2.startsWith(loggedInUser) ||
                team2.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team2)
            ) {
              selectedTeam = team2;
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

      if (!selectedTeam) {
        selectedTeam = teamIdsWithMatches[0];
      }

      for (let i = 0; i < teamIdsWithMatches.length; i++) {
        const itemId = teamIdsWithMatches[i];
        teamsWithMatches[i] = {
          id: itemId,
          name: teamsMap.get(itemId)[name],
        };
      }

      teamYearsList = this.setYearsList(selectedTeam, teamsMap);

      selectedYearTeam = teamYearsList[teamYearsList.length - 1];
      doughnutDataTeam = this.getDoughnutData(teamsMap.get(selectedTeam));
      matchesChartDataTeam = this.getMatchesChartData(
        teamsMap.get(selectedTeam),
        selectedYearTeam
      );
    }
    return [
      teamsMap,
      selectedTeam,
      teamsWithMatches,
      selectedYearTeam,
      teamYearsList,
      matchesChartDataTeam,
      doughnutDataTeam,
    ];
  }

  clearTimeline(currentMap) {
    currentMap.forEach((item) => {
      const currentWinsTimeline = item[winsTimeline];
      if (currentWinsTimeline) {
        currentWinsTimeline.clear();
      }
      const currentLossesTimeline = item[lossesTimeline];
      if (currentLossesTimeline) {
        currentLossesTimeline.clear();
      }
    });
  }

  getPlayersOfTeam(teamId: string, playerIds: string[]): string[] {
    let counter = 0;
    const teamPlayers: string[] = [];

    for (const playerId of playerIds) {
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
