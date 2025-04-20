import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { DealStatusBadge } from "./DealStatusBadge";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Deal, DealTerms } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";

interface DealDetailsProps {
  deal: Deal;
}

export function DealDetails({ deal }: DealDetailsProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTerms, setEditedTerms] = useState<DealTerms>(deal.terms);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const isArtist = session?.user?.role === "ARTIST";
  const isExec = session?.user?.role === "EXEC";
  const isPending = deal.state === "PENDING";
  const isCountered = deal.state === "COUNTERED";
  const isAwaitingResponse = deal.state === "AWAITING_RESPONSE";

  // Check if user is part of this deal
  const isPartOfDeal = (isArtist && deal.artistId === session?.user?.id) ||
                      (isExec && deal.execId === session?.user?.id);

  const canAccept = isPartOfDeal && ((isArtist && isPending) || (isExec && isCountered));
  const canDecline = isPartOfDeal && ((isArtist && (isPending || isAwaitingResponse)) ||
                    (isExec && (isPending || isCountered || isAwaitingResponse)));
  const canCounter = isPartOfDeal && ((isArtist && isPending) || (isExec && isAwaitingResponse));

  const getAcceptButtonText = () => {
    if (isExec && isCountered) {
      return "Accept Counter Offer";
    }
    return "Accept Deal";
  };

  const updateDeal = api.deal.updateDealState.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description: "Deal state updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = async () => {
    try {
      // If exec is accepting a counter offer, move to PENDING state
      const newState = isExec && isCountered ? "PENDING" : "ACCEPTED";

      await updateDeal.mutateAsync({
        dealId: deal.id,
        newState,
        changes: {},
      });
    } catch (error) {
      console.error("Failed to accept deal:", error);
    }
  };

  const handleDecline = async () => {
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        newState: "DECLINED",
        changes: {},
      });
    } catch (error) {
      console.error("Failed to decline deal:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        newState: "CANCELLED",
        changes: {},
      });
    } catch (error) {
      console.error("Failed to cancel deal:", error);
    }
  };

  const handleSendCounterOffer = async () => {
    try {
      const changes: Partial<DealTerms> = {
        duration: editedTerms.duration,
        price: editedTerms.price,
      };

      // Only include usageType and rights if the user is an executive
      if (isExec) {
        changes.usageType = editedTerms.usageType;
        changes.rights = editedTerms.rights;
      }

      await updateDeal.mutateAsync({
        dealId: deal.id,
        newState: "COUNTERED",
        changes,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to send counter offer:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Deal Details</h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400">Track</h3>
          <p className="mt-1 text-white">{deal.track.title}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400">Status</h3>
          <div className="mt-1">
            <DealStatusBadge status={deal.state} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Deal Terms</h3>
          {canCounter && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel Edit" : "Edit Terms"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Usage Type</Label>
                {isExec ? (
                  <Select
                    value={editedTerms.usageType}
                    onValueChange={(value: "SYNC" | "MASTER") =>
                      setEditedTerms({ ...editedTerms, usageType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SYNC">Sync</SelectItem>
                      <SelectItem value="MASTER">Master</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-300">{deal.terms.usageType}</p>
                )}
              </div>
              <div>
                <Label className="text-gray-300">Rights</Label>
                {isExec ? (
                  <Select
                    value={editedTerms.rights}
                    onValueChange={(value: "EXCLUSIVE" | "NON_EXCLUSIVE") =>
                      setEditedTerms({ ...editedTerms, rights: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCLUSIVE">Exclusive</SelectItem>
                      <SelectItem value="NON_EXCLUSIVE">Non-Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-300">{deal.terms.rights}</p>
                )}
              </div>
              <div>
                <Label className="text-gray-300">Duration</Label>
                <Select
                  value={editedTerms.duration.toString()}
                  onValueChange={(value) =>
                    setEditedTerms({
                      ...editedTerms,
                      duration: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">1 Year</SelectItem>
                    <SelectItem value="24">2 Years</SelectItem>
                    <SelectItem value="36">3 Years</SelectItem>
                    <SelectItem value="60">5 Years</SelectItem>
                    <SelectItem value="1200">Perpetual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Price ($)</Label>
                <Input
                  type="number"
                  value={editedTerms.price}
                  onChange={(e) =>
                    setEditedTerms({
                      ...editedTerms,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="text-gray-300"
                />
              </div>
            </div>
            <Button onClick={handleSendCounterOffer}>Send Counter Offer</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Usage Type</Label>
                <p className="text-white">{deal.terms.usageType}</p>
              </div>
              <div>
                <Label className="text-gray-300">Rights</Label>
                <p className="text-white">{deal.terms.rights}</p>
              </div>
              <div>
                <Label className="text-gray-300">Duration</Label>
                <p className="text-white">{deal.terms.duration} months</p>
              </div>
              <div>
                <Label className="text-gray-300">Price</Label>
                <p className="text-white">${deal.terms.price}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <div className="flex flex-col gap-4">
            {/* Primary Actions */}
            {isCountered && isArtist && isPartOfDeal ? (
              <div className="text-center text-gray-300">
                Awaiting response from executive
              </div>
            ) : (
              <div className="flex gap-2">
                {canAccept && (
                  <Button
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {getAcceptButtonText()}
                  </Button>
                )}
                {isExec && isPartOfDeal && (
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                  >
                    Cancel Deal
                  </Button>
                )}
                {isArtist && canDecline && (
                  <Button
                    onClick={handleDecline}
                    variant="destructive"
                  >
                    Decline Deal
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}