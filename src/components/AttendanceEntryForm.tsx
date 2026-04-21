"use client";

import { useMemo, useState } from "react";
import { addAttendance } from "@/lib/actions";
import { AttendanceTargetType } from "@/lib/types";
import styles from "@/app/(protected)/module.module.css";

type AttendanceCandidate = {
  userId: number;
  studentId: number | null;
  name: string;
  role: AttendanceTargetType;
};

type AttendanceEntryFormProps = {
  candidates: AttendanceCandidate[];
  defaultDate: string;
  allowedTargetTypes?: AttendanceTargetType[];
};

export function AttendanceEntryForm({
  candidates,
  defaultDate,
  allowedTargetTypes = ["STUDENT", "STAFF"],
}: AttendanceEntryFormProps) {
  const [targetType, setTargetType] = useState<AttendanceTargetType>(allowedTargetTypes[0] ?? "STUDENT");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const optionLabel = (candidate: AttendanceCandidate): string => `${candidate.name} (${candidate.role})`;

  const datalistId = `attendance-name-list-${targetType.toLowerCase()}`;

  const matchingCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.role === targetType),
    [candidates, targetType],
  );

  const filteredCandidates = useMemo(
    () =>
      matchingCandidates.filter((candidate) => {
        if (!nameQuery.trim()) {
          return true;
        }

        const normalizedQuery = nameQuery.trim().toLowerCase();
        return (
          candidate.name.toLowerCase().includes(normalizedQuery) ||
          optionLabel(candidate).toLowerCase().includes(normalizedQuery)
        );
      }),
    [matchingCandidates, nameQuery],
  );

  function handleTargetChange(nextTargetType: AttendanceTargetType) {
    setTargetType(nextTargetType);
    setNameQuery("");
    setSelectedUserId("");
    setSelectedStudentId("");
  }

  function resolveSelection(value: string) {
    const exactMatch = matchingCandidates.find((candidate) => optionLabel(candidate) === value);
    if (exactMatch) {
      setSelectedUserId(String(exactMatch.userId));
      setSelectedStudentId(exactMatch.studentId != null ? String(exactMatch.studentId) : "");
      return;
    }

    const byNameMatches = matchingCandidates.filter((candidate) =>
      candidate.name.toLowerCase() === value.trim().toLowerCase(),
    );

    if (byNameMatches.length === 1) {
      const chosen = byNameMatches[0];
      setSelectedUserId(String(chosen.userId));
      setSelectedStudentId(chosen.studentId != null ? String(chosen.studentId) : "");
      return;
    }

    setSelectedUserId("");
    setSelectedStudentId("");
  }

  return (
    <form action={addAttendance} className={styles.formGrid}>
      {allowedTargetTypes.length > 1 ? (
        <select
          className={styles.select}
          name="targetType"
          value={targetType}
          onChange={(event) => handleTargetChange(event.target.value as AttendanceTargetType)}
        >
          {allowedTargetTypes.includes("STUDENT") && <option value="STUDENT">Student</option>}
          {allowedTargetTypes.includes("STAFF") && <option value="STAFF">Staff</option>}
        </select>
      ) : (
        <>
          <input type="hidden" name="targetType" value={targetType} />
          <input className={styles.input} value={targetType === "STUDENT" ? "Student" : "Staff"} readOnly aria-label="Attendance target type" />
        </>
      )}

      <input
        className={styles.input}
        name="nameSearch"
        list={datalistId}
        value={nameQuery}
        onChange={(event) => {
          const nextValue = event.target.value;
          setNameQuery(nextValue);
          resolveSelection(nextValue);
        }}
        onBlur={(event) => resolveSelection(event.target.value)}
        placeholder={targetType === "STUDENT" ? "Type student name" : "Type staff name"}
        autoComplete="off"
        required
      />
      <datalist id={datalistId}>
        {filteredCandidates.map((candidate) => (
          <option key={`${candidate.role}-${candidate.userId}`} value={optionLabel(candidate)} />
        ))}
      </datalist>

      <input type="hidden" name="userId" value={selectedUserId} />
      <input type="hidden" name="studentId" value={targetType === "STUDENT" ? selectedStudentId : ""} />

      <input className={styles.input} name="date" type="date" required defaultValue={defaultDate} />
      <select className={styles.select} name="status">
        <option value="PRESENT">Present</option>
        <option value="ABSENT">Absent</option>
        <option value="LATE">Late</option>
      </select>
      <input className={styles.input} name="notes" placeholder="Notes" />
      <button className={styles.button} type="submit" disabled={!selectedUserId}>
        Save Attendance
      </button>
    </form>
  );
}
