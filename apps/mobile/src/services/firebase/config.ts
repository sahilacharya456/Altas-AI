/**
 * Firebase configuration for AltasAI.
 *
 * Uses EXPO_PUBLIC_* environment variables so config stays platform-agnostic.
 * On native, auth is persisted via expo-secure-store (see persistence.ts).
 * On web, standard browserLocalPersistence is used.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  initializeAuth,
  browserLocalPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { secureStoreAsyncStorage } from './persistence';

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const hasFirebaseEnv = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = hasFirebaseEnv
  ? {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }
  : {
      apiKey: 'demo-local-only-api-key',
      authDomain: 'demo-altasai.firebaseapp.com',
      projectId: 'demo-altasai',
      storageBucket: 'demo-altasai.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
    };

export const isFirebaseConfigured = hasFirebaseEnv;
export const firebaseConfigWarning = hasFirebaseEnv
  ? null
  : '[Firebase] Missing env vars. Running local UI demo mode. Add apps/mobile/.env to enable auth & Firestore.';

if (firebaseConfigWarning && __DEV__) {
  console.warn(firebaseConfigWarning);
}

// ---------------------------------------------------------------------------
// App singleton
// ---------------------------------------------------------------------------

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ---------------------------------------------------------------------------
// Auth — secure persistence on native, browser persistence on web
// ---------------------------------------------------------------------------

let auth: Auth;
try {
  /**
   * On native we pass our SecureStore-backed async storage as the persistence
   * adapter. Firebase Auth web SDK accepts any object with getItem/setItem/
   * removeItem (the AsyncStorage interface) when passed via the persistence
   * option on React Native builds.
   *
   * Note: we cast to unknown first because the web SDK's Persistence type
   * doesn't expose the internal storage-adapter overload in its public types,
   * but the runtime supports it on React Native targets.
   */
  const persistence =
    Platform.OS === 'web'
      ? browserLocalPersistence
      : Platform.OS === 'android' || Platform.OS === 'ios'
      ? (secureStoreAsyncStorage as unknown as import('firebase/auth').Persistence)
      : inMemoryPersistence;

  auth = initializeAuth(app, { persistence });
} catch {
  // Already initialised (hot reload)
  auth = getAuth(app);
}

// ---------------------------------------------------------------------------
// Firestore — persistent multi-tab cache on web, memory cache on native
// ---------------------------------------------------------------------------

let db: Firestore;
try {
  db = initializeFirestore(
    app,
    Platform.OS === 'web'
      ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
      : { localCache: memoryLocalCache() }
  );
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
