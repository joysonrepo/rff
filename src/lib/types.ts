export type Role =
  | "FOUNDER"
  | "BOARD_DIRECTOR"
  | "ADMIN_MANAGER"
  | "HR"
  | "ACCOUNTS"
  | "PRINCIPAL"
  | "TEACHER"
  | "STAFF"
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
  status?: "ACTIVE" | "INACTIVE" | null;
  profileImage?: string | null;
  className?: string | null;
  howDidYouHear?: string | null;
  enquiryStatus?: string | null;
  dateOfBirth?: string | null;
  age: number;
  city?: string | null;
  state?: string | null;
  residentialAddress?: string | null;
  permanentAddress?: string | null;
  fatherName?: string | null;
  fatherEmail?: string | null;
  fatherMobile?: string | null;
  motherName?: string | null;
  motherEmail?: string | null;
  motherMobile?: string | null;
  feeOffered?: number | null;
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
  status?: "ACTIVE" | "INACTIVE" | null;
  profileImage?: string | null;
  role: string;
  salary?: number | null;
  dateOfBirth?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  qualification?: string | null;
  experienceYears?: number | null;
  joiningDate?: string | null;
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

export type Homework = {
  id: number;
  subjectName: string;
  sectionName: string;
  className: string;
  homeworkDate: string;
  submissionDate: string;
  description: string;
  attachmentFile?: string | null;
  studentId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
};

export type News = {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageFile?: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
};

export type Fee = {
  id: number;
  studentId: number;
  amount: number;
  status: FeeStatus;
  paidOn?: string | null;
  receiptNo?: string | null;
  createdAt: string;
  dateOfPayment?: string | null;
  amountPaidFor?: string | null;
  modeOfPayment?: string | null;
  notes?: string | null;
  payeeName?: string | null;
  invoiceFile?: string | null;
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
  className?: string | null;
  howDidYouHear?: string | null;
  enquiryStatus?: string | null;
  dateOfBirth?: string | null;
  parentName?: string;
  email: string;
  age: number;
  city?: string | null;
  state?: string | null;
  residentialAddress?: string | null;
  permanentAddress?: string | null;
  fatherName?: string | null;
  fatherEmail?: string | null;
  fatherMobile?: string | null;
  motherName?: string | null;
  motherEmail?: string | null;
  motherMobile?: string | null;
  feeOffered?: number | null;
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
  status?: "INFO" | "PENDING" | "RESOLVED";
  type?: "GENERAL" | "MONTHLY_FEE_PENDING";
  monthKey?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
};