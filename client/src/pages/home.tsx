import { useQuery } from "@tanstack/react-query";
import { Grid } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { useP2PContract, purchaseItem } from "@/lib/contracts";
import type { Listing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWeb3Store } from "@/lib/web3";

export default function Home() {
  const contract = useP2PContract();
  const { address } = useWeb3Store();
  const { toast } = useToast();

  const { data: listings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ['/api/listings'],
    refetchInterval: 5000 // Refetch every 5 seconds to catch new listings
  });

  const handlePurchase = async (listing: Listing) => {
    if (!contract || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    try {
      await purchaseItem(contract, listing.itemId, listing.price);
      toast({
        title: "Success",
        description: "Item purchased successfully! Please wait for the seller to deliver the item."
      });
    } catch (error: any) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error loading listings</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Grid className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No Listings Yet</h2>
        <p className="text-muted-foreground">Create the first listing!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPurchase={() => handlePurchase(listing)}
          />
        ))}
      </div>
    </div>
  );
}