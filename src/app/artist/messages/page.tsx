"use client";

import { DealList } from "@/components/messages/DealList";
import { DealChat } from "@/components/messages/DealChat";
import { DealDetails } from "@/components/messages/DealDetails";
import { useState } from "react";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 container mx-auto max-w-7xl px-4 py-8 overflow-hidden">
        <div className="flex h-full">
          {/* Left sidebar - Deal list */}
          <div className="w-80 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
            <DealList onSelectDeal={setSelectedDeal} />
          </div>

          {/* Main content - Chat and details */}
          <div className="ml-6 flex-1 flex">
            {/* Chat section */}
            <div className="flex-1 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
              {selectedDeal ? (
                <DealChat dealId={selectedDeal.id} deal={selectedDeal} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a deal to start chatting
                </div>
              )}
            </div>

            {/* Deal details section */}
            <div className="ml-6 w-96 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
              {selectedDeal ? (
                <DealDetails deal={selectedDeal} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a deal to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}