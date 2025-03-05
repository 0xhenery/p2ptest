import { Button } from "@/components/ui/button";
import { useWeb3Store, shortenAddress } from "@/lib/web3";
import { AlertCircle } from "lucide-react";

export function WalletConnect() {
  const { address, connect, disconnect, isBaseNetwork, switchToBaseNetwork } = useWeb3Store();

  return address ? (
    <div className="flex items-center gap-2">
      {!isBaseNetwork && (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={switchToBaseNetwork}
          className="flex items-center gap-1"
        >
          <AlertCircle className="h-4 w-4" />
          Switch to Base
        </Button>
      )}
      <Button variant="outline" onClick={disconnect}>
        {isBaseNetwork ? "✓ " : ""}{shortenAddress(address)}
      </Button>
    </div>
  ) : (
    <Button onClick={connect}>
      Connect Wallet
    </Button>
  );
}
