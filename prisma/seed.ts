/**
 * Seed script — creates the demo company workspace and two users.
 *
 * It intentionally does NOT seed document chunks or embeddings. Embeddings must be
 * generated from real text via the worker, so to get a working demo you should:
 *   1. Log in as admin@acme.com (Password123!)
 *   2. Upload the PDFs from ./demo-documents (convert the provided .md files to PDF,
 *      or upload any of your own PDFs)
 *   3. Run the worker (`npm run worker`) — it will extract, chunk, and embed them.
 *   4. Open the chat and ask the sample questions.
 *
 * Run with: `npm run seed`
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const company = await prisma.company.upsert({
    where: { slug: "acme-saas" },
    update: {},
    create: { name: "Acme SaaS Pvt Ltd", slug: "acme-saas" },
  });

  await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      name: "Acme Admin",
      email: "admin@acme.com",
      passwordHash,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "employee@acme.com" },
    update: {},
    create: {
      name: "Acme Employee",
      email: "employee@acme.com",
      passwordHash,
      role: "MEMBER",
      companyId: company.id,
    },
  });

  console.log("✅ Seed complete.");
  console.log("   Company: Acme SaaS Pvt Ltd");
  console.log("   Admin:   admin@acme.com / Password123!");
  console.log("   Member:  employee@acme.com / Password123!");
  console.log("\nNext: log in as admin, upload the demo PDFs, and run `npm run worker`.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
