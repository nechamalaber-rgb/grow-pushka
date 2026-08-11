import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jewishgreenbush.growpushka',
  appName: 'Grow Pushka',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
