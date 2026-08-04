import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KickerStatusDto } from './dto/kicker-status.dto';

/**
 * Replaces the frontend's two RTDB onValue('/Kicker') subscriptions
 * (app.component.ts, navigation.component.ts) with a plain broadcast socket.
 */
@WebSocketGateway({ namespace: 'kicker', cors: true })
export class KickerGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private lastStatus: KickerStatusDto | undefined;

  handleConnection(client: Socket): void {
    if (this.lastStatus) {
      client.emit('status', this.lastStatus);
    }
  }

  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }

  broadcastStatus(status: KickerStatusDto): void {
    this.lastStatus = status;
    this.server.emit('status', status);
  }
}
