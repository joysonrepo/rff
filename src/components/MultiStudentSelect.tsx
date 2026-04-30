"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StudentOption = {
  id: number;
  name: string;
};

type MultiStudentSelectProps = {
  students: StudentOption[];
  name?: string;
  placeholder?: string;
};

export function MultiStudentSelect({
  students,
  name = "studentIds",
  placeholder = "Select students",
}: MultiStudentSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedLabel = useMemo(() => {
    if (selectedIds.length === 0) {
      return placeholder;
    }

    const selectedNames = students
      .filter((student) => selectedIds.includes(student.id))
      .map((student) => student.name);

    if (selectedNames.length <= 2) {
      return selectedNames.join(", ");
    }

    return `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2} more`;
  }, [selectedIds, students, placeholder]);

  function toggleStudent(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) {
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: "10px",
          minHeight: "52px",
          padding: "0.6rem 0.7rem",
          background: "#ffffff",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
        }}
        aria-expanded={open}
      >
        {selectedLabel}
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: "220px",
            overflowY: "auto",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            padding: "0.4rem",
            zIndex: 20,
            boxShadow: "0 8px 28px rgba(17, 24, 39, 0.12)",
          }}
        >
          {students.map((student) => {
            const checked = selectedIds.includes(student.id);
            return (
              <label
                key={student.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.4rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggleStudent(student.id, event.target.checked)}
                />
                <span>{student.name}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
