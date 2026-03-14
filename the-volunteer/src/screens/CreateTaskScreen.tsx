import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import { createTask } from '../services/taskService';

export const CreateTaskScreen = () => {
  const { firebaseUser, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [accessDetails, setAccessDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const requesterType = profile?.requesterType;

  const onSubmit = async () => {
    if (!firebaseUser) {
      return;
    }

    if (!requesterType) {
      Alert.alert(
        'Complete profile first',
        'Set your profile type in Profile screen before creating a task.'
      );
      return;
    }

    const parsedHours = Number(estimatedHours);
    if (!title.trim() || !description.trim() || !estimatedHours.trim()) {
      Alert.alert('Missing information', 'Please add title, description, and estimated hours.');
      return;
    }

    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      Alert.alert('Invalid hours', 'Estimated hours must be a number between 0.5 and 24.');
      return;
    }

    if (
      requesterType === 'juridic' &&
      (!organizationName.trim() || !representativeName.trim() || !organizationAddress.trim())
    ) {
      Alert.alert('Missing juridic details', 'Please provide organization name, representative, and address.');
      return;
    }

    if (requesterType === 'physical' && (!contactPhone.trim() || !preferredTime.trim() || !accessDetails.trim())) {
      Alert.alert('Missing physical person details', 'Please provide phone, preferred time, and access details.');
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
        estimatedHours: Number(parsedHours.toFixed(1)),
        creatorId: firebaseUser.uid,
        creatorType: requesterType,
        requesterDetails:
          requesterType === 'juridic'
            ? {
                organizationName: organizationName.trim(),
                representativeName: representativeName.trim(),
                organizationAddress: organizationAddress.trim(),
              }
            : {
                contactPhone: contactPhone.trim(),
                preferredTime: preferredTime.trim(),
                accessDetails: accessDetails.trim(),
              },
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });

      setTitle('');
      setDescription('');
      setEstimatedHours('');
      setOrganizationName('');
      setRepresentativeName('');
      setOrganizationAddress('');
      setContactPhone('');
      setPreferredTime('');
      setAccessDetails('');
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
              Add task details and estimated time. Required fields depend on your profile type.
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.label}>
              Profile Type
            </Text>
            <Text variant="bodyMedium" style={styles.typeInfo}>
              {requesterType === 'juridic'
                ? 'Juridic Person (NGO/Company)'
                : requesterType === 'physical'
                ? 'Physical Person'
                : 'Not set. Go to Profile and choose your type first.'}
            </Text>

            <View style={styles.chipRow}>
              <Chip compact icon="clock-outline" style={styles.infoChip}>
                Enter estimated hours
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
            <TextInput
              mode="outlined"
              label="Estimated Hours"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            {requesterType === 'juridic' ? (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Juridic Details
                </Text>
                <TextInput
                  mode="outlined"
                  label="Organization Name"
                  value={organizationName}
                  onChangeText={setOrganizationName}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Representative Name"
                  value={representativeName}
                  onChangeText={setRepresentativeName}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Organization Address"
                  value={organizationAddress}
                  onChangeText={setOrganizationAddress}
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />
              </>
            ) : null}

            {requesterType === 'physical' ? (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Physical Person Details
                </Text>
                <TextInput
                  mode="outlined"
                  label="Contact Phone"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Preferred Time"
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Access / Building Details"
                  value={accessDetails}
                  onChangeText={setAccessDetails}
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />
              </>
            ) : null}

            <View style={styles.submitRow}>
              <Button
                mode="contained"
                onPress={onSubmit}
                loading={loading}
                disabled={loading || !requesterType}
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
  typeInfo: {
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
  sectionTitle: {
    marginTop: 16,
  },
  submitRow: {
    marginTop: 16,
  },
  submitButtonContent: {
    minHeight: 46,
  },
});
