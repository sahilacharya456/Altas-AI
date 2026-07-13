/**
 * Firebase configuration for AltasAI.
 *
 * Values are loaded from EXPO_PUBLIC_* variables so the same app can run on
 * native and web without committing environment-specific config.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import {
    initializeFirestore,
    getFirestore,
    Firestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    memoryLocalCache,
} from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration validated from environment.
const hasFirebaseEnv = Boolean(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = hasFirebaseEnv ? {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} : {
    apiKey: 'demo-local-only-api-key',
    authDomain: 'demo-altasai.firebaseapp.com',
    projectId: 'demo-altasai',
    storageBucket: 'demo-altasai.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000',
};

// Validate required config at startup
export const isFirebaseConfigured = hasFirebaseEnv;
export const firebaseConfigWarning = hasFirebaseEnv
    ? null
    : '[Firebase] Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID. Running local UI demo mode. Auth and Firestore writes require apps/mobile/.env.';

if (firebaseConfigWarning && __DEV__) {
    console.warn(firebaseConfigWarning);
}

// Initialize Firebase (singleton pattern)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
    auth = initializeAuth(app, {
        persistence: Platform.OS === 'web' ? browserLocalPersistence : inMemoryPersistence,
    });
} catch {
    // Auth already initialized (hot reload)
    auth = getAuth(app);
}

let db: Firestore;
try {
    if (Platform.OS === 'web') {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } else {
        db = initializeFirestore(app, {
            localCache: memoryLocalCache(),
        });
    }
} catch {
    // Firestore already initialized (hot reload)
    db = getFirestore(app);
}

export { app, auth, db };
export default app;
