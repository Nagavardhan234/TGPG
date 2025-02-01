import { AccessibilityInfo, Platform } from 'react-native';

export const AccessibilityUtils = {
  // Check if screen reader is enabled
  isScreenReaderEnabled: async () => {
    return await AccessibilityInfo.isScreenReaderEnabled();
  },

  // Generate accessibility label
  generateA11yLabel: (
    label: string,
    role?: string,
    state?: { [key: string]: any }
  ): string => {
    let a11yLabel = label;

    if (role) {
      a11yLabel += `, ${role}`;
    }

    if (state) {
      Object.entries(state).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          if (value) {
            a11yLabel += `, ${key}`;
          }
        } else {
          a11yLabel += `, ${key} ${value}`;
        }
      });
    }

    return a11yLabel;
  },

  // Common accessibility props
  getAccessibilityProps: (
    label: string,
    role?: string,
    state?: { [key: string]: any }
  ) => ({
    accessible: true,
    accessibilityLabel: AccessibilityUtils.generateA11yLabel(label, role, state),
    ...(Platform.OS === 'ios' ? {
      accessibilityRole: role,
      accessibilityState: state,
    } : {
      accessibilityRole: role,
      accessibilityState: state,
    }),
  }),

  // Button accessibility props
  getButtonA11yProps: (
    label: string,
    disabled?: boolean,
    selected?: boolean
  ) => ({
    ...AccessibilityUtils.getAccessibilityProps(
      label,
      'button',
      {
        disabled,
        selected,
      }
    ),
    accessibilityHint: `Double tap to ${disabled ? 'not available' : 'activate'}`,
  }),

  // Input accessibility props
  getInputA11yProps: (
    label: string,
    error?: string,
    required?: boolean
  ) => ({
    ...AccessibilityUtils.getAccessibilityProps(
      label,
      'textbox',
      {
        required,
        invalid: !!error,
      }
    ),
    accessibilityHint: error ? `Error: ${error}` : undefined,
  }),

  // List item accessibility props
  getListItemA11yProps: (
    label: string,
    selected?: boolean,
    expanded?: boolean
  ) => ({
    ...AccessibilityUtils.getAccessibilityProps(
      label,
      'menuitem',
      {
        selected,
        expanded,
      }
    ),
  }),

  // Modal accessibility props
  getModalA11yProps: (label: string) => ({
    ...AccessibilityUtils.getAccessibilityProps(label, 'dialog'),
    accessibilityViewIsModal: true,
  }),

  // Tab accessibility props
  getTabA11yProps: (
    label: string,
    selected: boolean
  ) => ({
    ...AccessibilityUtils.getAccessibilityProps(
      label,
      'tab',
      { selected }
    ),
  }),

  // Image accessibility props
  getImageA11yProps: (
    description: string,
    isDecorative?: boolean
  ) => ({
    accessible: !isDecorative,
    ...(isDecorative ? {
      accessibilityRole: 'none',
    } : AccessibilityUtils.getAccessibilityProps(description, 'image')),
  }),

  // Helper for handling focus
  focusOnElement: (ref: any) => {
    if (ref?.current) {
      AccessibilityInfo.isScreenReaderEnabled().then(isEnabled => {
        if (isEnabled) {
          ref.current.focus();
        }
      });
    }
  },

  // Announce screen reader message
  announce: (message: string, queueMode: 'interrupt' | 'queue' = 'interrupt') => {
    AccessibilityInfo.announceForAccessibility(message);
  },
}; 