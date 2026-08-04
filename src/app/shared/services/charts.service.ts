import { Injectable } from '@angular/core';
import { IMatch } from '../interfaces/match.interface';
import { CurrentUserService } from './current-user.service';
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

interface IMatchData {
  team1: string;
  team2: string;
  resultTeam1: number;
  resultTeam2: number;
  matchYear: number;
  matchMonth: number;
  dominationsSide0: number;
  dominationsSide1: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChartsService {
  constructor(private currentUserService: CurrentUserService) {}

  /**
   * @param teamPlayersById team id -> member player ids (id.name.interface.ts's ITeam.players).
   * Unused for single matches, where the "side id" already is the player id.
   */
  createStatisticPlayerData(
    matches: IMatch[],
    playersMap: Map<string, ILeaderboard>,
    teamPlayersById: Map<string, string[]>
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
    const playersWithMatches: { id: string; name: string }[] = [];
    let playerYearsList: number[];
    let selectedYearPlayer: number;
    let doughnutDataPlayer: number[];
    let matchesChartDataPlayer: number[];
    this.clearTimelineAndElo(playersMap);

    if (matches.length > 0) {
      const loggedInUser = this.currentUserService.id;
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
          dominationsSide0,
          dominationsSide1,
        } = this.getMatchData(match);

        const playersTeam1 = this.getPlayersOfSide(
          team1,
          match.isSingle,
          teamPlayersById
        );
        const playersTeam2 = this.getPlayersOfSide(
          team2,
          match.isSingle,
          teamPlayersById
        );

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

        const winningTeam =
          resultTeam1 > resultTeam2 ? playersTeam1 : playersTeam2;
        const loosingTeam =
          resultTeam1 > resultTeam2 ? playersTeam2 : playersTeam1;

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
          dominationsSide0,
          dominationsSide1,
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
    teamsMap: Map<string, ILeaderboard>,
    teamPlayersById: Map<string, string[]>
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
      const loggedInUser = this.currentUserService.id;
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
          dominationsSide0,
          dominationsSide1,
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
              (teamPlayersById.get(team1)?.includes(loggedInUser) ?? false) &&
              teamIdsWithMatches.includes(team1)
            ) {
              selectedTeamId = team1;
            } else if (
              (teamPlayersById.get(team2)?.includes(loggedInUser) ?? false) &&
              teamIdsWithMatches.includes(team2)
            ) {
              selectedTeamId = team2;
            }
          }

          if (resultTeam1 > resultTeam2) {
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
          dominationsSide0,
          dominationsSide1,
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

  private getMatchData(match: IMatch): IMatchData {
    const [side0, side1] = [...match.participants].sort(
      (a, b) => a.side - b.side
    );
    const team1 = side0.teamId ?? side0.userId;
    const team2 = side1.teamId ?? side1.userId;
    const resultTeam1 = side0.roundsWon;
    const resultTeam2 = side1.roundsWon;

    const playedAt = new Date(match.playedAt);
    const matchYear = playedAt.getFullYear();
    const matchMonth = playedAt.getMonth();

    let dominationsSide0 = 0;
    let dominationsSide1 = 0;
    for (const round of match.rounds) {
      if (!round.domination) {
        continue;
      }
      if (round.winnerSide === 0) {
        dominationsSide0++;
      } else {
        dominationsSide1++;
      }
    }

    return {
      team1,
      team2,
      resultTeam1,
      resultTeam2,
      matchYear,
      matchMonth,
      dominationsSide0,
      dominationsSide1,
    };
  }

  /** For single matches the "side id" already is the player id. */
  private getPlayersOfSide(
    sideId: string,
    isSingle: boolean,
    teamPlayersById: Map<string, string[]>
  ): string[] {
    if (isSingle) {
      return [sideId];
    }
    return teamPlayersById.get(sideId) ?? [];
  }

  private calculateElo(
    playersTeam1: string[],
    playersTeam2: string[],
    playersMap: Map<string, ILeaderboard>,
    dominationsT1: number,
    dominationsT2: number,
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

      // A domination round scored by one side is a "defeat" suffered by the other.
      const defeatsT1 = dominationsT2;
      const defeatsT2 = dominationsT1;

      const ST1 = resultTeam1 > resultTeam2 ? 1 : 0;
      const ST2 = resultTeam2 > resultTeam1 ? 1 : 0;

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

  sortByDate(matches: IMatch[]) {
    matches.sort(
      (a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
    );
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
