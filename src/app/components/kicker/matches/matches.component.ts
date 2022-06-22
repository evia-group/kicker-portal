import { Component } from '@angular/core';
import type { Observable } from 'rxjs';
import type { UsersService } from '../../../shared/services/users.service';
import type { TeamsService } from '../../../shared/services/teams.service';
import type { ITeam, IUser } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
})
export class MatchesComponent {
  users$: Observable<IUser[]>;
  teams$: Observable<ITeam[]>;

  constructor(
    protected userService: UsersService,
    protected teamService: TeamsService
  ) {
    this.users$ = this.userService.users$;
    this.teams$ = this.teamService.teams$;
  }
}
