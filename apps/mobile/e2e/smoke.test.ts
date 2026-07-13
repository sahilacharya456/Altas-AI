/**
 * AltasAI — Detox E2E Smoke Test Suite
 *
 * Covers the 3-step demo flow:
 *   1. App launches → Login screen visible
 *   2. (Mock auth bypass) → Dashboard loads
 *   3. Navigate to Mentor → Input visible and ready
 *
 * Prerequisites:
 *   - Build debug APK: npm run e2e:build --workspace=apps/mobile
 *   - Start emulator: Pixel_6_API_34 (or match .detoxrc.js)
 *   - Run tests:       npm run e2e:test --workspace=apps/mobile
 *
 * Note: Firebase Auth is mocked at the network layer in tests.
 * The app must expose testID attributes on key elements.
 */

import { device, element, by, expect } from 'detox';

describe('AltasAI — Demo Flow Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ----------------------------------------------------------
  // Step 1: App launch → Login screen
  // ----------------------------------------------------------
  it('should display the login screen on cold launch', async () => {
    // The login screen must have testID="login-screen"
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should show the email input on login screen', async () => {
    await expect(element(by.id('login-email-input'))).toBeVisible();
  });

  it('should show the password input on login screen', async () => {
    await expect(element(by.id('login-password-input'))).toBeVisible();
  });

  it('should show the sign-in button', async () => {
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  // ----------------------------------------------------------
  // Step 2: Fill credentials + submit → Dashboard
  // Note: Use a test account seeded in Firestore emulator,
  //       or use Firebase Auth Emulator with test credentials.
  // ----------------------------------------------------------
  it('should navigate to dashboard after login', async () => {
    await element(by.id('login-email-input')).typeText('test@altasai.dev');
    await element(by.id('login-password-input')).typeText('TestPass123!');
    await element(by.id('login-submit-button')).tap();

    // Wait for the dashboard to appear (up to 10s for auth round-trip)
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should show today\'s task summary on dashboard', async () => {
    await expect(element(by.id('dashboard-task-summary'))).toBeVisible();
  });

  // ----------------------------------------------------------
  // Step 3: Navigate to Mentor → Input visible
  // ----------------------------------------------------------
  it('should navigate to mentor screen from bottom nav', async () => {
    // Tap the mentor tab in the bottom navigation bar
    await element(by.id('tab-mentor')).tap();

    await waitFor(element(by.id('mentor-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show the mentor message input', async () => {
    await expect(element(by.id('mentor-message-input'))).toBeVisible();
  });

  it('should show the send button', async () => {
    await expect(element(by.id('mentor-send-button'))).toBeVisible();
  });

  it('should show quick response chips', async () => {
    // At least one quick response chip must exist
    await expect(element(by.id('mentor-quick-chip-0'))).toBeVisible();
  });
});
