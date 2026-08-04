import { Inject, Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, ReplaySubject } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../core/app-config';

export interface IKickerStatus {
  status: boolean;
  /** Unix seconds. */
  startTime: number;
  /** Present when a session just ended. */
  endTime?: number;
}

/**
 * Replaces the two onValue(ref(getDatabase(), '/Kicker')) subscriptions that
 * used to read the table's live status from Realtime Database. The backend
 * broadcasts the same payload over the /kicker WebSocket namespace instead
 * (api/src/kicker/kicker.gateway.ts).
 */
@Injectable({
  providedIn: 'root',
})
export class KickerSocketService implements OnDestroy {
  private socket: Socket;

  private statusSubject = new ReplaySubject<IKickerStatus>(1);

  public status$: Observable<IKickerStatus> = this.statusSubject.asObservable();

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.socket = io(`${config.apiUrl}/kicker`);
    this.socket.on('status', (status: IKickerStatus) => {
      this.statusSubject.next(status);
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
