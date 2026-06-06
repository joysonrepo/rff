import "dotenv/config";
import bcrypt from "bcryptjs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_PASSWORD = "Welcome@123";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeNameBase(name) {
  return String(name || "student")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "student";
}

function makeUniqueEmail(base, usedEmails) {
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

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });

const db = getFirestore(app);

async function main() {
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const [usersSnap, studentsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("students").get(),
  ]);

  const users = usersSnap.docs.map((doc) => doc.data());
  const students = studentsSnap.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));

  const userById = new Map();
  const usedEmails = new Set();
  let maxUserId = 0;

  for (const user of users) {
    const id = Number(user.id);
    const email = String(user.email || "").toLowerCase();
    if (Number.isInteger(id) && id > 0) {
      userById.set(id, user);
      if (id > maxUserId) maxUserId = id;
    }
    if (email) {
      usedEmails.add(email);
    }
  }

  let created = 0;
  let linked = 0;

  for (const student of students) {
    const studentId = Number(student.id);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      continue;
    }

    const existingUserId = Number(student.userId);
    const hasValidLinkedUser = Number.isInteger(existingUserId) && existingUserId > 0 && userById.has(existingUserId);

    if (hasValidLinkedUser) {
      continue;
    }

    maxUserId += 1;
    const userId = maxUserId;
    const base = `${normalizeNameBase(student.name)}.${studentId}`;
    const email = makeUniqueEmail(base, usedEmails);

    const newUser = {
      id: userId,
      name: String(student.name || `Student ${studentId}`),
      email,
      password: passwordHash,
      role: "STUDENT",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("users").doc(String(userId)).set(newUser, { merge: true });
    await db.collection("students").doc(String(studentId)).set({ userId, updatedAt: now }, { merge: true });

    userById.set(userId, newUser);
    usedEmails.add(email);
    created += 1;
    linked += 1;

    console.log(`Created login for student #${studentId} (${newUser.name}) -> ${email}`);
  }

  if (created > 0) {
    await db.collection("meta").doc("counters").set({ users: maxUserId }, { merge: true });
  }

  console.log(`Done. Created ${created} login(s), linked ${linked} student record(s). Default password: ${DEFAULT_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
