import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  SegmentedButtons,
  Switch,
  Portal,
  Modal
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

interface PollOption {
  id: number;
  text: string;
  imageUrl?: string;
}

export default function CreatePollScreen() {
  const { theme } = useTheme();
  const [pollType, setPollType] = useState<'text' | 'image'>('text');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: '' },
    { id: 2, text: '' }
  ]);
  const [pollImage, setPollImage] = useState<string>();
  const [isUrgent, setIsUrgent] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setPollImage(result.assets[0].uri);
    }
  };

  const addOption = () => {
    setOptions([...options, { id: options.length + 1, text: '' }]);
  };

  const removeOption = (id: number) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: number, text: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };

  const handleSubmit = () => {
    // Handle poll creation
    router.back();
  };

  return (
    <DashboardLayout
      title="Create Poll"
      subtitle="Add a new community poll"
    >
      <ScrollView style={styles.container}>
        <Surface style={[styles.section, { backgroundColor: theme?.colors?.surface }]}>
          <SegmentedButtons
            value={pollType}
            onValueChange={value => setPollType(value as 'text' | 'image')}
            buttons={[
              { value: 'text', label: 'Text Poll' },
              { value: 'image', label: 'Image Poll' }
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Poll Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Caption (optional)"
            value={caption}
            onChangeText={setCaption}
            mode="outlined"
            multiline
            style={styles.input}
          />

          <Button 
            mode="outlined"
            icon="image"
            onPress={pickImage}
            style={styles.imageButton}
          >
            {pollImage ? 'Change Cover Image' : 'Add Cover Image'}
          </Button>

          <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
            Poll Options
          </Text>

          {options.map((option, index) => (
            <View key={option.id} style={styles.optionContainer}>
              <TextInput
                label={`Option ${index + 1}`}
                value={option.text}
                onChangeText={(text) => updateOption(option.id, text)}
                mode="outlined"
                style={styles.optionInput}
              />
              {pollType === 'image' && (
                <Button 
                  mode="outlined"
                  icon="image"
                  onPress={() => {/* Handle option image */}}
                  style={styles.optionImageButton}
                >
                  Image
                </Button>
              )}
              {options.length > 2 && (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => removeOption(option.id)}
                />
              )}
            </View>
          ))}

          <Button 
            mode="outlined"
            icon="plus"
            onPress={addOption}
            style={styles.addButton}
          >
            Add Option
          </Button>

          <View style={styles.urgentContainer}>
            <Text style={{ color: theme?.colors?.onSurface }}>Mark as Urgent</Text>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
            />
          </View>

          <Button 
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Create Poll
          </Button>
        </Surface>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  imageButton: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
  },
  optionImageButton: {
    marginLeft: 8,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  urgentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
}); 