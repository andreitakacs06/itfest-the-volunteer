import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { TaskDifficulty } from '../firebase/types';
import { DIFFICULTY_CREDITS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { createTask } from '../services/taskService';

export const CreateTaskScreen = () => {
  const { firebaseUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Easy');
  const [loading, setLoading] = useState(false);

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
      setDifficulty('Easy');
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
            <Text variant="headlineSmall">Create Help Request</Text>
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

            <Text variant="titleMedium" style={styles.label}>
              Difficulty
            </Text>
            <RadioButton.Group
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as TaskDifficulty)}
            >
              <RadioButton.Item label={`Easy (${DIFFICULTY_CREDITS.Easy} credits)`} value="Easy" />
              <RadioButton.Item label={`Medium (${DIFFICULTY_CREDITS.Medium} credits)`} value="Medium" />
              <RadioButton.Item label={`Hard (${DIFFICULTY_CREDITS.Hard} credits)`} value="Hard" />
            </RadioButton.Group>

            <View style={styles.submitRow}>
              <Button mode="contained" onPress={onSubmit} loading={loading} disabled={loading}>
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
    padding: 16,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginTop: 12,
  },
  label: {
    marginTop: 14,
  },
  submitRow: {
    marginTop: 8,
  },
});
