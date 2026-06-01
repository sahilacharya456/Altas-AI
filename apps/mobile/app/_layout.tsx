import 'react-native-gesture-handler';
import '../global.css';

import { RootNavigator } from '../src/app/navigation';
import { AppProviders } from '../src/app/providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
