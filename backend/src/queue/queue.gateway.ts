import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`[Socket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`[Socket] Client disconnected: ${client.id}`);
  }

  emitQueueUpdate() {
    if (this.server) {
      this.server.emit('queue_updated', { timestamp: new Date().toISOString() });
      console.log('[Socket] Broadcasted queue_updated event');
    }
  }
}
