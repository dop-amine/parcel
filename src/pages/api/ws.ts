import { NextApiRequest } from 'next';
import { Server } from 'http';
import { createWebSocketServer } from '@/server/websocket';

let wss: ReturnType<typeof createWebSocketServer> | null = null;

export default function handler(req: NextApiRequest, res: any) {
  if (!wss) {
    const server = res.socket.server as Server;
    wss = createWebSocketServer(server);
    (global as any).wss = wss;
  }

  res.end();
}