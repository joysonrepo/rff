import Link from "next/link";
import styles from "@/app/(protected)/module.module.css";
import { Staff } from "@/lib/types";
import { deactivateStaff } from "@/lib/actions";
import { StaffProfileDialog } from "./StaffProfileDialog";

type StaffListRow = Staff & {
  accountRole?: string;
  isProfileManaged?: boolean;
};

type StaffListTableProps = {
  staff: StaffListRow[];
  showViewAction?: boolean;
  showManageActions?: boolean;
};

export function StaffListTable({ staff, showViewAction = true, showManageActions = false }: StaffListTableProps) {
  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table} style={{ minWidth: "840px" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Contact</th>
              <th>Email</th>
              {(showViewAction || showManageActions) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {staff.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>{employee.salary != null ? `₹${employee.salary}` : "-"}</td>
                <td>{employee.contactNumber ?? "-"}</td>
                <td>{employee.email ?? "-"}</td>
                {(showViewAction || showManageActions) && (
                  <td>
                    <div className={styles.actionRow}>
                      {showViewAction && (
                        <StaffProfileDialog staff={employee} />
                      )}
                      {showManageActions && employee.isProfileManaged !== false && (
                        <>
                          <Link href={`/staff-list/edit/${employee.id}`} className={styles.iconAction} aria-label="Edit staff" title="Edit staff">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z" fill="currentColor"/>
                            </svg>
                          </Link>
                          <form action={deactivateStaff}>
                            <input type="hidden" name="staffId" value={employee.id} />
                            <input type="hidden" name="accountUserId" value={employee.userId ?? ""} />
                            <button type="submit" className={styles.iconActionDanger} aria-label="Delete staff" title="Set staff inactive">
                              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z" fill="currentColor"/>
                              </svg>
                            </button>
                          </form>
                        </>
                      )}
                      {showManageActions && employee.isProfileManaged === false && (
                        <>
                        <Link href={`/staff-list/edit/${employee.id}`} className={styles.iconAction} aria-label="Edit staff" title="Edit staff">
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z" fill="currentColor"/>
                          </svg>
                        </Link>
                        <form action={deactivateStaff}>
                          <input type="hidden" name="staffId" value={employee.id} />
                          <input type="hidden" name="accountUserId" value={employee.userId ?? ""} />
                          <button type="submit" className={styles.iconActionDanger} aria-label="Delete staff" title="Remove staff account">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z" fill="currentColor"/>
                            </svg>
                          </button>
                        </form>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}
