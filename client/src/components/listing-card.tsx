import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, MessageCircle, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@shared/schema";
import { shortenAddress } from "@/lib/web3";
import { useWeb3Store } from "@/lib/web3";
import { useP2PContract, editItemPrice, confirmDelivery, claimPayment, getTradeDetails } from "@/lib/contracts";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface ListingCardProps {
  listing: Listing;
  onPurchase?: () => void;
}

export function ListingCard({
  listing,
  onPurchase,
}: ListingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(listing.price);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tradeStatus, setTradeStatus] = useState<'pending' | 'purchased' | 'delivered' | 'completed'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  const { address } = useWeb3Store();
  const contract = useP2PContract();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOwner = address && address.toLowerCase() === listing.sellerAddress.toLowerCase();

  // Fetch trade status from contract
  useEffect(() => {
    const fetchTradeStatus = async () => {
      if (!contract) return;
      try {
        const details = await getTradeDetails(contract, listing.itemId);
        if (details.isCompleted) {
          setTradeStatus('completed');
        } else if (details.isDelivered) {
          setTradeStatus('delivered');
        } else if (details.buyer !== '0x0000000000000000000000000000000000000000') {
          setTradeStatus('purchased');
        } else {
          setTradeStatus('pending');
        }
      } catch (error) {
        console.error('Error fetching trade status:', error);
      }
    };
    fetchTradeStatus();
  }, [contract, listing.itemId]);

  const handlePriceEdit = async () => {
    if (!contract) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update price on blockchain
      await editItemPrice(contract, listing.itemId, newPrice);

      // Update price in MongoDB
      await apiRequest("PATCH", `/api/listings/${listing.itemId}/price`, {
        price: newPrice
      });

      // Invalidate and refetch listings
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Price updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelivery = async () => {
    if (!contract || !address) return;
    setIsLoading(true);
    try {
      await confirmDelivery(contract, listing.itemId);
      setTradeStatus('delivered');
      toast({
        title: "Success",
        description: "Delivery confirmed successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimPayment = async () => {
    if (!contract || !address) return;
    setIsLoading(true);
    try {
      await claimPayment(contract, listing.itemId);
      setTradeStatus('completed');
      toast({
        title: "Success",
        description: "Payment claimed successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseClick = async () => {
    if (!onPurchase) return;
    setIsPurchasing(true);
    try {
      await onPurchase();
      setTradeStatus('purchased');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{listing.itemName}</h3>
            <p className="text-sm text-muted-foreground">
              by {shortenAddress(listing.sellerAddress)}
            </p>
          </div>
          <Badge>{tradeStatus}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm mb-4">{listing.description}</p>
        <div className="flex gap-2">
          <a href={listing.twitterLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
          </a>
          <a href={listing.telegramLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Telegram
            </Button>
          </a>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-24"
                step="0.000001"
                min="0"
              />
              <Button size="sm" onClick={handlePriceEdit}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </>
          ) : (
            <div className="text-lg font-semibold flex items-center gap-2">
              {listing.price} ETH
              {isOwner && tradeStatus === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {tradeStatus === 'pending' && onPurchase && !isOwner && (
          <Button 
            onClick={handlePurchaseClick}
            disabled={isPurchasing}
          >
            {isPurchasing ? 'Purchasing...' : 'Purchase'}
          </Button>
        )}
        {tradeStatus === 'purchased' && !isOwner && (
          <Button onClick={handleConfirmDelivery} disabled={isLoading}>
            {isLoading ? 'Confirming...' : 'Confirm Delivery'}
          </Button>
        )}
        {tradeStatus === 'delivered' && isOwner && (
          <Button onClick={handleClaimPayment} disabled={isLoading}>
            {isLoading ? 'Claiming...' : 'Claim Payment'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}