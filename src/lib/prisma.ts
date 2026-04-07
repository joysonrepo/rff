import { db } from "@/lib/firebaseAdmin";
import {
  Attendance,
  Batch,
  Course,
  Enrollment,
  Event,
  Fee,
  Mark,
  Notification,
  Parent,
  Staff,
  Student,
  Teacher,
  User,
} from "@/lib/types";

type SortDirection = "asc" | "desc";

type WhereClause = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function applyWhere<T>(items: T[], where?: WhereClause): T[] {
  if (!where) return items;
  return items.filter((item) =>
    Object.entries(where).every(([key, value]) => (item as Record<string, unknown>)[key] === value),
  );
}

function applyOrder<T>(items: T[], orderBy?: Record<string, SortDirection>): T[] {
  if (!orderBy) return items;
  const [field, direction] = Object.entries(orderBy)[0];
  const sorted = [...items].sort((a, b) => {
    const left = (a as Record<string, unknown>)[field];
    const right = (b as Record<string, unknown>)[field];
    if (left === right) return 0;
    if (left === undefined || left === null) return -1;
    if (right === undefined || right === null) return 1;
    return String(left) < String(right) ? -1 : 1;
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

function applyTake<T>(items: T[], take?: number): T[] {
  if (!take) return items;
  return items.slice(0, take);
}

async function getNextId(collectionName: string): Promise<number> {
  const counterRef = db.collection("meta").doc("counters");
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = (snap.data() ?? {}) as Record<string, number>;
    const next = (data[collectionName] ?? 0) + 1;
    tx.set(counterRef, { [collectionName]: next }, { merge: true });
    return next;
  });
}

async function listCollection<T>(collectionName: string): Promise<T[]> {
  const snap = await db.collection(collectionName).get();
  return snap.docs.map((doc) => doc.data() as T);
}

async function createWithId<T extends { id: number }>(collectionName: string, data: Omit<T, "id">): Promise<T> {
  const id = await getNextId(collectionName);
  const payload = { ...(data as object), id } as T;
  await db.collection(collectionName).doc(String(id)).set(payload as object);
  return payload;
}

async function findUniqueByField<T>(collectionName: string, where: WhereClause): Promise<T | null> {
  const [field, value] = Object.entries(where)[0];
  const snap = await db.collection(collectionName).where(field, "==", value).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as T;
}

async function updateById<T>(collectionName: string, id: number, data: Partial<T>): Promise<T> {
  const ref = db.collection(collectionName).doc(String(id));
  await ref.set(data as object, { merge: true });
  const snap = await ref.get();
  return snap.data() as T;
}

async function deleteById(collectionName: string, id: number): Promise<void> {
  await db.collection(collectionName).doc(String(id)).delete();
}

async function includeStudentsParent(students: Student[]): Promise<Array<Student & { parent?: Parent | null }>> {
  const parents = await listCollection<Parent>("parents");
  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));
  return students.map((student) => ({ ...student, parent: student.parentId ? parentMap.get(student.parentId) ?? null : null }));
}

async function includeAttendanceRelations(records: Attendance[]): Promise<Array<Attendance & { user?: User; student?: Student | null }>> {
  const [users, students] = await Promise.all([listCollection<User>("users"), listCollection<Student>("students")]);
  const userMap = new Map(users.map((user) => [user.id, user]));
  const studentMap = new Map(students.map((student) => [student.id, student]));
  return records.map((record) => ({
    ...record,
    user: userMap.get(record.userId),
    student: record.studentId ? studentMap.get(record.studentId) ?? null : null,
  }));
}

async function includeFeesStudent(items: Fee[]): Promise<Array<Fee & { student: Student }>> {
  const students = await listCollection<Student>("students");
  const studentMap = new Map(students.map((student) => [student.id, student]));
  return items
    .map((item) => ({ ...item, student: studentMap.get(item.studentId) }))
    .filter((item): item is Fee & { student: Student } => Boolean(item.student));
}

async function includeMarksStudent(items: Mark[]): Promise<Array<Mark & { student: Student }>> {
  const students = await listCollection<Student>("students");
  const studentMap = new Map(students.map((student) => [student.id, student]));
  return items
    .map((item) => ({ ...item, student: studentMap.get(item.studentId) }))
    .filter((item): item is Mark & { student: Student } => Boolean(item.student));
}

