import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

/** Wer wartet, je Spielart. */
export interface QueueSnapshot {
  gameTypeKey: string;
  entries: {
    userId: string;
    userName: string;
    teamSize: number;
    joinedAt: string;
  }[];
}

/** Eine gefundene Paarung, die bestaetigt werden muss. */
export interface ProposalNotification {
  proposalId: string;
  gameTypeKey: string;
  teamSize: number;
  expiresAt: string;
  players: { userId: string; userName: string; response: string }[];
}

/**
 * Live-Kanal der Warteschlange: ein reiner Broadcast von Aenderungen.
 *
 * Anders als `KickerGateway` wird hier beim Verbinden **kein** letzter Stand
 * wiedergegeben. Der Versuch, ihn im Prozessspeicher zu halten, war ein Fehler:
 * dieser Cache wird nie gegen die Datenbank geprueft, ueberlebt Aenderungen an
 * ihr vorbei und waere bei mehreren API-Instanzen je Instanz verschieden. Im
 * Test hat er einen langst geloeschten Wartenden angezeigt und dabei die
 * korrekte HTTP-Antwort im Client ueberschrieben.
 *
 * Den Ausgangszustand holt der Client stattdessen ueber
 * `GET /matchmaking/queue`, also aus der Datenbank. Der Socket liefert nur, was
 * sich danach aendert. Beim Kickerstatus ist die Wiedergabe richtig, weil es
 * dort keine andere Quelle gibt; hier gibt es eine.
 *
 * Der Kanal ist absichtlich **nur lesend** und ohne eigene Authentifizierung.
 * Wer auf einen Vorschlag antwortet, tut das ueber
 * `POST /matchmaking/proposals/:id/respond`, und dieser Endpunkt steht hinter
 * `EntraAuthGuard` und prueft, dass der angemeldete Nutzer Teil des Vorschlags
 * ist. Die Sicherheitsgrenze liegt also beim HTTP-Endpunkt. Eine eigene
 * Token-Pruefung im WebSocket-Handshake waere dafuer nicht noetig, und wer im
 * Haus auf ein Spiel wartet, ist keine schuetzenswerte Information.
 *
 * Vorschlaege werden mit ihrer Spielerliste verteilt; der Client zeigt den
 * Dialog nur, wenn er selbst darin steht.
 */
@WebSocketGateway({ namespace: 'matchmaking', cors: true })
export class MatchmakingGateway {
  @WebSocketServer()
  server: Server;

  broadcastQueue(snapshot: QueueSnapshot): void {
    this.server.emit('queue:updated', snapshot);
  }

  broadcastProposal(proposal: ProposalNotification): void {
    this.server.emit('proposal:created', proposal);
  }

  broadcastProposalResolved(
    proposalId: string,
    status: 'accepted' | 'declined' | 'expired',
  ): void {
    this.server.emit('proposal:resolved', { proposalId, status });
  }

  /**
   * Der Tisch ist wieder frei. Ausgeloest vom physischen Kickertisch ueber
   * `POST /kicker/status`, sobald eine Sitzung endet.
   */
  broadcastTableFree(gameTypeKey: string): void {
    this.server.emit('table:free', { gameTypeKey });
  }
}
