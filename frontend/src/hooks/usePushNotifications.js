// frontend/src/hooks/usePushNotifications.js
// Custom hook to register and manage push notification subscriptions

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = "https://campuswap.onrender.com";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function usePushNotifications(user) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'granted') {
      registerServiceWorkerAndSubscribe();
    }
  }, [user]);

  const registerServiceWorkerAndSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { data } = await axios.get(`${API_URL}/api/push/vapid-public-key`);
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      // Send subscription to backend
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/push/subscribe`,
        { subscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await registerServiceWorkerAndSubscribe();
    }
  };

  return { permission, subscribed, requestPermission };
}
