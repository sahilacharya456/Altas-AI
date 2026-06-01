export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error instanceof Error && error.message.trim()) {
    return formatUserFacingError(error.message);
  }

  if (typeof error === 'string' && error.trim()) {
    return formatUserFacingError(error);
  }

  return fallback;
};

export const formatUserFacingError = (message: string): string => {
  const normalized = message.trim();

  if (
    normalized.includes('The query requires an index') ||
    normalized.includes('firestore/indexes') ||
    normalized.includes('FAILED_PRECONDITION')
  ) {
    return 'AltasAI could not load this signal because the local data query needs adjustment. Try again after the latest update reloads.';
  }

  if (normalized.includes('Missing or insufficient permissions')) {
    return 'Cloud save was blocked by Firebase permissions. Sign in again, or deploy the latest Firestore rules for this project.';
  }

  if (normalized.includes('Firebase') && normalized.includes('network')) {
    return 'AltasAI could not reach Firebase. Check the connection and try again.';
  }

  return normalized;
};
