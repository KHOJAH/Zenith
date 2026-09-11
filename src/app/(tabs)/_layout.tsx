import React from 'react';
import { Tabs } from 'expo-router';
import { ZenithTabBar } from '@/components/ZenithTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <ZenithTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="quick-add" options={{ title: 'Quick Add' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Tabs>
  );
}
