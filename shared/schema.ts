import { z } from "zod";

export const insertListingSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  twitterLink: z.string().url("Invalid Twitter URL"),
  telegramLink: z.string().url("Invalid Telegram URL"),
  sellerAddress: z.string().min(1, "Seller address is required"),
  itemId: z.number()
});

export type InsertListing = z.infer<typeof insertListingSchema>;

export interface Listing extends InsertListing {
  id: number;
  isActive: boolean;
}