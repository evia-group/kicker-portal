import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import { Observable, Subscription } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-select-players',
  templateUrl: './select-players.component.html',
  styleUrls: ['./select-players.component.scss'],
})
export class SelectPlayersComponent implements OnInit, OnDestroy {
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

  usersSub: Subscription;

  resetFormSub: Subscription;

  constructor(
    private userService: UsersService,
    private matchesService: MatchesService
  ) {}

  ngOnInit(): void {
    this.usersSub = this.userService.users$.subscribe((data: IUser[]) => {
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

      this.setPlayerLists();

      this.touched.forEach((isTouched, index) => {
        if (isTouched) {
          this.markControlTouched(index);
        }
      });
    });

    this.resetFormSub = this.matchesService.resetForm$.subscribe((isReset) => {
      if (isReset) {
        this.selectedPlayers = ['', '', '', ''];
        this.touched = [false, false, false, false];
      }
    });
  }

  ngOnDestroy(): void {
    this.usersSub.unsubscribe();
    this.resetFormSub.unsubscribe();
  }

  updatePlayers(event: any) {
    this.selectedPlayers[+event.source.id] = event.value.id;
    this.setPlayerLists();
  }

  setPlayerLists() {
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

  getPlayersList(selId: number) {
    this.addTouched(selId);
    return this.playerLists[+selId];
  }

  compareValues(o1: any, o2: any) {
    return o1 && o2 && o1.id === o2.id;
  }
}
