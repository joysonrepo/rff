"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteActivityTask, updateActivityTask } from "@/lib/actions";
import styles from "@/app/(protected)/module.module.css";
import achieveStyles from "@/app/(protected)/achievements/achievements.module.css";

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  stars: number;
  createdAt: string | Date;
  assignments: {
    id: number;
    status: string;
    student: { id: number; name: string };
  }[];
};

type StudentOption = { id: number; name: string };

type TaskTableClientProps = {
  tasks: TaskRow[];
  students: StudentOption[];
};

function starDisplay(count: number) {
  return "⭐".repeat(Math.max(0, Math.min(count, 10)));
}

export function TaskTableClient({ tasks, students }: TaskTableClientProps) {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [tasks, editingTaskId],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (editingTask && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!editingTask && dialog.open) {
      dialog.close();
    }
  }, [editingTask]);

  return (
    <>
      <div className={styles.tableScroll}>
        <table className={`${styles.table} ${styles.responsiveTable}`}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Stars</th>
              <th>Assigned</th>
              <th>Approved</th>
              <th>Pending</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const approved = task.assignments.filter((assignment) => assignment.status === "APPROVED").length;
              const pending = task.assignments.filter((assignment) => assignment.status === "PENDING_REVIEW").length;

              return (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                    {task.description && <div className={achieveStyles.taskDesc}>{task.description}</div>}
                  </td>
                  <td>{starDisplay(task.stars)} ({task.stars})</td>
                  <td>{task.assignments.length}</td>
                  <td>{approved}</td>
                  <td>{pending > 0 ? <span className={achieveStyles.pendingCount}>{pending}</span> : 0}</td>
                  <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={achieveStyles.taskActions}>
                      <button className={achieveStyles.editLink} type="button" onClick={() => setEditingTaskId(task.id)}>
                        Edit
                      </button>
                      <form action={deleteActivityTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button className={styles.iconActionDanger} type="submit" title="Delete task">
                          🗑
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        className={achieveStyles.editDialog}
        onClose={() => setEditingTaskId(null)}
      >
        {editingTask && (
          <div className={achieveStyles.editDialogBody}>
            <div className={achieveStyles.editDialogHeader}>
              <h3 className={achieveStyles.editDialogTitle}>Edit Task</h3>
              <button
                type="button"
                className={achieveStyles.dialogClose}
                aria-label="Close edit dialog"
                onClick={() => setEditingTaskId(null)}
              >
                ✕
              </button>
            </div>

            <form className={achieveStyles.editTaskForm} action={updateActivityTask}>
              <input type="hidden" name="taskId" value={editingTask.id} />

              <label className={achieveStyles.label}>Task Title *</label>
              <input className={styles.input} name="title" defaultValue={editingTask.title} required />

              <label className={achieveStyles.label}>Description</label>
              <textarea
                className={`${styles.textarea} ${achieveStyles.textarea}`}
                name="description"
                defaultValue={editingTask.description ?? ""}
                rows={3}
              />

              <label className={achieveStyles.label}>Stars (1-10) *</label>
              <input
                className={styles.input}
                name="stars"
                type="number"
                min={1}
                max={10}
                defaultValue={editingTask.stars}
                required
              />

              <label className={achieveStyles.label}>Assigned Students *</label>
              <select
                className={`${styles.select} ${achieveStyles.multiSelect}`}
                name="studentIds"
                multiple
                required
                size={Math.min(students.length, 8)}
                defaultValue={editingTask.assignments.map((assignment) => String(assignment.student.id))}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
              <p className={achieveStyles.hint}>Hold Ctrl/Cmd to select multiple students</p>

              <div className={achieveStyles.dialogActionRow}>
                <button type="button" className={achieveStyles.dialogCancel} onClick={() => setEditingTaskId(null)}>
                  Cancel
                </button>
                <button className={styles.button} type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </>
  );
}
