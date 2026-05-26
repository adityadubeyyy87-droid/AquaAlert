import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/src/schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const { reportsTable, usersTable } = schema;

async function seed() {
  console.log("Seeding database…");

  // Clear existing data
  await db.delete(reportsTable);
  await db.delete(usersTable);

  // ── Users / leaderboard ──────────────────────────────────────────────────
  const users = await db.insert(usersTable).values([
    { name: "Priya Sharma",    email: "priya.sharma@gmail.com",    ecoPoints: 420, reportsSubmitted: 18, reportsVerified: 31, badge: "Platinum" },
    { name: "Arjun Mehta",     email: "arjun.mehta@gmail.com",     ecoPoints: 310, reportsSubmitted: 14, reportsVerified: 22, badge: "Gold"     },
    { name: "Sunita Patil",    email: "sunita.patil@gmail.com",    ecoPoints: 280, reportsSubmitted: 12, reportsVerified: 19, badge: "Gold"     },
    { name: "Rohan Desai",     email: "rohan.desai@gmail.com",     ecoPoints: 195, reportsSubmitted:  9, reportsVerified: 14, badge: "Gold"     },
    { name: "Kavita Nair",     email: "kavita.nair@gmail.com",     ecoPoints: 160, reportsSubmitted:  7, reportsVerified: 11, badge: "Gold"     },
    { name: "Vijay Kulkarni",  email: "vijay.kulkarni@gmail.com",  ecoPoints:  95, reportsSubmitted:  5, reportsVerified:  8, badge: "Silver"   },
    { name: "Deepa Joshi",     email: "deepa.joshi@gmail.com",     ecoPoints:  72, reportsSubmitted:  4, reportsVerified:  6, badge: "Silver"   },
    { name: "Amit Rao",        email: "amit.rao@gmail.com",        ecoPoints:  48, reportsSubmitted:  3, reportsVerified:  4, badge: "Bronze"   },
    { name: "Neha Singh",      email: "neha.singh@gmail.com",      ecoPoints:  30, reportsSubmitted:  2, reportsVerified:  3, badge: "Bronze"   },
    { name: "Rahul Chavan",    email: "rahul.chavan@gmail.com",    ecoPoints:  15, reportsSubmitted:  1, reportsVerified:  1, badge: "Bronze"   },
  ]).returning();

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const daysAgo  = (d: number) => new Date(now.getTime() - d * 86_400_000);

  // ── Reports ──────────────────────────────────────────────────────────────
  await db.insert(reportsTable).values([
    // ── ACTIVE (pending / verified / in_progress) ─────────────────────────
    {
      title: "Burst main near Andheri Metro Station",
      description: "Large water main has burst near the D.N. Nagar Metro entrance. Water is flooding the pavement and spilling into the road. Multiple residents have complained. Immediate attention required.",
      latitude: 19.1136, longitude: 72.8697,
      severity: "critical", status: "pending",
      ward: "Andheri West", upvotes: 24,
      reporterName: "Priya Sharma", userId: users[0].id,
      createdAt: hoursAgo(2), updatedAt: hoursAgo(2),
    },
    {
      title: "Continuous overflow at Bandra water tank",
      description: "The overhead water tank near Turner Road has been overflowing for over 6 hours. Water is running down the slope onto the main road. The BMC helpline was called but no response yet.",
      latitude: 19.0596, longitude: 72.8295,
      severity: "critical", status: "in_progress",
      ward: "Bandra West", upvotes: 31,
      reporterName: "Arjun Mehta", userId: users[1].id,
      createdAt: hoursAgo(6), updatedAt: hoursAgo(1),
    },
    {
      title: "Underground pipe leak causing road collapse risk",
      description: "A noticeable sinkhole is forming near Juhu Tara Road. Water seeping up from below. The ground is soft and there's a risk of road collapse. A red mark has been placed by local residents.",
      latitude: 19.0990, longitude: 72.8260,
      severity: "critical", status: "verified",
      ward: "Juhu", upvotes: 18,
      reporterName: "Sunita Patil", userId: users[2].id,
      createdAt: hoursAgo(10), updatedAt: hoursAgo(3),
    },
    {
      title: "High-pressure leak near Dadar Railway Station",
      description: "Water shooting from a cracked pipe near the Dadar West exit of the railway station. Creating a slipping hazard for commuters. Several auto drivers have complained to the station master.",
      latitude: 19.0178, longitude: 72.8478,
      severity: "high", status: "pending",
      ward: "Dadar", upvotes: 15,
      reporterName: "Rohan Desai", userId: users[3].id,
      createdAt: hoursAgo(4), updatedAt: hoursAgo(4),
    },
    {
      title: "Broken pipe flooding footpath in Powai",
      description: "A water pipe under the footpath near Hiranandani Gardens has broken. The entire footpath is flooded making it impassable for pedestrians. Water reaching the road surface now.",
      latitude: 19.1176, longitude: 72.9060,
      severity: "high", status: "in_progress",
      ward: "Powai", upvotes: 12,
      reporterName: "Kavita Nair", userId: users[4].id,
      createdAt: hoursAgo(8), updatedAt: hoursAgo(2),
    },
    {
      title: "Steady stream from cracked pipe — Borivali",
      description: "Cracked water pipe near Borivali National Park entrance. A steady stream of water is flowing along the gutter. Has been running for at least 2 days based on neighbour reports.",
      latitude: 19.2315, longitude: 72.8560,
      severity: "high", status: "verified",
      ward: "Borivali", upvotes: 8,
      reporterName: "Vijay Kulkarni", userId: users[5].id,
      createdAt: daysAgo(2), updatedAt: hoursAgo(5),
    },
    {
      title: "Leaking joint under Worli Sea Link approach",
      description: "A pipe joint is leaking near the Worli end of the sea link approach road. Water accumulating on the service road. The area is usually busy with traffic and the puddle is growing.",
      latitude: 19.0170, longitude: 72.8156,
      severity: "high", status: "pending",
      ward: "Worli", upvotes: 9,
      reporterName: "Deepa Joshi", userId: users[6].id,
      createdAt: hoursAgo(14), updatedAt: hoursAgo(14),
    },
    {
      title: "Dripping joint at Malad market",
      description: "Slow but consistent drip from a pipe joint at the back of Malad West market. Has been dripping for several days. The water is pooling near vegetable stalls creating hygiene concerns.",
      latitude: 19.1874, longitude: 72.8481,
      severity: "medium", status: "pending",
      ward: "Malad West", upvotes: 5,
      reporterName: "Amit Rao", userId: users[7].id,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      title: "Slow seep near Chembur colony building",
      description: "Slow water seepage from an underground pipe near building no. 7 in Chembur colony. Wet patch on the road has been getting larger over the past week. Flagged to local corporator.",
      latitude: 19.0522, longitude: 72.9005,
      severity: "medium", status: "verified",
      ward: "Chembur", upvotes: 6,
      reporterName: "Neha Singh", userId: users[8].id,
      createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },
    {
      title: "Drip at fire hydrant connection — Kurla",
      description: "The connection nut on a fire hydrant near Kurla bus stand is loose and dripping. Not an emergency but should be tightened before it worsens. Small puddle forming.",
      latitude: 19.0728, longitude: 72.8826,
      severity: "low", status: "pending",
      ward: "Kurla", upvotes: 3,
      reporterName: "Rahul Chavan", userId: users[9].id,
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      title: "Wet patch near Ghatkopar Metro pillar",
      description: "Small wet patch visible at the base of a Metro pillar in Ghatkopar. Possibly a minor pipe connection issue. Not severe but has been there for about a week.",
      latitude: 19.0858, longitude: 72.9082,
      severity: "low", status: "pending",
      ward: "Ghatkopar", upvotes: 2,
      reporterName: "Priya Sharma", userId: users[0].id,
      createdAt: daysAgo(6), updatedAt: daysAgo(6),
    },
    {
      title: "Water seeping from boundary wall — Kandivali",
      description: "Water seeping through a boundary wall crack near Thakur Village in Kandivali East. The source appears to be a buried pipe behind the wall. Dampness visible on both sides.",
      latitude: 19.2044, longitude: 72.8603,
      severity: "medium", status: "in_progress",
      ward: "Kandivali East", upvotes: 7,
      reporterName: "Arjun Mehta", userId: users[1].id,
      createdAt: daysAgo(3), updatedAt: hoursAgo(12),
    },

    // ── RESOLVED ──────────────────────────────────────────────────────────
    {
      title: "Burst pipe repaired near Santacruz station",
      description: "Burst water main near Santacruz East railway station. Water was flooding onto the platform approach road. Issue has been fully repaired by the BMC crew.",
      latitude: 19.0804, longitude: 72.8484,
      severity: "critical", status: "resolved",
      ward: "Santacruz East", upvotes: 22,
      reporterName: "Sunita Patil", userId: users[2].id,
      createdAt: daysAgo(7), updatedAt: daysAgo(2),
      resolvedAt: daysAgo(2),
    },
    {
      title: "Overhead tank overflow resolved — Goregaon",
      description: "Overhead tank at Goregaon East was overflowing for 2 days. BMC repaired the float valve and the overflow has stopped completely.",
      latitude: 19.1609, longitude: 72.8493,
      severity: "high", status: "resolved",
      ward: "Goregaon East", upvotes: 11,
      reporterName: "Kavita Nair", userId: users[4].id,
      createdAt: daysAgo(9), updatedAt: daysAgo(3),
      resolvedAt: daysAgo(3),
    },
    {
      title: "Leaking joint sealed — Vikhroli",
      description: "Leaking pipe joint near Vikhroli industrial area has been sealed by the repair team. Area is now dry.",
      latitude: 19.1067, longitude: 72.9259,
      severity: "medium", status: "resolved",
      ward: "Vikhroli", upvotes: 4,
      reporterName: "Vijay Kulkarni", userId: users[5].id,
      createdAt: daysAgo(10), updatedAt: daysAgo(4),
      resolvedAt: daysAgo(4),
    },
  ]);

  console.log("✓ Seeded users:", users.length);
  console.log("✓ Seeded reports: 15 (12 active, 3 resolved)");
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
