import { prisma } from "@/lib/prisma";
import { Fee, Student } from "@/lib/types";

const MONTHLY_FEE_COURSES = new Set(["MUSIC", "TUITION"]);
const RESOLVED_RETENTION_DAYS = 60;
const MONTH_KEY_PATTERN = /\((\d{4}-\d{2})\)$/;

type MonthlyStudent = Pick<Student, "id" | "name" | "course" | "userId">;

type ReminderNotification = {
  id: number;
  userId: number;
  title: string;
  status?: string;
  type?: string;
  monthKey?: string | null;
  resolvedAt?: unknown;
  createdAt?: unknown;
};

function getDateValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      const parsed = maybeTimestamp.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof maybeTimestamp._seconds === "number") {
      const parsed = new Date(maybeTimestamp._seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthKey(referenceDate: Date): string {
  return `${referenceDate.getUTCFullYear()}-${String(referenceDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(referenceDate: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

function getMonthRangeFromKey(monthKey: string): { start: Date; end: Date } | null {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

function getReminderMonthKey(notification: ReminderNotification): string | null {
  if (notification.monthKey && typeof notification.monthKey === "string") {
    return notification.monthKey;
  }

  const match = String(notification.title).match(MONTH_KEY_PATTERN);
  return match?.[1] ?? null;
}

function isFeeReminder(notification: ReminderNotification): boolean {
  return notification.type === "MONTHLY_FEE_PENDING" || String(notification.title).startsWith("Monthly Fee Pending (");
}

async function resolveReminder(notificationId: number): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}

async function cleanupResolvedReminders(referenceDate: Date): Promise<number> {
  const notifications = (await prisma.notification.findMany({ orderBy: { createdAt: "desc" } })) as ReminderNotification[];

  let deleted = 0;
  for (const notification of notifications) {
    if (!isFeeReminder(notification)) {
      continue;
    }

    if (notification.status !== "RESOLVED") {
      continue;
    }

    const resolvedAt = getDateValue(notification.resolvedAt) ?? getDateValue(notification.createdAt);
    if (!resolvedAt) {
      continue;
    }

    const ageInMs = referenceDate.getTime() - resolvedAt.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    if (ageInDays >= RESOLVED_RETENTION_DAYS) {
      await prisma.notification.delete({ where: { id: notification.id } });
      deleted += 1;
    }
  }

  return deleted;
}

function isDateWithinMonth(date: Date | null, monthStart: Date, monthEnd: Date): boolean {
  if (!date) {
    return false;
  }
  return date >= monthStart && date < monthEnd;
}

async function studentHasPaidInMonth(studentId: number, monthStart: Date, monthEnd: Date): Promise<boolean> {
  const fees = await prisma.fee.findMany({ where: { studentId } });

  return fees.some((fee: Fee) => {
    if (fee.status !== "PAID") {
      return false;
    }

    const paymentDate = getDateValue(fee.dateOfPayment) ?? getDateValue(fee.paidOn) ?? getDateValue(fee.createdAt);
    return isDateWithinMonth(paymentDate, monthStart, monthEnd);
  });
}

export async function sendMonthlyFeeDelayReminders(
  referenceDate = new Date(),
  studentIds?: number[],
): Promise<{ month: string; checked: number; created: number; resolved: number; deleted: number; skipped: boolean }> {
  const deleted = await cleanupResolvedReminders(referenceDate);
  const shouldCreateReminders = referenceDate.getDate() > 5;

  const { start, end } = getMonthRange(referenceDate);
  const monthKey = getMonthKey(referenceDate);

  const allActiveStudents = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, course: true, userId: true },
  });

  const targetIds = studentIds ? new Set(studentIds) : null;

  const eligibleStudents = allActiveStudents.filter((student: MonthlyStudent) => {
    if (!MONTHLY_FEE_COURSES.has(String(student.course))) {
      return false;
    }

    if (!student.userId) {
      return false;
    }

    if (targetIds && !targetIds.has(student.id)) {
      return false;
    }

    return true;
  });

  let created = 0;
  let resolved = 0;

  for (const student of eligibleStudents) {
    const title = `Monthly Fee Pending (${monthKey})`;

    const alreadyPaid = await studentHasPaidInMonth(student.id, start, end);
    const existingForMonth = (await prisma.notification.findMany({
      where: {
        userId: student.userId,
        title,
      },
    })) as ReminderNotification[];

    if (alreadyPaid) {
      for (const existing of existingForMonth) {
        if (existing.status !== "RESOLVED") {
          await resolveReminder(existing.id);
          resolved += 1;
        }
      }
      continue;
    }

    if (!shouldCreateReminders) {
      continue;
    }

    const message = `Your ${String(student.course).toLowerCase()} fee payment for ${monthKey} is pending. Please complete payment immediately.`;

    if (existingForMonth.length > 0) {
      continue;
    }

    await prisma.notification.create({
      data: {
        userId: student.userId,
        title,
        message,
        status: "PENDING",
        type: "MONTHLY_FEE_PENDING",
        monthKey,
        resolvedAt: null,
      },
    });
    created += 1;
  }

  const allMonthlyReminders = (await prisma.notification.findMany({ orderBy: { createdAt: "desc" } })) as ReminderNotification[];
  const feeReminders = allMonthlyReminders.filter((notification) => isFeeReminder(notification));
  const studentByUserId = new Map<number, MonthlyStudent>();
  for (const student of allActiveStudents) {
    if (student.userId) {
      studentByUserId.set(student.userId, student);
    }
  }

  for (const reminder of feeReminders) {
    if (reminder.status === "RESOLVED") {
      continue;
    }

    const month = getReminderMonthKey(reminder);
    if (!month) {
      continue;
    }

    const range = getMonthRangeFromKey(month);
    if (!range) {
      continue;
    }

    const mappedStudent = studentByUserId.get(reminder.userId);
    if (!mappedStudent) {
      continue;
    }

    const paidInReminderMonth = await studentHasPaidInMonth(mappedStudent.id, range.start, range.end);
    if (!paidInReminderMonth) {
      continue;
    }

    await resolveReminder(reminder.id);
    resolved += 1;
  }

  return {
    month: monthKey,
    checked: eligibleStudents.length,
    created,
    resolved,
    deleted,
    skipped: !shouldCreateReminders,
  };
}
