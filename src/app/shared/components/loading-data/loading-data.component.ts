import { Component, Input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-data',
  templateUrl: './loading-data.component.html',
  styleUrls: ['./loading-data.component.scss'],
  imports: [SpinnerComponent, TranslateModule],
})
export class LoadingDataComponent {
  @Input()
  showSpinner = false;

  @Input()
  showNoData = false;
}
