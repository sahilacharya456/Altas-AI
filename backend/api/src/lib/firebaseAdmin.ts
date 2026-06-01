import admin from 'firebase-admin';
import { env } from '../config/env';

const normalizePrivateKey = (key?: string): string | undefined =>
  key?.replace(/\\n/g, '\n');

interface ServiceAccountEnv {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
}

const getCredential = () => {
  if (env.firebaseServiceAccountJson) {
    const parsed = JSON.parse(env.firebaseServiceAccountJson) as ServiceAccountEnv;
    return admin.credential.cert({
      projectId: parsed.project_id ?? parsed.projectId,
      clientEmail: parsed.client_email ?? parsed.clientEmail,
      privateKey: normalizePrivateKey(parsed.private_key ?? parsed.privateKey),
    });
  }

  return admin.credential.applicationDefault();
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
    projectId: env.firebaseProjectId,
  });
}

export const auth = admin.auth();
export const appCheck = admin.appCheck();
export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
