import { Injectable } from '@angular/core';
import { InfoBarComponent } from '../components/info-bar/info-bar.component';
import type { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class InfoBarService {
  constructor(private snackBar: MatSnackBar) {}

  public openCustomSnackBar(
    message?: string,
    action?: string,
    durationInSeconds?: number
  ) {
    this.snackBar.open(message ? message : '', action ? action : '', {
      duration: durationInSeconds * 1000,
      verticalPosition: 'bottom',
    });
  }

  public openComponentSnackBar(durationInSeconds?: number) {
    this.snackBar.openFromComponent(InfoBarComponent, {
      duration: durationInSeconds * 1000,
      verticalPosition: 'bottom',
    });
  }
}
