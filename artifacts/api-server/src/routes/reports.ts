import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import {
  ListReportsQueryParams,
  CreateReportBody,
  GetReportParams,
  UpdateReportParams,
  UpdateReportBody,
  UpvoteReportParams,
  ListReportsResponse,
  GetReportResponse,
  UpdateReportResponse,
  UpvoteReportResponse,
} from "@workspace/api-zod";

type RawReport = typeof reportsTable.$inferSelect;

function serializeReport(r: RawReport) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    resolvedAt: r.resolvedAt instanceof Date ? r.resolvedAt.toISOString() : (r.resolvedAt ?? null),
  };
}

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  const parsed = ListReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, severity, ward, limit, offset } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(reportsTable.status, status));
  if (severity) conditions.push(eq(reportsTable.severity, severity));
  if (ward) conditions.push(eq(reportsTable.ward, ward));

  const rows = await db
    .select()
    .from(reportsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  res.json(ListReportsResponse.parse(rows.map(serializeReport)));
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      ...parsed.data,
      status: "pending",
      upvotes: 0,
    })
    .returning();

  res.status(201).json(GetReportResponse.parse(serializeReport(report)));
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetReportResponse.parse(serializeReport(report)));
});

router.patch("/reports/:id", async (req, res): Promise<void> => {
  const params = UpdateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "resolved") {
    updates.resolvedAt = new Date();
  }

  const [report] = await db
    .update(reportsTable)
    .set(updates)
    .where(eq(reportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(UpdateReportResponse.parse(serializeReport(report)));
});

router.post("/reports/:id/upvote", async (req, res): Promise<void> => {
  const params = UpvoteReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .update(reportsTable)
    .set({ upvotes: sql`${reportsTable.upvotes} + 1` })
    .where(eq(reportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(UpvoteReportResponse.parse(serializeReport(report)));
});

export default router;
