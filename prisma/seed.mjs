import prismaPkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = prismaPkg;

const Role = {
  FOUNDER: "FOUNDER",
  BOARD_DIRECTOR: "BOARD_DIRECTOR",
  ADMIN_MANAGER: "ADMIN_MANAGER",
  HR: "HR",
  ACCOUNTS: "ACCOUNTS",
  PRINCIPAL: "PRINCIPAL",
  TEACHER: "TEACHER",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
};

const CourseType = {
  MONTESSORI: "MONTESSORI",
  MUSIC: "MUSIC",
  TUITION: "TUITION",
};

const EnrollmentStatus = {
  PENDING: "PENDING",
};

const AttendanceStatus = {
  PRESENT: "PRESENT",
};

const AttendanceTargetType = {
  STUDENT: "STUDENT",
};

const FeeStatus = {
  PARTIAL: "PARTIAL",
};

const prisma = new PrismaClient();

const users = [
  ["Founder", "founder@rolfunfactory.com", Role.FOUNDER],
  ["Board Director", "board@rolfunfactory.com", Role.BOARD_DIRECTOR],
  ["Admin Manager", "admin@rolfunfactory.com", Role.ADMIN_MANAGER],
  ["HR Lead", "hr@rolfunfactory.com", Role.HR],
  ["Accounts Lead", "accounts@rolfunfactory.com", Role.ACCOUNTS],
  ["Principal", "principal@rolfunfactory.com", Role.PRINCIPAL],
  ["Teacher Mira", "teacher@rolfunfactory.com", Role.TEACHER],
  ["Parent Ravi", "parent@rolfunfactory.com", Role.PARENT],
  ["Student Arul", "student@rolfunfactory.com", Role.STUDENT],
];

