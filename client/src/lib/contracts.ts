import { ethers } from "ethers";
import { useWeb3Store } from "./web3";

// TODO: Replace with actual contract address on Base network
const P2P_CONTRACT_ADDRESS = "0x101D26C5CFBcC31c6eA30b074045E4d2624649e9";

const P2P_CONTRACT_ABI = [
  "function listItem(uint128 price) external payable",
  "function purchaseItem(uint256 itemId) external payable",
  "function confirmDelivery(uint256 itemId) external",
  "function claimPayment(uint256 itemId) external",
  "function editItemPrice(uint256 itemId, uint128 newPrice) external",
  "function getTradeDetails(uint256 itemId) external view returns (address seller, address buyer, uint256 price, bool isDelivered, bool isCompleted)",
  "event ItemListed(address indexed seller, uint256 indexed itemId, uint256 price)",
  "event ItemPurchased(uint256 indexed itemId, address indexed buyer, uint256 price)",
  "event ItemDelivered(uint256 indexed itemId, uint256 price)",
  "event PaymentReleased(uint256 indexed itemId, address seller, uint256 amount)",
  "event ItemPriceUpdated(uint256 indexed itemId, uint256 newPrice)",
  "event DebugSeller(uint256 indexed itemId, address msgSender, address tradeSeller)"
];

export function useP2PContract() {
  const { signer, isBaseNetwork } = useWeb3Store();
  if (!signer) return null;
  if (!isBaseNetwork) {
    console.warn("Not connected to Base network. Contract interactions will fail.");
  }
  return new ethers.Contract(P2P_CONTRACT_ADDRESS, P2P_CONTRACT_ABI, signer);
}

export async function listItem(contract: ethers.Contract, price: string) {
  const { isBaseNetwork } = useWeb3Store.getState();
  if (!isBaseNetwork) {
    throw new Error("Please connect to Base network to interact with the marketplace");
  }
  try {
    const listingFee = ethers.parseEther("0.0000004");
    const priceInWei = ethers.parseEther(price);
    const tx = await contract.listItem(priceInWei, {
      value: listingFee,
    });
    const receipt = await tx.wait();

    // Get itemId from event
    const event = receipt.logs.find(
      (log: any) => log.eventName === "ItemListed",
    );

    if (!event) {
      throw new Error("ItemListed event not found in transaction");
    }

    return {
      itemId: event.args[1].toString(),
      price: ethers.formatEther(event.args[2]),
    };
  } catch (error: any) {
    throw new Error(`Failed to list item: ${error.message}`);
  }
}

export async function purchaseItem(
  contract: ethers.Contract,
  itemId: number,
  price: string,
) {
  const { isBaseNetwork } = useWeb3Store.getState();
  if (!isBaseNetwork) {
    throw new Error("Please connect to Base network to interact with the marketplace");
  }
  
  try {
    const tx = await contract.purchaseItem(itemId, {
      value: ethers.parseEther(price),
    });
    return await tx.wait();
  } catch (error: any) {
    throw new Error(`Failed to purchase item: ${error.message}`);
  }
}

export async function confirmDelivery(
  contract: ethers.Contract,
  itemId: number,
) {
  const { isBaseNetwork } = useWeb3Store.getState();
  if (!isBaseNetwork) {
    throw new Error("Please connect to Base network to interact with the marketplace");
  }
  
  try {
    const tx = await contract.confirmDelivery(itemId);
    return await tx.wait();
  } catch (error: any) {
    throw new Error(`Failed to confirm delivery: ${error.message}`);
  }
}

export async function claimPayment(contract: ethers.Contract, itemId: number) {
  const { isBaseNetwork } = useWeb3Store.getState();
  if (!isBaseNetwork) {
    throw new Error("Please connect to Base network to interact with the marketplace");
  }
  
  try {
    const tx = await contract.claimPayment(itemId);
    return await tx.wait();
  } catch (error: any) {
    throw new Error(`Failed to claim payment: ${error.message}`);
  }
}

export async function editItemPrice(
  contract: ethers.Contract,
  itemId: number,
  newPrice: string,
) {
  const { isBaseNetwork } = useWeb3Store.getState();
  if (!isBaseNetwork) {
    throw new Error("Please connect to Base network to interact with the marketplace");
  }
  
  try {
    const priceInWei = ethers.parseEther(newPrice);
    const tx = await contract.editItemPrice(itemId, priceInWei);
    return await tx.wait();
  } catch (error: any) {
    throw new Error(`Failed to edit price: ${error.message}`);
  }
}

export async function getTradeDetails(
  contract: ethers.Contract,
  itemId: number,
) {
  try {
    const details = await contract.getTradeDetails(itemId);
    return {
      seller: details[0],
      buyer: details[1],
      price: ethers.formatEther(details[2]),
      isDelivered: details[3],
      isCompleted: details[4],
    };
  } catch (error: any) {
    throw new Error(`Failed to get trade details: ${error.message}`);
  }
}