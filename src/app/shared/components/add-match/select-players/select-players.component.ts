import {Component, Input} from '@angular/core';
import {ITeam, IUser} from '../../../interfaces/user.interface';
import {Observable} from 'rxjs';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-select-players',
  templateUrl: './select-players.component.html',
  styleUrls: ['./select-players.component.scss']
})
export class SelectPlayersComponent {

  @Input()
  players: Observable<IUser[]> | Observable<ITeam[]>;

  @Input()
  showingTeams = false;

  @Input()
  matchForm: FormGroup;

  teams: number[] = [0, 1];
}