async function main() {
  const password = await bcrypt.hash("Welcome@123", 12);

  for (const [name, email, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, password },
      create: { name, email, role, password },
    });
  }

  const parentUser = await prisma.user.findUniqueOrThrow({ where: { email: "parent@rolfunfactory.com" } });
  const studentUser = await prisma.user.findUniqueOrThrow({ where: { email: "student@rolfunfactory.com" } });
  const teacherUser = await prisma.user.findUniqueOrThrow({ where: { email: "teacher@rolfunfactory.com" } });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: { name: "Parent Ravi", contact: "+91-9000000001" },
    create: { name: "Parent Ravi", contact: "+91-9000000001", userId: parentUser.id },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: { name: "Teacher Mira", subject: "Music" },
    create: { name: "Teacher Mira", subject: "Music", userId: teacherUser.id },
  });

  const montessori = await prisma.course.upsert({
    where: { id: 1 },
    update: { name: "Montessori Foundation", type: CourseType.MONTESSORI },
    create: { id: 1, name: "Montessori Foundation", type: CourseType.MONTESSORI },
  });

  const music = await prisma.course.upsert({
    where: { id: 2 },
    update: { name: "Music Basics", type: CourseType.MUSIC },
    create: { id: 2, name: "Music Basics", type: CourseType.MUSIC },
  });

  const tuition = await prisma.course.upsert({
    where: { id: 3 },
    update: { name: "Evening Tuition", type: CourseType.TUITION },
    create: { id: 3, name: "Evening Tuition", type: CourseType.TUITION },
  });

  const batch = await prisma.batch.upsert({
    where: { id: 1 },
    update: { name: "Morning Stars", courseId: montessori.id, teacherId: teacher.id, timing: "9:00 AM - 11:00 AM" },
    create: { id: 1, name: "Morning Stars", courseId: montessori.id, teacherId: teacher.id, timing: "9:00 AM - 11:00 AM" },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      name: "Student Arul",
      status: "ACTIVE",
      profileImage: "https://placehold.co/180x180/png?text=Arul",
      className: "Grade 3",
      howDidYouHear: "FRIEND_REFERRAL",
      enquiryStatus: "CONVERTED",
      dateOfBirth: new Date("2017-08-11"),
      age: 8,
      city: "Chennai",
      state: "Tamil Nadu",
      residentialAddress: "12 Lake View Street, Chennai",
      permanentAddress: "12 Lake View Street, Chennai",
      fatherName: "Ravi Kumar",
      fatherEmail: "ravi.kumar@example.com",
      fatherMobile: "+91-9000000001",
      motherName: "Priya Ravi",
      motherEmail: "priya.ravi@example.com",
      motherMobile: "+91-9000000002",
      feeOffered: 5000,
      parentId: parent.id,
      course: CourseType.MONTESSORI,
      batchId: batch.id,
    },
    create: {
      name: "Student Arul",
      status: "ACTIVE",
      profileImage: "https://placehold.co/180x180/png?text=Arul",
      className: "Grade 3",
      howDidYouHear: "FRIEND_REFERRAL",
      enquiryStatus: "CONVERTED",
      dateOfBirth: new Date("2017-08-11"),
      age: 8,
      city: "Chennai",
      state: "Tamil Nadu",
      residentialAddress: "12 Lake View Street, Chennai",
      permanentAddress: "12 Lake View Street, Chennai",
      fatherName: "Ravi Kumar",
      fatherEmail: "ravi.kumar@example.com",
      fatherMobile: "+91-9000000001",
      motherName: "Priya Ravi",
      motherEmail: "priya.ravi@example.com",
      motherMobile: "+91-9000000002",
      feeOffered: 5000,
      userId: studentUser.id,
      parentId: parent.id,
      course: CourseType.MONTESSORI,
      batchId: batch.id,
    },
  });

  await prisma.staff.upsert({
    where: { id: 1 },
    update: {
      name: "Keerthi",
      status: "ACTIVE",
      profileImage: "https://placehold.co/180x180/png?text=Keerthi",
      role: "Coordinator",
      dateOfBirth: new Date("1994-02-21"),
      email: "keerthi.staff@rolfunfactory.com",
      contactNumber: "+91-9000000099",
      emergencyContact: "+91-9000000088",
      address: "27 Elm Street, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      qualification: "MBA",
      experienceYears: 6,
      joiningDate: new Date("2022-06-01"),
    },
    create: {
      id: 1,
      name: "Keerthi",
      status: "ACTIVE",
      profileImage: "https://placehold.co/180x180/png?text=Keerthi",
      role: "Coordinator",
      dateOfBirth: new Date("1994-02-21"),
      email: "keerthi.staff@rolfunfactory.com",
      contactNumber: "+91-9000000099",
      emergencyContact: "+91-9000000088",
      address: "27 Elm Street, Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      qualification: "MBA",
      experienceYears: 6,
      joiningDate: new Date("2022-06-01"),
    },
  });

  await prisma.enrollment.upsert({
    where: { id: 1 },
    update: {
      name: "New Child",
      className: "Grade 2",
      howDidYouHear: "SOCIAL_MEDIA",
      enquiryStatus: "NEW",
      dateOfBirth: new Date("2018-05-14"),
      parentName: "Suresh",
      email: "suresh.parent@example.com",
      age: 7,
      city: "Chennai",
      state: "Tamil Nadu",
      residentialAddress: "45 River Road, Chennai",
      permanentAddress: "45 River Road, Chennai",
      fatherName: "Suresh",
      fatherEmail: "suresh.parent@example.com",
      fatherMobile: "+91-9012345678",
      motherName: "Kavya Suresh",
      motherEmail: "kavya.parent@example.com",
      motherMobile: "+91-9087654321",
      feeOffered: 4500,
      course: CourseType.MUSIC,
      status: EnrollmentStatus.PENDING,
      notes: "Interested in weekend batch",
    },
    create: {
      id: 1,
      name: "New Child",
      className: "Grade 2",
      howDidYouHear: "SOCIAL_MEDIA",
      enquiryStatus: "NEW",
      dateOfBirth: new Date("2018-05-14"),
      parentName: "Suresh",
      email: "suresh.parent@example.com",
      age: 7,
      city: "Chennai",
      state: "Tamil Nadu",
      residentialAddress: "45 River Road, Chennai",
      permanentAddress: "45 River Road, Chennai",
      fatherName: "Suresh",
      fatherEmail: "suresh.parent@example.com",
      fatherMobile: "+91-9012345678",
      motherName: "Kavya Suresh",
      motherEmail: "kavya.parent@example.com",
      motherMobile: "+91-9087654321",
      feeOffered: 4500,
      course: CourseType.MUSIC,
      status: EnrollmentStatus.PENDING,
      notes: "Interested in weekend batch",
    },
  });

  await prisma.attendance.create({
    data: {
      userId: studentUser.id,
      studentId: student.id,
      date: new Date(),
      status: AttendanceStatus.PRESENT,
      targetType: AttendanceTargetType.STUDENT,
      markedById: teacherUser.id,
      notes: "On time",
    },
  });

  await prisma.mark.create({
    data: {
      studentId: student.id,
      subject: "Mathematics",
      marks: 86,
      examType: "Unit Test",
    },
  });

  await prisma.fee.create({
    data: {
      studentId: student.id,
      amount: 5000,
      status: FeeStatus.PARTIAL,
      receiptNo: "RFF-1001",
      paidOn: new Date(),
    },
  });

  await prisma.event.create({
    data: {
      name: "Summer Discovery Camp",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      description: "A hands-on camp with science, music, and art stations.",
      registrations: 22,
    },
  });

  await prisma.course.upsert({ where: { id: music.id }, update: {}, create: { id: music.id, name: music.name, type: music.type } });
  await prisma.course.upsert({ where: { id: tuition.id }, update: {}, create: { id: tuition.id, name: tuition.name, type: tuition.type } });

  console.log("Seed data created. Default password for all users: Welcome@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
