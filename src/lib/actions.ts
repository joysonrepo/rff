"use server";

import { revalidatePath } from "next/cache";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AttendanceStatus, AttendanceTargetType, CourseType, EnrollmentStatus, FeeStatus, Role } from "@/lib/types";
import { sendMonthlyFeeDelayReminders } from "@/lib/feeReminders";

const FIRESTORE_SAFE_DATA_URL_MAX_BYTES = 900 * 1024;
const PROFILE_IMAGE_MAX_BYTES = 700 * 1024;

function ensureAccess(moduleName: Parameters<typeof canAccess>[1], role: Role): void {
  if (!canAccess(role, moduleName)) {
    throw new Error("You do not have permission for this module.");
  }
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

function normalizeUsernameToEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@rff.local`;
}

async function getOptionalFileDataUrl(formData: FormData, key: string, maxMb = 5): Promise<string | null> {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }
  const maxSize = maxMb * 1024 * 1024;
  if (value.size > maxSize) {
    throw new Error(`File must be ${maxMb}MB or smaller.`);
  }
  const bytes = Buffer.from(await value.arrayBuffer());
  const dataUrl = `data:${value.type};base64,${bytes.toString("base64")}`;
  if (Buffer.byteLength(dataUrl, "utf8") > FIRESTORE_SAFE_DATA_URL_MAX_BYTES) {
    throw new Error("File is too large to store inline. Please upload a smaller file.");
  }
  return dataUrl;
}

async function getOptionalImageDataUrl(formData: FormData, key: string): Promise<string | null> {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (!value.type.startsWith("image/")) {
    throw new Error("Profile image must be a valid image file.");
  }

  const maxSize = PROFILE_IMAGE_MAX_BYTES;
  if (value.size > maxSize) {
    throw new Error("Profile image must be 700KB or smaller.");
  }

  const bytes = Buffer.from(await value.arrayBuffer());
  const dataUrl = `data:${value.type};base64,${bytes.toString("base64")}`;
  if (Buffer.byteLength(dataUrl, "utf8") > FIRESTORE_SAFE_DATA_URL_MAX_BYTES) {
    throw new Error("Profile image is too large after encoding. Please upload a smaller image.");
  }
  return dataUrl;
}

export async function addStudent(formData: FormData) {
  const session = await requireSession();
  ensureAccess("students", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const className = getOptionalString(formData, "className");
  const howDidYouHear = getOptionalString(formData, "howDidYouHear");
  const enquiryStatus = getOptionalString(formData, "enquiryStatus");
  const dateOfBirthRaw = getOptionalString(formData, "dateOfBirth");
  const age = Number(formData.get("age") ?? 0);
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");
  const residentialAddress = getOptionalString(formData, "residentialAddress");
  const permanentAddress = getOptionalString(formData, "permanentAddress");
  const fatherName = getOptionalString(formData, "fatherName");
  const fatherEmail = getOptionalString(formData, "fatherEmail");
  const fatherMobile = getOptionalString(formData, "fatherMobile");
  const motherName = getOptionalString(formData, "motherName");
  const motherEmail = getOptionalString(formData, "motherEmail");
  const motherMobile = getOptionalString(formData, "motherMobile");
  const feeOfferedRaw = getOptionalString(formData, "feeOffered") ?? getOptionalString(formData, "fees");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const profileImage = await getOptionalImageDataUrl(formData, "profileImage");
  const course = String(formData.get("course") ?? "MONTESSORI") as CourseType;

  if (!name || !age || !username || !password) {
    throw new Error("Name, age, username and password are required.");
  }

  const loginEmail = normalizeUsernameToEmail(username);
  const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
  if (existingUser) {
    throw new Error("Username already exists. Please use a different username.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const createdUser = await prisma.user.create({
    data: {
      name,
      email: loginEmail,
      password: hashedPassword,
      role: "STUDENT",
    },
  });

  await prisma.student.create({
    data: {
      name,
      status: "ACTIVE",
      profileImage,
      className,
      howDidYouHear,
      enquiryStatus,
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      age,
      city,
      state,
      residentialAddress,
      permanentAddress,
      fatherName,
      fatherEmail,
      fatherMobile,
      motherName,
      motherEmail,
      motherMobile,
      feeOffered: feeOfferedRaw ? Number(feeOfferedRaw) : null,
      userId: createdUser.id,
      course,
    },
  });

  revalidatePath("/students");
  revalidatePath("/student-list");
  revalidatePath("/dashboard");
}

export async function addStaff(formData: FormData) {
  const session = await requireSession();
  ensureAccess("staff", session.role);

  const name = String(formData.get("name") ?? "").trim();
  const profileImage = await getOptionalImageDataUrl(formData, "profileImage");
  const role = String(formData.get("role") ?? "").trim();
  const salaryRaw = getOptionalString(formData, "salary");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const dateOfBirthRaw = getOptionalString(formData, "dateOfBirth");
  const email = getOptionalString(formData, "email");
  const contactNumber = getOptionalString(formData, "contactNumber");
  const emergencyContact = getOptionalString(formData, "emergencyContact");
  const address = getOptionalString(formData, "address");
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");
  const qualification = getOptionalString(formData, "qualification");
  const experienceYearsRaw = getOptionalString(formData, "experienceYears");
  const joiningDateRaw = getOptionalString(formData, "joiningDate");

  if (!name || !role || !username || !password) {
    throw new Error("Name, staff role, username and password are required.");
  }

  const loginEmail = normalizeUsernameToEmail(username);
  const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
  if (existingUser) {
    throw new Error("Username already exists. Please use a different username.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const createdUser = await prisma.user.create({
    data: {
      name,
      email: loginEmail,
      password: hashedPassword,
      role: "STAFF",
    },
  });

  await prisma.staff.create({
    data: {
      name,
      status: "ACTIVE",
      profileImage,
      role,
      salary: salaryRaw ? Number(salaryRaw) : null,
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      email,
      contactNumber,
      emergencyContact,
      address,
      city,
      state,
      qualification,
      experienceYears: experienceYearsRaw ? Number(experienceYearsRaw) : null,
      joiningDate: joiningDateRaw ? new Date(joiningDateRaw) : null,
      userId: createdUser.id,
    },
  });
  revalidatePath("/staff");
  revalidatePath("/staff-list");
  revalidatePath("/settings");
}

export async function addAttendance(formData: FormData) {
  const session = await requireSession();
  ensureAccess("attendance", session.role);

  const userId = Number(formData.get("userId") ?? 0);
  const studentIdValue = String(formData.get("studentId") ?? "").trim();
  const studentId = studentIdValue ? Number(studentIdValue) : null;
  const targetType = String(formData.get("targetType") ?? "STUDENT") as AttendanceTargetType;
  const status = String(formData.get("status") ?? "PRESENT") as AttendanceStatus;
  const notes = String(formData.get("notes") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();

  if (!userId || !dateRaw) {
    throw new Error("User and date are required.");
  }

  if ((session.role === "TEACHER" || session.role === "STAFF") && targetType !== "STUDENT") {
    throw new Error("Teachers and staff can only mark student attendance.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Selected user was not found.");
  }

  if (targetType === "STUDENT") {
    if (user.role !== "STUDENT") {
      throw new Error("Selected name is not a student account.");
    }

    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || (student.userId != null && student.userId !== userId)) {
        throw new Error("Selected student mapping is invalid.");
      }
    }
  }

  if (targetType === "STAFF" && (user.role === "STUDENT" || user.role === "PARENT")) {
    throw new Error("Selected name is not a staff account.");
  }

  await prisma.attendance.create({
    data: {
      userId,
      studentId: targetType === "STUDENT" ? studentId : null,
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
  const payeeName = String(formData.get("payeeName") ?? "").trim() || null;
  const amountPaidFor = String(formData.get("amountPaidFor") ?? "").trim() || null;
  const modeOfPayment = String(formData.get("modeOfPayment") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dateOfPaymentRaw = String(formData.get("dateOfPayment") ?? "").trim();
  const dateOfPayment = dateOfPaymentRaw ? new Date(dateOfPaymentRaw) : null;
  const invoiceFile = await getOptionalFileDataUrl(formData, "invoiceFile", 5);

  if (!studentId || !amount) {
    throw new Error("Student and amount are required.");
  }

  const receiptNo = `RFF-${Date.now()}`;

  await prisma.fee.create({
    data: {
      studentId,
      amount,
      status,
      payeeName,
      dateOfPayment,
      amountPaidFor,
      modeOfPayment,
      notes,
      invoiceFile,
      receiptNo,
      paidOn: status === "PAID" || status === "PARTIAL" ? new Date() : null,
    },
  });

  await sendMonthlyFeeDelayReminders(new Date(), [studentId]);

  revalidatePath("/fees");
  revalidatePath("/reports");
  revalidatePath("/notifications");
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
  const className = getOptionalString(formData, "className");
  const howDidYouHear = getOptionalString(formData, "howDidYouHear");
  const enquiryStatus = getOptionalString(formData, "enquiryStatus");
  const dateOfBirthRaw = getOptionalString(formData, "dateOfBirth");
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");
  const residentialAddress = getOptionalString(formData, "residentialAddress");
  const permanentAddress = getOptionalString(formData, "permanentAddress");
  const fatherName = getOptionalString(formData, "fatherName");
  const fatherEmail = getOptionalString(formData, "fatherEmail");
  const fatherMobile = getOptionalString(formData, "fatherMobile");
  const motherName = getOptionalString(formData, "motherName");
  const motherEmail = getOptionalString(formData, "motherEmail");
  const motherMobile = getOptionalString(formData, "motherMobile");
  const feeOfferedRaw = getOptionalString(formData, "feeOffered");
  const parentName = fatherName;
  const email = fatherEmail ?? motherEmail ?? "";
  const age = Number(formData.get("age") ?? 0);
  const course = String(formData.get("course") ?? "MONTESSORI") as CourseType;

  if (!name || !email || !age) {
    throw new Error("Name, email, and age are required.");
  }

  await prisma.enrollment.create({
    data: {
      name,
      className,
      howDidYouHear,
      enquiryStatus,
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      parentName,
      email,
      age,
      city,
      state,
      residentialAddress,
      permanentAddress,
      fatherName,
      fatherEmail,
      fatherMobile,
      motherName,
      motherEmail,
      motherMobile,
      feeOffered: feeOfferedRaw ? Number(feeOfferedRaw) : null,
      course,
    },
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
          status: "ACTIVE",
          className: enrollment.className,
          howDidYouHear: enrollment.howDidYouHear,
          enquiryStatus: enrollment.enquiryStatus,
          dateOfBirth: enrollment.dateOfBirth,
          age: enrollment.age,
          city: enrollment.city,
          state: enrollment.state,
          residentialAddress: enrollment.residentialAddress,
          permanentAddress: enrollment.permanentAddress,
          fatherName: enrollment.fatherName,
          fatherEmail: enrollment.fatherEmail,
          fatherMobile: enrollment.fatherMobile,
          motherName: enrollment.motherName,
          motherEmail: enrollment.motherEmail,
          motherMobile: enrollment.motherMobile,
          feeOffered: enrollment.feeOffered,
          course: enrollment.course,
        },
      });
    }
  }

  revalidatePath("/enrollments");
  revalidatePath("/students");
  revalidatePath("/student-list");
}

export async function deactivateStudent(formData: FormData) {
  const session = await requireSession();
  ensureAccess("students", session.role);

  const studentId = Number(formData.get("studentId") ?? 0);
  if (!studentId) {
    throw new Error("Student id is required.");
  }

  await prisma.student.update({ where: { id: studentId }, data: { status: "INACTIVE" } });

  revalidatePath("/students");
  revalidatePath("/student-list");
  revalidatePath("/dashboard");
}

export async function deactivateStaff(formData: FormData) {
  const session = await requireSession();
  ensureAccess("staff", session.role);

  const staffId = Number(formData.get("staffId") ?? 0);
  if (!staffId) {
    throw new Error("Staff id is required.");
  }

  await prisma.staff.update({ where: { id: staffId }, data: { status: "INACTIVE" } });

  revalidatePath("/staff");
  revalidatePath("/staff-list");
  revalidatePath("/dashboard");
}

export async function updateStudent(formData: FormData) {
  const session = await requireSession();
  ensureAccess("students", session.role);

  const studentId = Number(formData.get("studentId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const className = getOptionalString(formData, "className");
  const howDidYouHear = getOptionalString(formData, "howDidYouHear");
  const enquiryStatus = getOptionalString(formData, "enquiryStatus");
  const dateOfBirthRaw = getOptionalString(formData, "dateOfBirth");
  const age = Number(formData.get("age") ?? 0);
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");
  const residentialAddress = getOptionalString(formData, "residentialAddress");
  const permanentAddress = getOptionalString(formData, "permanentAddress");
  const fatherName = getOptionalString(formData, "fatherName");
  const fatherEmail = getOptionalString(formData, "fatherEmail");
  const fatherMobile = getOptionalString(formData, "fatherMobile");
  const motherName = getOptionalString(formData, "motherName");
  const motherEmail = getOptionalString(formData, "motherEmail");
  const motherMobile = getOptionalString(formData, "motherMobile");
  const feeOfferedRaw = getOptionalString(formData, "feeOffered") ?? getOptionalString(formData, "fees");
  const course = String(formData.get("course") ?? "MONTESSORI") as CourseType;
  const profileImage = await getOptionalImageDataUrl(formData, "profileImage");

  if (!studentId || !name || !age) {
    throw new Error("Student id, name, and age are required.");
  }

  const data: Record<string, unknown> = {
    name,
    className,
    howDidYouHear,
    enquiryStatus,
    dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
    age,
    city,
    state,
    residentialAddress,
    permanentAddress,
    fatherName,
    fatherEmail,
    fatherMobile,
    motherName,
    motherEmail,
    motherMobile,
    feeOffered: feeOfferedRaw ? Number(feeOfferedRaw) : null,
    course,
  };

  if (profileImage) {
    data.profileImage = profileImage;
  }

  await prisma.student.update({ where: { id: studentId }, data });

  revalidatePath("/students");
  revalidatePath("/student-list");
  revalidatePath("/dashboard");
}

export async function updateStaff(formData: FormData) {
  const session = await requireSession();
  ensureAccess("staff", session.role);

  const staffId = Number(formData.get("staffId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const salaryRaw = getOptionalString(formData, "salary");
  const dateOfBirthRaw = getOptionalString(formData, "dateOfBirth");
  const email = getOptionalString(formData, "email");
  const contactNumber = getOptionalString(formData, "contactNumber");
  const emergencyContact = getOptionalString(formData, "emergencyContact");
  const address = getOptionalString(formData, "address");
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");
  const qualification = getOptionalString(formData, "qualification");
  const experienceYearsRaw = getOptionalString(formData, "experienceYears");
  const joiningDateRaw = getOptionalString(formData, "joiningDate");
  const profileImage = await getOptionalImageDataUrl(formData, "profileImage");

  if (!staffId || !name || !role) {
    throw new Error("Staff id, name and role are required.");
  }

  const data: Record<string, unknown> = {
    name,
    role,
    salary: salaryRaw ? Number(salaryRaw) : null,
    dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
    email,
    contactNumber,
    emergencyContact,
    address,
    city,
    state,
    qualification,
    experienceYears: experienceYearsRaw ? Number(experienceYearsRaw) : null,
    joiningDate: joiningDateRaw ? new Date(joiningDateRaw) : null,
  };

  if (profileImage) {
    data.profileImage = profileImage;
  }

  await prisma.staff.update({ where: { id: staffId }, data });

  revalidatePath("/staff");
  revalidatePath("/staff-list");
  revalidatePath("/dashboard");
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
    data: users.map((user: { id: number }) => ({
      userId: user.id,
      title,
      message,
      status: "INFO",
      type: "GENERAL",
      monthKey: null,
      resolvedAt: null,
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
