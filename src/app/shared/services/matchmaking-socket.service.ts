import { Inject, Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../core/app-config';

export interface IQueueEntry {
  userId: string;
  userName: string;
  teamSize: number;
  joinedAt: string;
}

export interface IQueueSnapshot {
  gameTypeKey: string;
  entries: IQueueEntry[];
}

export interface IProposal {
  proposalId: string;
  gameTypeKey: string;
  teamSize: number;
  expiresAt: string;
  players: { userId: string; userName: string; response: string }[];
}

export interface IProposalResolved {
  proposalId: string;
  status: 'accepted' | 'declined' | 'expired';
}

/**
 * Live-Kanal der Warteschlange, nach dem Muster von `KickerSocketService`.
 *
 * Der Kanal ist rein lesend. Vorschlaege kommen an alle Verbundenen, dieser
 * Client zeigt sie nur, wenn er selbst darin steht. Antworten laufen ueber
 * HTTP, wo der Server prueft, wer antworten darf
 * (`api/src/matchmaking/matchmaking.gateway.ts` begruendet das).
 */
@Injectable({ providedIn: 'root' })
export class MatchmakingSocketService implements OnDestroy {
  private socket: Socket;

  private queueSubject = new ReplaySubject<IQueueSnapshot>(1);
  private proposalSubject = new Subject<IProposal>();
  private resolvedSubject = new Subject<IProposalResolved>();
  private tableFreeSubject = new Subject<string>();

  /**
   * Aenderungen der Warteschlange. Der `ReplaySubject` gibt spaeteren
   * Abonnenten **innerhalb dieser Anwendung** den letzten empfangenen Stand;
   * der Server sendet beim Verbinden bewusst keinen Ausgangszustand, den holt
   * der Client ueber `GET /matchmaking/queue` (Begruendung in
   * `api/src/matchmaking/matchmaking.gateway.ts`).
   */
  public queue$: Observable<IQueueSnapshot> = this.queueSubject.asObservable();
  public proposal$: Observable<IProposal> = this.proposalSubject.asObservable();
  public resolved$: Observable<IProposalResolved> =
    this.resolvedSubject.asObservable();
  public tableFree$: Observable<string> = this.tableFreeSubject.asObservable();

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.socket = io(`${config.apiUrl}/matchmaking`);
    this.socket.on('queue:updated', (snapshot: IQueueSnapshot) =>
      this.queueSubject.next(snapshot)
    );
    this.socket.on('proposal:created', (proposal: IProposal) =>
      this.proposalSubject.next(proposal)
    );
    this.socket.on('proposal:resolved', (event: IProposalResolved) =>
      this.resolvedSubject.next(event)
    );
    this.socket.on('table:free', (event: { gameTypeKey: string }) =>
      this.tableFreeSubject.next(event.gameTypeKey)
    );
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
