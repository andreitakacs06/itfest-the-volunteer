import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useOpenTasks } from '../hooks/useTasks';
import { Task, RequesterType, getTaskHours } from '../firebase/types';
import { getDistanceKm } from '../utils/distance';
import { TASK_RADIUS_KM } from '../utils/constants';
import { PALETTE, RADIUS, SHADOW_LG, SHADOW_SM, TaskCategory } from '../utils/theme';
import { TaskCard } from '../components/TaskCard';
import { FilterChipRow } from '../components/FilterChipRow';
import { CategoryBadge } from '../components/CategoryBadge';
import { RequesterTypeFilterRow } from '../components/RequesterTypeFilterRow';
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
  const [selectedTask,     setSelectedTask]     = useState<Task | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [nearbyMenuVisible, setNearbyMenuVisible] = useState(false);
  const [acceptingTaskId,   setAcceptingTaskId]   = useState<string | null>(null);
  const [categoryFilter,    setCategoryFilter]    = useState<TaskCategory | null>(null);
  const [requesterTypeFilter, setRequesterTypeFilter] = useState<RequesterType | null>(null);
  const [fade] = useState(new Animated.Value(0));

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const load = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        const nextRegion = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        setRegion(nextRegion);
        if (firebaseUser) await updateUserLocation(firebaseUser);
      };
      void load();
      return () => { active = false; };
    }, [firebaseUser])
  );

  const locationForDistance = userLocation ?? region;

  const nearbyTasks = useMemo(() => {
    return tasks.filter((task) => getDistanceKm(locationForDistance, task.location) <= TASK_RADIUS_KM);
  }, [tasks, locationForDistance]);

  const filteredTasks = useMemo(() => {
    let res = nearbyTasks;
    if (categoryFilter) res = res.filter((t) => t.category === categoryFilter);
    if (requesterTypeFilter) res = res.filter((t) => t.creatorType === requesterTypeFilter);
    return res;
  }, [nearbyTasks, categoryFilter, requesterTypeFilter]);

  const markerCoordinates = useMemo(() => {
    const groupedTasks = new Map<string, Task[]>();

    filteredTasks.forEach((task) => {
      const key = `${task.location.latitude.toFixed(5)}:${task.location.longitude.toFixed(5)}`;
      groupedTasks.set(key, [...(groupedTasks.get(key) ?? []), task]);
    });

    const coordinates: Record<string, { latitude: number; longitude: number }> = {};
    groupedTasks.forEach((group) => {
      if (group.length === 1) {
        coordinates[group[0].id] = group[0].location;
        return;
      }

      const radius = 0.00018;
      group.forEach((task, index) => {
        const angle = (2 * Math.PI * index) / group.length;
        coordinates[task.id] = {
          latitude: task.location.latitude + radius * Math.cos(angle),
          longitude: task.location.longitude + radius * Math.sin(angle),
        };
      });
    });

    return coordinates;
  }, [filteredTasks]);

  const selectedDistance = selectedTask
    ? getDistanceKm(locationForDistance, selectedTask.location)
    : undefined;

  const onSelectTask = (task: Task) => {
    setNearbyMenuVisible(false);
    setSelectedMarkerId(task.id);
    setSelectedTask(task);
    fade.setValue(0);
    Animated.spring(fade, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  };

  const closeTaskPanel = () => {
    if (selectedMarkerId) {
      const mapInstance = mapRef.current as (MapView & { deselectMarker?: (id: string) => void }) | null;
      mapInstance?.deselectMarker?.(selectedMarkerId);
    }
    setSelectedTask(null);
    setSelectedMarkerId(null);
  };

  const onAcceptTask = async (task: Task) => {
    if (!firebaseUser) return;
    setAcceptingTaskId(task.id);
    try {
      await acceptTask(task.id, firebaseUser.uid);
      setNearbyMenuVisible(false);
      closeTaskPanel();
    } catch (error) {
      Alert.alert('Could not accept task', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const recenterMap = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 500);
  };

  const markerColor = (task: Task): string => {
    if (task.creatorType === 'juridic')  return '#0EA5E9';
    if (task.creatorType === 'physical') return '#16A34A';
    return '#94A3B8';
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredTasks.map((task) => (
          <Marker
            key={task.id}
            identifier={task.id}
            coordinate={markerCoordinates[task.id] ?? task.location}
            title={task.title}
            description={`${getTaskHours(task)} hours`}
            pinColor={markerColor(task)}
            onPress={() => onSelectTask(task)}
          />
        ))}
      </MapView>

      {/* ── Top overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        {/* Count + list toggle */}
        <View style={styles.countRow}>
          <Pressable
            style={styles.countPill}
            onPress={() => setNearbyMenuVisible((v) => !v)}
          >
            <Text style={styles.countPillIcon}>{nearbyMenuVisible ? '✕' : '📋'}</Text>
            <Text style={styles.countPillText}>
              {filteredTasks.length} nearby{categoryFilter ? ` · ${categoryFilter}` : ''}
            </Text>
          </Pressable>

          {/* Recenter */}
          <Pressable
            style={({ pressed }) => [styles.recenterBtn, pressed && styles.recenterBtnActive]}
            onPress={recenterMap}
          >
            {({ pressed }) => <Text style={[styles.recenterIcon, pressed && styles.recenterIconActive]}>◎</Text>}
          </Pressable>
        </View>

        {/* Category + Requester filter chips */}
        <FilterChipRow selected={categoryFilter} onSelect={setCategoryFilter} />
        <View style={{ marginTop: -4 }}>
          <RequesterTypeFilterRow selected={requesterTypeFilter} onSelect={setRequesterTypeFilter} />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Individual</Text>
          <View style={[styles.legendDot, { backgroundColor: '#0EA5E9' }]} />
          <Text style={styles.legendText}>NGO / Org</Text>
        </View>
      </View>

      {/* ── Nearby tasks panel ── */}
      {nearbyMenuVisible && (
        <View style={[styles.nearbyPanel, { top: insets.top + 120 }]}>
          <View style={styles.nearbyPanelHandle} />
          <Text style={styles.nearbyTitle}>Nearby Tasks</Text>
          {filteredTasks.length === 0 ? (
            <View style={styles.nearbyEmpty}>
              <Text style={styles.nearbyEmptyText}>No tasks nearby right now.</Text>
            </View>
          ) : (
            <ScrollView style={styles.nearbyList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {filteredTasks.map((task) => {
                const dist = getDistanceKm(locationForDistance, task.location);
                const isAccepting = acceptingTaskId === task.id;
                return (
                  <Pressable
                    key={task.id}
                    style={styles.nearbyRow}
                    onPress={() => { setNearbyMenuVisible(false); onSelectTask(task); }}
                  >
                    <View style={styles.nearbyRowLeft}>
                      <CategoryBadge category={task.category} size="sm" />
                      <Text style={styles.nearbyRowTitle} numberOfLines={1}>{task.title}</Text>
                      <Text style={styles.nearbyRowMeta}>
                        {getTaskHours(task)}h · {dist.toFixed(1)} km
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.nearbyAcceptBtn, isAccepting && styles.nearbyAcceptBtnDisabled, pressed && !isAccepting && styles.nearbyAcceptBtnPressed]}
                      onPress={() => void onAcceptTask(task)}
                      disabled={isAccepting}
                    >
                      <Text style={styles.nearbyAcceptText}>{isAccepting ? '…' : 'Accept'}</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Background dismiss for selected task panel ── */}
      {selectedTask && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeTaskPanel} />
      )}

      {/* ── Selected task card (slide up) ── */}
      {selectedTask && (
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fade,
              transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          {/* Requester contact detail strip */}
          {selectedTask.requesterDetails && (
            <View style={styles.contactStrip}>
              {(selectedTask.creatorName || 'organizationName' in selectedTask.requesterDetails) && (
                <Text style={styles.contactText}>
                  👤 {selectedTask.creatorName || (selectedTask.requesterDetails as any).organizationName}
                </Text>
              )}
              {'contactPhone' in selectedTask.requesterDetails && (
                <Text style={styles.contactText}>
                  📞 {selectedTask.requesterDetails.contactPhone}
                  {'  ·  '}
                  🕐 {selectedTask.requesterDetails.preferredTime}
                </Text>
              )}
            </View>
          )}

          <TaskCard
            task={selectedTask}
            distanceKm={selectedDistance}
            actionText="Accept Task"
            onPressAction={() => void onAcceptTask(selectedTask)}
            actionLoading={acceptingTaskId === selectedTask.id}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={closeTaskPanel} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // ── Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  countPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    ...SHADOW_SM,
  },
  countPillIcon: {
    fontSize: 14,
  },
  countPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.slate800,
    fontFamily: 'SpaceGrotesk_500Medium',
    flex: 1,
  },
  recenterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  recenterBtnActive: {
    backgroundColor: PALETTE.blue500,
  },
  recenterIcon: {
    fontSize: 20,
    color: PALETTE.blue500,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  recenterIconActive: {
    color: PALETTE.white,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 20,
    marginBottom: 4,
    gap: 5,
    ...SHADOW_SM,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  legendText: {
    fontSize: 11,
    color: PALETTE.slate600,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginRight: 6,
  },

  // ── Nearby panel
  nearbyPanel: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xxl,
    padding: 16,
    paddingTop: 12,
    maxHeight: 300,
    ...SHADOW_LG,
  },
  nearbyPanelHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: PALETTE.slate200,
    alignSelf: 'center',
    marginBottom: 10,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 10,
  },
  nearbyList: {
    maxHeight: 200,
  },
  nearbyEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  nearbyEmptyText: {
    color: PALETTE.slate400,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 14,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.slate100,
    gap: 10,
  },
  nearbyRowLeft: {
    flex: 1,
    gap: 3,
  },
  nearbyRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  nearbyRowMeta: {
    fontSize: 12,
    color: PALETTE.slate500,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  nearbyAcceptBtn: {
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nearbyAcceptBtnDisabled: {
    backgroundColor: PALETTE.blue400,
  },
  nearbyAcceptBtnPressed: {
    backgroundColor: PALETTE.blue700,
  },
  nearbyAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.white,
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  // ── Selected task card panel
  cardContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    gap: 6,
  },
  contactStrip: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOW_SM,
  },
  contactText: {
    fontSize: 13,
    color: PALETTE.slate700,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  closeBtn: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.90)',
    ...SHADOW_SM,
  },
  closeBtnText: {
    fontSize: 14,
    color: PALETTE.slate600,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});
