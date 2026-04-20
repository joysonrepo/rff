import { redirect } from "next/navigation";
import { getSession, loginUser } from "@/lib/auth";
import styles from "./page.module.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";

    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const result = await loginUser(identifier, password);
    if (!result.ok) {
      redirect("/login?error=1");
    }

    redirect("/dashboard");
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} action={loginAction}>
        <h1>ROL&apos;s Fun Factory</h1>
        <p>Login to access your role dashboard.</p>
        {params.error ? <p className={styles.error}>Invalid username or password.</p> : null}
        <input className={styles.input} type="text" name="identifier" placeholder="Username or email" required />
        <input className={styles.input} type="password" name="password" placeholder="Password" required />
        <button className={styles.button} type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
