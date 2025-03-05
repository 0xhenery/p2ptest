import { ethers } from "ethers";
import { create } from "zustand";

// Base Network Chain ID - Base Mainnet
const BASE_CHAIN_ID = "0x2105"; // Chain ID for Base in hex

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type Web3Store = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: string | null;
  isBaseNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBaseNetwork: () => Promise<void>;
};

export const useWeb3Store = create<Web3Store>((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isBaseNetwork: false,

  connect: async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // Get current chain ID
      const { chainId } = await provider.getNetwork();
      const chainIdHex = `0x${chainId.toString(16)}`;

      const isBaseNetwork = chainIdHex === BASE_CHAIN_ID;

      set({ 
        provider, 
        signer, 
        address: accounts[0],
        chainId: chainIdHex,
        isBaseNetwork
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', async (newChainId: string) => {
        const isBaseNetwork = newChainId === BASE_CHAIN_ID;
        set({ chainId: newChainId, isBaseNetwork });

        if (!isBaseNetwork) {
          alert("Please switch to Base network to use this application");
        }
      });

      // If not on Base network, prompt to switch
      if (!isBaseNetwork) {
        await get().switchToBaseNetwork();
      }
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
      alert("Failed to connect to wallet. Please try again.");
    }
  },

  switchToBaseNetwork: async () => {
    if (!window.ethereum) return;

    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // If the network is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_CHAIN_ID,
                chainName: 'Base Mainnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
        }
      } else {
        console.error("Failed to switch to Base network:", switchError);
      }
    }
  },

  disconnect: () => {
    if (window.ethereum) {
      window.ethereum.removeAllListeners('chainChanged');
    }
    set({ provider: null, signer: null, address: null, chainId: null, isBaseNetwork: false });
  },
}));