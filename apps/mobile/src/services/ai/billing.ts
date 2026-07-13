import { Linking } from 'react-native';
import { callBackend } from './backendClient';

type SubscriptionTier = 'pro' | 'team';

export const openSubscriptionCheckout = async (tier: SubscriptionTier): Promise<void> => {
  const result = await callBackend<{ url: string }>('/api/subscription/checkout', {
    tier,
    successUrl: 'altasai://subscription/success',
    cancelUrl: 'altasai://subscription/cancel',
  });

  if (!result.url) {
    throw new Error('Stripe Checkout URL was not returned.');
  }

  await Linking.openURL(result.url);
};
