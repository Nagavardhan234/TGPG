import React from 'react';
import { View, AccessibilityInfo, AccessibilityProps, StyleProp, ViewStyle } from 'react-native';

interface AccessibilityWrapperProps extends AccessibilityProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityRole?: AccessibilityProps['accessibilityRole'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
  accessibilityActions?: Array<{ name: string; label?: string }>;
}

const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  style,
  importantForAccessibility = 'auto',
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  onAccessibilityAction,
  accessibilityActions,
  ...props
}) => {
  const announceAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  return (
    <View
      style={style}
      importantForAccessibility={importantForAccessibility}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onAccessibilityAction={onAccessibilityAction}
      accessibilityActions={accessibilityActions}
      {...props}
    >
      {children}
    </View>
  );
};

export const withAccessibility = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  accessibilityConfig: Partial<AccessibilityWrapperProps>
) => {
  return (props: P) => (
    <AccessibilityWrapper {...accessibilityConfig}>
      <WrappedComponent {...props} />
    </AccessibilityWrapper>
  );
};

export default AccessibilityWrapper; 