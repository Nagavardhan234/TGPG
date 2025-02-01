import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { useNetworkStore } from '../stores/networkStore';

export const checkConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
};

export const initNetworkMonitoring = () => {
  const unsubscribe = NetInfo.addEventListener(state => {
    useNetworkStore.getState().setNetworkState({
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });
  });

  return unsubscribe;
};

export const getConnectionInfo = async (): Promise<NetInfoState> => {
  try {
    const state = await NetInfo.fetch();
    return state;
  } catch (error) {
    console.error('Network info error:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
      details: null,
    } as NetInfoState;
  }
};

export const subscribeToNetworkChanges = (
  onConnected: () => void,
  onDisconnected: () => void
): NetInfoSubscription => {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      onConnected();
    } else {
      onDisconnected();
    }
  });
}; 