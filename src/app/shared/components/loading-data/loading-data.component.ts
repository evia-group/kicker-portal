import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-data',
  templateUrl: './loading-data.component.html',
  styleUrls: ['./loading-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SpinnerComponent, TranslatePipe],
})
export class LoadingDataComponent {
  @Input()
  showSpinner = false;

  @Input()
  showNoData = false;
}
