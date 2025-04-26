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
        <div className="flex flex-col lg:flex-row h-full w-full overflow-x-hidden">
          {/* Left sidebar - Deal list */}
          <div className="w-full lg:w-80 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden mb-4 lg:mb-0">
            <DealList onSelectDeal={setSelectedDeal} />
          </div>

          {/* Main content - Chat and details */}
          <div className="flex flex-col lg:flex-row flex-1 w-full">
            {/* Chat section */}
            <div className="w-full lg:flex-1 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden mb-4 lg:mb-0 lg:ml-6">
              {selectedDeal ? (
                <DealChat dealId={selectedDeal.id} deal={selectedDeal} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a deal to start chatting
                </div>
              )}
            </div>

            {/* Deal details section */}
            <div className="w-full lg:w-96 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden lg:ml-6">
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