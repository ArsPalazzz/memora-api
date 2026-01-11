import { cert } from 'firebase-admin/app';
import admin from 'firebase-admin';

const serviceAccountJSON = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
  'base64'
).toString('utf8');

const serviceAccount = JSON.parse(serviceAccountJSON);

admin.initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export { admin };
