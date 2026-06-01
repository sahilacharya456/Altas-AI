import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = false,
  height = 'md',
  color = 'primary',
  label,
}) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clampedProgress * 100);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    accent: 'bg-accent',
  };

  return (
    <View className="w-full">
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-2">
          {label && (
            <Text className="text-text-secondary text-sm">{label}</Text>
          )}
          {showPercentage && (
            <Text className="text-text-secondary text-sm">{percentage}%</Text>
          )}
        </View>
      )}

      <View className={`w-full bg-surface-elevated rounded-full overflow-hidden ${heightClasses[height]}`}>
        <View
          className={`${heightClasses[height]} ${colorClasses[color]} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};
