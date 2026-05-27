import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db, reportsTable, usersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetHeatmapDataResponse,
  GetSeverityBreakdownResponse,
  GetStatusBreakdownResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  ListWardsResponse,
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

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where status = 'pending')::int`,
      inProgress: sql<number>`count(*) filter (where status = 'in_progress')::int`,
      resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
      resolvedToday: sql<number>`count(*) filter (where status = 'resolved' and resolved_at >= ${todayISO}::timestamptz)::int`,
      critical: sql<number>`count(*) filter (where severity = 'critical')::int`,
      activeWards: sql<number>`count(distinct ward)::int`,
      avgResolutionHours: sql<number>`
        coalesce(
          avg(
            extract(epoch from (resolved_at - created_at)) / 3600
          ) filter (where resolved_at is not null),
          0
        )
      `,
    })
    .from(reportsTable);

  const [pointsRow] = await db
    .select({
      totalEcoPoints: sql<number>`coalesce(sum(eco_points), 0)::int`,
    })
    .from(usersTable);

  const totalReports = counts?.total ?? 0;
  const resolvedReports = counts?.resolved ?? 0;
  const nrwReductionEstimate = resolvedReports * 0.5;

  const summary = {
    totalReports,
    pendingReports: counts?.pending ?? 0,
    inProgressReports: counts?.inProgress ?? 0,
    resolvedReports,
    resolvedToday: counts?.resolvedToday ?? 0,
    criticalReports: counts?.critical ?? 0,
    totalEcoPoints: pointsRow?.totalEcoPoints ?? 0,
    activeWards: counts?.activeWards ?? 0,
    avgResolutionHours: Math.round((counts?.avgResolutionHours ?? 0) * 10) / 10,
    nrwReductionEstimate,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/analytics/heatmap", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      latitude: reportsTable.latitude,
      longitude: reportsTable.longitude,
      severity: reportsTable.severity,
    })
    .from(reportsTable);

  const intensityMap: Record<string, number> = {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
  };

  const points = rows.map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    intensity: intensityMap[r.severity] ?? 0.5,
    severity: r.severity,
  }));

  res.json(GetHeatmapDataResponse.parse(points));
});

router.get("/analytics/severity-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      severity: reportsTable.severity,
      count: sql<number>`count(*)::int`,
    })
    .from(reportsTable)
    .groupBy(reportsTable.severity);

  res.json(GetSeverityBreakdownResponse.parse(rows));
});

router.get("/analytics/status-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      status: reportsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(reportsTable)
    .groupBy(reportsTable.status);

  res.json(GetStatusBreakdownResponse.parse(rows));
});

router.get("/analytics/recent-activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(reportsTable)
    .where(
      sql`status NOT IN ('resolved', 'rejected')`
    )
    .orderBy(desc(reportsTable.createdAt))
    .limit(parsed.data.limit ?? 10);

  res.json(GetRecentActivityResponse.parse(rows.map(serializeReport)));
});

router.get("/wards", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      ward: reportsTable.ward,
      totalReports: sql<number>`count(*)::int`,
      pendingReports: sql<number>`count(*) filter (where status = 'pending')::int`,
      criticalReports: sql<number>`count(*) filter (where severity = 'critical')::int`,
      resolvedReports: sql<number>`count(*) filter (where status = 'resolved')::int`,
    })
    .from(reportsTable)
    .groupBy(reportsTable.ward)
    .orderBy(sql`count(*) desc`);

  res.json(ListWardsResponse.parse(rows));
});

export default router;
