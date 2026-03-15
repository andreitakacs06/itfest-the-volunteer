import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeAllTasks, subscribeAllUsers, deleteTaskById, setUserBanStatus } from '../services/adminService';
import { Task, UserProfile } from '../firebase/types';
import { PALETTE, RADIUS, SHADOW_MD, SHADOW_SM } from '../utils/theme';

export const AdminDashboardScreen = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    const unsubscribeUsers = subscribeAllUsers(setUsers);
    const unsubscribeTasks = subscribeAllTasks(setTasks);

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, []);

  const analytics = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const totalUsers = users.length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalUsers,
    };
  }, [tasks, users]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, userSearch]);

  const onDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskById(taskId);
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again later.');
    }
  };

  const toggleBan = async (user: UserProfile) => {
    try {
      await setUserBanStatus(user.id, !user.banned);
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSub}>
              Manage users and tasks
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>
            Analytics
          </Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.totalTasks}</Text>
              <Text style={styles.analyticsLabel}>Total tasks</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.completedTasks}</Text>
              <Text style={styles.analyticsLabel}>Completed</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.totalUsers}</Text>
              <Text style={styles.analyticsLabel}>Users</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Users
        </Text>
        <TextInput
          mode="outlined"
          value={userSearch}
          onChangeText={setUserSearch}
          placeholder="Search users by name"
          style={styles.searchInput}
        />
        <View style={styles.usersPanel}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeaderRow}>
                  <View style={styles.userInfoBlock}>
                    <View style={styles.userInfoRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>
                          {user.name
                            .split(' ')
                            .filter(Boolean)
                            .map((part) => part[0]?.toUpperCase())
                            .slice(0, 2)
                            .join('')}
                        </Text>
                      </View>
                      <View style={styles.userTextBlock}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.userRole}>
                  {user.role} • Hours: {user.credits}
                </Text>
                <Text style={styles.noUsersText}>
                  Completed tasks: {user.completedTasks ?? 0}
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, user.banned && styles.bannedBtn]}
                  onPress={() => toggleBan(user)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionBtnText, user.banned && styles.bannedBtnText]}>
                    {user.banned ? 'Unban User' : 'Ban User'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {filteredUsers.length === 0 ? (
              <Text style={styles.noUsersText}>No users found.</Text>
            ) : null}
          </ScrollView>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>
          Tasks
        </Text>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDesc}>
              {task.status} • {task.credits} h
            </Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDeleteTask(task.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteBtnText}>Delete Task</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.slate50 },

  // Header
  header:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:{ fontSize: 30, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub: { fontSize: 13, color: PALETTE.blue500, marginTop: 2, fontFamily: 'SpaceGrotesk_500Medium' },

  // Scroll
  scroll:        { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },

  // Analytics card
  analyticsCard: {
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
    ...SHADOW_MD,
  },
  analyticsTitle: {
    color: PALETTE.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  analyticsValue: {
    color: PALETTE.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  analyticsLabel: {
    color: '#E5F0FF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'SpaceGrotesk_400Regular',
  },

  searchInput: {
    marginBottom: 8,
    backgroundColor: PALETTE.white,
  },
  usersPanel: {
    maxHeight: 520,
  },

  // User card
  userCard: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    ...SHADOW_SM,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoBlock: {
    flex: 1,
    paddingRight: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E7EEF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#315C8A',
    fontWeight: '700',
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  userTextBlock: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  userEmail: {
    fontSize: 13,
    color: PALETTE.slate500,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 18,
    color: PALETTE.blue700,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 13,
    color: PALETTE.slate600,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 8,
    marginBottom: 12,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: PALETTE.red300,
    backgroundColor: PALETTE.red100,
  },
  actionBtnText: {
    fontSize: 13,
    color: PALETTE.red600,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_500Medium',
    textAlign: 'center',
  },
  bannedBtn: {
    backgroundColor: PALETTE.slate200,
    borderColor: PALETTE.slate200,
  },
  bannedBtnText: {
    color: PALETTE.slate600,
  },

  creditMenu: {
    marginTop: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5ECF4',
    backgroundColor: '#F8FBFF',
    padding: 12,
  },
  creditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.slate700,
    fontFamily: 'SpaceGrotesk_500Medium',
    marginBottom: 8,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: PALETTE.slate50,
    borderRadius: RADIUS.md,
  },
  hoursText: {
    fontSize: 14,
    color: PALETTE.slate700,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  creditAddBtn: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.blue500,
    ...SHADOW_SM,
  },
  creditAddBtnDisabled: {
    backgroundColor: PALETTE.blue400,
    shadowOpacity: 0,
    elevation: 0,
  },
  creditAddBtnText: {
    fontSize: 14,
    color: PALETTE.white,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },

  noUsersText: {
    color: PALETTE.slate500,
    marginVertical: 8,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },

  divider: {
    marginVertical: 16,
  },

  // Task card
  taskCard: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    ...SHADOW_SM,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: PALETTE.slate500,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 12,
  },
  deleteBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: PALETTE.red300,
    backgroundColor: PALETTE.red100,
  },
  deleteBtnText: {
    fontSize: 13,
    color: PALETTE.red600,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_500Medium',
    textAlign: 'center',
  },
});