import { Component, Input } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { AutocompleteSelectionComponent } from '../../../autocomplete-selection/autocomplete-selection.component';

@Component({
  selector: 'app-two-selections',
  templateUrl: './two-selections.component.html',
  styleUrls: ['./two-selections.component.scss'],
  imports: [AutocompleteSelectionComponent],
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
