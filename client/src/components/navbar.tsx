import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { WalletConnect } from "./wallet-connect";

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="text-xl font-bold">P2P Market</a>
          </Link>
          <div className="relative w-64">
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-8"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/create">
            <Button>Create Listing</Button>
          </Link>
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
