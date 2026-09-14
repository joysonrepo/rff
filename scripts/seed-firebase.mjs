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

  const roles = [
    { id: 1, name: "STUDENT", createdAt: now },
    { id: 2, name: "PARENT", createdAt: now },
    { id: 3, name: "TEACHER", createdAt: now },
    { id: 4, name: "STAFF", createdAt: now },
    { id: 5, name: "PRINCIPAL", createdAt: now },
    { id: 6, name: "ACCOUNTS", createdAt: now },
    { id: 7, name: "HR", createdAt: now },
    { id: 8, name: "ADMIN_MANAGER", createdAt: now },
    { id: 9, name: "BOARD_DIRECTOR", createdAt: now },
    { id: 10, name: "FOUNDER", createdAt: now },
  ];
  const pages = [
    [1, "dashboard", "Dashboard", "/dashboard"], [2, "students", "Students", "/students"],
    [3, "studentList", "Student List", "/student-list"], [4, "staff", "Staff", "/staff"],
    [5, "staffList", "Staff List", "/staff-list"], [6, "attendance", "Attendance", "/attendance"],
    [7, "news", "Newslet", "/news"], [8, "fees", "Fees", "/fees"], [9, "reports", "Reports", "/reports"],
    [10, "homework", "Homework", "/homework"], [11, "events", "Events", "/events"],
    [12, "settings", "Settings", "/settings"], [13, "enrollments", "Enrollments", "/enrollments"],
    [14, "courses", "Courses & Batches", "/courses"], [15, "notifications", "Notifications", "/notifications"],
    [16, "marks", "Marks", "/marks"], [17, "achievements", "Achievements", "/achievements"],
  ].map(([id, key, label, route]) => ({ id, key, label, route, createdAt: now }));
  const accessByRole = {
    FOUNDER: ["dashboard", "students", "studentList", "staff", "staffList", "attendance", "homework", "news", "fees", "reports", "events", "settings", "enrollments", "courses", "notifications", "marks", "achievements"],
    BOARD_DIRECTOR: ["dashboard", "news", "reports"], ADMIN_MANAGER: ["dashboard", "students", "studentList", "attendance", "homework", "news", "events", "enrollments", "courses", "notifications"],
    HR: ["dashboard", "staff", "staffList", "attendance", "news", "reports"], ACCOUNTS: ["dashboard", "fees", "news", "reports", "staff", "staffList"],
    PRINCIPAL: ["dashboard", "students", "studentList", "attendance", "homework", "news", "marks", "reports", "events"],
    TEACHER: ["dashboard", "students", "studentList", "attendance", "homework", "news", "marks", "events", "notifications", "achievements"],
    STAFF: ["dashboard", "attendance", "news", "events", "notifications", "marks"], PARENT: ["dashboard", "students", "studentList", "attendance", "news", "marks", "fees", "events", "notifications"],
    STUDENT: ["dashboard", "attendance", "homework", "news", "marks", "events", "notifications", "achievements"],
  };
  const pageByKey = new Map(pages.map((page) => [page.key, page]));
  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const pageAccesses = Object.entries(accessByRole).flatMap(([roleName, pageKeys], index) => pageKeys.map((key, offset) => ({ id: index * 100 + offset + 1, pageId: pageByKey.get(key).id, roleId: roleByName.get(roleName).id, createdAt: now })));

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
  const teachers = [{ id: 1, name: "Teacher Mira", subject: "Music", dateOfBirth: "1990-06-15T00:00:00.000Z", userId: 7, createdAt: now, updatedAt: now }];
  const students = [{ id: 1, name: "Student Arul", age: 8, status: "ACTIVE", userId: 9, parentId: 1, course: "PSA", batchId: 1, createdAt: now, updatedAt: now }];
  const staff = [{ id: 1, name: "Keerthi", role: "Coordinator", salary: null, status: "ACTIVE", createdAt: now, updatedAt: now }];
  const courses = [
    { id: 1, name: "Montessori Foundation", type: "MONTESSORI", createdAt: now },
    { id: 2, name: "Music Basics", type: "MUSIC", createdAt: now },
    { id: 3, name: "PSA Program", type: "PSA", createdAt: now },
    { id: 4, name: "Nest Program", type: "NEST", createdAt: now },
  ];
  const batches = [{ id: 1, name: "Morning Stars", courseId: 1, teacherId: 1, timing: "9:00 AM - 11:00 AM", createdAt: now }];
  const enrollments = [{ id: 1, name: "New Child", parentName: "Suresh", email: "suresh.parent@example.com", age: 7, course: "MUSIC", status: "PENDING", notes: "Interested in weekend batch", createdAt: now }];
  const attendance = [{ id: 1, userId: 9, name: "Student Arul", studentId: 1, date: now, status: "PRESENT", targetType: "STUDENT", markedById: 7, notes: "On time", createdAt: now }];
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
      status: "INFO",
      type: "GENERAL",
      monthKey: null,
      resolvedAt: null,
      createdAt: now,
    },
  ];

  await seedCollection("users", users);
  await seedCollection("roles", roles);
  await seedCollection("pages", pages);
  await seedCollection("pageAccesses", pageAccesses);
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
      pageAccesses: pageAccesses.length,
    },
    { merge: true },
  );

  console.log("Firebase seed completed. Default password: Welcome@123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
