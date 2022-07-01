import { Component, Input } from '@angular/core';
import { ITeam, IUser } from '../../../interfaces/user.interface';
import { map, Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { UsersService } from 'src/app/shared/services/users.service';

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

  playersList: IUser[] = [];

  allPlayers: IUser[] = [];

  constructor(userService: UsersService) {
    userService.users$.subscribe(data => {
      data.forEach((player: IUser) => {
        let isNew = true;
        this.allPlayers.forEach(player2 => {
          if (player.id === player2.id) {
            isNew = false;
          }
        });
        if (isNew) {
          this.allPlayers.push(player);
        }
      });
    });
  }

  teams: number[] = [0, 1];

  selectedPlayers: string[] = [];

  updatePlayers(event: any) {
    this.selectedPlayers[+event.source.id] = event.value.id;
  }

  createPlayersList(selId: string) {
    console.log(this.selectedPlayers);
    let selList: IUser[] = [];
    this.allPlayers.forEach(player => {
      if (!this.selectedPlayers.includes(player.id) || this.selectedPlayers.indexOf(player.id) === +selId) {
        selList.push(player);
      }
    })
    return selList;
  }
}
