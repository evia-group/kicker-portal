import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {UsersService} from '../../../shared/services/users.service';
import {TeamsService} from '../../../shared/services/teams.service';
import {ITeam, IUser} from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss']
})
export class MatchesComponent {

  users$: Observable<IUser[]>;
  teams$: Observable<ITeam[]>;

  constructor(protected userService: UsersService,
              protected teamService: TeamsService) {
    this.users$ = this.userService.users$;
    this.teams$ = this.teamService.teams$;

    console.log('this', this.users$.subscribe(data => console.log('data', data)));
  }
}
