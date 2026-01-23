export * from "./models/auth";
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  materialCode: text("material_code").notNull().unique(), // e.g., MAT-XXXX
  name: text("name"), // Optional descriptive name
  quantity: integer("quantity").notNull().default(0),
  rackId: text("rack_id").notNull(),
  binNumber: text("bin_number").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  materialCode: text("material_code").notNull(), // Linked by code for simplicity or ID
  type: text("type").notNull(), // 'ENTRY' | 'ISSUE'
  quantity: integer("quantity").notNull(),
  rackId: text("rack_id"),
  binNumber: text("bin_number"),
  personName: text("person_name").notNull(), // 'Entered By' or 'Issued By'
  timestamp: timestamp("timestamp").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, lastUpdated: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, timestamp: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Material = typeof materials.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

// Request types
export type CreateMaterialRequest = z.infer<typeof insertMaterialSchema>;
export type UpdateMaterialRequest = Partial<z.infer<typeof insertMaterialSchema>>;
export type CreateTransactionRequest = z.infer<typeof insertTransactionSchema>;

// Response types
export type MaterialResponse = Material;
export type TransactionResponse = Transaction;

// Query types
export interface SearchParams {
  query?: string; // Search by code, rack, or status
}

export interface DashboardStats {
  totalMaterials: number;
  enteredToday: number;
  issuedToday: number;
}
