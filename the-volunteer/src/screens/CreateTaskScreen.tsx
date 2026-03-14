import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Menu, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { TaskDifficulty } from '../firebase/types';
import { DIFFICULTY_CREDITS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { createTask } from '../services/taskService';

type TaskTypeOption = {
  label: string;
  example: string;
  difficulty: TaskDifficulty;
};

const TASK_TYPE_OPTIONS: TaskTypeOption[] = [
  {
    label: 'Carry groceries or light boxes',
    example: 'Example: Carrying a few boxes upstairs',
    difficulty: 'Easy',
  },
  {
    label: 'Household setup and furniture help',
    example: 'Example: Moving a sofa or assembling shelves',
    difficulty: 'Medium',
  },
  {
    label: 'Vehicle or heavy technical work',
    example: 'Example: Working on a car or lifting heavy equipment',
    difficulty: 'Hard',
  },
];

export const CreateTaskScreen = () => {
  const { firebaseUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<TaskTypeOption>(TASK_TYPE_OPTIONS[0]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const difficulty = selectedTaskType.difficulty;
  const assignedCredits = DIFFICULTY_CREDITS[difficulty];

  const onSubmit = async () => {
    if (!firebaseUser || !title.trim() || !description.trim()) {
      Alert.alert('Missing information', 'Please add title and description.');
      return;
    }

    try {
      setLoading(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location required', 'Location permission is needed to create local tasks.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      await createTask({
        title,
        description,
        difficulty,
        creatorId: firebaseUser.uid,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });

      setTitle('');
      setDescription('');
      setSelectedTaskType(TASK_TYPE_OPTIONS[0]);
      Alert.alert('Success', 'Help request created successfully.');
    } catch (error) {
      Alert.alert('Unable to create task', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Create Help Request
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Pick the type of help needed and credits will be assigned automatically.
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.label}>
              Help Type
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  contentStyle={styles.menuButtonContent}
                  style={styles.menuButton}
                >
                  {selectedTaskType.label}
                </Button>
              }
            >
              {TASK_TYPE_OPTIONS.map((option) => (
                <Menu.Item
                  key={option.label}
                  title={`${option.label} (${option.difficulty})`}
                  onPress={() => {
                    setSelectedTaskType(option);
                    setMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <Text variant="bodySmall" style={styles.exampleText}>
              {selectedTaskType.example}
            </Text>

            <View style={styles.chipRow}>
              <Chip compact icon="speedometer-medium" style={styles.infoChip}>
                {difficulty} difficulty
              </Chip>
              <Chip compact icon="star-circle" style={styles.infoChip}>
                {assignedCredits} credits
              </Chip>
            </View>

            <TextInput
              mode="outlined"
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <View style={styles.submitRow}>
              <Button
                mode="contained"
                onPress={onSubmit}
                loading={loading}
                disabled={loading}
                contentStyle={styles.submitButtonContent}
              >
                Publish Request
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  content: {
    padding: 18,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.72,
    lineHeight: 20,
  },
  divider: {
    marginTop: 14,
    marginBottom: 10,
  },
  menuButton: {
    marginTop: 8,
  },
  menuButtonContent: {
    justifyContent: 'flex-start',
    minHeight: 50,
  },
  exampleText: {
    marginTop: 8,
    opacity: 0.75,
    lineHeight: 18,
  },
  chipRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoChip: {
    borderRadius: 14,
  },
  input: {
    marginTop: 14,
  },
  label: {
    marginTop: 8,
  },
  submitRow: {
    marginTop: 16,
  },
  submitButtonContent: {
    minHeight: 46,
  },
});
