import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { IPlayers } from '../../interfaces/match.interface';

@Component({
  selector: 'app-selection-with-search',
  templateUrl: './selection-with-search.component.html',
  styleUrls: ['./selection-with-search.component.scss'],
})
export class SelectionWithSearchComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input()
  values: IPlayers[] = [];

  @Input()
  selectedValue: IPlayers;

  @Input()
  labelText = '';

  @Output()
  optionSelectedEvent = new EventEmitter<IPlayers>();

  filteredValues: ReplaySubject<IPlayers[]> = new ReplaySubject<IPlayers[]>(1);

  selectionCtrl: FormControl = new FormControl();

  selectionFilterCtrl: FormControl<string> = new FormControl<string>('');

  @ViewChild('valueSelect', { static: true }) valueSelect: MatSelect;

  _onDestroy = new Subject<void>();

  ngOnInit() {
    const initialValue = this.selectedValue
      ? this.selectedValue
      : this.values[0];
    if (this.values.length > 0) {
      this.selectionCtrl.setValue(initialValue);
    }

    this.filteredValues.next(this.values.slice());

    this.selectionFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterValues();
      });
  }

  ngAfterViewInit(): void {
    this.setInitialValue();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setInitialValue() {
    this.filteredValues
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.valueSelect.compareWith = (a, b) => a && b && a.id === b.id;
      });
  }

  filterValues() {
    if (!this.values) {
      return;
    }

    let filter = this.selectionFilterCtrl.value;
    if (!filter) {
      this.filteredValues.next(this.values.slice());
      return;
    } else {
      filter = filter.toLowerCase();
    }

    this.filteredValues.next(
      this.values.filter(
        (value) => value.name.toLowerCase().indexOf(filter) > -1
      )
    );
  }

  onSelectionChange(matSelectChange: MatSelectChange) {
    this.optionSelectedEvent.emit(matSelectChange.value);
  }
}
