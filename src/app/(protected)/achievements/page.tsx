import { AccessDenied } from "@/components/AccessDenied";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createActivityTask,
  requestTaskCompletion,
  reviewTaskAssignment,
} from "@/lib/actions";
import { TaskTableClient } from "@/components/achievements/TaskTableClient";
import styles from "../module.module.css";
import achieveStyles from "./achievements.module.css";

type AssignmentRow = {
  id: number;
  status: string;
  requestedAt: Date | null;
  reviewedAt: Date | null;
  starsAwarded: number | null;
  student: { id: number; name: string };
  task: { id: number; title: string; description: string | null; stars: number };
};

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  stars: number;
  createdAt: Date;
  assignments: {
    id: number;
    status: string;
    requestedAt: Date | null;
    reviewedAt: Date | null;
    starsAwarded: number | null;
    student: { id: number; name: string };
  }[];
};

type StudentOption = { id: number; name: string };

export default async function AchievementsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "achievements")) {
    return <AccessDenied moduleName="achievements" />;
  }

  const isTeacher =
    session.role === "TEACHER" ||
    session.role === "PRINCIPAL" ||
    session.role === "FOUNDER";
  const isStudent = session.role === "STUDENT";

  let tasks: TaskRow[] = [];
  let students: StudentOption[] = [];
  let myAssignments: AssignmentRow[] = [];
  let myStudent: { id: number; name: string } | null = null;
  let totalStars = 0;

  if (isTeacher) {
    tasks = (await prisma.activityTask.findMany({
      orderBy: { createdAt: "desc" },
      include: { assignments: { include: { student: true } } },
    })) as unknown as TaskRow[];

    students = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  if (isStudent) {
    myStudent = (await prisma.student.findFirst({
      where: { userId: Number(session.sub) },
    })) as { id: number; name: string } | null;

    if (myStudent) {
      myAssignments = (await prisma.taskAssignment.findMany({
        where: { studentId: myStudent.id },
        include: { task: true, student: true },
        orderBy: { createdAt: "desc" },
      })) as unknown as AssignmentRow[];

      totalStars = myAssignments
        .filter((a) => a.status === "APPROVED")
        .reduce((sum, a) => sum + (a.starsAwarded ?? 0), 0);
    }
  }

  const pendingReviews = isTeacher
    ? tasks.flatMap((t) =>
        t.assignments
          .filter((a) => a.status === "PENDING_REVIEW")
          .map((a) => ({ ...a, task: { id: t.id, title: t.title, description: t.description, stars: t.stars } })),
      )
    : [];

  function starDisplay(count: number) {
    return "⭐".repeat(Math.max(0, Math.min(count, 10)));
  }

  function compactStarDisplay(count: number) {
    return `⭐ ${Math.max(0, count)}`;
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      ASSIGNED: achieveStyles.badgeAssigned,
      PENDING_REVIEW: achieveStyles.badgePending,
      APPROVED: achieveStyles.badgeApproved,
      REJECTED: achieveStyles.badgeRejected,
    };
    const label: Record<string, string> = {
      ASSIGNED: "Assigned",
      PENDING_REVIEW: "Awaiting Review",
      APPROVED: "Approved ✓",
      REJECTED: "Rejected",
    };
    return <span className={`${achieveStyles.badge} ${map[status] ?? ""}`}>{label[status] ?? status}</span>;
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Activity Achievements</h1>

      {/* ── TEACHER VIEW ─────────────────────────────────────────────── */}
      {isTeacher && (
        <>
          {/* Pending review requests */}
          {pendingReviews.length > 0 && (
            <section className={`${styles.section} ${achieveStyles.pendingSection}`}>
              <h2 className={achieveStyles.sectionHeading}>
                🔔 Pending Review Requests ({pendingReviews.length})
              </h2>
              <div className={styles.tableScroll}>
                <table className={`${styles.table} ${styles.responsiveTable}`}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Task</th>
                      <th>Stars</th>
                      <th>Requested</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReviews.map((a) => (
                      <tr key={a.id}>
                        <td>{a.student.name}</td>
                        <td>{a.task.title}</td>
                        <td>{starDisplay(a.task.stars)} ({a.task.stars})</td>
                        <td>
                          {a.requestedAt
                            ? new Date(a.requestedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <div className={styles.actionRow}>
                            <form action={reviewTaskAssignment}>
                              <input type="hidden" name="assignmentId" value={a.id} />
                              <input type="hidden" name="action" value="APPROVED" />
                              <button
                                className={achieveStyles.approveBtn}
                                type="submit"
                                title="Approve"
                              >
                                ✓ Approve
                              </button>
                            </form>
                            <form action={reviewTaskAssignment}>
                              <input type="hidden" name="assignmentId" value={a.id} />
                              <input type="hidden" name="action" value="REJECTED" />
                              <button
                                className={achieveStyles.rejectBtn}
                                type="submit"
                                title="Reject"
                              >
                                ✗ Reject
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Create task form */}
          <section className={styles.section}>
            <details className={styles.collapsible}>
              <summary className={styles.collapsibleSummary}>
                <h2 className={styles.collapsibleTitle}>Create New Task</h2>
              </summary>
              <div className={styles.collapsibleBody}>
                <form className={achieveStyles.taskForm} action={createActivityTask}>
                  <div className={achieveStyles.formRow}>
                    <label className={achieveStyles.label}>Task Title *</label>
                    <input
                      className={styles.input}
                      name="title"
                      placeholder="e.g. Complete chapter 3 exercises"
                      required
                    />
                  </div>
                  <div className={achieveStyles.formRow}>
                    <label className={achieveStyles.label}>Description</label>
                    <textarea
                      className={`${styles.textarea} ${achieveStyles.textarea}`}
                      name="description"
                      placeholder="Describe what the student needs to do..."
                      rows={3}
                    />
                  </div>
                  <div className={achieveStyles.formRow}>
                    <label className={achieveStyles.label}>Stars to Award (1–10) *</label>
                    <input
                      className={styles.input}
                      name="stars"
                      type="number"
                      min={1}
                      max={10}
                      defaultValue={1}
                      required
                    />
                  </div>
                  <div className={achieveStyles.formRow}>
                    <label className={achieveStyles.label}>Assign to Students *</label>
                    <select
                      className={`${styles.select} ${achieveStyles.multiSelect}`}
                      name="studentIds"
                      multiple
                      required
                      size={Math.min(students.length, 8)}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className={achieveStyles.hint}>Hold Ctrl/Cmd to select multiple students</p>
                  </div>
                  <button className={styles.button} type="submit">
                    🎯 Create &amp; Assign Task
                  </button>
                </form>
              </div>
            </details>
          </section>

          {/* All tasks */}
          <section className={styles.section}>
            <h2 className={achieveStyles.sectionHeading}>All Tasks</h2>
            {tasks.length === 0 ? (
              <p className={styles.subtitle}>No tasks created yet.</p>
            ) : (
              <TaskTableClient tasks={tasks} students={students} />
            )}
          </section>

          {/* Student progress */}
          <section className={styles.section}>
            <details className={styles.collapsible}>
              <summary className={styles.collapsibleSummary}>
                <h2 className={styles.collapsibleTitle}>Student Star Leaderboard</h2>
              </summary>
              <div className={styles.collapsibleBody}>
                <StudentLeaderboard tasks={tasks} />
              </div>
            </details>
          </section>
        </>
      )}

      {/* ── STUDENT VIEW ─────────────────────────────────────────────── */}
      {isStudent && (
        <>
          {/* Star summary */}
          <div className={achieveStyles.starSummary}>
            <div className={achieveStyles.starCount}>{totalStars}</div>
            <div className={achieveStyles.starLabel}>Total Stars Earned</div>
            <div className={achieveStyles.starEmoji}>{compactStarDisplay(totalStars)}</div>
          </div>

          {/* Badges */}
          <div className={achieveStyles.badgesRow}>
            {totalStars >= 1 && <div className={achieveStyles.badgeChip}>🌟 Star Starter</div>}
            {totalStars >= 5 && <div className={achieveStyles.badgeChip}>🏅 Rising Star</div>}
            {totalStars >= 10 && <div className={achieveStyles.badgeChip}>🥇 Gold Achiever</div>}
            {totalStars >= 20 && <div className={achieveStyles.badgeChip}>🏆 Champion</div>}
            {totalStars >= 50 && <div className={achieveStyles.badgeChip}>💎 Legend</div>}
            {totalStars === 0 && (
              <div className={achieveStyles.badgeChipGray}>Complete tasks to earn badges!</div>
            )}
          </div>

          {/* My tasks */}
          <section className={styles.section}>
            <h2 className={achieveStyles.sectionHeading}>My Tasks</h2>
            {myAssignments.length === 0 ? (
              <p className={styles.subtitle}>No tasks assigned yet. Check back soon!</p>
            ) : (
              <div className={styles.tableScroll}>
                <table className={`${styles.table} ${styles.responsiveTable}`}>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Stars</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAssignments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.task.title}</strong>
                          {a.task.description && (
                            <div className={achieveStyles.taskDesc}>{a.task.description}</div>
                          )}
                        </td>
                        <td>
                          {a.status === "APPROVED"
                            ? `${starDisplay(a.starsAwarded ?? 0)} (${a.starsAwarded})`
                            : `${starDisplay(a.task.stars)} (${a.task.stars})`}
                        </td>
                        <td>{statusBadge(a.status)}</td>
                        <td>
                          {a.status === "ASSIGNED" && (
                            <form action={requestTaskCompletion}>
                              <input type="hidden" name="assignmentId" value={a.id} />
                              <button className={achieveStyles.requestBtn} type="submit">
                                ✋ Mark as Done
                              </button>
                            </form>
                          )}
                          {a.status === "PENDING_REVIEW" && (
                            <span className={achieveStyles.waitingText}>Waiting for teacher...</span>
                          )}
                          {a.status === "APPROVED" && (
                            <span className={achieveStyles.approvedText}>Stars awarded!</span>
                          )}
                          {a.status === "REJECTED" && (
                            <span className={achieveStyles.rejectedText}>Keep trying!</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StudentLeaderboard({ tasks }: { tasks: TaskRow[] }) {
  const studentMap = new Map<number, { name: string; stars: number; completed: number }>();

  for (const task of tasks) {
    for (const a of task.assignments) {
      if (!studentMap.has(a.student.id)) {
        studentMap.set(a.student.id, { name: a.student.name, stars: 0, completed: 0 });
      }
      const entry = studentMap.get(a.student.id)!;
      if (a.status === "APPROVED") {
        entry.stars += a.starsAwarded ?? 0;
        entry.completed += 1;
      }
    }
  }

  const sorted = [...studentMap.entries()]
    .map(([id, student]) => ({ id, ...student }))
    .sort((a, b) => b.stars - a.stars);

  if (sorted.length === 0) {
    return <p style={{ color: "#5b6372" }}>No student data yet.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {sorted.map((s, i) => (
        <div
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.6rem 0.9rem",
            borderRadius: "10px",
            background: i === 0 ? "#fffbe6" : i === 1 ? "#f5f5f5" : "#fafafa",
            border: i === 0 ? "1px solid #f5c518" : "1px solid #efe8de",
          }}
        >
          <span style={{ fontWeight: 700, color: "#888", minWidth: "1.5rem" }}>#{i + 1}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
          <span style={{ color: "#5b6372", fontSize: "0.9rem" }}>{s.completed} task{s.completed !== 1 ? "s" : ""}</span>
          <span style={{ fontWeight: 700, color: "#7a5000" }}>⭐ {s.stars}</span>
        </div>
      ))}
    </div>
  );
}
