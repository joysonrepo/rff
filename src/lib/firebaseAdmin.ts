import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(value?: string): string | undefined {
  if (!value) return undefined;
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
}

type ServiceAccountLike = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function parseServiceAccountFromEnv(): ServiceAccountLike | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as ServiceAccountLike;
  } catch {
    return null;
  }
}

const fromJson = parseServiceAccountFromEnv();
const projectId = process.env.FIREBASE_PROJECT_ID ?? fromJson?.project_id;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? fromJson?.client_email;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? fromJson?.private_key);

const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);

if (!hasServiceAccount && process.env.NODE_ENV === "production") {
  throw new Error(
    "Firebase Admin credentials are missing or malformed. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel.",
  );
}

const app =
  getApps()[0] ??
  initializeApp(
    hasServiceAccount
      ? {
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        }
      : {},
  );

export const db = getFirestore(app);