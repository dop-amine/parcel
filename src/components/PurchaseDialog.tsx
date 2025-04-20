'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: string;
    title: string;
    artist: {
      name: string | null;
    };
  };
}

export default function PurchaseDialog({ isOpen, onClose, track }: PurchaseDialogProps) {
  const [selectedUsage, setSelectedUsage] = useState<string>("");
  const [selectedRights, setSelectedRights] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [proposedPrice, setProposedPrice] = useState<string>("");

  const createDeal = api.deal.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const usageTypes = [
    "Commercial",
    "Personal",
    "Streaming",
    "Broadcast",
    "Film/TV",
  ];

  const rights = [
    "Master Rights",
    "Sync Rights",
    "Performance Rights",
    "Distribution Rights",
  ];

  const durations = [
    "1 Year",
    "2 Years",
    "3 Years",
    "5 Years",
    "Perpetual",
  ];

  const handleSubmit = () => {
    if (!selectedUsage || selectedRights.length === 0 || !selectedDuration || !proposedPrice) {
      return;
    }

    createDeal.mutate({
      trackId: track.id,
      terms: {
        usageType: selectedUsage,
        rights: selectedRights,
        duration: selectedDuration,
        price: proposedPrice ? parseInt(proposedPrice) : 0,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase License</DialogTitle>
          <DialogDescription>
            Create a deal to license &quot;{track.title}&quot; by {track.artist.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Usage Type</label>
            <div className="flex flex-wrap gap-2">
              {usageTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedUsage === type ? "default" : "outline"}
                  onClick={() => setSelectedUsage(type)}
                  className="h-8"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Rights</label>
            <div className="flex flex-wrap gap-2">
              {rights.map((right) => (
                <Button
                  key={right}
                  variant={selectedRights.includes(right) ? "default" : "outline"}
                  onClick={() => {
                    if (selectedRights.includes(right)) {
                      setSelectedRights(selectedRights.filter((r) => r !== right));
                    } else {
                      setSelectedRights([...selectedRights, right]);
                    }
                  }}
                  className="h-8"
                >
                  {right}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Duration</label>
            <div className="flex flex-wrap gap-2">
              {durations.map((duration) => (
                <Button
                  key={duration}
                  variant={selectedDuration === duration ? "default" : "outline"}
                  onClick={() => setSelectedDuration(duration)}
                  className="h-8"
                >
                  {duration}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Proposed Price ($)</label>
            <input
              type="number"
              value={proposedPrice}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  setProposedPrice(value.toString());
                } else {
                  setProposedPrice("");
                }
              }}
              className="w-full rounded-md border border-gray-800 bg-white px-3 py-2 text-sm text-gray-900"
              placeholder="Enter amount"
              min="0"
              step="1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createDeal.isPending}>
            {createDeal.isPending ? "Creating..." : "Create Deal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}