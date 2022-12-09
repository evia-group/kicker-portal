import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatchesService } from 'src/app/shared/services/matches.service';

@Component({
  selector: 'app-round-result',
  templateUrl: './round-result.component.html',
  styleUrls: ['./round-result.component.scss'],
})
export class RoundResultComponent implements OnInit, OnDestroy {
  public dominationTeamOne = 'dominationTeamOne';
  public dominationTeamTwo = 'dominationTeamTwo';

  @Input()
  round: string;

  @Input()
  matchForm: FormGroup;

  @Input()
  showingTeams = false;

  resetFormSub: Subscription;

  constructor(private matchesService: MatchesService) {}

  ngOnDestroy(): void {
    this.resetFormSub.unsubscribe();
  }

  ngOnInit() {
    this.matchForm
      .get(`rounds.${this.round}.${this.dominationTeamOne}`)
      .disable();
    this.matchForm
      .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
      .disable();
    this.resetFormSub = this.matchesService.resetForm$.subscribe(
      (teamsWasShowing) => {
        if (this.showingTeams === teamsWasShowing) {
          this.matchForm
            .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
            .disable();
          this.matchForm
            .get(`rounds.${this.round}.${this.dominationTeamOne}`)
            .disable();
        }
      }
    );
  }

  dominationChange(ownTeam: string, enemyTeam: string) {
    if (this.matchForm.get(`rounds.${this.round}.${ownTeam}`).value === true) {
      this.matchForm.get(`rounds.${this.round}.${enemyTeam}`).setValue(false);
    }
  }

  enableDominationSlider(event) {
    if (event.value === 'team1') {
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
        .setValue(false);
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamOne}`)
        .enable();
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
        .disable();
    } else if (event.value === 'team2') {
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamOne}`)
        .setValue(false);
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
        .enable();
      this.matchForm
        .get(`rounds.${this.round}.${this.dominationTeamOne}`)
        .disable();
    }
  }
}
