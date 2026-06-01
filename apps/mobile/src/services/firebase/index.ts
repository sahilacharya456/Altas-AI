/**
 * Firebase Services - Central Export
 */

// Firebase configuration
export { app, auth, db, isFirebaseConfigured, firebaseConfigWarning } from './config';

// Authentication
export {
    signUp,
    signIn,
    signOut,
    resetPassword,
    getCurrentUser,
    onAuthChange,
    getIdToken,
    type AuthUser,
} from './auth';

// Firestore operations
export {
    getDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    addDocument,
    subscribeToDocument,
    subscribeToCollection,
    batchWrite,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
} from './firestore';
