import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-data',
  templateUrl: './loading-data.component.html',
  styleUrls: ['./loading-data.component.scss'],
  standalone: false,
})
export class LoadingDataComponent {
  @Input()
  showSpinner = false;

  @Input()
  showNoData = false;
}
