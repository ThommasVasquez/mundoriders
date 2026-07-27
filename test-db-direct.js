const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("@neondatabase/serverless");
const { PrismaNeon } = require("@prisma/adapter-neon");
const ws = require("ws");
const { neonConfig } = require("@neondatabase/serverless");
neonConfig.webSocketConstructor = ws;

async function run() {
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  const prismaInstance = new PrismaClient({ adapter });

  try {
    const count = await prismaInstance.user.count();
    console.log("User count:", count);
    const userId = "87f2b92b-5a3c-437e-96dc-2275d88c7cf1";

    console.log("Testing follow query...");
    const following = await prismaInstance.follow.findMany({
      where: { followerId: userId },
    });
    console.log("Following count:", following.length);

    console.log("Testing userStatus query...");
    const activeStatus = await prismaInstance.userStatus.findFirst({
      where: {
        userId: userId,
        expiresAt: { gt: new Date() }
      }
    });
    console.log("Active status:", activeStatus);

    console.log("Testing follow unique query...");
    const followRecord = await prismaInstance.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: userId,
        }
      }
    });
    console.log("Follow record:", followRecord);

  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await prismaInstance.$disconnect();
  }
}

run();
