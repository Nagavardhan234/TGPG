import React, { useState } from 'react';
import { View, StyleSheet, Platform, TextInput as RNTextInput, TextInputProps, Keyboard } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export interface ValidationInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  style?: any;
}

export const ValidationInput: React.FC<ValidationInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  icon,
  keyboardType = 'default',
  secureTextEntry,
  multiline,
  numberOfLines,
  style,
  right,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Determine the actual keyboard type based on platform and input type
  const actualKeyboardType = Platform.select({
    android: keyboardType === 'phone-pad' || keyboardType === 'number-pad' || keyboardType === 'numeric' 
      ? 'numeric' 
      : keyboardType,
    ios: keyboardType === 'phone-pad' || keyboardType === 'number-pad' || keyboardType === 'numeric'
      ? 'number-pad'
      : keyboardType,
    default: keyboardType,
  });

  const handleBlur = () => {
    setIsFocused(false);
    if (Platform.OS === 'ios' && !multiline) {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <RNTextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.onSurface,
              borderColor: error 
                ? theme.colors.error 
                : isFocused 
                  ? theme.colors.primary 
                  : theme.colors.outline,
            },
            multiline && styles.multilineInput,
            icon && { paddingLeft: 48 },
            right && { paddingRight: 48 },
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={actualKeyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          returnKeyType={multiline ? 'default' : 'done'}
          blurOnSubmit={!multiline}
          enablesReturnKeyAutomatically
          textContentType={keyboardType === 'phone-pad' ? 'telephoneNumber' : undefined}
          maxLength={keyboardType === 'phone-pad' ? 10 : undefined}
          caretHidden={false}
          autoComplete="off"
          editable={true}
          {...props}
        />
        {right && <View style={styles.rightContainer}>{right}</View>}
      </View>
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  multilineInput: {
    height: 'auto',
    minHeight: 48,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
}); 