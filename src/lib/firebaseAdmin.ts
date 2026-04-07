import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);

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