/**
 * Centralized demo mode configuration
 * Returns true if the application should run in demo mode (using test data instead of API calls)
 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

/**
 * Log demo mode status for debugging
 */
export const logDemoModeStatus = (component: string): void => {
  const demoMode = isDemoMode();
  console.log(`🔧 ${component}: Demo Mode = ${demoMode ? 'ENABLED' : 'DISABLED'}`);
};
