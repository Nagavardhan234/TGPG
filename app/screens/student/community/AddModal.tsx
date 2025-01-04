import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Portal, Modal, Text, TextInput, Button, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const NEON_COLORS = {
  blue: '#00FFFF',
  purple: '#FF00FF',
  teal: '#00FFA3',
  dark: '#0A0A1F',
  darkBlue: '#0A1A3F',
};

interface AddModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AddModal({ visible, onDismiss, onSubmit }: AddModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibility, setVisibility] = useState<'Public' | 'PG'>('Public');
  const [media, setMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit({
        title,
        description,
        date: date.toISOString(),
        location,
        visibility,
        media,
      });
      handleDismiss();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setLocation('');
    setVisibility('Public');
    setMedia(null);
    onDismiss();
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets[0].uri);
    }
  };

  const renderInput = (props: any) => (
    <TextInput
      {...props}
      mode="flat"
      style={[styles.input, props.style]}
      theme={{
        colors: {
          primary: NEON_COLORS.blue,
          text: '#fff',
          placeholder: 'rgba(255,255,255,0.5)',
          background: 'transparent',
        },
      }}
      underlineColor="rgba(255,255,255,0.1)"
      activeUnderlineColor={NEON_COLORS.blue}
      textColor="#fff"
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.modalGradient}
          >
            <Animated.View entering={FadeIn.duration(300)}>
              <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                  <Text style={styles.title}>Create Post</Text>
                  <IconButton
                    icon="close"
                    iconColor="#fff"
                    style={styles.closeButton}
                    onPress={handleDismiss}
                  />
                </View>

                {renderInput({
                  label: 'Title',
                  value: title,
                  onChangeText: setTitle,
                })}

                {renderInput({
                  label: 'Description',
                  value: description,
                  onChangeText: setDescription,
                  multiline: true,
                  numberOfLines: 3,
                })}

                <View style={styles.mediaSection}>
                  <Text style={styles.sectionTitle}>Media</Text>
                  <View style={styles.mediaButtons}>
                    <Pressable
                      style={styles.mediaButton}
                      onPress={handleImagePick}
                    >
                      <MaterialCommunityIcons
                        name="image"
                        size={24}
                        color={NEON_COLORS.blue}
                      />
                      <Text style={styles.mediaButtonText}>Image</Text>
                    </Pressable>

                    <Pressable style={styles.mediaButton}>
                      <MaterialCommunityIcons
                        name="video"
                        size={24}
                        color={NEON_COLORS.purple}
                      />
                      <Text style={styles.mediaButtonText}>Video</Text>
                    </Pressable>
                  </View>

                  {media && (
                    <View style={styles.selectedMedia}>
                      <Text style={styles.selectedMediaText}>
                        Image selected
                      </Text>
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor="#fff"
                        onPress={() => setMedia(null)}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.visibilitySection}>
                  <Text style={styles.sectionTitle}>Visibility</Text>
                  <View style={styles.visibilityButtons}>
                    <Pressable
                      style={[
                        styles.visibilityButton,
                        visibility === 'Public' && styles.visibilityButtonActive
                      ]}
                      onPress={() => setVisibility('Public')}
                    >
                      <MaterialCommunityIcons
                        name="earth"
                        size={24}
                        color={visibility === 'Public' ? NEON_COLORS.blue : '#fff'}
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        visibility === 'Public' && styles.visibilityButtonTextActive
                      ]}>
                        Public
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.visibilityButton,
                        visibility === 'PG' && styles.visibilityButtonActive
                      ]}
                      onPress={() => setVisibility('PG')}
                    >
                      <MaterialCommunityIcons
                        name="account-group"
                        size={24}
                        color={visibility === 'PG' ? NEON_COLORS.blue : '#fff'}
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        visibility === 'PG' && styles.visibilityButtonTextActive
                      ]}>
                        PG Only
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dateSection}>
                  <Text style={styles.sectionTitle}>Date & Time</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                    textColor={NEON_COLORS.blue}
                  >
                    {format(date, 'MMM d, yyyy h:mm a')}
                  </Button>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="datetime"
                    is24Hour={false}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}

                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    onPress={handleDismiss}
                    style={[styles.actionButton, styles.cancelButton]}
                    textColor="#fff"
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading || !title}
                    style={[styles.actionButton, styles.submitButton]}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                  >
                    Post
                  </Button>
                </View>
              </ScrollView>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalBlur: {
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: NEON_COLORS.blue,
    textShadowColor: NEON_COLORS.blue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeButton: {
    margin: -8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mediaButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedMediaText: {
    color: '#fff',
    fontSize: 14,
  },
  visibilitySection: {
    marginBottom: 16,
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  visibilityButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  visibilityButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  visibilityButtonTextActive: {
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: 16,
  },
  dateButton: {
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    minWidth: 100,
  },
  cancelButton: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  submitButton: {
    backgroundColor: NEON_COLORS.blue,
    borderRadius: 20,
    elevation: 0,
  },
  submitButtonContent: {
    height: 40,
  },
  submitButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON_COLORS.dark,
  },
}); 