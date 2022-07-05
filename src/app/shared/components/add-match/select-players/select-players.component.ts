import { Component, Input } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-select-players',
  templateUrl: './select-players.component.html',
  styleUrls: ['./select-players.component.scss'],
})
export class SelectPlayersComponent {
  @Input()
  players: Observable<IUser[]> | Observable<ITeam[]>;

  @Input()
  showingTeams = false;

  @Input()
  matchForm: FormGroup;

  teams: number[] = [0, 1];

  allPlayers: IUser[] = [];

  playerLists: IUser[][] = [[], [], [], []];

  selectedPlayers: string[] = ['', '', '', ''];

  touched: boolean[] = [false, false, false, false];

  constructor(userService: UsersService, matchesService: MatchesService) {
    userService.users$.subscribe((data: IUser[]) => {
      this.allPlayers = data;

      const allIds: string[] = [];

      data.forEach((player) => {
        allIds.push(player.id);
      });

      this.selectedPlayers.forEach((pId, index) => {
        if (!allIds.includes(pId)) {
          this.resetControl(index);
        }
      });

      for (let i = 0; i < this.playerLists.length; i++) {
        this.playerLists[i] = this.createPlayersList(i);
      }

      this.touched.forEach((isTouched, index) => {
        if (isTouched) {
          this.markControlTouched(index);
        }
      });
    });

    matchesService.resetForm$.subscribe((isReset) => {
      if (isReset) {
        this.selectedPlayers = [];
        this.touched = [false, false, false, false];
      }
    });
  }

  updatePlayers(event: any) {
    this.selectedPlayers[+event.source.id] = event.value.id;

    for (let i = 0; i < this.playerLists.length; i++) {
      this.playerLists[i] = this.createPlayersList(i);
    }
  }

  resetControl(index: number) {
    this.getControl(index).reset();
  }

  addTouched(index: number) {
    this.touched[index] = this.getControl(index).touched;
  }

  markControlTouched(index: number) {
    this.getControl(index).markAsTouched();
  }

  getControl(index: number) {
    if (index === 0) {
      return this.matchForm.get('players.team1.one');
    } else if (index === 1) {
      return this.matchForm.get('players.team1.two');
    } else if (index === 2) {
      return this.matchForm.get('players.team2.one');
    } else if (index === 3) {
      return this.matchForm.get('players.team2.two');
    }
  }

  createPlayersList(selId: number) {
    return this.allPlayers.filter((player) => {
      return (
        !this.selectedPlayers.includes(player.id) ||
        this.selectedPlayers.indexOf(player.id) === selId
      );
    });
  }

  getPlayersList(selId: string) {
    this.addTouched(+selId);
    return this.playerLists[+selId];
  }

  compareValues(o1: any, o2: any) {
    return o1 && o2 && o1.id === o2.id;
  }
}
