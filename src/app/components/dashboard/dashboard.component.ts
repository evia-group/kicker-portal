import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [MatCard, MatCardContent, MatIcon, TranslatePipe],
})
export class DashboardComponent {}
