import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addUserCredits, subscribeAllTasks, subscribeAllUsers, deleteTaskById, setUserBanStatus } from '../services/adminService';
import { Task, UserProfile } from '../firebase/types';

export const AdminDashboardScreen = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [expandedCreditUserId, setExpandedCreditUserId] = useState<string | null>(null);
  const [submittingCreditUserId, setSubmittingCreditUserId] = useState<string | null>(null);

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

  const onAddCredits = async (user: UserProfile) => {
    if (submittingCreditUserId === user.id) {
      return;
    }

    const amount = user.completedTasks;

    try {
      setSubmittingCreditUserId(user.id);
      await addUserCredits(user.id, amount);
      setExpandedCreditUserId(null);
      Alert.alert('Hours accepted', `${amount} hours were accepted for ${user.name}.`);
    } catch (e) {
      Alert.alert('Review hours failed', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setSubmittingCreditUserId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text variant="headlineSmall">Admin Dashboard</Text>
        <Card style={[styles.card, styles.analyticsCard]}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.analyticsTitle}>
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
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
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
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
            {filteredUsers.map((user) => (
              <Card key={user.id} style={[styles.card, styles.userCard]} mode="contained">
                <Card.Content>
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
                          <Text variant="titleSmall">{user.name}</Text>
                          <Text>{user.email}</Text>
                        </View>
                      </View>
                    </View>
                    <IconButton
                      icon={expandedCreditUserId === user.id ? 'close' : 'plus'}
                      size={20}
                      onPress={() =>
                        setExpandedCreditUserId((current) => (current === user.id ? null : user.id))
                      }
                      style={styles.plusButton}
                      accessibilityLabel="Open review hours"
                      disabled={submittingCreditUserId === user.id}
                    />
                  </View>
                  <Text>
                    {user.role} • Hours: {user.credits}
                  </Text>
                  <Button
                    mode={user.banned ? 'contained' : 'outlined'}
                    icon={user.banned ? 'account-check' : 'account-cancel'}
                    onPress={() => toggleBan(user)}
                    style={[styles.action, user.banned && styles.bannedButton]}
                    labelStyle={user.banned ? styles.bannedButtonLabel : undefined}
                  >
                    {user.banned ? 'Unban User' : 'Ban User'}
                  </Button>
                  {expandedCreditUserId === user.id ? (
                    <View style={styles.creditMenu}>
                      <Text variant="labelLarge">Review hours</Text>
                      <View style={styles.creditRow}>
                        <View style={styles.hoursContainer}>
                          <Text variant="bodyLarge">{user.completedTasks} hours</Text>
                        </View>
                        <Button
                          mode="contained"
                          compact
                          onPress={() => onAddCredits(user)}
                          style={styles.creditAddButton}
                          loading={submittingCreditUserId === user.id}
                          disabled={submittingCreditUserId === user.id}
                        >
                          Accept
                        </Button>
                      </View>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            ))}
            {filteredUsers.length === 0 ? (
              <Text style={styles.noUsersText}>No users found.</Text>
            ) : null}
          </ScrollView>
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Tasks
        </Text>
        {tasks.map((task) => (
          <Card key={task.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall">{task.title}</Text>
              <Text>
                {task.status} • {task.credits} h
              </Text>
              <Button mode="outlined" onPress={() => onDeleteTask(task.id)} style={styles.action}>
                Delete Task
              </Button>
            </Card.Content>
          </Card>
        ))}
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
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  userCard: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#E6ECF3',
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  usersPanel: {
    maxHeight: 520,
  },
  noUsersText: {
    color: '#667084',
    marginVertical: 8,
  },
  action: {
    marginTop: 10,
  },
  bannedButton: {
    backgroundColor: '#9AA5B1',
    borderColor: '#9AA5B1',
  },
  bannedButtonLabel: {
    color: '#FFFFFF',
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
  },
  userTextBlock: {
    marginLeft: 10,
  },
  plusButton: {
    margin: 0,
  },
  analyticsCard: {
    backgroundColor: '#3d92e8',
    borderRadius: 16,
    marginBottom: 10,
  },
  analyticsTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  analyticsValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  analyticsLabel: {
    color: '#E5F0FF',
    fontSize: 12,
    marginTop: 4,
  },
  creditMenu: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5ECF4',
    backgroundColor: '#F8FBFF',
    padding: 10,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  hoursContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#EEF2F5',
    borderRadius: 12,
  },
  creditAddButton: {
    marginLeft: 8,
    borderRadius: 10,
  },
  divider: {
    marginVertical: 10,
  },
});