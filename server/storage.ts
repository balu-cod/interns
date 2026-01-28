import { db } from "./db";
import { materials, transactions } from "@shared/schema";
import { eq, ilike, sql } from "drizzle-orm";

export const storage = {
  // =======================
  // MATERIALS
  // =======================

  async getMaterials(params?: { query?: string }) {
    if (params?.query) {
      const q = `%${params.query}%`;
      return await db
        .select()
        .from(materials)
        .where(
          sql`
            ${materials.materialCode} ILIKE ${q}
            OR ${materials.name} ILIKE ${q}
            OR ${materials.rackId} ILIKE ${q}
          `
        );
    }

    return await db.select().from(materials);
  },

  async getMaterialByCode(code: string) {
    const result = await db
      .select()
      .from(materials)
      .where(eq(materials.materialCode, code))
      .limit(1);

    return result[0] ?? null;
  },

  async createMaterial(data: {
    materialCode: string;
    name?: string;
    quantity: number;
    rackId: string;
    binNumber: string;
  }) {
    const result = await db
      .insert(materials)
      .values(data)
      .returning();

    return result[0];
  },

  async updateMaterial(
    id: number,
    data: Partial<{
      quantity: number;
      rackId: string;
      binNumber: string;
      name?: string;
    }>
  ) {
    const result = await db
      .update(materials)
      .set({
        ...data,
        lastUpdated: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    return result[0];
  },

  // =======================
  // TRANSACTIONS
  // =======================

  async getTransactions() {
    return await db
      .select()
      .from(transactions)
      .orderBy(sql`${transactions.timestamp} DESC`);
  },

  async createTransaction(data: {
    materialCode: string;
    type: "ENTRY" | "ISSUE";
    quantity: number;
    rackId?: string;
    binNumber?: string;
    personName: string;
  }) {
    const result = await db
      .insert(transactions)
      .values(data)
      .returning();

    return result[0];
  },

  // =======================
  // DASHBOARD STATS
  // =======================

  async getStats() {
    const totalMaterials = await db
      .select({ count: sql<number>`count(*)` })
      .from(materials);

    const enteredToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        sql`
          ${transactions.type} = 'ENTRY'
          AND ${transactions.timestamp}::date = CURRENT_DATE
        `
      );

    const issuedToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        sql`
          ${transactions.type} = 'ISSUE'
          AND ${transactions.timestamp}::date = CURRENT_DATE
        `
      );

    return {
      totalMaterials: Number(totalMaterials[0].count),
      enteredToday: Number(enteredToday[0].count),
      issuedToday: Number(issuedToday[0].count),
    };
  },
};
