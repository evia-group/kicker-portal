import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-round-result',
  templateUrl: './round-result.component.html',
  styleUrls: ['./round-result.component.scss'],
})
export class RoundResultComponent implements OnInit {
  public dominationTeamOne = 'dominationTeamOne';
  public dominationTeamTwo = 'dominationTeamTwo';

  @Input()
  round: string;

  @Input()
  matchForm: UntypedFormGroup;

  ngOnInit() {
    this.matchForm
      .get(`rounds.${this.round}.${this.dominationTeamOne}`)
      .disable();
    this.matchForm
      .get(`rounds.${this.round}.${this.dominationTeamTwo}`)
      .disable();
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
