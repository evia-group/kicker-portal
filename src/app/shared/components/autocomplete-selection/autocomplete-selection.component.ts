import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-autocomplete-selection',
  templateUrl: './autocomplete-selection.component.html',
  styleUrls: ['./autocomplete-selection.component.scss'],
})
export class AutocompleteSelectionComponent implements OnInit, OnChanges {
  @Input()
  options = [];

  @Input()
  selectionFormControl = new FormControl();

  @Input()
  displayWithFunction(option) {
    return option;
  }

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
    if (this.options.length > 0) {
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
