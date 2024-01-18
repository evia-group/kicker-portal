import { Component, Input } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-two-selections',
  templateUrl: './two-selections.component.html',
  styleUrls: ['./two-selections.component.scss'],
})
export class TwoSelectionsComponent {
  @Input()
  firstPlayerControl: UntypedFormControl;

  @Input()
  secondPlayerControl: UntypedFormControl;

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
