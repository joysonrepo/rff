import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      user: { select: { email: true } },
    },
    orderBy: { id: "asc" },
  });

  const missing = students.filter((s) => !s.userId || !s.user);

  console.log(`total students: ${students.length}`);
  console.log(`students with login: ${students.length - missing.length}`);
  console.log(`students without login: ${missing.length}`);
  console.log("--- student login map ---");

  for (const s of students) {
    console.log(`${s.id}\t${s.name}\t${s.user?.email ?? "NO_LOGIN"}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
