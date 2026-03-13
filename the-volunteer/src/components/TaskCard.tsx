import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { Task } from '../firebase/types';

interface TaskCardProps {
  task: Task;
  distanceKm?: number;
  actionText?: string;
  onPressAction?: () => void;
  actionLoading?: boolean;
}

export const TaskCard = ({
  task,
  distanceKm,
  actionText,
  onPressAction,
  actionLoading,
}: TaskCardProps) => (
  <Card style={styles.card} mode="elevated">
    <Card.Content>
      <Text variant="titleMedium">{task.title}</Text>
      <Text variant="bodyMedium" style={styles.description}>
        {task.description}
      </Text>
      <Chip style={styles.chip} compact>
        {task.difficulty} • {task.credits} credits
      </Chip>
      {typeof distanceKm === 'number' ? (
        <Text variant="bodySmall" style={styles.meta}>
          {distanceKm.toFixed(2)} km away
        </Text>
      ) : null}
      <Text variant="bodySmall" style={styles.meta}>
        Status: {task.status}
      </Text>
      {typeof task.earnedCredits === 'number' ? (
        <Text variant="bodySmall" style={styles.meta}>
          Earned: {task.earnedCredits} credits
        </Text>
      ) : null}
      {actionText && onPressAction ? (
        <Button
          mode="contained"
          style={styles.button}
          onPress={onPressAction}
          loading={actionLoading}
          disabled={actionLoading}
        >
          {actionText}
        </Button>
      ) : null}
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    marginTop: 8,
    color: '#445063',
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#EDF4FF',
  },
  meta: {
    marginTop: 10,
    color: '#677286',
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
  },
});
