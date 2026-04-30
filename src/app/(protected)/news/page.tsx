import Link from "next/link";
import { AccessDenied } from "@/components/AccessDenied";
import { saveNewsPost } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "./news.module.css";

type NewsSearchParams = {
  tab?: string;
  edit?: string;
};

type NewsPageProps = {
  searchParams: Promise<NewsSearchParams>;
};

type NewsRow = {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageFile?: string | null;
  createdAt: string | Date;
  createdBy?: {
    name: string;
    role?: string;
  } | null;
};

function toDateLabel(value: string | Date): string {
  return new Date(value).toLocaleDateString();
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const session = await requireSession();
  if (!canAccess(session.role, "news")) {
    return <AccessDenied moduleName="news" />;
  }

  const params = await searchParams;
  const canManage = session.role !== "STUDENT" && session.role !== "PARENT";
  const activeTab = canManage && params.tab === "manage" ? "manage" : "view";
  const editId = Number(params.edit ?? 0);

  const newsRows = (await prisma.news.findMany({
    include: { createdBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  })) as NewsRow[];

  const editRow = canManage && editId ? newsRows.find((row) => row.id === editId) ?? null : null;

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>Newslet</h2>
        <p className={styles.heroSub}>Share highlights, updates, and announcements with your whole school community.</p>
      </section>

      {canManage && (
        <div className={styles.tabRow}>
          <Link href="/news?tab=manage" className={activeTab === "manage" ? styles.tabActive : styles.tab}>
            Add / Edit Post
          </Link>
          <Link href="/news?tab=view" className={activeTab === "view" ? styles.tabActive : styles.tab}>
            View All Posts
          </Link>
        </div>
      )}

      {canManage && activeTab === "manage" && (
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>{editRow ? "Edit News Post" : "Create News Post"}</h3>
          <form action={saveNewsPost} className={styles.formGrid}>
            <input type="hidden" name="newsId" value={editRow?.id ?? ""} />

            <div className={`${styles.field} ${styles.third}`}>
              <label className={styles.label} htmlFor="title">
                Title <span className={styles.required}>*</span>
              </label>
              <input id="title" className={styles.input} name="title" defaultValue={editRow?.title ?? ""} required />
            </div>

            <div className={`${styles.field} ${styles.third}`}>
              <label className={styles.label} htmlFor="summary">
                Summary <span className={styles.required}>*</span>
              </label>
              <input id="summary" className={styles.input} name="summary" defaultValue={editRow?.summary ?? ""} required />
            </div>

            <div className={`${styles.field} ${styles.third}`}>
              <label className={styles.label} htmlFor="imageFile">Image</label>
              <input id="imageFile" className={styles.file} name="imageFile" type="file" accept="image/*" />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.label} htmlFor="content">
                Details <span className={styles.required}>*</span>
              </label>
              <textarea id="content" className={styles.textarea} name="content" defaultValue={editRow?.content ?? ""} required />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <div className={styles.actionRow}>
                <button type="submit" className={styles.saveBtn}>
                  {editRow ? "Update Post" : "Publish Post"}
                </button>
                <button type="reset" className={styles.clearBtn}>
                  Reset
                </button>
                {editRow && (
                  <Link href="/news?tab=manage" className={styles.cancelBtn}>
                    Cancel Edit
                  </Link>
                )}
              </div>
            </div>
          </form>

          {newsRows.length > 0 && (
            <div className={styles.manageList}>
              {newsRows.map((item) => (
                <article key={item.id} className={styles.manageItem}>
                  <div>
                    <h4 className={styles.cardTitle}>{item.title}</h4>
                    <p className={styles.manageMeta}>Last updated on {toDateLabel(item.createdAt)}</p>
                  </div>
                  <Link href={`/news?tab=manage&edit=${item.id}`} className={styles.editBtn}>
                    Edit
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "view" && (
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>All Published Posts</h3>
          {newsRows.length === 0 ? (
            <div className={styles.empty}>No news posts yet. Check back soon.</div>
          ) : (
            <div className={styles.newsGrid}>
              {newsRows.map((item) => (
                <article key={item.id} className={styles.card}>
                  {item.imageFile ? (
                    <img className={styles.cardImage} src={item.imageFile} alt={item.title} />
                  ) : (
                    <div className={styles.cardImage} />
                  )}
                  <div className={styles.cardBody}>
                    <h4 className={styles.cardTitle}>{item.title}</h4>
                    <p className={styles.cardSummary}>{item.summary}</p>
                    <p className={styles.cardContent}>{item.content}</p>
                    <p className={styles.cardMeta}>
                      Posted by {item.createdBy?.name ?? "Unknown"} on {toDateLabel(item.createdAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
