import { create } from 'zustand';
import { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  type: NetInfoState['type'];
  isInternetReachable: boolean | null;
  setNetworkState: (state: Partial<NetworkState>) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  type: 'unknown',
  isInternetReachable: true,
  setNetworkState: (newState) => set((state) => ({ ...state, ...newState })),
})); 