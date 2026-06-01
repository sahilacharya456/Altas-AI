/**
 * Firestore Service Layer
 * Generic operations for all collections with type safety
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    type DocumentData,
    type QueryConstraint,
    Timestamp,
    serverTimestamp,
    writeBatch,
    increment,
    type DocumentReference,
    type CollectionReference,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { auth } from './config';

// Helper to get current user ID
const getUserId = (): string => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.uid;
};

// Helper to get user document reference
const getUserDocRef = (path: string): DocumentReference => {
    const uid = getUserId();
    return doc(db, 'users', uid, ...path.split('/'));
};

// Helper to get user collection reference
const getUserCollectionRef = (path: string): CollectionReference => {
    const uid = getUserId();
    return collection(db, 'users', uid, path);
};

/**
 * Get a single document from user's subcollection
 */
export const getDocument = async <T extends DocumentData>(
    path: string
): Promise<T | null> => {
    const docRef = getUserDocRef(path);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
        id: snapshot.id,
        ...snapshot.data(),
    } as unknown as T;
};

/**
 * Set (create/overwrite) a document in user's subcollection
 */
export const setDocument = async <T extends DocumentData>(
    path: string,
    data: Omit<T, 'id'>,
    merge = false
): Promise<void> => {
    const docRef = getUserDocRef(path);
    await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge });
};

/**
 * Update fields in an existing document
 */
export const updateDocument = async (
    path: string,
    data: Partial<DocumentData>
): Promise<void> => {
    const docRef = getUserDocRef(path);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

/**
 * Delete a document
 */
export const deleteDocument = async (path: string): Promise<void> => {
    const docRef = getUserDocRef(path);
    await deleteDoc(docRef);
};

/**
 * Query a collection with constraints
 */
export const queryCollection = async <T extends DocumentData>(
    collectionPath: string,
    constraints: QueryConstraint[] = []
): Promise<T[]> => {
    const collectionRef = getUserCollectionRef(collectionPath);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as unknown as T[];
};

/**
 * Add a document to a collection (auto-generate ID)
 */
export const addDocument = async <T extends DocumentData>(
    collectionPath: string,
    data: Omit<T, 'id'>
): Promise<string> => {
    const uid = getUserId();
    const collectionRef = getUserCollectionRef(collectionPath);
    const docRef = doc(collectionRef);

    await setDoc(docRef, {
        ...data,
        userId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
};

/**
 * Subscribe to a document for real-time updates
 */
export const subscribeToDocument = <T extends DocumentData>(
    path: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    const docRef = getUserDocRef(path);

    return onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        callback({
            id: snapshot.id,
            ...snapshot.data(),
        } as unknown as T);
    }, (error) => {
        if (__DEV__) console.error(`[Firestore] Subscription error for ${path}:`, error);
        onError?.(error);
    });
};

/**
 * Subscribe to a collection for real-time updates
 */
export const subscribeToCollection = <T extends DocumentData>(
    collectionPath: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = [],
    onError?: (error: Error) => void
): Unsubscribe => {
    const collectionRef = getUserCollectionRef(collectionPath);
    const q = query(collectionRef, ...constraints);

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as unknown as T[];

        callback(data);
    }, (error) => {
        if (__DEV__) console.error(`[Firestore] Collection subscription error for ${collectionPath}:`, error);
        onError?.(error);
    });
};

/**
 * Batch write multiple documents
 */
export const batchWrite = async (
    operations: Array<{
        type: 'set' | 'update' | 'delete';
        path: string;
        data?: DocumentData;
    }>
): Promise<void> => {
    const batch = writeBatch(db);

    for (const op of operations) {
        const docRef = getUserDocRef(op.path);

        switch (op.type) {
            case 'set':
                batch.set(docRef, {
                    ...op.data,
                    updatedAt: serverTimestamp(),
                });
                break;
            case 'update':
                batch.update(docRef, {
                    ...op.data,
                    updatedAt: serverTimestamp(),
                });
                break;
            case 'delete':
                batch.delete(docRef);
                break;
        }
    }

    await batch.commit();
};


// Export Firestore utilities for custom queries
export {
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    increment,
    type Unsubscribe,
    type DocumentData,
    type QueryConstraint,
};
