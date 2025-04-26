"use client";

import { DealList } from "@/components/messages/DealList";
import { DealChat } from "@/components/messages/DealChat";
import { DealDetails } from "@/components/messages/DealDetails";
import { useState, useEffect } from "react";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [activeMobileSection, setActiveMobileSection] = useState<'deals' | 'chat' | 'details'>('deals');

  // Reset to deals tab if no deal is selected
  useEffect(() => {
    if (!selectedDeal && activeMobileSection !== 'deals') {
      setActiveMobileSection('deals');
    }
  }, [selectedDeal, activeMobileSection]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        {/* Mobile: show tabs, Desktop: show all */}
        <div className="block lg:hidden mb-4">
          <div className="flex justify-between gap-2 mb-2">
            <button
              className={`flex-1 py-2 rounded ${activeMobileSection === 'deals' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActiveMobileSection('deals')}
            >
              Deals
            </button>
            <button
              className={`flex-1 py-2 rounded ${activeMobileSection === 'chat' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActiveMobileSection('chat')}
              disabled={!selectedDeal}
            >
              DM
            </button>
            <button
              className={`flex-1 py-2 rounded ${activeMobileSection === 'details' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActiveMobileSection('details')}
              disabled={!selectedDeal}
            >
              Deal Details
            </button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] w-full min-h-0">
          {/* Left sidebar - Deal list */}
          {/* Mobile: show only active section, Desktop: show all */}
          <div className={`w-full lg:w-80 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm mb-4 lg:mb-0 ${activeMobileSection !== 'deals' ? 'hidden lg:block' : ''}`}>
            <DealList onSelectDeal={setSelectedDeal} />
          </div>

          {/* Main content - Chat and details */}
          <div className="flex flex-col lg:flex-row flex-1 w-full min-h-0">
            {/* Chat section */}
            <div className={`w-full lg:flex-1 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm mb-4 lg:mb-0 lg:ml-6 ${activeMobileSection !== 'chat' ? 'hidden lg:block' : ''}`}>
              {selectedDeal ? (
                <DealChat dealId={selectedDeal.id} deal={selectedDeal} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a deal to start chatting
                </div>
              )}
            </div>

            {/* Deal details section */}
            <div className={`w-full lg:w-96 rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm lg:ml-6 ${activeMobileSection !== 'details' ? 'hidden lg:block' : ''}`}>
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