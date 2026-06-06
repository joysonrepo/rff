import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Welcome@123";

function normalizeNameBase(name) {
  return String(name || "student")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "student";
}

async function getMissingStudents() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, userId: true },
    orderBy: { id: "asc" },
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(users.map((u) => u.id));

  return students.filter((s) => !s.userId || !validUserIds.has(s.userId));
}

async function buildUniqueEmail(base, usedEmails) {
  let n = 0;
  while (true) {
    const suffix = n === 0 ? "" : `.${n}`;
    const email = `${base}${suffix}@rff.local`;
    if (!usedEmails.has(email)) {
      return email;
    }
    n += 1;
  }
}

async function main() {
  const missingStudents = await getMissingStudents();
  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const usedEmails = new Set(existingUsers.map((u) => String(u.email).toLowerCase()));

  if (missingStudents.length === 0) {
    console.log("No students need login backfill.");
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  let createdCount = 0;
  for (const student of missingStudents) {
    const base = normalizeNameBase(student.name);
    const uniqueEmail = await buildUniqueEmail(`${base}.${student.id}`, usedEmails);

    const user = await prisma.user.create({
      data: {
        name: student.name,
        email: uniqueEmail,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });
    usedEmails.add(uniqueEmail);
    createdCount += 1;

    console.log(`Created user ${uniqueEmail} for student #${student.id} (${student.name})`);
  }

  console.log(`Done. Created ${createdCount} student login(s). Default password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
