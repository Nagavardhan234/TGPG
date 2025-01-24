import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function RegistrationStatus() {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={() => router.push('/screens/LoginScreen')}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* Main Content with Blob Effects */}
      <LinearGradient
        colors={isDarkMode ? ['#2D2D2D', '#383838'] : ['#F3EFFF', '#E8F0FF']}
        style={styles.contentContainer}
      >
        {/* Decorative Blobs */}
        <View style={styles.blobContainer}>
          <View style={[styles.blob1, { backgroundColor: isDarkMode ? '#3D3D3D' : '#D8BBFF' }]} />
          <View style={[styles.blob2, { backgroundColor: isDarkMode ? '#434343' : '#FFD6D6' }]} />
          <View style={[styles.blob3, { backgroundColor: isDarkMode ? '#3D3D3D' : '#D8BBFF' }]} />
        </View>

        {/* Glass Effect Card */}
        <BlurView
          intensity={isDarkMode ? 20 : 40}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.glassCard}
        >
          <View style={styles.iconContainer}>
            <IconButton
              icon="clock-check-outline"
              size={40}
              iconColor={theme.colors.primary}
              style={styles.statusIcon}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Registration Pending
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your registration is awaiting manager approval
          </Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <IconButton
                icon="information"
                size={24}
                iconColor={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                We'll notify you once your registration is approved
              </Text>
            </View>

            <View style={styles.infoItem}>
              <IconButton
                icon="phone"
                size={24}
                iconColor={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Contact hostel manager for any queries
              </Text>
            </View>

            <View style={styles.infoItem}>
              <IconButton
                icon="email"
                size={24}
                iconColor={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Check your email for updates
              </Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  blob1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    left: -width * 0.2,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
  },
  blob2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    top: width * 0.2,
    right: -width * 0.3,
    opacity: 0.25,
    transform: [{ scale: 1.1 }],
  },
  blob3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    bottom: width * 0.1,
    left: width * 0.1,
    opacity: 0.2,
    transform: [{ scale: 0.9 }],
  },
  glassCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    margin: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoContainer: {
    width: '100%',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
  },
  infoIcon: {
    margin: 0,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
}); 