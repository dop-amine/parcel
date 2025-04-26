import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { getSession } from 'next-auth/react';

interface WebSocketClient extends WebSocket {
  userId: string;
  role: string;
}

export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: WebSocketClient, req) => {
    // Get session from request headers
    const session = await getSession({ req });
    if (!session?.user) {
      ws.close();
      return;
    }

    // Store user info in the WebSocket connection
    ws.userId = session.user.id;
    ws.role = session.user.role;

    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return wss;
}

// Function to broadcast deal updates to relevant users
export function broadcastDealUpdate(wss: WebSocketServer, deal: any) {
  wss.clients.forEach((client: WebSocketClient) => {
    // Only send to users involved in the deal
    if (client.userId === deal.artistId || client.userId === deal.execId) {
      client.send(JSON.stringify({
        type: 'dealUpdate',
        deal,
      }));
    }
  });
}