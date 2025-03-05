import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  const broadcast = (message: any) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  app.post('/api/listings', async (req, res) => {
    try {
      const listingData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(listingData);
      broadcast({ type: 'NEW_LISTING', listing });
      res.json(listing);
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(400).json({ error: 'Invalid listing data' });
    }
  });

  app.get('/api/listings', async (req, res) => {
    try {
      const listings = await storage.getListings();
      res.json(listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  });

  app.patch('/api/listings/:itemId/price', async (req, res) => {
    const itemId = parseInt(req.params.itemId);
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'Price is required' });
    }

    try {
      const listing = await storage.getListingByItemId(itemId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      await storage.updateListingPrice(itemId, price);
      broadcast({ type: 'LISTING_PRICE_UPDATED', itemId, price });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating listing price:', error);
      res.status(500).json({ error: 'Failed to update listing price' });
    }
  });

  app.get('/api/listings/search', async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    try {
      const results = await storage.searchListings(query);
      res.json(results);
    } catch (error) {
      console.error('Error searching listings:', error);
      res.status(500).json({ error: 'Failed to search listings' });
    }
  });

  app.patch('/api/listings/:itemId/status', async (req, res) => {
    const itemId = parseInt(req.params.itemId);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
      await storage.updateListingStatus(itemId, isActive);
      broadcast({ type: 'LISTING_STATUS_UPDATED', itemId, isActive });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating listing status:', error);
      res.status(500).json({ error: 'Failed to update listing status' });
    }
  });

  return httpServer;
}