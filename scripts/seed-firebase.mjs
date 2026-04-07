import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

// Local DB structure (Firestore):
// - One collection per domain: users, students, staff, attendance, fees, etc.
// - Each document id is the numeric id converted to string (e.g., "1", "2").
// - meta/counters stores the latest numeric id per collection.

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
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

async function seedCollection(name, rows) {
  const batch = db.batch();
  for (const row of rows) {
    // Keep Firestore document key aligned with the row's numeric id.
    const ref = db.collection(name).doc(String(row.id));
    batch.set(ref, row, { merge: true });
  }
  await batch.commit();
}

async function main() {
  const now = new Date().toISOString();
  const password = await bcrypt.hash("Welcome@123", 12);

  const users = [
    { id: 1, name: "Founder", email: "founder@rolfunfactory.com", password, role: "FOUNDER", createdAt: now, updatedAt: now },
    { id: 2, name: "Board Director", email: "board@rolfunfactory.com", password, role: "BOARD_DIRECTOR", createdAt: now, updatedAt: now },
    { id: 3, name: "Admin Manager", email: "admin@rolfunfactory.com", password, role: "ADMIN_MANAGER", createdAt: now, updatedAt: now },
    { id: 4, name: "HR Lead", email: "hr@rolfunfactory.com", password, role: "HR", createdAt: now, updatedAt: now },
    { id: 5, name: "Accounts Lead", email: "accounts@rolfunfactory.com", password, role: "ACCOUNTS", createdAt: now, updatedAt: now },
    { id: 6, name: "Principal", email: "principal@rolfunfactory.com", password, role: "PRINCIPAL", createdAt: now, updatedAt: now },
    { id: 7, name: "Teacher Mira", email: "teacher@rolfunfactory.com", password, role: "TEACHER", createdAt: now, updatedAt: now },
    { id: 8, name: "Parent Ravi", email: "parent@rolfunfactory.com", password, role: "PARENT", createdAt: now, updatedAt: now },
    { id: 9, name: "Student Arul", email: "student@rolfunfactory.com", password, role: "STUDENT", createdAt: now, updatedAt: now },
  ];

  const parents = [{ id: 1, name: "Parent Ravi", contact: "+91-9000000001", userId: 8, createdAt: now, updatedAt: now }];
  const teachers = [{ id: 1, name: "Teacher Mira", subject: "Music", userId: 7, createdAt: now, updatedAt: now }];
  const students = [{ id: 1, name: "Student Arul", age: 8, userId: 9, parentId: 1, course: "MONTESSORI", batchId: 1, createdAt: now, updatedAt: now }];
  const staff = [{ id: 1, name: "Keerthi", role: "Coordinator", createdAt: now, updatedAt: now }];
  const courses = [
    { id: 1, name: "Montessori Foundation", type: "MONTESSORI", createdAt: now },
    { id: 2, name: "Music Basics", type: "MUSIC", createdAt: now },
    { id: 3, name: "Evening Tuition", type: "TUITION", createdAt: now },
  ];
  const batches = [{ id: 1, name: "Morning Stars", courseId: 1, teacherId: 1, timing: "9:00 AM - 11:00 AM", createdAt: now }];
  const enrollments = [{ id: 1, name: "New Child", parentName: "Suresh", email: "suresh.parent@example.com", age: 7, course: "MUSIC", status: "PENDING", notes: "Interested in weekend batch", createdAt: now }];
  const attendance = [{ id: 1, userId: 9, studentId: 1, date: now, status: "PRESENT", targetType: "STUDENT", markedById: 7, notes: "On time", createdAt: now }];
  const marks = [{ id: 1, studentId: 1, subject: "Mathematics", marks: 86, examType: "Unit Test", createdAt: now }];
  const fees = [{ id: 1, studentId: 1, amount: 5000, status: "PARTIAL", paidOn: now, receiptNo: "RFF-1001", createdAt: now }];
  const events = [{ id: 1, name: "Summer Discovery Camp", date: new Date(Date.now() + 864000000).toISOString(), description: "A hands-on camp with science, music, and art stations.", registrations: 22, createdAt: now }];
  const notifications = [
    {
      id: 1,
      userId: 9,
      title: "Welcome to ROL's Fun Factory",
      message: "Your student portal is ready. Please check today's activities and announcements.",
      isRead: false,
      createdAt: now,
    },
  ];

  await seedCollection("users", users);
  await seedCollection("parents", parents);
  await seedCollection("teachers", teachers);
  await seedCollection("students", students);
  await seedCollection("staff", staff);
  await seedCollection("courses", courses);
  await seedCollection("batches", batches);
  await seedCollection("enrollments", enrollments);
  await seedCollection("attendance", attendance);
  await seedCollection("marks", marks);
  await seedCollection("fees", fees);
  await seedCollection("events", events);
  await seedCollection("notifications", notifications);

  // Tracks current id counters used by the app-level createWithId() helper.
  await db.collection("meta").doc("counters").set(
    {
      users: users.length,
      parents: parents.length,
      teachers: teachers.length,
      students: students.length,
      staff: staff.length,
      courses: courses.length,
      batches: batches.length,
      enrollments: enrollments.length,
      attendance: attendance.length,
      marks: marks.length,
      fees: fees.length,
      events: events.length,
      notifications: notifications.length,
    },
    { merge: true },
  );

  console.log("Firebase seed completed. Default password: Welcome@123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
