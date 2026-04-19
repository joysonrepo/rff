import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

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

function getServiceAccount() {
  const fromJson = parseServiceAccountFromEnv();
  const projectId = process.env.FIREBASE_PROJECT_ID ?? fromJson?.project_id;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? fromJson?.client_email;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? fromJson?.private_key);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing or malformed. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel.",
    );
  }

  return { projectId, clientEmail, privateKey };
}

export function hasFirebaseAdminConfig(): boolean {
  const fromJson = parseServiceAccountFromEnv();
  const projectId = process.env.FIREBASE_PROJECT_ID ?? fromJson?.project_id;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? fromJson?.client_email;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? fromJson?.private_key);
  return Boolean(projectId && clientEmail && privateKey);
}

declare global {
  // eslint-disable-next-line no-var
  var __firestoreInstance: Firestore | undefined;
}

export function getDb(): Firestore {
  if (globalThis.__firestoreInstance) {
    return globalThis.__firestoreInstance;
  }

  const { projectId, clientEmail, privateKey } = getServiceAccount();
  const isNew = getApps().length === 0;
  const app = isNew
    ? initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    : getApps()[0];

  const db = getFirestore(app);
  if (isNew) {
    db.settings({ ignoreUndefinedProperties: true });
  }
  globalThis.__firestoreInstance = db;
  return db;
}