import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text } from 'react-native-paper';
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
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Analytics</Text>
            <Text>Total tasks: {analytics.totalTasks}</Text>
            <Text>Completed tasks: {analytics.completedTasks}</Text>
            <Text>Number of users: {analytics.totalUsers}</Text>
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
                      <Text variant="titleSmall">{user.name}</Text>
                      <Text>{user.email}</Text>
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
                    {user.role} • credits: {user.credits} • streak: {user.dailyStreak}
                  </Text>
                  <Button mode="outlined" onPress={() => toggleBan(user)} style={styles.action}>
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
                {task.status} • {task.credits} credits • {task.difficulty}
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
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoBlock: {
    flex: 1,
    paddingRight: 8,
  },
  plusButton: {
    margin: 0,
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
    backgroundColor: '#F0F0F0',
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