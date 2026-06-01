import React from 'react';

import { GradientButton } from './GradientButton';

type GradientButtonProps = React.ComponentProps<typeof GradientButton>;

export const SecondaryButton = (props: Omit<GradientButtonProps, 'variant'>) => (
  <GradientButton {...props} variant="secondary" />
);
