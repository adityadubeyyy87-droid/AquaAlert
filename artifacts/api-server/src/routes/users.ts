import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  ListUsersResponse,
  GetUserResponse,
} from "@workspace/api-zod";

type RawUser = typeof usersTable.$inferSelect;

function serializeUser(u: RawUser) {
  return {
    ...u,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

function computeBadge(ecoPoints: number): string {
  if (ecoPoints >= 1500) return "Platinum";
  if (ecoPoints >= 500) return "Gold";
  if (ecoPoints >= 100) return "Silver";
  return "Bronze";
}

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.ecoPoints))
    .limit(parsed.data.limit ?? 10);

  res.json(ListUsersResponse.parse(rows.map(serializeUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const badge = computeBadge(0);

  const [user] = await db
    .insert(usersTable)
    .values({
      ...parsed.data,
      ecoPoints: 0,
      reportsSubmitted: 0,
      reportsVerified: 0,
      badge,
    })
    .returning();

  res.status(201).json(GetUserResponse.parse(serializeUser(user)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(serializeUser(user)));
});

export default router;
