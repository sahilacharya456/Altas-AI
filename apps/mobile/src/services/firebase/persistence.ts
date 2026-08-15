/**
 * Custom Firebase Auth Persistence using expo-secure-store.
 *
 * Firebase JS SDK v12 Auth exposes `initializeAuth` which accepts a `persistence`
 * option. The internal interface it expects (`ReactNativeAsyncStorage`-compatible)
 * requires `getItem`, `setItem`, and `removeItem`. We implement that shape here
 * so that auth sessions survive cold app restarts on native platforms.
 */

import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_KEY_PREFIX = 'firebase_auth_';

/**
 * SecureStore-backed async storage adapter compatible with Firebase Auth's
 * ReactNativeAsyncStorage interface (used by `initializeAuth`).
 */
export const secureStoreAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[SecureStorePersistence] Failed to set auth key:', key, error);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${SECURE_STORE_KEY_PREFIX}${key}`);
    } catch (error) {
      if (__DEV__) {
        console.warn('[SecureStorePersistence] Failed to remove auth key:', key, error);
      }
    }
  },
};
