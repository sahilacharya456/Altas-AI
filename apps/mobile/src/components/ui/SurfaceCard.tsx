import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { GlassCard } from './GlassCard';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}

export const SurfaceCard = ({
  children,
  style,
  padding = 'md',
  elevated = false,
  pressable = false,
  onPress,
}: SurfaceCardProps) => (
  <GlassCard
    variant={elevated ? 'elevated' : 'surface'}
    padding={padding}
    pressable={pressable}
    onPress={onPress}
    style={style}
  >
    {children}
  </GlassCard>
);
