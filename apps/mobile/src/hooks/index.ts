// Shared hooks live here as the app moves repeated screen logic out of routes.
// Keep feature-specific hooks inside src/features/<feature> when ownership is clear.
export { useNetworkStatus } from './useNetworkStatus';
export type { NetworkStatus } from './useNetworkStatus';

