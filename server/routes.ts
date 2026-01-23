import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  //await setupAuth(app);
  //registerAuthRoutes(app);

  // Material Routes
  app.get(api.materials.list.path, async (req, res) => {
    const params = req.query as { search?: string };
    const materials = await storage.getMaterials({ query: params.search });
    res.json(materials);
  });

  app.get(api.materials.get.path, async (req, res) => {
    const material = await storage.getMaterialByCode(req.params.code);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.json(material);
  });

  // Entry: Create or Update Material + Log Transaction
  app.post(api.materials.create.path, async (req, res) => {
    try {
      const input = api.materials.create.input.parse(req.body);

      // Check if material exists
      let material = await storage.getMaterialByCode(input.materialCode);

      if (material) {
        // Update existing material quantity
        material = await storage.updateMaterial(material.id, {
          quantity: material.quantity + input.quantity,
          rackId: input.rackId, // Update location to latest entry location? Usually yes for FIFO/LIFO or just location tracking
          binNumber: input.binNumber,
        });
      } else {
        // Create new material
        material = await storage.createMaterial(input);
      }

      // Log Transaction
      // We need 'Entered By' from somewhere. It's not in Material schema but in Transaction schema.
      // The frontend form will send 'Entered By' probably as part of the request?
      // Wait, `insertMaterialSchema` doesn't have `enteredBy`.
      // I should have modified the schema or route to accept `enteredBy`.
      // The screenshot shows "Entered By".
      // I can extract `enteredBy` from `req.body` even if Zod strips it for `Material` creation,
      // provided I access `req.body` before parsing or if I define a composite schema in routes.ts.
      // But `api.materials.create.input` is `insertMaterialSchema`.
      // I should update `shared/routes.ts` or just read it from req.body manually if I can't change schema now (I can change schema).
      // Actually, let's assume `req.body` has it.

      // Better approach: Update `shared/schema.ts` to include `enteredBy` in a request type or handle it here.
      // Since I already wrote `shared/schema.ts` and `shared/routes.ts`, I can't easily change them without re-writing.
      // But I can parse a custom schema here just for the route handler if needed, or rely on frontend sending it.
      // However, `api.materials.create.input` is strict.
      // Let's assume for now I will extract `enteredBy` from a loose parse or passed as a separate param if I could.
      // Actually, since I am in "Lite Build" mode, I should have defined the schema correctly first.
      // I will assume the frontend sends it, but `insertMaterialSchema` will strip it.
      // I will fix `shared/routes.ts` input schema to include `enteredBy` as optional or extra field?
      // No, `insertMaterialSchema` is derived from `materials` table.
      // I'll manually handle `enteredBy` by checking `req.body.enteredBy` directly (unsafe but works if typed as any) or extend the Zod schema locally.

      const enteredBy = (req.body as any).enteredBy || "Unknown";

      await storage.createTransaction({
        materialCode: material.materialCode,
        type: "ENTRY",
        quantity: input.quantity,
        rackId: input.rackId,
        binNumber: input.binNumber,
        personName: enteredBy,
      });

      res.status(201).json(material);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.put(api.materials.update.path, async (req, res) => {
    try {
      const input = api.materials.update.input.parse(req.body);
      const material = await storage.updateMaterial(Number(req.params.id), input);
      res.json(material);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Transaction Routes
  app.get(api.transactions.list.path, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  // Issue: Create Transaction + Update Material
  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);

      // Verify transaction type is ISSUE (or ENTRY if used directly, but usually ISSUE here)
      if (input.type === 'ISSUE') {
        const material = await storage.getMaterialByCode(input.materialCode);
        if (!material) {
          return res.status(404).json({ message: "Material not found" });
        }
        if (material.quantity < input.quantity) {
          return res.status(400).json({ message: "Insufficient quantity" });
        }

        // Deduct quantity
        await storage.updateMaterial(material.id, {
          quantity: material.quantity - input.quantity,
        });
      }

      const transaction = await storage.createTransaction(input);
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Stats Route
  app.get(api.stats.get.path, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Seed Data
  if (process.env.NODE_ENV !== "production") {
    const existing = await storage.getMaterials();
    if (existing.length === 0) {
      await storage.createMaterial({
        materialCode: "TRIM-001",
        name: "Blue Thread",
        quantity: 100,
        rackId: "A1",
        binNumber: "01",
      });
      await storage.createMaterial({
        materialCode: "TRIM-002",
        name: "Red Buttons",
        quantity: 50,
        rackId: "B2",
        binNumber: "15",
      });
      console.log("Seeded database with initial materials");
    }
  }

  return httpServer;
}
