export type Role =
  | "FOUNDER"
  | "BOARD_DIRECTOR"
  | "ADMIN_MANAGER"
  | "HR"
  | "ACCOUNTS"
  | "PRINCIPAL"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

export type CourseType = "MONTESSORI" | "MUSIC" | "TUITION";
export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceTargetType = "STUDENT" | "STAFF";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";
export type FeeStatus = "PENDING" | "PARTIAL" | "PAID";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type Parent = {
  id: number;
  name: string;
  contact: string;
  userId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Student = {
  id: number;
  name: string;
  age: number;
  userId?: number | null;
  parentId?: number | null;
  course: CourseType;
  batchId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Teacher = {
  id: number;
  name: string;
  subject: string;
  userId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Staff = {
  id: number;
  name: string;
  role: string;
  userId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Attendance = {
  id: number;
  userId: number;
  studentId?: number | null;
  date: string;
  status: AttendanceStatus;
  targetType: AttendanceTargetType;
  markedById?: number | null;
  notes?: string;
  createdAt: string;
};

export type Mark = {
  id: number;
  studentId: number;
  subject: string;
  marks: number;
  examType?: string;
  createdAt: string;
};

export type Fee = {
  id: number;
  studentId: number;
  amount: number;
  status: FeeStatus;
  paidOn?: string | null;
  receiptNo?: string | null;
  createdAt: string;
};

export type Course = {
  id: number;
  name: string;
  type: CourseType;
  createdAt: string;
};

export type Batch = {
  id: number;
  name: string;
  courseId: number;
  teacherId?: number | null;
  timing: string;
  createdAt: string;
};

export type Enrollment = {
  id: number;
  name: string;
  parentName?: string;
  email: string;
  age: number;
  course: CourseType;
  status: EnrollmentStatus;
  notes?: string;
  createdAt: string;
  reviewedBy?: number | null;
};

export type Event = {
  id: number;
  name: string;
  date: string;
  description: string;
  registrations: number;
  createdAt: string;
};

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};