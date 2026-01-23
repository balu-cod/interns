import { db } from "./db";
import {
  materials,
  transactions,
  type Material,
  type Transaction,
  type CreateMaterialRequest,
  type CreateTransactionRequest,
  type UpdateMaterialRequest,
  type DashboardStats,
  type SearchParams,
} from "@shared/schema";
import { eq, like, desc, sql, and, gte, lt } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Material Operations
  getMaterials(params?: SearchParams): Promise<Material[]>;
  getMaterialByCode(code: string): Promise<Material | undefined>;
  createMaterial(material: CreateMaterialRequest): Promise<Material>;
  updateMaterial(id: number, updates: UpdateMaterialRequest): Promise<Material>;
  deleteMaterial(id: number): Promise<void>;

  // Transaction Operations
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: CreateTransactionRequest): Promise<Transaction>;

  // Stats
  getStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Re-export auth methods
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;

  // Material Methods
  async getMaterials(params?: SearchParams): Promise<Material[]> {
    if (params?.query) {
      const search = `%${params.query}%`;
      return await db
        .select()
        .from(materials)
        .where(
          sql`${materials.materialCode} ILIKE ${search} OR ${materials.rackId} ILIKE ${search} OR ${materials.name} ILIKE ${search}`
        )
        .orderBy(desc(materials.lastUpdated));
    }
    return await db.select().from(materials).orderBy(desc(materials.lastUpdated));
  }

  async getMaterialByCode(code: string): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.materialCode, code));
    return material;
  }

  async createMaterial(insertMaterial: CreateMaterialRequest): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async updateMaterial(id: number, updates: UpdateMaterialRequest): Promise<Material> {
    const [updated] = await db
      .update(materials)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return updated;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // Transaction Methods
  async getTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp))
      .limit(50); // Limit to recent 50
  }

  async createTransaction(insertTransaction: CreateTransactionRequest): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  // Stats
  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalMaterialsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials);

    const [enteredTodayResult] = await db
      .select({ sum: sql<number>`sum(${transactions.quantity})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'ENTRY'),
          gte(transactions.timestamp, today),
          lt(transactions.timestamp, tomorrow)
        )
      );

    const [issuedTodayResult] = await db
      .select({ sum: sql<number>`sum(${transactions.quantity})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'ISSUE'),
          gte(transactions.timestamp, today),
          lt(transactions.timestamp, tomorrow)
        )
      );

    return {
      totalMaterials: Number(totalMaterialsResult?.count || 0),
      enteredToday: Number(enteredTodayResult?.sum || 0),
      issuedToday: Number(issuedTodayResult?.sum || 0),
    };
  }
}

export const storage = new DatabaseStorage();
