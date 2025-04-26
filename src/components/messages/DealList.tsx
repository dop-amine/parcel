import { useState } from "react";
import { api } from "@/utils/api";
import { DealStatusBadge } from "./DealStatusBadge";
import { formatDistanceToNow } from "date-fns";
import type { Deal } from "@/types/deal";

interface DealListProps {
  onSelectDeal: (deal: Deal) => void;
}

export function DealList({ onSelectDeal }: DealListProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { data: deals, isLoading } = api.deal.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Consider data stale immediately
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const handleDealSelect = (deal: Deal) => {
    setSelectedDealId(deal.id);
    onSelectDeal(deal);
  };

  if (isLoading) {
    return <div className="p-4">Loading deals...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Deals</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {deals?.map((deal) => (
          <div
            key={deal.id}
            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 ${
              selectedDealId === deal.id ? "bg-gray-800/50" : ""
            }`}
            onClick={() => handleDealSelect(deal)}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-white">{deal.track.title}</div>
              <DealStatusBadge status={deal.state} />
            </div>
            <div className="text-sm text-gray-400">
              {deal.terms.price} • {formatDistanceToNow(new Date(deal.updatedAt))} ago
            </div>
            <div className="text-sm mt-1 text-gray-400">
              {deal.terms.usageType} • {deal.terms.duration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}