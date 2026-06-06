"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { setFlashMessage } from "@/lib/flash";
import bcrypt from "bcryptjs";
import { AttendanceStatus, AttendanceTargetType, CourseType, EnrollmentStatus, FeeStatus, Role } from "@/lib/types";
import { sendMonthlyFeeDelayReminders } from "@/lib/feeReminders";

const FIRESTORE_SAFE_DATA_URL_MAX_BYTES = 900 * 1024;
const PROFILE_IMAGE_MAX_BYTES = 700 * 1024;
const VALID_ROLES: Role[] = [
  "FOUNDER",
  "BOARD_DIRECTOR",
  "ADMIN_MANAGER",
  "HR",
  "ACCOUNTS",
  "PRINCIPAL",
  "TEACHER",
  "STAFF",
  "PARENT",
  "STUDENT",
];

function isRole(value: string): value is Role {
  return VALID_ROLES.includes(value as Role);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Action failed. Please try again.";
}

async function redirectToReferrer(fallbackPath: string): Promise<never> {
  const headerStore = await headers();
  const referrer = headerStore.get("referer");

  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      redirect(`${refUrl.pathname}${refUrl.search}`);
    } catch {
      redirect(fallbackPath);
    }
  }

  redirect(fallbackPath);
}

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

function mapRoleInputToUserRole(value: string): Role | null {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  const roleMap: Record<string, Role> = {
    BOARD_DIRECTOR: "BOARD_DIRECTOR",
    ADMIN_MANAGER: "ADMIN_MANAGER",
    HR: "HR",
    ACCOUNTS: "ACCOUNTS",
    PRINCIPAL: "PRINCIPAL",
    TEACHER: "TEACHER",
    STAFF: "STAFF",
    PARENT: "PARENT",
  };
  return roleMap[normalized] ?? null;
}

function toRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    FOUNDER: "Founder",
    BOARD_DIRECTOR: "Board Director",
    ADMIN_MANAGER: "Admin Manager",
    HR: "HR",
    ACCOUNTS: "Accounts",
    PRINCIPAL: "Principal",
    TEACHER: "Teacher",
    STAFF: "Staff",
    PARENT: "Parent",
    STUDENT: "Student",
  };
  return labels[role];
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
      dateOfBirth: dateOfBirthRaw || null,
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
  try {
    const session = await requireSession();
    ensureAccess("staff", session.role);

    const name = String(formData.get("name") ?? "").trim();
    const profileImage = await getOptionalImageDataUrl(formData, "profileImage");
    const roleInput = String(formData.get("role") ?? "").trim();
    const role = mapRoleInputToUserRole(roleInput);
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
        role,
      },
    });

    await prisma.staff.create({
      data: {
        name,
        status: "ACTIVE",
        profileImage,
        role: toRoleLabel(role),
        salary: salaryRaw ? Number(salaryRaw) : null,
        dateOfBirth: dateOfBirthRaw || null,
        email,
        contactNumber,
        emergencyContact,
        address,
        city,
        state,
        qualification,
        experienceYears: experienceYearsRaw ? Number(experienceYearsRaw) : null,
        joiningDate: joiningDateRaw || null,
        userId: createdUser.id,
      },
    });

    revalidatePath("/staff");
    revalidatePath("/staff-list");
    revalidatePath("/settings");
    await setFlashMessage("success", "Staff details saved successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/staff");
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
      date: new Date(dateRaw).toISOString(),
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
  const dateOfPayment = dateOfPaymentRaw || null;
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
      paidOn: status === "PAID" || status === "PARTIAL" ? new Date().toISOString() : null,
    },
  });

  await sendMonthlyFeeDelayReminders(new Date(), [studentId]);

  revalidatePath("/fees");
  revalidatePath("/reports");
  revalidatePath("/notifications");
}

