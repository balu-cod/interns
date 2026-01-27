import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /* ================================
     MATERIAL ROUTES
  ================================= */

  // GET /api/materials
  app.get(api.materials.list.path, async (req, res) => {
    try {
      const { search } = req.query as { search?: string };
      const materials = await storage.getMaterials({ query: search });
      return res.json(materials);
    } catch (err) {
      console.error("❌ GET /materials failed:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET /api/materials/:code
  app.get(api.materials.get.path, async (req, res) => {
    try {
      const material = await storage.getMaterialByCode(req.params.code);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      return res.json(material);
    } catch (err) {
      console.error("❌ GET /materials/:code failed:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // POST /api/materials  (ENTRY)
  app.post(api.materials.create.path, async (req, res) => {
    console.log("➡️ POST /api/materials", req.body);

    try {
      // Validate ONLY material fields
      const input = api.materials.create.input.parse(req.body);

      let material = await storage.getMaterialByCode(input.materialCode);

      if (material) {
        material = await storage.updateMaterial(material.id, {
          quantity: material.quantity + input.quantity,
          rackId: input.rackId,
          binNumber: input.binNumber,
        });
      } else {
        material = await storage.createMaterial(input);
      }

      // 🔹 Transaction logging (non-blocking)
      try {
        const enteredBy =
          typeof req.body.enteredBy === "string" && req.body.enteredBy.trim()
            ? req.body.enteredBy
            : "SYSTEM";

        await storage.createTransaction({
          materialCode: material.materialCode,
          type: "ENTRY",
          quantity: input.quantity,
          rackId: input.rackId,
          binNumber: input.binNumber,
          personName: enteredBy,
        });
      } catch (txErr) {
        console.error("⚠️ Transaction insert failed (ignored):", txErr);
      }

      return res.status(201).json(material);

    } catch (err) {
      console.error("❌ POST /materials error:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // PUT /api/materials/:id
  app.put(api.materials.update.path, async (req, res) => {
    try {
      const input = api.materials.update.input.parse(req.body);
      const material = await storage.updateMaterial(
        Number(req.params.id),
        input
      );
      return res.json(material);
    } catch (err) {
      console.error("❌ PUT /materials/:id failed:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /* ================================
     TRANSACTION ROUTES
  ================================= */

  // GET /api/transactions
  app.get(api.transactions.list.path, async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      return res.json(transactions);
    } catch (err) {
      console.error("❌ GET /transactions failed:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // POST /api/transactions (ISSUE)
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
      return res.status(201).json(transaction);

    } catch (err) {
      console.error("❌ POST /transactions failed:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  /* ================================
     STATS ROUTE
  ================================= */

  // GET /api/stats
  app.get(api.stats.get.path, async (_req, res) => {
    try {
      const stats = await storage.getStats();
      return res.json(stats);
    } catch (err) {
      console.error("❌ GET /stats failed:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
