import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../utils/haptics';

interface SelectCardProps {
  title: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  recommended?: boolean;
  color?: string;
  onPress?: () => void;
}

export const SelectCard: React.FC<SelectCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  recommended = false,
  color,
  onPress,
}) => {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      safeImpactAsync(ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const borderColor = selected ? 'border-primary' : 'border-border';
  const bgColor = selected ? 'bg-surface-elevated' : 'bg-surface';

  return (
    <TouchableOpacity
      className={`${bgColor} ${borderColor} border-2 rounded-2xl p-4 relative overflow-hidden`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Colored accent bar when selected */}
      {selected && color && (
        <View
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Recommended badge */}
      {recommended && (
        <View className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-full">
          <Text className="text-white text-2xs font-semibold">RECOMMENDED</Text>
        </View>
      )}

      <View className="flex-row items-start">
        {icon && (
          <Text className="text-2xl mr-3">{icon}</Text>
        )}

        <View className="flex-1">
          <Text className="text-text font-semibold text-lg">{title}</Text>
          {description && (
            <Text className="text-text-secondary text-sm mt-1">{description}</Text>
          )}
        </View>

        {/* Selection indicator */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-3 ${selected ? 'border-primary bg-primary' : 'border-border'
            }`}
        >
          {selected && (
            <View className="w-2 h-2 bg-white rounded-full" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
