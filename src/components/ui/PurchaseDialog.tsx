'use client';

import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { useToast } from "@/hooks/use-toast";
import type { Deal } from "@/types/deal";
import { useSession } from "next-auth/react";

interface PurchaseDialogProps {
  deal: Deal;
  children: React.ReactNode;
}

export function PurchaseDialog({ deal, children }: PurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState(deal.terms.price.toString());
  const { toast } = useToast();
  const { data: session } = useSession();
  const isArtist = session?.user?.role === "ARTIST";

  const updateDeal = api.deal.updateDealState.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      toast({
        title: "Success",
        description: isCounterOffer ? "Counter offer sent" : "Deal has been accepted",
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

  const isCounterOffer = deal.state === "COUNTERED";
  const isPending = deal.state === "PENDING";
  const canAccept = isArtist || (isPending && deal.state === "PENDING");

  const handleAction = () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    if (isCounterOffer) {
      // Accepting a counter offer
      updateDeal.mutate({
        dealId: deal.id,
        newState: "PENDING",
        changes: {
          price: numericPrice,
        },
      });
    } else if (canAccept) {
      // Accepting the deal
      updateDeal.mutate({
        dealId: deal.id,
        newState: "ACCEPTED",
        changes: {
          price: numericPrice,
        },
      });
    } else {
      // Making a counter offer
      updateDeal.mutate({
        dealId: deal.id,
        newState: "COUNTERED",
        changes: {
          price: numericPrice,
        },
      });
    }
  };

  const getDialogTitle = () => {
    if (isCounterOffer) return "Accept Counter Offer";
    if (canAccept) return "Accept Deal";
    return "Make Counter Offer";
  };

  const getActionButtonText = () => {
    if (isCounterOffer) return "Accept Counter Offer";
    if (canAccept) return "Accept Deal";
    return "Send Counter Offer";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateDeal.isPending}
            >
              {updateDeal.isPending ? "Processing..." : getActionButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}