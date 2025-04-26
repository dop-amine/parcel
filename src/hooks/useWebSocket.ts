import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'dealUpdate') {
        // Update the deal in the query cache
        queryClient.setQueryData([['deal', 'getDeal'], { dealId: data.deal.id }], data.deal);

        // Update the deal in the list
        queryClient.setQueryData([['deal', 'list']], (old: any[]) => {
          if (!old) return old;
          return old.map((d) =>
            d.id === data.deal.id ? data.deal : d
          );
        });

        // Force a refetch of the deal to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: [['deal', 'getDeal'], { dealId: data.deal.id }] });
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [queryClient]);

  return ws.current;
}