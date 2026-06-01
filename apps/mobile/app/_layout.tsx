import 'react-native-gesture-handler';
import '../global.css';

import { RootNavigator } from '../src/navigation';
import { AppProviders } from '../src/providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
