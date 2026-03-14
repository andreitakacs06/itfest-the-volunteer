import React, { useMemo, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Button, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useOpenTasks } from '../hooks/useTasks';
import { Task } from '../firebase/types';
import { getDistanceKm } from '../utils/distance';
import { TASK_RADIUS_KM } from '../utils/constants';
import { TaskCard } from '../components/TaskCard';
import { acceptTask } from '../services/taskService';
import { updateUserLocation } from '../services/authService';

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const { firebaseUser } = useAuth();
  const { tasks } = useOpenTasks(firebaseUser?.uid);
  const mapRef = React.useRef<MapView | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [nearbyMenuVisible, setNearbyMenuVisible] = useState(false);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [acceptingTaskId, setAcceptingTaskId] = useState<string | null>(null);
  const [fade] = useState(new Animated.Value(0));

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const load = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) {
          return;
        }
        const nextRegion = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        setRegion(nextRegion);
        if (firebaseUser) {
          await updateUserLocation(firebaseUser);
        }
      };

      void load();
      return () => {
        active = false;
      };
    }, [firebaseUser])
  );

  const locationForDistance = userLocation ?? region;

  const nearbyTasks = useMemo(() => {
    return tasks.filter((task) => {
      const distance = getDistanceKm(locationForDistance, task.location);
      return distance <= TASK_RADIUS_KM;
    });
  }, [tasks, locationForDistance]);

  const selectedDistance = selectedTask ? getDistanceKm(locationForDistance, selectedTask.location) : undefined;

  const onSelectTask = (task: Task) => {
    setNearbyMenuVisible(false);
    setSelectedMarkerId(task.id);
    setSelectedTask(task);
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeTaskPanel = () => {
    if (selectedMarkerId) {
      const mapInstance = mapRef.current as (MapView & { deselectMarker?: (markerId: string) => void }) | null;
      mapInstance?.deselectMarker?.(selectedMarkerId);
    }
    setSelectedTask(null);
    setSelectedMarkerId(null);
  };

  const onAcceptTask = async (task: Task) => {
    if (!firebaseUser) {
      return;
    }

    setLoadingAccept(task.id === selectedTask?.id);
    setAcceptingTaskId(task.id);
    try {
      await acceptTask(task.id, firebaseUser.uid);
      setNearbyMenuVisible(false);
      closeTaskPanel();
    } catch (error) {
      Alert.alert('Could not accept task', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setLoadingAccept(false);
      setAcceptingTaskId(null);
    }
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} provider={PROVIDER_DEFAULT} style={styles.map} region={region} onRegionChangeComplete={setRegion}>
        {userLocation ? <Marker coordinate={userLocation} title="You" pinColor="#0A84FF" /> : null}
        {nearbyTasks.map((task) => (
          <Marker
            key={task.id}
            identifier={task.id}
            coordinate={task.location}
            title={task.title}
            description={`${task.estimatedHours ?? task.credits} hours`}
            pinColor={task.creatorType === 'juridic' ? '#0EA5E9' : task.creatorType === 'physical' ? '#16A34A' : undefined}
            onPress={() => onSelectTask(task)}
          />
        ))}
      </MapView>
      <Pressable
        style={[styles.nearbyBadge, { top: insets.top + 10 }]}
        onPress={() => setNearbyMenuVisible((current) => !current)}
      >
        <Text variant="labelLarge">Nearby requests: {nearbyTasks.length}</Text>
      </Pressable>
      {nearbyMenuVisible ? (
        <Card style={[styles.nearbyMenu, { top: insets.top + 56 }]}>
          <Card.Content>
            <Text variant="titleMedium">Nearby Tasks</Text>
            <ScrollView style={styles.nearbyMenuList} nestedScrollEnabled>
              {nearbyTasks.length === 0 ? (
                <Text style={styles.emptyMenuText}>No nearby tasks right now.</Text>
              ) : (
                nearbyTasks.map((task) => (
                  <View key={task.id} style={styles.nearbyTaskRow}>
                    <View style={styles.nearbyTaskInfo}>
                      <Text variant="bodyLarge">{task.title}</Text>
                      <Text variant="bodySmall" style={styles.nearbyTaskMeta}>
                        {task.estimatedHours ?? task.credits} h
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => void onAcceptTask(task)}
                      loading={acceptingTaskId === task.id}
                      disabled={acceptingTaskId === task.id}
                    >
                      Accept
                    </Button>
                  </View>
                ))
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      ) : null}
      {selectedTask ? (
        <Pressable style={styles.dismissOverlay} onPress={closeTaskPanel} />
      ) : null}
      {selectedTask ? (
        <Animated.View style={[styles.cardContainer, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <TaskCard
            task={selectedTask}
            distanceKm={selectedDistance}
            actionText="Accept Task"
            onPressAction={() => void onAcceptTask(selectedTask)}
            actionLoading={loadingAccept || acceptingTaskId === selectedTask.id}
          />
          <Button mode="text" onPress={closeTaskPanel}>
            Close
          </Button>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  map: {
    flex: 1,
  },
  nearbyBadge: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  nearbyMenu: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    maxHeight: 260,
  },
  nearbyMenuList: {
    marginTop: 8,
    maxHeight: 180,
  },
  emptyMenuText: {
    color: '#667084',
    paddingVertical: 8,
  },
  nearbyTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  nearbyTaskInfo: {
    flex: 1,
    paddingRight: 10,
  },
  nearbyTaskMeta: {
    color: '#667084',
    marginTop: 2,
  },
  cardContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
