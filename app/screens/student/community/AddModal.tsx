import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, useTheme, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  interpolate,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/app/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const POST_TYPES = [
  {
    key: 'POST',
    icon: 'post-outline',
    label: 'Share Update',
    color: '#FF6B6B',
    description: 'Share a message or photo with your PG'
  },
  {
    key: 'POLL',
    icon: 'poll',
    label: 'Create Poll',
    color: '#4ECDC4',
    description: 'Get opinions from your PG mates'
  },
  {
    key: 'EVENT',
    icon: 'calendar-star',
    label: 'Plan Event',
    color: '#45B7D1',
    description: 'Organize an event or meetup'
  }
] as const;

interface AddModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: any) => void;
  pgId: number | undefined;
}

// Add supported file types
const SUPPORTED_FILES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
  VIDEO: ['video/mp4'],
  AUDIO: ['audio/mpeg', 'audio/mp3']
};

export default function AddModal({ visible, onDismiss, onSubmit, pgId }: AddModalProps) {
  const { colors, dark } = useTheme();
  const [selectedType, setSelectedType] = useState<typeof POST_TYPES[number]['key'] | null>(null);
  const [content, setContent] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollExpiry, setPollExpiry] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventLocation, setEventLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO' | null>(null);

  const modalScale = useSharedValue(visible ? 1 : 0.8);
  const modalOpacity = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1);
      modalOpacity.value = withTiming(1);
    } else {
      modalScale.value = withSpring(0.8);
      modalOpacity.value = withTiming(0);
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setMediaFile(asset);
      setMediaType(asset.type === 'video' ? 'VIDEO' : 'IMAGE');
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3'],
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaFile(asset);
        setMediaType('AUDIO');
      }
    } catch (err) {
      console.error('Error picking audio:', err);
    }
  };

  const handleSubmit = async () => {
    if (!pgId) {
      console.error('No PG ID available');
      return;
    }

    try {
      let mediaUrl = null;
      if (mediaFile) {
        // Create form data
        const formData = new FormData();
        
        // Get file extension from uri
        const uriParts = mediaFile.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        // Create file object
        const file = {
          uri: mediaFile.uri,
          name: `file.${fileType}`,
          type: mediaFile.type || `${mediaType.toLowerCase()}/${fileType}`
        };

        formData.append('file', file as any);

        try {
          const uploadResponse = await api.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data, headers) => {
              return formData; // Return FormData directly
            },
          });

          if (uploadResponse.data.success) {
            mediaUrl = uploadResponse.data.url;
          } else {
            throw new Error('Upload failed');
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Failed to upload file. Please try again.');
          return;
        }
      }

      let data: any = {
        type: selectedType,
        content: content.trim(),
        mediaUrl,
        mediaType
      };

      if (selectedType === 'POLL') {
        const validOptions = pollOptions.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          alert('Please add at least 2 poll options');
          return;
        }
        if (!pollQuestion.trim()) {
          alert('Please enter a poll question');
          return;
        }

        data.additionalData = {
          poll: {
            question: pollQuestion.trim(),
            options: validOptions,
            expiresAt: pollExpiry.toISOString()
          }
        };
      } else if (selectedType === 'EVENT') {
        if (!eventTitle.trim()) {
          alert('Please enter an event title');
          return;
        }
        if (!eventDescription.trim()) {
          alert('Please enter an event description');
          return;
        }
        if (!eventLocation.trim()) {
          alert('Please enter an event location');
          return;
        }

        data.additionalData = {
          event: {
            title: eventTitle.trim(),
            description: eventDescription.trim(),
            eventDate: eventDate.toISOString(),
            location: eventLocation.trim()
          }
        };
      } else if (!content.trim()) {
        alert('Please enter your message');
        return;
      }

      onSubmit(data);
      resetForm();
      onDismiss();
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setContent('');
    setPollOptions(['', '']);
    setPollQuestion('');
    setPollExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setEventTitle('');
    setEventDescription('');
    setEventDate(new Date());
    setEventLocation('');
  };

  const renderTypeSelection = () => (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={styles.typeContainer}
    >
      <Text style={[styles.title, { color: colors.primary }]}>Create New Post</Text>
      <View style={styles.typeGrid}>
        {POST_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeCard, { backgroundColor: type.color + '15' }]}
            onPress={() => setSelectedType(type.key)}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={32}
              color={type.color}
            />
            <Text style={[styles.typeLabel, { color: colors.text }]}>{type.label}</Text>
            <Text style={[styles.typeDescription, { color: colors.text + '99' }]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderPostForm = () => (
    <Animated.View 
      entering={SlideInDown.duration(300)} 
      exiting={SlideOutDown.duration(300)}
      style={styles.formContainer}
    >
      <TextInput
        mode="outlined"
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        style={styles.input}
      />
      
      {mediaFile && (
        <View style={styles.mediaPreview}>
          {mediaType === 'IMAGE' && (
            <Image source={{ uri: mediaFile.uri }} style={styles.mediaPreviewImage} />
          )}
          {mediaType === 'VIDEO' && (
            <View style={styles.mediaPreviewVideo}>
              <MaterialCommunityIcons name="video" size={32} color={colors.primary} />
              <Text>Video selected</Text>
            </View>
          )}
          {mediaType === 'AUDIO' && (
            <View style={styles.mediaPreviewAudio}>
              <MaterialCommunityIcons name="music" size={32} color={colors.primary} />
              <Text>Audio selected</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.removeMediaButton}
            onPress={() => {
              setMediaFile(null);
              setMediaType(null);
            }}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mediaButtons}>
        <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
          <MaterialCommunityIcons name="image-plus" size={24} color={colors.primary} />
          <Text style={{ color: colors.primary }}>Photo/Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.mediaButton} onPress={pickAudio}>
          <MaterialCommunityIcons name="music" size={24} color={colors.primary} />
          <Text style={{ color: colors.primary }}>Audio</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderPollForm = () => (
    <Animated.View 
      entering={SlideInDown.duration(300)} 
      exiting={SlideOutDown.duration(300)}
      style={styles.formContainer}
    >
      <TextInput
        mode="outlined"
        placeholder="Ask a question..."
        value={pollQuestion}
        onChangeText={setPollQuestion}
        style={styles.input}
      />
      {pollOptions.map((option, index) => (
        <View key={index} style={styles.pollOptionContainer}>
    <TextInput
            mode="outlined"
            placeholder={`Option ${index + 1}`}
            value={option}
            onChangeText={(text) => {
              const newOptions = [...pollOptions];
              newOptions[index] = text;
              setPollOptions(newOptions);
            }}
            style={styles.pollOptionInput}
          />
          {index > 1 && (
            <TouchableOpacity
              onPress={() => {
                setPollOptions(pollOptions.filter((_, i) => i !== index));
              }}
              style={styles.removeOptionButton}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {pollOptions.length < 5 && (
        <Button
          mode="outlined"
          onPress={() => setPollOptions([...pollOptions, ''])}
          style={styles.addOptionButton}
          icon="plus"
        >
          Add Option
        </Button>
      )}
      <TouchableOpacity
        onPress={() => {
          setDatePickerMode('date');
          setShowDatePicker(true);
        }}
        style={styles.dateButton}
      >
        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
        <Text style={[styles.dateButtonText, { color: colors.primary }]}>
          Poll ends {format(pollExpiry, 'PPp')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEventForm = () => (
    <Animated.View 
      entering={SlideInDown.duration(300)} 
      exiting={SlideOutDown.duration(300)}
      style={styles.formContainer}
    >
      <TextInput
        mode="outlined"
        placeholder="Event Title"
        value={eventTitle}
        onChangeText={setEventTitle}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        placeholder="Event Description"
        value={eventDescription}
        onChangeText={setEventDescription}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        placeholder="Location"
        value={eventLocation}
        onChangeText={setEventLocation}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={() => {
          setDatePickerMode('date');
          setShowDatePicker(true);
        }}
        style={styles.dateButton}
      >
        <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
        <Text style={[styles.dateButtonText, { color: colors.primary }]}>
          {format(eventDate, 'PPP')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setDatePickerMode('time');
          setShowDatePicker(true);
        }}
        style={styles.dateButton}
      >
        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
        <Text style={[styles.dateButtonText, { color: colors.primary }]}>
          {format(eventDate, 'p')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: colors.surface }
        ]}
      >
        <Animated.View style={[styles.container, modalStyle]}>
                <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (selectedType) {
                  setSelectedType(null);
                } else {
                  resetForm();
                  onDismiss();
                }
              }}
              style={styles.backButton}
                    >
                      <MaterialCommunityIcons
                name={selectedType ? 'arrow-left' : 'close'}
                        size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            {selectedType && (
              <TouchableOpacity
                onPress={handleSubmit}
                      style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary }
                ]}
              >
                <Text style={[styles.submitButtonText, { color: colors.surface }]}>
                  Post
                      </Text>
              </TouchableOpacity>
            )}
                  </View>
          <ScrollView style={styles.content}>
            {!selectedType && renderTypeSelection()}
            {selectedType === 'POST' && renderPostForm()}
            {selectedType === 'POLL' && renderPollForm()}
            {selectedType === 'EVENT' && renderEventForm()}
          </ScrollView>
                {showDatePicker && (
                  <DateTimePicker
              value={datePickerMode === 'date' ? eventDate : pollExpiry}
              mode={datePickerMode}
              is24Hour={true}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                  if (datePickerMode === 'date') {
                    setEventDate(selectedDate);
                  } else {
                    setPollExpiry(selectedDate);
                  }
                      }
                    }}
                  />
                )}
            </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  backButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  typeContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1a1a1a',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeGrid: {
    gap: 16,
  },
  typeCard: {
    padding: 20,
    borderRadius: 24,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  typeLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  typeDescription: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  formContainer: {
    padding: 20,
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pollOptionInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
  },
  removeOptionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  addOptionButton: {
    marginTop: 12,
    borderRadius: 20,
    borderColor: '#007AFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  mediaPreview: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mediaPreviewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  mediaPreviewVideo: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  mediaPreviewAudio: {
    width: '100%',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
}); 