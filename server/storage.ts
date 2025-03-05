import { type Listing, type InsertListing } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  createListing(listing: InsertListing): Promise<Listing>;
  getListing(id: number): Promise<Listing | undefined>;
  getListings(): Promise<Listing[]>;
  getListingByItemId(itemId: number): Promise<Listing | undefined>;
  updateListingStatus(itemId: number, isActive: boolean): Promise<void>;
  updateListingPrice(itemId: number, price: string): Promise<void>;
  searchListings(query: string): Promise<Listing[]>;
}

export class MongoStorage implements IStorage {
  private collection = db.collection<Listing>('listings');
  private async getNextId(): Promise<number> {
    const doc = await this.collection.findOne({}, { sort: { id: -1 } });
    return (doc?.id || 0) + 1;
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = await this.getNextId();
    const listing: Listing = { ...insertListing, id, isActive: true };
    await this.collection.insertOne(listing);
    return listing;
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return await this.collection.findOne({ id }) || undefined;
  }

  async getListings(): Promise<Listing[]> {
    return await this.collection.find({}).toArray();
  }

  async getListingByItemId(itemId: number): Promise<Listing | undefined> {
    return await this.collection.findOne({ itemId }) || undefined;
  }

  async updateListingStatus(itemId: number, isActive: boolean): Promise<void> {
    await this.collection.updateOne(
      { itemId },
      { $set: { isActive } }
    );
  }

  async updateListingPrice(itemId: number, price: string): Promise<void> {
    await this.collection.updateOne(
      { itemId },
      { $set: { price } }
    );
  }

  async searchListings(query: string): Promise<Listing[]> {
    const lowercaseQuery = query.toLowerCase();
    return await this.collection.find({
      itemName: { $regex: lowercaseQuery, $options: 'i' }
    }).toArray();
  }
}

export const storage = new MongoStorage();