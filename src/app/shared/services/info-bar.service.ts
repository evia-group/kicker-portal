import { Injectable } from '@angular/core';
import { InfoBarComponent } from '../components/info-bar/info-bar.component';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class InfoBarService {
  constructor(private snackBar: MatSnackBar) {}

  public openCustomSnackBar(
    message?: string,
    action?: string,
    durationInSeconds?: number,
    panelClassName?: string
  ) {
    this.snackBar.open(message ? message : '', action ? action : '', {
      duration: durationInSeconds * 1000,
      verticalPosition: 'bottom',
      panelClass: panelClassName ? [panelClassName] : '',
    });
  }

  /**
   * Wie openCustomSnackBar, gibt aber die Referenz zurueck, damit der Aufrufer
   * auf die Aktion reagieren kann. `duration` ist optional: ein Hinweis, der
   * eine Entscheidung verlangt, darf nicht von allein verschwinden.
   */
  public openActionSnackBar(
    message: string,
    action: string,
    durationInSeconds?: number
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, {
      ...(durationInSeconds ? { duration: durationInSeconds * 1000 } : {}),
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
