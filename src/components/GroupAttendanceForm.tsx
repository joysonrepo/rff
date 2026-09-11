"use client";

import { useMemo, useState, useTransition } from "react";
import { markGroupAttendance } from "@/lib/actions";
import styles from "@/app/(protected)/module.module.css";

type GroupStudent = {
  id: number;
  name: string;
  className: string;
  course: string;
};

export function GroupAttendanceForm({ students, defaultDate }: { students: GroupStudent[]; defaultDate: string }) {
  const courses = useMemo(() => Array.from(new Set(students.map((student) => student.course))), [students]);
  const [course, setCourse] = useState("");
  const groups = useMemo(
    () => Array.from(new Set(students.filter((student) => !course || student.course === course).map((student) => student.className))),
    [students, course],
  );
  const [groupName, setGroupName] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [attendanceTime, setAttendanceTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isSaving, startTransition] = useTransition();
  const hasFilter = Boolean(course || groupName);
  const groupStudents = hasFilter
    ? students.filter(
        (student) => (!course || student.course === course) && (!groupName || student.className === groupName),
      )
    : [];

  function saveSelection(nextSelectedStudentIds: number[]) {
    const formData = new FormData();
    formData.set("groupName", groupName);
    formData.set("course", course);
    formData.set("date", date);
    formData.set("attendanceTime", attendanceTime);
    groupStudents.forEach((student) => formData.append("studentIds", String(student.id)));
    nextSelectedStudentIds.forEach((studentId) => formData.append("selectedStudentIds", String(studentId)));
    startTransition(() => {
      void markGroupAttendance(formData);
    });
  }

  function toggleStudent(studentId: number) {
    const nextSelectedStudentIds = selectedStudentIds.includes(studentId)
      ? selectedStudentIds.filter((id) => id !== studentId)
      : [...selectedStudentIds, studentId];
    setSelectedStudentIds(nextSelectedStudentIds);
    saveSelection(nextSelectedStudentIds);
  }

  function handleGroupChange(nextGroupName: string) {
    setGroupName(nextGroupName);
    setSelectedStudentIds([]);
  }

  function handleCourseChange(nextCourse: string) {
    setCourse(nextCourse);
    if (groupName && nextCourse && !students.some((student) => student.course === nextCourse && student.className === groupName)) {
      setGroupName("");
    }
    setSelectedStudentIds([]);
  }

  return (
    <form action={markGroupAttendance} className={styles.formGrid}>
      <label>Course
        <select className={styles.select} name="course" value={course} onChange={(event) => handleCourseChange(event.target.value)}>
          <option value="">Select Course</option>
          {courses.map((courseOption) => <option key={courseOption} value={courseOption}>{courseOption}</option>)}
        </select>
      </label>
      <label>Group / class
        <select className={styles.select} name="groupName" value={groupName} onChange={(event) => {
          handleGroupChange(event.target.value);
        }}>
          <option value="">Select Group / Class</option>
          {groups.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>
      </label>
      <label>Date
        <input className={styles.input} name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </label>
      <label>Attendance time
        <input className={styles.input} name="attendanceTime" type="time" value={attendanceTime} onChange={(event) => setAttendanceTime(event.target.value)} required />
      </label>
      <div className={styles.attendanceTiles}>
        {groupStudents.map((student) => {
          const selected = selectedStudentIds.includes(student.id);
          return (
            <button
              key={student.id}
              type="button"
              className={`${styles.attendanceTile} ${selected ? styles.attendanceTileSelected : ""}`}
              onClick={() => toggleStudent(student.id)}
              aria-pressed={selected}
              disabled={isSaving}
            >
              {student.name}
            </button>
          );
        })}
      </div>
      {groupStudents.map((student) => <input key={student.id} type="hidden" name="studentIds" value={student.id} />)}
      {selectedStudentIds.map((studentId) => <input key={studentId} type="hidden" name="selectedStudentIds" value={studentId} />)}
      <p className={`${styles.subtitle} ${styles.attendanceHelp}`}>Selected students are Present or Late based on the attendance time. Unselected students are Absent.</p>
      <button className={`${styles.button} ${styles.attendanceSubmit}`} type="submit" disabled={!groupStudents.length}>Save Group Attendance</button>
    </form>
  );
}