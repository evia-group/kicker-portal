import { Injectable } from '@angular/core';
import { IMatch, ISingleMatch } from '../interfaces/match.interface';
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
  constructor(private authService: AuthService) {}

  createStatisticPlayerData(
    matches: IMatch[] | ISingleMatch[],
    playersMap: Map<string, ILeaderboard>
  ): [
    Map<string, ILeaderboard>,
    { id: string; name: string },
    { id: string; name: string }[],
    number,
    number[],
    number[],
    number[]
  ] {
    let selectedPlayer: { id: string; name: string };
    let playerIds: string[] = [];
    const playersWithMatches: { id: string; name: string }[] = [];
    let playerYearsList: number[];
    let selectedYearPlayer: number;
    let doughnutDataPlayer: number[];
    let matchesChartDataPlayer: number[];
    this.clearTimelineAndElo(playersMap);

    if (matches.length > 0) {
      const loggedInUser = this.authService.user.uid;
      this.sortByDate(matches);

      const playerIdsWithMatches: string[] = [];

      matches.forEach((match: IMatch) => {
        const {
          team1,
          team2,
          resultTeam1,
          resultTeam2,
          matchYear,
          matchMonth,
        } = this.getMatchData(match);

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

        this.calculateElo(
          playersTeam1,
          playersTeam2,
          playersMap,
          match,
          team1,
          resultTeam1,
          resultTeam2
        );
      });

      for (let i = 0; i < playerIdsWithMatches.length; i++) {
        const itemId = playerIdsWithMatches[i];
        playersWithMatches[i] = {
          id: itemId,
          name: playersMap.get(itemId)[name],
        };
      }

      this.sortByName(playersWithMatches);

      if (playerIdsWithMatches.includes(loggedInUser)) {
        selectedPlayer = playersWithMatches.find(
          (player) => player.id === loggedInUser
        );
      } else {
        selectedPlayer = playersWithMatches[0];
      }

      playerYearsList = this.setYearsList(selectedPlayer.id, playersMap);

      selectedYearPlayer = playerYearsList[playerYearsList.length - 1];

      doughnutDataPlayer = this.getDoughnutData(
        playersMap.get(selectedPlayer.id)
      );
      matchesChartDataPlayer = this.getMatchesChartData(
        playersMap.get(selectedPlayer.id),
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

  createStatisticTeamData(
    matches: IMatch[],
    teamsMap: Map<string, ILeaderboard>
  ): [
    Map<string, ILeaderboard>,
    { id: string; name: string },
    { id: string; name: string }[],
    number,
    number[],
    number[],
    number[]
  ] {
    let selectedTeam: { id: string; name: string };
    let selectedTeamId: string;
    const teamsWithMatches: { id: string; name: string }[] = [];
    let teamYearsList: number[];
    let selectedYearTeam: number;
    let doughnutDataTeam: number[];
    let matchesChartDataTeam: number[];
    this.clearTimelineAndElo(teamsMap);
    if (matches.length > 0) {
      const loggedInUser = this.authService.user.uid;
      this.sortByDate(matches);

      const teamIdsWithMatches: string[] = [];

      matches.forEach((match: IMatch) => {
        const {
          team1,
          team2,
          resultTeam1,
          resultTeam2,
          matchYear,
          matchMonth,
        } = this.getMatchData(match);
        const teamIds = Array.from(teamsMap.keys());

        if (teamIds.includes(team1) || teamIds.includes(team2)) {
          if (!teamIdsWithMatches.includes(team1) && teamIds.includes(team1)) {
            teamIdsWithMatches.push(team1);
          }

          if (!teamIdsWithMatches.includes(team2) && teamIds.includes(team2)) {
            teamIdsWithMatches.push(team2);
          }

          if (!selectedTeamId) {
            if (
              (team1.startsWith(loggedInUser) ||
                team1.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team1)
            ) {
              selectedTeamId = team1;
            } else if (
              (team2.startsWith(loggedInUser) ||
                team2.endsWith(loggedInUser)) &&
              teamIdsWithMatches.includes(team2)
            ) {
              selectedTeamId = team2;
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

        this.calculateElo(
          [team1],
          [team2],
          teamsMap,
          match,
          team1,
          resultTeam1,
          resultTeam2
        );
      });

      for (let i = 0; i < teamIdsWithMatches.length; i++) {
        const itemId = teamIdsWithMatches[i];
        teamsWithMatches[i] = {
          id: itemId,
          name: teamsMap.get(itemId)[name],
        };
      }

      this.sortByName(teamsWithMatches);

      if (!selectedTeamId) {
        selectedTeamId = teamsWithMatches[0].id;
      }

      selectedTeam = teamsWithMatches.find(
        (team) => team.id === selectedTeamId
      );

      teamYearsList = this.setYearsList(selectedTeamId, teamsMap);

      selectedYearTeam = teamYearsList[teamYearsList.length - 1];
      doughnutDataTeam = this.getDoughnutData(teamsMap.get(selectedTeamId));
      matchesChartDataTeam = this.getMatchesChartData(
        teamsMap.get(selectedTeamId),
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

  private getMatchData(match: IMatch) {
    const matchTeams = Object.keys(match.result);
    const team1 = matchTeams[0];
    const team2 = matchTeams[1];
    const resultTeam1 = match.result[team1];
    const resultTeam2 = match.result[team2];

    const matchYear = match.date.toDate().getFullYear();
    const matchMonth = match.date.toDate().getMonth();
    return { team1, team2, resultTeam1, resultTeam2, matchYear, matchMonth };
  }

  private calculateElo(
    playersTeam1: string[],
    playersTeam2: string[],
    playersMap: Map<string, ILeaderboard>,
    match: IMatch,
    team1: string,
    resultTeam1: number,
    resultTeam2: number
  ) {
    const T1P1 = playersTeam1[0];
    const T1P2 = playersTeam1[1];
    const T2P1 = playersTeam2[0];
    const T2P2 = playersTeam2[1];

    let allAvailable: boolean;
    if (T1P2) {
      allAvailable =
        playersMap.has(T1P1) &&
        playersMap.has(T1P2) &&
        playersMap.has(T2P1) &&
        playersMap.has(T2P2);
    } else {
      allAvailable = playersMap.has(T1P1) && playersMap.has(T2P1);
    }

    if (allAvailable) {
      const oldRatingT1P1 = playersMap.get(T1P1).elo;
      const oldRatingT1P2 = playersMap.has(T1P2) ? playersMap.get(T1P2).elo : 0;
      const oldRatingT2P1 = playersMap.get(T2P1).elo;
      const oldRatingT2P2 = playersMap.has(T2P2) ? playersMap.get(T2P2).elo : 0;

      const T1Rating = (oldRatingT1P1 + oldRatingT1P2) / 2;
      const T2Rating = (oldRatingT2P1 + oldRatingT2P2) / 2;

      const ET1 = this.getExpectedScore(T1Rating, T2Rating);
      const ET2 = this.getExpectedScore(T2Rating, T1Rating);

      let dominationsT1 = 0;
      let dominationsT2 = 0;

      match.dominations.forEach((domination) => {
        if (domination.id === team1) {
          dominationsT1++;
        } else {
          dominationsT2++;
        }
      });

      let defeatsT1 = 0;
      let defeatsT2 = 0;

      match.defeats.forEach((defeat) => {
        if (defeat.id === team1) {
          defeatsT1++;
        } else {
          defeatsT2++;
        }
      });

      const ST1 = resultTeam1 === 2 ? 1 : 0;
      const ST2 = resultTeam2 === 2 ? 1 : 0;

      const resultDifferenceT1 = this.convertValue(resultTeam1 - resultTeam2);
      const resultDifferenceT2 = this.convertValue(resultTeam2 - resultTeam1);

      const PT1 = Math.abs(
        resultDifferenceT1 + dominationsT1 * 0.5 - defeatsT1 * 0.5
      );
      const PT2 = Math.abs(
        resultDifferenceT2 + dominationsT2 * 0.5 - defeatsT2 * 0.5
      );

      playersMap.get(T1P1).elo = this.getNewRating(
        playersMap.get(T1P1).elo,
        PT1,
        ST1,
        ET1
      );

      if (playersMap.has(T1P2)) {
        playersMap.get(T1P2).elo = this.getNewRating(
          playersMap.get(T1P2).elo,
          PT1,
          ST1,
          ET1
        );
      }

      playersMap.get(T2P1).elo = this.getNewRating(
        playersMap.get(T2P1).elo,
        PT2,
        ST2,
        ET2
      );

      if (playersMap.has(T2P2)) {
        playersMap.get(T2P2).elo = this.getNewRating(
          playersMap.get(T2P2).elo,
          PT2,
          ST2,
          ET2
        );
      }
    }
  }

  getExpectedScore(currentPlayerOrTeamRating: number, opponentRating: number) {
    return 1 / (1 + 10 ** ((opponentRating - currentPlayerOrTeamRating) / 500));
  }

  getNewRating(oldRating: number, P: number, S: number, E: number) {
    return Math.round(oldRating + 32 * P * (S - E));
  }

  convertValue(inputValue: number) {
    if (inputValue === 2) {
      return 1.5;
    } else if (inputValue === 1) {
      return 1;
    } else if (inputValue === -1) {
      return -1;
    } else if (inputValue === -2) {
      return -1.5;
    } else {
      return 0;
    }
  }

  sortByName(list: { id: string; name: string }[]) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortByDate(matches: IMatch[] | ISingleMatch[]) {
    matches.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  }

  clearTimelineAndElo(currentMap: Map<string, ILeaderboard>) {
    currentMap.forEach((item) => {
      item.elo = 0;
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