async function includeCoursesBatches(items: Course[]): Promise<Array<Course & { batches: Batch[] }>> {
  const batches = await listCollection<Batch>("batches");
  return items.map((course) => ({ ...course, batches: batches.filter((batch) => batch.courseId === course.id) }));
}

async function includeNotificationsUser(items: Notification[]): Promise<Array<Notification & { user: User }>> {
  const users = await listCollection<User>("users");
  const userMap = new Map(users.map((user) => [user.id, user]));
  return items
    .map((item) => ({ ...item, user: userMap.get(item.userId) }))
    .filter((item): item is Notification & { user: User } => Boolean(item.user));
}

function applySelect<T extends Record<string, unknown>>(items: T[], select?: Record<string, boolean>): T[] {
  if (!select) return items;
  const keys = Object.entries(select)
    .filter(([, include]) => include)
    .map(([key]) => key);
  return items.map((item) => {
    const out: Record<string, unknown> = {};
    for (const key of keys) out[key] = item[key];
    return out as T;
  });
}

export const prisma: any = {
  user: {
    async findUnique(args: { where: WhereClause }) {
      return findUniqueByField<User>("users", args.where);
    },
    async findMany(args?: { where?: WhereClause; select?: Record<string, boolean>; orderBy?: Record<string, SortDirection> }) {
      const rows = await listCollection<User>("users");
      const filtered = applyOrder(applyWhere(rows, args?.where), args?.orderBy);
      return applySelect(filtered as Array<Record<string, unknown>>, args?.select) as User[];
    },
    async create(args: { data: Omit<User, "id" | "createdAt" | "updatedAt"> }) {
      return createWithId<User>("users", { ...args.data, createdAt: nowIso(), updatedAt: nowIso() });
    },
    async delete(args: { where: { id: number } }) {
      await deleteById("users", args.where.id);
    },
    async count(args?: { where?: WhereClause }) {
      const rows = await listCollection<User>("users");
      return applyWhere(rows, args?.where).length;
    },
  },
  parent: {
    async findUnique(args: { where: WhereClause }) {
      return findUniqueByField<Parent>("parents", args.where);
    },
  },
  student: {
    async create(args: { data: Omit<Student, "id" | "createdAt" | "updatedAt"> }) {
      return createWithId<Student>("students", { ...args.data, createdAt: nowIso(), updatedAt: nowIso() });
    },
    async findMany(args?: {
      where?: WhereClause;
      include?: { parent?: boolean };
      orderBy?: Record<string, SortDirection>;
      select?: Record<string, boolean>;
    }) {
      const rows = applyOrder(applyWhere(await listCollection<Student>("students"), args?.where), args?.orderBy);
      const selected = applySelect(rows as Array<Record<string, unknown>>, args?.select) as Student[];
      if (args?.include?.parent) {
        return includeStudentsParent(selected as Student[]);
      }
      return selected;
    },
    async count(args?: { where?: WhereClause }) {
      const rows = await listCollection<Student>("students");
      return applyWhere(rows, args?.where).length;
    },
  },
  teacher: {
    async count() {
      const rows = await listCollection<Teacher>("teachers");
      return rows.length;
    },
  },
  staff: {
    async create(args: { data: Omit<Staff, "id" | "createdAt" | "updatedAt"> }) {
      return createWithId<Staff>("staff", { ...args.data, createdAt: nowIso(), updatedAt: nowIso() });
    },
    async findMany(args?: { where?: WhereClause; orderBy?: Record<string, SortDirection> }) {
      return applyOrder(applyWhere(await listCollection<Staff>("staff"), args?.where), args?.orderBy);
    },
    async count(args?: { where?: WhereClause }) {
      const rows = await listCollection<Staff>("staff");
      return applyWhere(rows, args?.where).length;
    },
  },
  attendance: {
    async create(args: { data: Omit<Attendance, "id" | "createdAt"> }) {
      return createWithId<Attendance>("attendance", { ...args.data, createdAt: nowIso() });
    },
    async findMany(args?: {
      where?: WhereClause;
      include?: { user?: boolean; student?: boolean };
      orderBy?: Record<string, SortDirection>;
      take?: number;
    }) {
      const rows = applyTake(
        applyOrder(applyWhere(await listCollection<Attendance>("attendance"), args?.where), args?.orderBy),
        args?.take,
      );
      if (args?.include?.user || args?.include?.student) {
        return includeAttendanceRelations(rows);
      }
      return rows;
    },
    async count(args?: { where?: WhereClause }) {
      const rows = await listCollection<Attendance>("attendance");
      return applyWhere(rows, args?.where).length;
    },
  },
  mark: {
    async create(args: { data: Omit<Mark, "id" | "createdAt"> }) {
      return createWithId<Mark>("marks", { ...args.data, createdAt: nowIso() });
    },
    async findMany(args?: { include?: { student?: boolean }; orderBy?: Record<string, SortDirection>; where?: WhereClause }) {
      const rows = applyOrder(applyWhere(await listCollection<Mark>("marks"), args?.where), args?.orderBy);
      if (args?.include?.student) {
        return includeMarksStudent(rows);
      }
      return rows;
    },
  },
  fee: {
    async create(args: { data: Omit<Fee, "id" | "createdAt"> }) {
      return createWithId<Fee>("fees", { ...args.data, createdAt: nowIso() });
    },
    async findMany(args?: { include?: { student?: boolean }; orderBy?: Record<string, SortDirection>; where?: WhereClause }) {
      const rows = applyOrder(applyWhere(await listCollection<Fee>("fees"), args?.where), args?.orderBy);
      if (args?.include?.student) {
        return includeFeesStudent(rows);
      }
      return rows;
    },
    async aggregate(args: { _sum: { amount: boolean } }) {
      const rows = await listCollection<Fee>("fees");
      return { _sum: { amount: args._sum.amount ? rows.reduce((sum, row) => sum + Number(row.amount), 0) : 0 } };
    },
  },
  course: {
    async create(args: { data: Omit<Course, "id" | "createdAt"> }) {
      return createWithId<Course>("courses", { ...args.data, createdAt: nowIso() });
    },
    async findMany(args?: { include?: { batches?: boolean }; orderBy?: Record<string, SortDirection>; where?: WhereClause }) {
      const rows = applyOrder(applyWhere(await listCollection<Course>("courses"), args?.where), args?.orderBy);
      if (args?.include?.batches) {
        return includeCoursesBatches(rows);
      }
      return rows;
    },
  },
  batch: {
    async create(args: { data: Omit<Batch, "id" | "createdAt"> }) {
      return createWithId<Batch>("batches", { ...args.data, createdAt: nowIso() });
    },
  },
  enrollment: {
    async create(args: { data: Omit<Enrollment, "id" | "createdAt" | "status"> & { status?: Enrollment["status"] } }) {
      return createWithId<Enrollment>("enrollments", {
        ...args.data,
        status: args.data.status ?? "PENDING",
        createdAt: nowIso(),
      });
    },
    async update(args: { where: { id: number }; data: Partial<Enrollment> }) {
      return updateById<Enrollment>("enrollments", args.where.id, args.data);
    },
    async findUnique(args: { where: WhereClause }) {
      return findUniqueByField<Enrollment>("enrollments", args.where);
    },
    async findMany(args?: { where?: WhereClause; orderBy?: Record<string, SortDirection> }) {
      return applyOrder(applyWhere(await listCollection<Enrollment>("enrollments"), args?.where), args?.orderBy);
    },
    async count(args?: { where?: WhereClause }) {
      const rows = await listCollection<Enrollment>("enrollments");
      return applyWhere(rows, args?.where).length;
    },
  },
  event: {
    async create(args: { data: Omit<Event, "id" | "createdAt" | "registrations"> & { registrations?: number } }) {
      return createWithId<Event>("events", {
        ...args.data,
        registrations: args.data.registrations ?? 0,
        createdAt: nowIso(),
      });
    },
    async findMany(args?: { where?: WhereClause; orderBy?: Record<string, SortDirection> }) {
      return applyOrder(applyWhere(await listCollection<Event>("events"), args?.where), args?.orderBy);
    },
  },
  notification: {
    async createMany(args: { data: Array<Omit<Notification, "id" | "createdAt" | "isRead"> & { isRead?: boolean }> }) {
      for (const row of args.data) {
        await createWithId<Notification>("notifications", {
          ...row,
          isRead: row.isRead ?? false,
          createdAt: nowIso(),
        });
      }
    },
    async findMany(args?: {
      where?: WhereClause;
      orderBy?: Record<string, SortDirection>;
      include?: { user?: boolean };
    }) {
      const rows = applyOrder(applyWhere(await listCollection<Notification>("notifications"), args?.where), args?.orderBy);
      if (args?.include?.user) {
        return includeNotificationsUser(rows);
      }
      return rows;
    },
  },
};
