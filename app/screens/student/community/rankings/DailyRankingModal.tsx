import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  Button,
  Checkbox,
  Divider,
  Portal,
  Modal
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import LottieView from 'lottie-react-native';

interface Roommate {
  id: number;
  name: string;
  avatar?: string;
  contributions: string[];
  isSelected: boolean;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (selectedRoommates: number[]) => void;
}

const dummyRoommates: Roommate[] = [
  {
    id: 1,
    name: "John Doe",
    contributions: ["Cleaned common area", "Organized recycling"],
    isSelected: false
  },
  {
    id: 2,
    name: "Mike Ross",
    contributions: ["Maintained kitchen", "Helped with laundry"],
    isSelected: false
  },
  {
    id: 3,
    name: "Sarah Wilson",
    contributions: ["Coordinated cleaning schedule"],
    isSelected: false
  }
];

export default function DailyRankingModal({ visible, onDismiss, onSubmit }: Props) {
  const { theme } = useTheme();
  const [roommates, setRoommates] = useState<Roommate[]>(dummyRoommates);
  const [showCelebration, setShowCelebration] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const toggleRoommate = (id: number) => {
    setRoommates(roommates.map(roommate => 
      roommate.id === id 
        ? { ...roommate, isSelected: !roommate.isSelected }
        : roommate
    ));
  };

  const handleSubmit = () => {
    const selectedIds = roommates
      .filter(roommate => roommate.isSelected)
      .map(roommate => roommate.id);

    setShowCelebration(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setShowCelebration(false);
      onSubmit(selectedIds);
      onDismiss();
    }, 3000);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme?.colors?.surface }]}
      >
        {showCelebration ? (
          <Animated.View style={[styles.celebrationContainer, { opacity: fadeAnim }]}>
            <LottieView
              source={require('@/assets/Animations/Animation - 1734132487639.json')}
              autoPlay
              loop={false}
              style={styles.celebrationAnimation}
            />
            <Text style={[styles.celebrationText, { color: theme?.colors?.primary }]}>
              Great job everyone!
            </Text>
          </Animated.View>
        ) : (
          <>
            <Text style={[styles.title, { color: theme?.colors?.primary }]}>
              Daily Contributions
            </Text>
            <Text style={[styles.subtitle, { color: theme?.colors?.onSurfaceVariant }]}>
              Select roommates who contributed today
            </Text>

            <ScrollView style={styles.roommatesList}>
              {roommates.map((roommate, index) => (
                <React.Fragment key={roommate.id}>
                  <Surface style={[
                    styles.roommateCard,
                    { backgroundColor: roommate.isSelected ? theme?.colors?.primaryContainer : theme?.colors?.surface }
                  ]}>
                    <View style={styles.roommateInfo}>
                      <Avatar.Text
                        size={40}
                        label={roommate.name.substring(0, 2)}
                        style={{ backgroundColor: theme?.colors?.primary + '20' }}
                      />
                      <View style={styles.roommateDetails}>
                        <Text style={[styles.roommateName, { color: theme?.colors?.onSurface }]}>
                          {roommate.name}
                        </Text>
                        <View style={styles.contributionTags}>
                          {roommate.contributions.map((contribution, idx) => (
                            <Surface 
                              key={idx}
                              style={[styles.contributionTag, { backgroundColor: theme?.colors?.secondaryContainer }]}
                            >
                              <Text style={{ color: theme?.colors?.onSecondaryContainer, fontSize: 12 }}>
                                {contribution}
                              </Text>
                            </Surface>
                          ))}
                        </View>
                      </View>
                      <Checkbox.Android
                        status={roommate.isSelected ? 'checked' : 'unchecked'}
                        onPress={() => toggleRoommate(roommate.id)}
                      />
                    </View>
                  </Surface>
                  {index < roommates.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <Button 
                mode="outlined"
                onPress={onDismiss}
                style={styles.footerButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained"
                onPress={handleSubmit}
                style={styles.footerButton}
              >
                Submit
              </Button>
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  roommatesList: {
    marginBottom: 20,
  },
  roommateCard: {
    padding: 12,
    borderRadius: 12,
  },
  roommateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roommateDetails: {
    flex: 1,
  },
  roommateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contributionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  contributionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divider: {
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  footerButton: {
    minWidth: 100,
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  celebrationAnimation: {
    width: 200,
    height: 200,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
}); 