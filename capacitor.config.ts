import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a658cbe063414243949a54a62e296d1c',
  appName: 'Valkyra',
  webDir: 'dist',
  server: {
    url: 'https://a658cbe0-6341-4243-949a-54a62e296d1c.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
