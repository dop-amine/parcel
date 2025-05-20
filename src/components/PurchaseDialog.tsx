'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

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
  const router = useRouter();
  const [selectedUsage, setSelectedUsage] = useState<string>("");
  const [selectedRights, setSelectedRights] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [proposedPrice, setProposedPrice] = useState<string>("");
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);

  const createDeal = api.deal.create.useMutation({
    onSuccess: (data) => {
      setCreatedDealId(data.id);
    },
  });

  if (!track) return null;

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
    { label: "1 Year", value: 12 },
    { label: "2 Years", value: 24 },
    { label: "3 Years", value: 36 },
    { label: "5 Years", value: 60 },
    { label: "Perpetual", value: 1200 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsage || selectedRights.length === 0 || selectedDuration === null || !proposedPrice) {
      return;
    }
    createDeal.mutate({
      trackId: track.id,
      terms: {
        usageType: selectedUsage as string,
        rights: selectedRights as string[],
        duration: selectedDuration as number,
        price: proposedPrice ? parseInt(proposedPrice) : 0,
      },
    });
  };

  const handleGoToDeal = () => {
    router.push('/exec/messages');
    onClose();
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

        {createdDealId ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Deal Created</h3>
            <p className="text-sm text-gray-500 text-center">
              Your deal has been created successfully. You can now proceed to the messages page to continue the negotiation.
            </p>
            <Button onClick={handleGoToDeal} className="mt-4">
              Go To Deal
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                      type="button"
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
                      type="button"
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
                      key={duration.value}
                      variant={selectedDuration === duration.value ? "default" : "outline"}
                      onClick={() => setSelectedDuration(duration.value)}
                      className="h-8"
                      type="button"
                    >
                      {duration.label}
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
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Creating..." : "Create Deal"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}