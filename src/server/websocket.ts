import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { getSession } from 'next-auth/react';
import { Deal } from '@/types/deal';

interface WebSocketClient extends WebSocket {
  userId?: string;
  role?: string;
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
export function broadcastDealUpdate(wss: WebSocketServer, deal: Deal) {
  wss.clients.forEach((client) => {
    const wsClient = client as WebSocketClient;
    // Only send to users involved in the deal
    if (wsClient.readyState === WebSocket.OPEN &&
        (wsClient.userId === deal.artistId || wsClient.userId === deal.execId)) {
      wsClient.send(JSON.stringify({
        type: 'DEAL_UPDATE',
        data: deal
      }));
    }
  });
}

export function initializeWebSocketServer() {
  const wss = new WebSocketServer({ port: 3001 });
  global.wss = wss;

  wss.on('connection', (ws) => {
    const wsClient = ws as WebSocketClient;
    console.log('Client connected');

    wsClient.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return wss;
}