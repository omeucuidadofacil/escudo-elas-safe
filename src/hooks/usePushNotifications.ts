import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') {
          console.warn('Push permission denied');
          return;
        }

        await LocalNotifications.requestPermissions();
        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('FCM token:', token.value);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('device_tokens').upsert(
            {
              user_id: user.id,
              token: token.value,
              platform: Capacitor.getPlatform(),
            },
            { onConflict: 'token' }
          );
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('Push received (foreground):', notification);
          await LocalNotifications.schedule({
            notifications: [{
              id: Date.now() % 100000,
              title: notification.title || '🚨 ALERTA SOS',
              body: notification.body || 'Uma pessoa próxima precisa de ajuda!',
              sound: 'default',
              extra: notification.data,
            }],
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push tapped:', action);
          const url = action.notification?.data?.url;
          if (url) window.location.href = url;
        });
      } catch (e) {
        console.error('Push init error:', e);
      }
    };

    init();
  }, []);
};
