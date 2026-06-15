// src/hooks/usePlatform.js
// Detects whether the app is running inside a native Capacitor container (Android/iOS)
// vs a regular web browser. Safe to call on web — returns false for all native flags.
import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';
  const isMobile = isNative; // true on real device, false in browser
  return { platform, isNative, isAndroid, isIOS, isMobile };
}
