import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' as const },
  displayMedium: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' as const },
  displaySmall: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' as const },
  headlineLarge: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' as const },
  headlineMedium: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  headlineSmall: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleLarge: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleMedium: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleSmall: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  bodyLarge: { fontFamily: 'SpaceGrotesk_400Regular', fontWeight: '400' as const },
  bodyMedium: { fontFamily: 'SpaceGrotesk_400Regular', fontWeight: '400' as const },
  bodySmall: { fontFamily: 'SpaceGrotesk_400Regular', fontWeight: '400' as const },
  labelLarge: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  labelMedium: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  labelSmall: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0A84FF',
    secondary: '#4AA3FF',
    tertiary: '#0B6BCB',
    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    outline: '#D7DEE7',
    onSurfaceVariant: '#4A5568',
  },
};
