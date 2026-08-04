import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { InfoBarService } from '../shared/services/info-bar.service';

/** Merker, damit der Installationshinweis nicht bei jedem Start erscheint. */
const INSTALL_HINT_DISMISSED_KEY = 'evia.installHintDismissed';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly infoBar = inject(InfoBarService);
  private readonly translate = inject(TranslateService);

  /** Einmalig beim Anwendungsstart aufrufen. */
  init(): void {
    this.watchForUpdates();
    this.maybeShowInstallHint();
  }

  /**
   * Eine neue Version wird nicht im Hintergrund aktiviert. Ein Reload mitten in
   * einer Eingabe wuerde einen halb gefuellten Spielbericht verwerfen, deshalb
   * entscheidet der Nutzer, wann neu geladen wird. Der Hinweis hat bewusst kein
   * Zeitlimit.
   */
  private watchForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_READY'))
      .subscribe(() => {
        const ref = this.infoBar.openActionSnackBar(
          this.translate.instant('pwa.updateAvailable'),
          this.translate.instant('pwa.reload')
        );
        ref.onAction().subscribe(() => {
          // activateUpdate schaltet den Worker um, das Neuladen holt danach die
          // neuen Dateien. Ohne das Warten laedt der Browser noch die alten.
          void this.swUpdate.activateUpdate().then(() => location.reload());
        });
      });
  }

  /**
   * Auf iOS funktioniert Web Push erst ab 16.4 und ausschliesslich in der
   * installierten PWA, nicht im Safari-Tab. Ohne Installation kann die App dort
   * also gar nicht benachrichtigen, deshalb der Hinweis. Auf anderen Systemen
   * uebernimmt der Browser die Installationsaufforderung selbst.
   */
  private maybeShowInstallHint(): void {
    if (
      !this.isIos() ||
      this.isStandalone() ||
      localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === 'true'
    ) {
      return;
    }

    const ref = this.infoBar.openActionSnackBar(
      this.translate.instant('pwa.iosInstallHint'),
      this.translate.instant('pwa.understood')
    );
    ref.onAction().subscribe(() => {
      localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, 'true');
    });
  }

  private isIos(): boolean {
    // Hier ist die Plattform tatsaechlich die Frage und nicht die Faehigkeit:
    // die Einschraenkung stammt von iOS, nicht von der Bildschirmgroesse oder
    // der Eingabeart. iPadOS meldet sich als Macintosh, deshalb die Pruefung
    // auf Touch-Punkte.
    const ua = navigator.userAgent;
    const isIPadOs = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(ua) || isIPadOs;
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // Nicht standardisiert, aber die einzige Erkennung, die Safari anbietet.
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }
}
