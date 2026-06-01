import React from 'react';
import { Text, View } from 'react-native';

import { styles } from './homeStyles';

interface HomeStatPillProps {
  label: string;
  value: string;
}

export function HomeStatPill({ label, value }: HomeStatPillProps) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}
