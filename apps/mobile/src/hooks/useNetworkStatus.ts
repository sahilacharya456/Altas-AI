import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { AppState } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setStatus({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable ?? false,
            type: state.type ?? null,
          });
        }
      } catch {
        if (mounted) {
          setStatus({ isConnected: false, isInternetReachable: false, type: null });
        }
      }
    };

    void check();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void check();
    });

    const interval = setInterval(check, 15_000);

    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return status;
};
