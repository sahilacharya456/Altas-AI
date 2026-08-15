/**
 * Tests for the centralized logger utility.
 */

// Mock __DEV__ as true for testing
(global as Record<string, unknown>).__DEV__ = true;

import { logger } from '../utils/logger';

describe('logger', () => {
  const consoleSpy = {
    debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
    info: jest.spyOn(console, 'info').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('logs debug messages', () => {
    logger.debug('debug message', { key: 'value' }, 'TestContext');
    expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
    expect(consoleSpy.debug.mock.calls[0][0]).toContain('[AltasAI:TestContext]');
    expect(consoleSpy.debug.mock.calls[0][0]).toContain('debug message');
  });

  it('logs info messages', () => {
    logger.info('info message');
    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
  });

  it('logs warn messages with data', () => {
    logger.warn('warn message', new Error('test'), 'Store');
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
  });

  it('logs error messages', () => {
    logger.error('error message', { detail: 'some detail' });
    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
  });

  it('uses App as default context', () => {
    logger.info('no context message');
    expect(consoleSpy.info.mock.calls[0][0]).toContain('[AltasAI:App]');
  });
});
