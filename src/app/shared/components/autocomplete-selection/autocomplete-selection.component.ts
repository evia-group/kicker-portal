import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatAutocomplete,
} from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatInput,
  MatSuffix,
  MatError,
} from '@angular/material/input';
import { MatOption } from '@angular/material/select';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-autocomplete-selection',
  templateUrl: './autocomplete-selection.component.html',
  styleUrls: ['./autocomplete-selection.component.scss'],
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatAutocomplete,
    MatOption,
    MatIconButton,
    MatSuffix,
    MatIcon,
    MatError,
    AsyncPipe,
    TranslateModule,
  ],
})
export class AutocompleteSelectionComponent implements OnInit, OnChanges {
  @Input()
  options: any[];

  @Input()
  selectionFormControl: any;

  @Input()
  displayWithFunction: any;

  @Input()
  hasError = false;

  @Input()
  errorText = '';

  @Input()
  labelText = '';

  @Input()
  placeholderText = '';

  @Output()
  optionSelectedEvent = new EventEmitter();

  filteredOptions: Observable<any>;

  ngOnInit(): void {
    this.setFilteredOptions();
  }

  ngOnChanges(): void {
    this.setFilteredOptions();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) => {
      const displayedOption = this.displayWithFunction(option);
      return displayedOption.toLowerCase().includes(filterValue);
    });
  }

  setFilteredOptions() {
    if (this.selectionFormControl && this.displayWithFunction && this.options) {
      const startValue = this.selectionFormControl.value
        ? this.selectionFormControl.value
        : '';
      this.filteredOptions = this.selectionFormControl.valueChanges.pipe(
        startWith(startValue),
        map((value) => {
          const inputValue =
            typeof value !== 'string' ? this.displayWithFunction(value) : value;
          return this._filter(inputValue || '');
        })
      );
    }
  }

  emitWhenOptionSelected($event: MatAutocompleteSelectedEvent) {
    this.optionSelectedEvent.emit($event);
  }

  clearValue() {
    this.selectionFormControl.setValue('');
  }
}
