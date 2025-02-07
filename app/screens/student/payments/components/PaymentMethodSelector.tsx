import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, Text, useTheme, IconButton } from 'react-native-paper';

type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'UPI',
    label: 'UPI',
    icon: 'qrcode',
    description: 'Pay using UPI apps'
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: 'bank',
    description: 'Direct bank transfer'
  },
  {
    id: 'CASH',
    label: 'Cash',
    icon: 'cash',
    description: 'Pay in cash'
  }
];

export const PaymentMethodSelector = ({
  selectedMethod,
  onSelectMethod
}: PaymentMethodSelectorProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {PAYMENT_METHODS.map((method) => (
        <Pressable
          key={method.id}
          onPress={() => onSelectMethod(method.id)}
        >
          <Surface
            style={[
              styles.methodCard,
              { 
                backgroundColor: colors.surface,
                borderColor: selectedMethod === method.id ? colors.primary : colors.surfaceVariant,
                borderWidth: selectedMethod === method.id ? 2 : 1,
              }
            ]}
          >
            <IconButton
              icon={method.icon}
              size={24}
              iconColor={selectedMethod === method.id ? colors.primary : colors.onSurfaceVariant}
              style={styles.methodIcon}
            />
            <View style={styles.methodInfo}>
              <Text 
                style={[
                  styles.methodLabel,
                  { color: selectedMethod === method.id ? colors.primary : colors.onSurface }
                ]}
              >
                {method.label}
              </Text>
              <Text style={[styles.methodDescription, { color: colors.onSurfaceVariant }]}>
                {method.description}
              </Text>
            </View>
          </Surface>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  methodIcon: {
    margin: 0,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  methodDescription: {
    fontSize: 12,
    marginTop: 2,
  },
}); 