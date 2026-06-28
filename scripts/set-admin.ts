import { prisma } from "../src/lib/prisma";

const email = "mirjieshkere@gmail.com";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { email: true, userRole: true, name: true },
  });

  if (!existing) {
    console.error(`User not found: ${email}`);
    console.error("Log in once at /login first, then run this script again.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { userRole: "admin" },
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, userRole: true, name: true },
  });

  console.log("Admin role set:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
