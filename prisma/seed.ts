import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set; aborting seed.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seedAdmin(): Promise<void> {
  const email = 'curator@aura.com';
  const hash = await bcrypt.hash('aura-curator', 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash },
    create: { email, password: hash, name: "Curator", role: "ADMIN" },
  });

  console.log(`Seeded Curator: ${user.email}`);
}

async function main() {
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
