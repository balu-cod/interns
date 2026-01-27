import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";

/**
 * ============================================
 * LOCAL SCHEMAS (SERVER-ONLY)
 * ============================================
 * We DO NOT modify shared schemas.
 * This avoids frontend/backend contract mismatch.
 */
const materialEntrySchema = z.object({
  materialCode: z.string().min(1),
  quantity: z.number().min(1),
  rackId: z.string().min(1),
  binNumber: z.string().min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /**
   * ============================================
   * MATERIAL ROUTES
   * ============================================
   */

  // GET all materials
  app.get(api.materials.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const materials = await storage.getMaterials({ query: search });
    res.json(materials);
  });

  // GET material by code
  app.get(api.materials.get.path, async (req, res) => {
    const material = await storage.getMaterialByCode(req.params.code);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.json(material);
  });

  /**
   * ENTRY: Create OR update material + log transaction
   */
  app.post(api.materials.create.path, async (req, res) => {
    try {
      const input = materialEntrySchema.parse(req.body);

      let material = await storage.getMaterialByCode(input.materialCode);

      if (material) {
        // Update quantity
        material = await storage.updateMaterial(material.id, {
          quantity: material.quantity + input.quantity,
          rackId: input.rackId,
          binNumber: input.binNumber,
        });
      } else {
        // Create new material
        material = await storage.createMaterial({
          materialCode: input.materialCode,
          quantity: input.quantity,
          rackId: input.rackId,
          binNumber: input.binNumber,
        });
      }

      // Log ENTRY transaction (backend-controlled)
      await storage.createTransaction({
        materialCode: material.materialCode,
        type: "ENTRY",
        quantity: input.quantity,
        rackId: input.rackId,
        binNumber: input.binNumber,
        personName: "system", // later replace with auth user
      });

      res.status(201).json(material);

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      console.error("ENTRY ERROR:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /**
   * UPDATE material directly (admin/edit use-case)
   */
  app.put(api.materials.update.path, async (req, res) => {
    try {
      const input = api.materials.update.input.parse(req.body);
      const material = await storage.updateMaterial(
        Number(req.params.id),
        input
      );
      res.json(material);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      console.error("UPDATE ERROR:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /**
   * ============================================
   * TRANSACTION ROUTES
   * ============================================
   */

  // GET all transactions
  app.get(api.transactions.list.path, async (_req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  /**
   * ISSUE material (deduct quantity)
   */
  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);

      if (input.type === "ISSUE") {
        const material = await storage.getMaterialByCode(input.materialCode);

        if (!material) {
          return res.status(404).json({ message: "Material not found" });
        }

        if (material.quantity < input.quantity) {
          return res.status(400).json({ message: "Insufficient quantity" });
        }

        await storage.updateMaterial(material.id, {
          quantity: material.quantity - input.quantity,
        });
      }

      const transaction = await storage.createTransaction(input);
      res.status(201).json(transaction);

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      console.error("ISSUE ERROR:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /**
   * ============================================
   * STATS ROUTE
   * ============================================
   */

  app.get(api.stats.get.path, async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  /**
   * ============================================
   * DEV SEED DATA
   * ============================================
   */
  if (process.env.NODE_ENV !== "production") {
    const existing = await storage.getMaterials();
    if (existing.length === 0) {
      await storage.createMaterial({
        materialCode: "TRIM-001",
        quantity: 100,
        rackId: "A1",
        binNumber: "01",
      });
      await storage.createMaterial({
        materialCode: "TRIM-002",
        quantity: 50,
        rackId: "B2",
        binNumber: "15",
      });
      console.log("✅ Seeded materials");
    }
  }

  return httpServer;
}
