import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { radius } from '@/theme/radius';

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  borderRadius?: number;
  highlightColor?: string;
  showSpecularBorder?: boolean;
}

export function GlassCard({
  intensity,
  borderRadius = radius.xxl,
  highlightColor,
  showSpecularBorder = true,
  style,
  children,
  ...props
}: GlassCardProps) {
  const { isDark } = useTheme();

  const defaultIntensity = intensity ?? (isDark ? 35 : 55);

  const containerStyle: ViewStyle = {
    borderRadius,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
    backgroundColor: isDark ? 'rgba(18, 24, 38, 0.58)' : 'rgba(255, 255, 255, 0.68)',
    ...(isDark
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.45,
          shadowRadius: 28,
          elevation: 8,
        }
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 22,
          elevation: 4,
        }),
  };

  return (
    <View style={[containerStyle, style]} {...props}>
      {/* Native Blur Backdrop */}
      <BlurView
        intensity={defaultIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Top subtle specular highlight accent line with tapered gradient */}
      {showSpecularBorder && (
        <LinearGradient
          colors={[
            'transparent',
            highlightColor || (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.95)'),
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
          style={styles.specularHighlight}
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
  },
});
