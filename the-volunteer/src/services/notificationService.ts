import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (uid: string) => {
  if (!Device.isDevice) {
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== 'granted') {
    return;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  const value = typeof token.data === 'string' ? token.data : '';
  if (!value) {
    return;
  }

  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayUnion(value),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
};