export async function addEvent(formData: FormData) {
  try {
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
        date: new Date(date).toISOString(),
        description,
      },
    });

    revalidatePath("/events");
    await setFlashMessage("success", "Event created successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/events");
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
      dateOfBirth: dateOfBirthRaw || null,
      parentName: parentName ?? undefined,
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
  try {
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
    await setFlashMessage("success", "Staff record updated successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/staff-list");
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
  try {
    const session = await requireSession();
    ensureAccess("staff", session.role);

    const staffId = Number(formData.get("staffId") ?? 0);
    const name = String(formData.get("name") ?? "").trim();
    const roleInput = String(formData.get("role") ?? "").trim();
    const role = mapRoleInputToUserRole(roleInput);
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

    const currentStaff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!currentStaff) {
      throw new Error("Staff not found.");
    }

    const data: Record<string, unknown> = {
      name,
      role: toRoleLabel(role),
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

    if (currentStaff.userId) {
      await prisma.user.update({
        where: { id: currentStaff.userId },
        data: {
          name,
          role,
        },
      });
    }

    revalidatePath("/staff");
    revalidatePath("/staff-list");
    revalidatePath("/dashboard");
    await setFlashMessage("success", "Staff details saved successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/staff-list");
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
  try {
    const session = await requireSession();
    ensureAccess("marks", session.role);

    const studentId = Number(formData.get("studentId") ?? 0);
    const subject = String(formData.get("subject") ?? "").trim();
    const marks = Number(formData.get("marks") ?? 0);
    const examType = String(formData.get("examType") ?? "").trim();

    if (!studentId || !subject || !Number.isFinite(marks) || marks < 0 || marks > 100) {
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
    await setFlashMessage("success", "Marks saved successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/marks");
}

export async function addHomework(formData: FormData) {
  try {
    const session = await requireSession();
    ensureAccess("homework", session.role);

    if (session.role === "STUDENT") {
      throw new Error("Students cannot create homework.");
    }

    const subjectName = String(formData.get("subjectName") ?? "").trim();
    const sectionName = String(formData.get("sectionName") ?? "").trim();
    const className = String(formData.get("className") ?? "").trim();
    const homeworkDateRaw = String(formData.get("homeworkDate") ?? "").trim();
    const submissionDateRaw = String(formData.get("submissionDate") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const selectedStudentIds = formData
      .getAll("studentIds")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    const singleStudentId = Number(formData.get("studentId") ?? 0);
    const studentIds = selectedStudentIds.length ? selectedStudentIds : singleStudentId ? [singleStudentId] : [];
    const attachmentFile = await getOptionalFileDataUrl(formData, "attachmentFile", 5);
    const allowedSections = ["SECTION_A", "SECTION_B", "SECTION_C", "SECTION_D", "GENERAL"];

    if (!subjectName || !sectionName || !className || !homeworkDateRaw || !submissionDateRaw || !description || studentIds.length === 0) {
      throw new Error("All fields except attachment are required.");
    }

    if (!allowedSections.includes(sectionName)) {
      throw new Error("Invalid section selected.");
    }

    const [students, createdBy] = await Promise.all([
      prisma.student.findMany({ where: { status: "ACTIVE" }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: Number(session.sub) } }),
    ]);

    const studentIdSet = new Set(students.map((student: { id: number }) => student.id));
    const invalidSelection = studentIds.some((id) => !studentIdSet.has(id));

    if (invalidSelection) {
      throw new Error("One or more selected students were not found.");
    }

    if (!createdBy) {
      throw new Error("Current user not found.");
    }

    for (const studentId of studentIds) {
      await prisma.homework.create({
        data: {
          subjectName,
          sectionName,
          className,
          homeworkDate: new Date(homeworkDateRaw).toISOString(),
          submissionDate: new Date(submissionDateRaw).toISOString(),
          description,
          attachmentFile,
          studentId,
          createdById: createdBy.id,
        },
      });
    }

    revalidatePath("/homework");
    await setFlashMessage("success", "Homework saved successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/homework");
}

export async function saveNewsPost(formData: FormData) {
  try {
    const session = await requireSession();
    ensureAccess("news", session.role);

    if (session.role === "STUDENT" || session.role === "PARENT") {
      throw new Error("You do not have permission to add or edit news posts.");
    }

    const newsId = Number(formData.get("newsId") ?? 0);
    const title = String(formData.get("title") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const imageValue = formData.get("imageFile");

    if (!title || !summary || !content) {
      throw new Error("Title, summary, and content are required.");
    }

    if (imageValue instanceof File && imageValue.size > 0 && !imageValue.type.startsWith("image/")) {
      throw new Error("News image must be a valid image file.");
    }

    const imageFile = await getOptionalFileDataUrl(formData, "imageFile", 5);

    if (newsId) {
      const existingNews = await prisma.news.findUnique({ where: { id: newsId } });
      if (!existingNews) {
        throw new Error("News post not found.");
      }

      const data: Record<string, unknown> = {
        title,
        summary,
        content,
      };

      if (imageFile) {
        data.imageFile = imageFile;
      }

      await prisma.news.update({ where: { id: newsId }, data });
      await setFlashMessage("success", "News post updated successfully.");
    } else {
      await prisma.news.create({
        data: {
          title,
          summary,
          content,
          imageFile,
          createdById: Number(session.sub),
        },
      });
      await setFlashMessage("success", "News post created successfully.");
    }

    revalidatePath("/news");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/news?tab=manage");
}

export async function sendNotification(formData: FormData) {
  try {
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
    await setFlashMessage("success", "Notification sent successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/notifications");
}

export async function addUser(formData: FormData) {
  try {
    const session = await requireSession();
    if (session.role !== "FOUNDER") {
      throw new Error("Only founder can add users.");
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "").trim();
    const roleValue = String(formData.get("role") ?? "STUDENT").trim();

    if (!isRole(roleValue)) {
      throw new Error("Invalid role selected.");
    }

    const role = roleValue;

    if (!name || !email || !password) {
      throw new Error("All user fields are required.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashedPassword, role } });

    revalidatePath("/settings");
    await setFlashMessage("success", "User created successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/settings");
}

export async function deleteUser(formData: FormData) {
  try {
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
    await setFlashMessage("success", "User removed successfully.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/settings");
}

// ── Activity Achievements ──────────────────────────────────────────────────

export async function createActivityTask(formData: FormData) {
  try {
    const session = await requireSession();
    ensureAccess("achievements", session.role);

    if (session.role !== "TEACHER" && session.role !== "PRINCIPAL" && session.role !== "FOUNDER") {
      throw new Error("Only teachers can create tasks.");
    }

    const title = String(formData.get("title") ?? "").trim();
    const description = getOptionalString(formData, "description");
    const stars = Number(formData.get("stars") ?? 1);
    const studentIds = formData.getAll("studentIds").map(Number).filter(Boolean);

    if (!title) throw new Error("Task title is required.");
    if (stars < 1 || stars > 10) throw new Error("Stars must be between 1 and 10.");
    if (studentIds.length === 0) throw new Error("Select at least one student.");

    const task = await prisma.activityTask.create({
      data: {
        title,
        description,
        stars,
        createdById: Number(session.sub),
        assignments: {
          create: studentIds.map((studentId) => ({ studentId, status: "ASSIGNED" })),
        },
      },
    });

    revalidatePath("/achievements");
    await setFlashMessage("success", `Task "${task.title}" created and assigned.`);
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/achievements");
}

export async function requestTaskCompletion(formData: FormData) {
  try {
    const session = await requireSession();
    if (session.role !== "STUDENT") throw new Error("Only students can request completion.");

    const assignmentId = Number(formData.get("assignmentId") ?? 0);
    if (!assignmentId) throw new Error("Invalid assignment.");

    const student = await prisma.student.findFirst({ where: { userId: Number(session.sub) } });
    if (!student) throw new Error("Student record not found.");

    const assignment = await prisma.taskAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.studentId !== student.id) throw new Error("Assignment not found.");
    if (assignment.status !== "ASSIGNED") throw new Error("Task already submitted or reviewed.");

    await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: { status: "PENDING_REVIEW" as const, requestedAt: new Date().toISOString() },
    });

    revalidatePath("/achievements");
    await setFlashMessage("success", "Completion request sent to teacher.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/achievements");
}

export async function reviewTaskAssignment(formData: FormData) {
  try {
    const session = await requireSession();

    if (session.role !== "TEACHER" && session.role !== "PRINCIPAL" && session.role !== "FOUNDER") {
      throw new Error("Only teachers can review tasks.");
    }

    const assignmentId = Number(formData.get("assignmentId") ?? 0);
    const action = String(formData.get("action") ?? "").trim();

    if (!assignmentId) throw new Error("Invalid assignment.");
    if (action !== "APPROVED" && action !== "REJECTED") throw new Error("Invalid action.");

    const assignment = await prisma.taskAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new Error("Assignment not found.");
    if (assignment.status !== "PENDING_REVIEW") throw new Error("Assignment is not awaiting review.");

    // fetch the task separately to get star count
    const tasks = await prisma.activityTask.findMany({ where: { id: assignment.taskId } });
    const task = tasks[0];
    if (!task) throw new Error("Task not found.");

    await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: action as "APPROVED" | "REJECTED",
        reviewedAt: new Date().toISOString(),
        reviewedById: Number(session.sub),
        starsAwarded: action === "APPROVED" ? task.stars : null,
      },
    });

    revalidatePath("/achievements");
    await setFlashMessage("success", action === "APPROVED" ? "Task approved — stars awarded!" : "Task rejected.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/achievements");
}

export async function deleteActivityTask(formData: FormData) {
  try {
    const session = await requireSession();

    if (session.role !== "TEACHER" && session.role !== "PRINCIPAL" && session.role !== "FOUNDER") {
      throw new Error("Only teachers can delete tasks.");
    }

    const taskId = Number(formData.get("taskId") ?? 0);
    if (!taskId) throw new Error("Invalid task.");

    await prisma.taskAssignment.deleteMany({ where: { taskId } });
    await prisma.activityTask.delete({ where: { id: taskId } });

    revalidatePath("/achievements");
    await setFlashMessage("success", "Task deleted.");
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  await redirectToReferrer("/achievements");
}

export async function updateActivityTask(formData: FormData) {
  try {
    const session = await requireSession();

    if (session.role !== "TEACHER" && session.role !== "PRINCIPAL" && session.role !== "FOUNDER") {
      throw new Error("Only teachers can update tasks.");
    }

    const taskId = Number(formData.get("taskId") ?? 0);
    const title = String(formData.get("title") ?? "").trim();
    const description = getOptionalString(formData, "description");
    const stars = Number(formData.get("stars") ?? 0);
    const studentIds = [...new Set(formData
      .getAll("studentIds")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0))];

    if (!taskId) throw new Error("Invalid task.");
    if (!title) throw new Error("Task title is required.");
    if (!Number.isInteger(stars) || stars < 1 || stars > 10) {
      throw new Error("Stars must be between 1 and 10.");
    }
    if (studentIds.length === 0) {
      throw new Error("Select at least one student.");
    }

    const taskRows = await prisma.activityTask.findMany({ where: { id: taskId } });
    const task = taskRows[0];
    if (!task) throw new Error("Task not found.");

    const activeStudents = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });
    const activeStudentIdSet = new Set(activeStudents.map((student) => student.id));
    const activeStudentNameById = new Map(activeStudents.map((student) => [student.id, student.name]));
    const invalidSelection = studentIds.some((id) => !activeStudentIdSet.has(id));
    if (invalidSelection) {
      throw new Error("One or more selected students are invalid.");
    }

    await prisma.activityTask.update({
      where: { id: taskId },
      data: {
        title,
        description,
        stars,
      },
    });

    const approvedAssignments = await prisma.taskAssignment.findMany({
      where: { taskId, status: "APPROVED" },
    });

    for (const assignment of approvedAssignments) {
      await prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: { starsAwarded: stars },
      });
    }

    const existingAssignments = await prisma.taskAssignment.findMany({ where: { taskId } });

    const selectedStudentIdSet = new Set(studentIds);
    const existingStudentIdSet = new Set(existingAssignments.map((assignment) => assignment.studentId));

    const toAdd = studentIds.filter((id) => !existingStudentIdSet.has(id));
    const toRemove = existingAssignments.filter((assignment) => !selectedStudentIdSet.has(assignment.studentId));

    const blockedRemovals = toRemove.filter(
      (assignment) => assignment.status === "PENDING_REVIEW" || assignment.status === "APPROVED",
    );
    if (blockedRemovals.length > 0) {
      const blockedStudentNames = blockedRemovals
        .map((assignment) => activeStudentNameById.get(assignment.studentId) ?? `Student ${assignment.studentId}`)
        .join(", ");
      throw new Error(`Cannot unassign students with submitted/reviewed work: ${blockedStudentNames}`);
    }

    for (const assignment of toRemove) {
      await prisma.taskAssignment.deleteMany({ where: { taskId, studentId: assignment.studentId } });
    }

    for (const studentId of toAdd) {
      await prisma.taskAssignment.create({
        data: {
          taskId,
          studentId,
          status: "ASSIGNED",
          requestedAt: null,
          reviewedAt: null,
          reviewedById: null,
          starsAwarded: null,
        },
      });
    }

    revalidatePath("/achievements");
    await setFlashMessage("success", `Task "${title}" updated successfully.`);
  } catch (error) {
    await setFlashMessage("error", getErrorMessage(error));
  }

  redirect("/achievements");
}
