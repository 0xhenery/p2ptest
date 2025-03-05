
import { useWeb3Store } from "@/lib/web3";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

export function NetworkBanner() {
  const { address, isBaseNetwork, switchToBaseNetwork } = useWeb3Store();

  if (!address || isBaseNetwork) {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>Please switch to Base network to use this marketplace</span>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={switchToBaseNetwork}
        >
          Switch to Base
        </Button>
      </div>
    </div>
  );
}
