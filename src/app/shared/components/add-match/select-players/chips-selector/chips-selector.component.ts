import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { IUser } from '../../../../interfaces/user.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-chips-selector',
  templateUrl: './chips-selector.component.html',
  styleUrls: ['./chips-selector.component.scss'],
})
export class ChipsSelectorComponent implements OnInit, OnChanges {
  valueCtrl = new FormControl<string | IUser>('');
  options: IUser[] = [];
  filteredOptions: Observable<IUser[]>;

  @Input()
  firstPlayerCtrl: FormControl = new FormControl();

  @Input()
  secondPlayerCtrl: FormControl = new FormControl();

  @Input()
  firstPlayerOptions: IUser[];

  @Input()
  secondPlayerOptions: IUser[];

  @Input()
  isSingleMode = false;

  ngOnInit(): void {
    this.setFilteredOptions();
    this.toggleFormField();
  }

  ngOnChanges(): void {
    this.options =
      !this.firstPlayerCtrl.value || this.isSingleMode
        ? this.firstPlayerOptions
        : this.secondPlayerOptions;
    this.setFilteredOptions();
    this.toggleFormField();
  }

  toggleFormField() {
    if (!this.isSingleMode) {
      if (
        this.firstPlayerCtrl &&
        this.firstPlayerCtrl.value &&
        this.secondPlayerCtrl &&
        this.secondPlayerCtrl.value
      ) {
        this.valueCtrl.disable();
      } else if (this.firstPlayerCtrl && this.secondPlayerCtrl) {
        this.valueCtrl.enable();
      }
    } else {
      if (this.firstPlayerCtrl && this.firstPlayerCtrl.value) {
        this.valueCtrl.disable();
      } else if (this.firstPlayerCtrl) {
        this.valueCtrl.enable();
      }
    }
  }

  setFilteredOptions() {
    this.filteredOptions = this.valueCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string') {
          return this._filter(value || '');
        }
        return this._filter(value.name || '');
      })
    );
  }

  private _filter(value: string) {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn(player: IUser) {
    return player && player.name ? player.name : '';
  }

  selected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    !this.firstPlayerCtrl.value || this.isSingleMode
      ? this.firstPlayerCtrl.setValue(selectedOption)
      : this.secondPlayerCtrl.setValue(selectedOption);
    this.valueCtrl.setValue('');
    this.toggleFormField();
  }

  remove(id: number) {
    id === 0
      ? this.firstPlayerCtrl.setValue(null)
      : this.secondPlayerCtrl.setValue(null);

    this.valueCtrl.enable();
  }
}
