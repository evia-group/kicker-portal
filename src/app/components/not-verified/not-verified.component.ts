import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-not-verified',
  templateUrl: './not-verified.component.html',
  styleUrls: ['./not-verified.component.scss'],
  imports: [MatCard, MatCardContent, MatIcon, TranslatePipe],
})
export class NotVerifiedComponent {}
