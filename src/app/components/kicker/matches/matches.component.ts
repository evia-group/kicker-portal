import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UsersService } from '../../../shared/services/users.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { ITeam, IUser } from '../../../shared/interfaces/user.interface';
import { MatchesService } from '../../../shared/services/matches.service';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
})
export class MatchesComponent implements OnInit, OnDestroy {
  users$: Observable<IUser[]>;
  teams$: Observable<ITeam[]>;

  singleMode = false;

  singleModeSubscription: Subscription;

  constructor(
    protected userService: UsersService,
    protected teamService: TeamsService,
    protected matchesService: MatchesService
  ) {
    this.users$ = this.userService.users$;
    this.teams$ = this.teamService.teams$;
  }

  ngOnInit(): void {
    this.matchesService.singleModeSub$.subscribe((singleMode) => {
      if (this.singleMode !== singleMode) {
        this.singleMode = singleMode;
      }
    });
  }

  onSingleModeChange(singleMode: boolean) {
    this.matchesService.singleModeSub$.next(singleMode);
  }

  ngOnDestroy(): void {
    this.singleModeSubscription?.unsubscribe();
  }
}
