import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBarBackground() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 49 + insets.bottom; // Standard iOS tab bar height

  return (
    <View style={{ 
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: tabBarHeight,
    }}>
      <BlurView intensity={80} style={{ flex: 1 }} />
    </View>
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
