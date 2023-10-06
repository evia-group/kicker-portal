import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-two-selections',
  templateUrl: './two-selections.component.html',
  styleUrls: ['./two-selections.component.scss'],
})
export class TwoSelectionsComponent {
  @Input()
  firstPlayerControl: FormControl;

  @Input()
  secondPlayerControl: FormControl;

  @Input()
  firstPlayerOptions;

  @Input()
  secondPlayerOptions;

  @Input()
  displayWithFunction;

  @Input()
  placeholderText: string;

  @Input()
  labelText: string;
}
