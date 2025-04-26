'use client';

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Send } from "lucide-react";
import { getQueryKey } from "@trpc/react-query";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Deal } from "@/types/deal";

interface DealChatProps {
  dealId: string;
  deal: Deal;
}

export function DealChat({ dealId, deal }: DealChatProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: messages, isLoading } = api.chat.list.useQuery(
    { dealId },
    {
      refetchInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = api.chat.send.useMutation({
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: getQueryKey(api.chat.list, { dealId }, 'query') });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(getQueryKey(api.chat.list, { dealId }, 'query'));

      // Optimistically update to the new value
      queryClient.setQueryData(
        getQueryKey(api.chat.list, { dealId }, 'query'),
        (old: any) => {
          const optimisticMessage = {
            id: 'temp-' + Date.now(),
            content: newMessage.content,
            createdAt: new Date().toISOString(),
            user: {
              id: session?.user?.id,
              name: session?.user?.name || 'You',
            },
          };
          return [...(old || []), optimisticMessage];
        }
      );

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        getQueryKey(api.chat.list, { dealId }, 'query'),
        context?.previousMessages
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: getQueryKey(api.chat.list, { dealId }, 'query') });
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  const isDealClosed = deal.state === 'DECLINED' || deal.state === 'ACCEPTED';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages?.map((msg) => {
          const isCurrentUser = msg.user.id === session?.user?.id;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{msg.user.name}</span>
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl break-words",
                  isCurrentUser
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-100 rounded-bl-sm"
                )}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        {isDealClosed ? (
          <div className="text-center text-gray-400 py-2">
            This deal is {deal.state.toLowerCase()}. No new messages can be sent.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) {
                sendMessage.mutate({ dealId, content: message.trim() });
                setMessage(""); // Clear input immediately for better UX
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}