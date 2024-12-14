import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  TextInput,
  Menu,
  Divider,
  Portal,
  Modal,
  Button,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  withSpring 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: number;
  text: string;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
  type: 'text' | 'image' | 'voice' | 'file';
  mediaUrl?: string;
  duration?: number;
  reactions?: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  isRead?: boolean;
}

// Dummy data
const messages: Message[] = [
  {
    id: 1,
    text: "Hey everyone! Don't forget about tomorrow's cleaning schedule.",
    sender: { id: 1, name: "John" },
    timestamp: "10:30 AM",
    type: "text",
    reactions: [
      { emoji: "👍", count: 2, userReacted: true },
      { emoji: "✅", count: 1, userReacted: false }
    ]
  },
  {
    id: 2,
    text: "I've already cleaned the common area",
    sender: { id: 2, name: "Mike" },
    timestamp: "10:32 AM",
    type: "text",
    mediaUrl: "https://example.com/image.jpg",
    reactions: [
      { emoji: "🎉", count: 3, userReacted: false }
    ]
  }
];

// Add typing animation
const TypingIndicator = () => {
  const { theme } = useTheme();
  return (
    <Animated.View 
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.typingIndicator, { backgroundColor: theme?.colors?.surfaceVariant }]}
    >
      <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
        Mike is typing...
      </Text>
      <ActivityIndicator size={16} color={theme?.colors?.primary} />
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Simulate typing indicator
  useEffect(() => {
    const typingTimeout = setTimeout(() => setIsTyping(Math.random() > 0.7), 3000);
    return () => clearTimeout(typingTimeout);
  }, [messages]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    setShowScrollButton(scrollPosition > 300);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    // Handle the recorded audio file
    console.log('Recording stopped, file:', uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      // Handle the selected image
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  const renderMessage = (msg: Message, index: number) => (
    <Animated.View
      key={msg.id}
      entering={SlideInRight.delay(index * 100)}
      exiting={SlideOutLeft}
    >
      <Pressable onLongPress={() => {
        setSelectedMessage(msg);
        setShowReactions(true);
      }}>
        <Surface 
          style={[
            styles.messageContainer,
            { 
              backgroundColor: msg.sender.id === 1 ? 
                theme?.colors?.primaryContainer : 
                theme?.colors?.surfaceVariant,
              alignSelf: msg.sender.id === 1 ? 'flex-end' : 'flex-start',
            }
          ]}
        >
          <LinearGradient
            colors={[
              msg.sender.id === 1 ? 
                `${theme?.colors?.primary}20` : 
                `${theme?.colors?.surfaceVariant}20`,
              'transparent'
            ]}
            style={styles.messageGradient}
          />

          {msg.sender.id !== 1 && (
            <View style={styles.senderInfo}>
              <Avatar.Text
                size={24}
                label={msg.sender.name.substring(0, 2)}
                style={{ backgroundColor: theme?.colors?.primary + '40' }}
              />
              <Text style={[styles.senderName, { color: theme?.colors?.primary }]}>
                {msg.sender.name}
              </Text>
            </View>
          )}

          {msg.type === 'image' && msg.mediaUrl && (
            <Image 
              source={{ uri: msg.mediaUrl }}
              style={styles.messageImage}
            />
          )}

          <Text style={{ color: theme?.colors?.onSurface }}>
            {msg.text}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, { color: theme?.colors?.onSurfaceVariant }]}>
              {msg.timestamp}
              {msg.isRead && <IconButton icon="check-all" size={12} />}
            </Text>
            {msg.reactions && (
              <View style={styles.reactions}>
                {msg.reactions.map((reaction, idx) => (
                  <Animated.View
                    key={idx}
                    entering={FadeIn.delay(idx * 100)}
                  >
                    <Chip
                      style={[
                        styles.reactionChip,
                        { 
                          backgroundColor: reaction.userReacted ? 
                            theme?.colors?.primaryContainer : 
                            theme?.colors?.surfaceVariant 
                        }
                      ]}
                    >
                      <Text>{reaction.emoji} {reaction.count}</Text>
                    </Chip>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );

  return (
    <DashboardLayout
      title="Room 301 Group"
      subtitle="3 participants"
      headerRight={() => (
        <View style={styles.headerRight}>
          <IconButton icon="video" onPress={() => {}} />
          <IconButton icon="phone" onPress={() => {}} />
          <IconButton icon="dots-vertical" onPress={() => {}} />
        </View>
      )}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {messages.map(renderMessage)}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {showScrollButton && (
          <Animated.View 
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.scrollButton}
          >
            <IconButton 
              icon="chevron-down"
              mode="contained"
              onPress={scrollToBottom}
            />
          </Animated.View>
        )}

        <BlurView intensity={20} style={styles.inputWrapper}>
          <Surface style={[styles.inputContainer, { backgroundColor: theme?.colors?.surface }]}>
            <IconButton 
              icon="emoticon-outline"
              size={24}
              onPress={() => {}}
            />
            <IconButton 
              icon="paperclip"
              size={24}
              onPress={() => setShowAttachMenu(true)}
            />
            <TextInput
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={isRecording ? "stop" : "microphone"}
                  onPress={isRecording ? stopRecording : startRecording}
                  color={isRecording ? theme?.colors?.error : undefined}
                />
              }
            />
            <IconButton 
              icon={message.trim() ? "send" : "camera"}
              size={24}
              onPress={() => {}}
              containerColor={message.trim() ? theme?.colors?.primary : undefined}
              iconColor={message.trim() ? theme?.colors?.surface : undefined}
            />
          </Surface>
        </BlurView>

        {/* Attachment Menu */}
        <Portal>
          <Modal
            visible={showAttachMenu}
            onDismiss={() => setShowAttachMenu(false)}
            contentContainerStyle={[
              styles.attachMenu,
              { backgroundColor: theme?.colors?.surface }
            ]}
          >
            <View style={styles.attachGrid}>
              {[
                { icon: 'image', label: 'Photo' },
                { icon: 'file', label: 'Document' },
                { icon: 'camera', label: 'Camera' },
                { icon: 'map-marker', label: 'Location' }
              ].map((item, index) => (
                <Button
                  key={index}
                  icon={item.icon}
                  mode="contained-tonal"
                  onPress={() => {
                    setShowAttachMenu(false);
                    if (item.icon === 'image') pickImage();
                  }}
                  style={styles.attachButton}
                >
                  {item.label}
                </Button>
              ))}
            </View>
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  reactions: {
    flexDirection: 'row',
    gap: 4,
  },
  reactionChip: {
    height: 24,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
  },
  attachMenu: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  attachButton: {
    width: '48%',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 16,
    margin: 8,
    alignSelf: 'flex-start',
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    borderRadius: 24,
    elevation: 4,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
}); 