import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface StatsCardProps {
  title: string;
  amount: number;
  icon: string;
  gradient: string[];
  style?: object;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  amount,
  icon,
  gradient,
  style,
}) => {
  return (
    <View style={[styles.statusCard, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      />
      <MaterialCommunityIcons
        name={icon}
        size={width < 768 ? 24 : 28}
        color="white"
        style={styles.cardIcon}
      />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardAmount}>₹{amount.toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    flex: 1,
    minWidth: width > 768 ? 200 : (width - 48) / 2,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    color: 'white',
    opacity: 0.7,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: width < 768 ? 18 : 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default StatsCard; 