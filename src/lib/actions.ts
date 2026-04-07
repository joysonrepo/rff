"use server";

import { revalidatePath } from "next/cache";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AttendanceStatus, AttendanceTargetType, CourseType, EnrollmentStatus, FeeStatus, Role } from "@/lib/types";

function ensureAccess(moduleName: Parameters<typeof canAccess>[1], role: Role): void {
  if (!canAccess(role, moduleName)) {
    throw new Error("You do not have permission for this module.");
  }
}

export async function addStudent(formData: FormData) {
  const session = await requireSession();
  ensureAccess("students", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const age = Number(formData.get("age") ?? 0);
  const course = String(formData.get("course") ?? "MONTESSORI") as CourseType;

  if (!name || !age) {
    throw new Error("Name and age are required.");
  }

  await prisma.student.create({
    data: { name, age, course },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
}

export async function addStaff(formData: FormData) {
  const session = await requireSession();
  ensureAccess("staff", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!name || !role) {
    throw new Error("Name and staff role are required.");
  }

  await prisma.staff.create({ data: { name, role } });
  revalidatePath("/staff");
}

export async function addAttendance(formData: FormData) {
  const session = await requireSession();
  ensureAccess("attendance", session.role);

  const userId = Number(formData.get("userId") ?? 0);
  const studentIdRaw = formData.get("studentId");
  const studentId = studentIdRaw ? Number(studentIdRaw) : null;
  const targetType = String(formData.get("targetType") ?? "STUDENT") as AttendanceTargetType;
  const status = String(formData.get("status") ?? "PRESENT") as AttendanceStatus;
  const notes = String(formData.get("notes") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();

  if (!userId || !dateRaw) {
    throw new Error("User and date are required.");
  }

  await prisma.attendance.create({
    data: {
      userId,
      studentId,
      date: new Date(dateRaw),
      status,
      targetType,
      notes,
      markedById: Number(session.sub),
    },
  });

  revalidatePath("/attendance");
}

export async function addFee(formData: FormData) {
  const session = await requireSession();
  ensureAccess("fees", session.role);

  const studentId = Number(formData.get("studentId") ?? 0);
  const amount = Number(formData.get("amount") ?? 0);
  const status = String(formData.get("status") ?? "PENDING") as FeeStatus;

  if (!studentId || !amount) {
    throw new Error("Student and amount are required.");
  }

  const receiptNo = `RFF-${Date.now()}`;

  await prisma.fee.create({
    data: {
      studentId,
      amount,
      status,
      receiptNo,
      paidOn: status === "PAID" || status === "PARTIAL" ? new Date() : null,
    },
  });

  revalidatePath("/fees");
  revalidatePath("/reports");
}

export async function addEvent(formData: FormData) {
  const session = await requireSession();
  ensureAccess("events", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !date || !description) {
    throw new Error("Name, date, and description are required.");
  }

  await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      description,
    },
  });

  revalidatePath("/events");
}

export async function addEnrollment(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const parentName = String(formData.get("parentName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const age = Number(formData.get("age") ?? 0);
  const course = String(formData.get("course") ?? "MONTESSORI") as CourseType;

  if (!name || !email || !age) {
    throw new Error("Name, email, and age are required.");
  }

  await prisma.enrollment.create({
    data: { name, parentName, email, age, course },
  });

  revalidatePath("/");
  revalidatePath("/enrollments");
}

export async function reviewEnrollment(formData: FormData) {
  const session = await requireSession();
  ensureAccess("enrollments", session.role);

  const enrollmentId = Number(formData.get("enrollmentId") ?? 0);
  const status = String(formData.get("status") ?? "PENDING") as EnrollmentStatus;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status, reviewedBy: Number(session.sub) },
  });

  if (status === "APPROVED") {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (enrollment) {
      await prisma.student.create({
        data: {
          name: enrollment.name,
          age: enrollment.age,
          course: enrollment.course,
        },
      });
    }
  }

  revalidatePath("/enrollments");
  revalidatePath("/students");
}

export async function addCourseBatch(formData: FormData) {
  const session = await requireSession();
  ensureAccess("courses", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "MONTESSORI") as CourseType;
  const batchName = String(formData.get("batchName") ?? "").trim();
  const timing = String(formData.get("timing") ?? "").trim();

  if (!name || !batchName || !timing) {
    throw new Error("Course name, batch name, and timing are required.");
  }

  const course = await prisma.course.create({ data: { name, type } });
  await prisma.batch.create({ data: { name: batchName, courseId: course.id, timing } });

  revalidatePath("/courses");
}

export async function addMark(formData: FormData) {
  const session = await requireSession();
  ensureAccess("marks", session.role);

  const studentId = Number(formData.get("studentId") ?? 0);
  const subject = String(formData.get("subject") ?? "").trim();
  const marks = Number(formData.get("marks") ?? 0);
  const examType = String(formData.get("examType") ?? "").trim();

  if (!studentId || !subject || Number.isNaN(marks)) {
    throw new Error("Student, subject and marks are required.");
  }

  await prisma.mark.create({
    data: {
      studentId,
      subject,
      marks,
      examType,
    },
  });

  revalidatePath("/marks");
  revalidatePath("/reports");
}

export async function sendNotification(formData: FormData) {
  const session = await requireSession();
  ensureAccess("notifications", session.role);

  const targetRole = String(formData.get("targetRole") ?? "STUDENT") as Role;
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!title || !message) {
    throw new Error("Title and message are required.");
  }

  const users = await prisma.user.findMany({ where: { role: targetRole }, select: { id: true } });

  await prisma.notification.createMany({
    data: users.map((user: any) => ({
      userId: user.id,
      title,
      message,
    })),
  });

  revalidatePath("/notifications");
}

export async function addUser(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "FOUNDER") {
    throw new Error("Only founder can add users.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "STUDENT") as Role;

  if (!name || !email || !password) {
    throw new Error("All user fields are required.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, password: hashedPassword, role } });

  revalidatePath("/settings");
}

export async function deleteUser(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "FOUNDER") {
    throw new Error("Only founder can delete users.");
  }

  const userId = Number(formData.get("userId") ?? 0);
  if (userId === Number(session.sub)) {
    throw new Error("Founder cannot delete active account.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings");
}
