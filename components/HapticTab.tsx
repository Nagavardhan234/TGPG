import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticTabProps {
  onPress?: () => void;
  children: React.ReactNode;
  active?: boolean;
}

export default function HapticTab({ onPress, children, active }: HapticTabProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {children}
    </Pressable>
  );
}
