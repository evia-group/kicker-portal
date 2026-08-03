import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UsersService } from '../../../shared/services/users.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { ITeam, IUser } from '../../../shared/interfaces/user.interface';
import { MatchesService } from '../../../shared/services/matches.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { AddMatchComponent } from '../../../shared/components/add-match/add-match.component';
import { NgStyle } from '@angular/common';
import { LastAddedMatchesComponent } from '../../../shared/components/last-added-matches/last-added-matches.component';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
  imports: [
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    AddMatchComponent,
    NgStyle,
    LastAddedMatchesComponent,
  ],
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
