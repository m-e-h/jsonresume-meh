/**
 * Unit Tests for Error Handler Module
 * Tests all functionality of the ErrorHandler class and utilities
 */

import {
  ErrorHandler,
  ResumeBuilderError,
  errorHandler,
  ErrorUtils,
  ErrorSeverity,
  ErrorCategory
} from './error-handler.js';

// Mock DOM methods
const mockDocument = {
  createElement: jest.fn(() => ({
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    remove: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  getElementById: jest.fn()
};

const mockWindow = {
  addEventListener: jest.fn(),
  location: {
    href: 'http://localhost:3000'
  }
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)'
};

// Setup global mocks
global.document = mockDocument;
global.window = mockWindow;
global.navigator = mockNavigator;

// Mock console methods to avoid test output clutter
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('ResumeBuilderError', () => {
  test('should create error with default values', () => {
    const error = new ResumeBuilderError('Test error');

    expect(error.name).toBe('ResumeBuilderError');
    expect(error.message).toBe('Test error');
    expect(error.category).toBe(ErrorCategory.UNKNOWN);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.details).toEqual({});
    expect(error.timestamp).toBeDefined();
    expect(error.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    expect(error.url).toBe('http://localhost:3000');
  });

  test('should create error with custom values', () => {
    const details = { field: 'name', value: 'test' };
    const error = new ResumeBuilderError(
      'Validation error',
      ErrorCategory.VALIDATION,
      ErrorSeverity.HIGH,
      details
    );

    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.details).toBe(details);
  });

  test('should have valid ISO timestamp', () => {
    const error = new ResumeBuilderError('Test error');

    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('should convert to JSON correctly', () => {
    const error = new ResumeBuilderError(
      'Test error',
      ErrorCategory.VALIDATION,
      ErrorSeverity.HIGH,
      { field: 'name' }
    );

    const json = error.toJSON();

    expect(json.name).toBe('ResumeBuilderError');
    expect(json.message).toBe('Test error');
    expect(json.category).toBe(ErrorCategory.VALIDATION);
    expect(json.severity).toBe(ErrorSeverity.HIGH);
    expect(json.details).toEqual({ field: 'name' });
    expect(json.timestamp).toBeDefined();
    expect(json.userAgent).toBeDefined();
    expect(json.url).toBeDefined();
    expect(json.stack).toBeDefined();
  });
});

describe('ErrorHandler', () => {
  let handler;
  let mockErrorContainer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock error container
    mockErrorContainer = {
      appendChild: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      id: 'error-container',
      className: 'error-container'
    };

    mockDocument.createElement.mockReturnValue(mockErrorContainer);

    // Create new handler instance
    handler = new ErrorHandler({
      enableConsoleLogging: true,
      enableUserNotifications: true,
      enableErrorReporting: false,
      autoHideDelay: 1000
    });
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default options', () => {
      const defaultHandler = new ErrorHandler();

      expect(defaultHandler.options.enableConsoleLogging).toBe(true);
      expect(defaultHandler.options.enableUserNotifications).toBe(true);
      expect(defaultHandler.options.enableErrorReporting).toBe(false);
      expect(defaultHandler.options.maxErrorsToStore).toBe(50);
      expect(defaultHandler.options.autoHideDelay).toBe(5000);
    });

    test('should merge custom options', () => {
      const customHandler = new ErrorHandler({
        enableErrorReporting: true,
        maxErrorsToStore: 100,
        autoHideDelay: 3000
      });

      expect(customHandler.options.enableErrorReporting).toBe(true);
      expect(customHandler.options.maxErrorsToStore).toBe(100);
      expect(customHandler.options.autoHideDelay).toBe(3000);
      expect(customHandler.options.enableConsoleLogging).toBe(true); // Should keep default
    });

    test('should initialize error statistics', () => {
      expect(handler.errorCount[ErrorSeverity.LOW]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.MEDIUM]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.HIGH]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.CRITICAL]).toBe(0);
      expect(handler.errorHistory).toEqual([]);
    });

    test('should set up global error handlers', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should create error container', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('Error Categorization', () => {
    test('should categorize validation errors', () => {
      const error = new Error('Validation failed');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.VALIDATION);
    });

    test('should categorize network errors', () => {
      const error = new Error('Network request failed');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.NETWORK);
    });

    test('should categorize rendering errors', () => {
      const error = new Error('Template rendering failed');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.RENDERING);
    });

    test('should categorize PDF export errors', () => {
      const error = new Error('PDF generation failed');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.PDF_EXPORT);
    });

    test('should categorize file system errors', () => {
      const error = new Error('File read error');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.FILE_SYSTEM);
    });

    test('should categorize configuration errors', () => {
      const error = new Error('Configuration setting invalid');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.CONFIGURATION);
    });

    test('should default to unknown category', () => {
      const error = new Error('Some random error');
      const category = handler.categorizeError(error);
      expect(category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('Severity Determination', () => {
    test('should determine critical severity', () => {
      const error = new Error('Critical system failure');
      const severity = handler.determineSeverity(error);
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should determine high severity for validation errors', () => {
      const error = new Error('Required field validation failed');
      const severity = handler.determineSeverity(error);
      expect(severity).toBe(ErrorSeverity.HIGH);
    });

    test('should determine low severity for warnings', () => {
      const error = new Error('Warning: deprecated feature');
      const severity = handler.determineSeverity(error);
      expect(severity).toBe(ErrorSeverity.LOW);
    });

    test('should default to medium severity', () => {
      const error = new Error('Some error');
      const severity = handler.determineSeverity(error);
      expect(severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Handling', () => {
    test('should handle standard Error objects', () => {
      const error = new Error('Test error');
      const result = handler.handleError(error);

      expect(result).toBeInstanceOf(ResumeBuilderError);
      expect(result.message).toBe('Test error');
      expect(handler.errorHistory).toHaveLength(1);
      expect(handler.errorCount[result.severity]).toBe(1);
    });

    test('should handle ResumeBuilderError objects', () => {
      const error = new ResumeBuilderError(
        'Test error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.HIGH
      );

      const result = handler.handleError(error);

      expect(result).toBe(error);
      expect(handler.errorHistory).toHaveLength(1);
      expect(handler.errorCount[ErrorSeverity.HIGH]).toBe(1);
    });

    test('should add context to errors', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', data: { id: 1 } };

      const result = handler.handleError(error, context);

      expect(result.details.originalError).toBe('Test error');
      expect(result.details.operation).toBe('test');
      expect(result.details.data).toEqual({ id: 1 });
    });

    test('should limit error history size', () => {
      const smallHandler = new ErrorHandler({ maxErrorsToStore: 3 });

      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        smallHandler.handleError(new Error(`Error ${i}`));
      }

      expect(smallHandler.errorHistory).toHaveLength(3);
      expect(smallHandler.errorHistory[0].message).toBe('Error 4'); // Most recent first
    });
  });

  describe('Console Logging', () => {
    test('should log errors to console when enabled', () => {
      const error = new ResumeBuilderError(
        'Test error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.HIGH
      );

      handler.handleError(error);

      expect(console.error).toHaveBeenCalledWith(
        '[VALIDATION] [HIGH] Test error',
        error
      );
    });

    test('should not log when console logging disabled', () => {
      const quietHandler = new ErrorHandler({ enableConsoleLogging: false });
      const error = new Error('Test error');

      quietHandler.handleError(error);

      expect(console.error).not.toHaveBeenCalled();
    });

    test('should use appropriate console method for severity', () => {
      const lowError = new ResumeBuilderError('Low', ErrorCategory.UNKNOWN, ErrorSeverity.LOW);
      const mediumError = new ResumeBuilderError('Medium', ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM);
      const highError = new ResumeBuilderError('High', ErrorCategory.UNKNOWN, ErrorSeverity.HIGH);
      const criticalError = new ResumeBuilderError('Critical', ErrorCategory.UNKNOWN, ErrorSeverity.CRITICAL);

      handler.handleError(lowError);
      handler.handleError(mediumError);
      handler.handleError(highError);
      handler.handleError(criticalError);

      expect(console.info).toHaveBeenCalledWith('[UNKNOWN] [LOW] Low', lowError);
      expect(console.warn).toHaveBeenCalledWith('[UNKNOWN] [MEDIUM] Medium', mediumError);
      expect(console.error).toHaveBeenCalledWith('[UNKNOWN] [HIGH] High', highError);
      expect(console.error).toHaveBeenCalledWith('[UNKNOWN] [CRITICAL] Critical', criticalError);
    });
  });

  describe('User Notifications', () => {
    test('should create error notification when enabled', () => {
      const error = new ResumeBuilderError('Test error');

      handler.handleError(error);

      expect(mockErrorContainer.appendChild).toHaveBeenCalled();
    });

    test('should not create notification when disabled', () => {
      const quietHandler = new ErrorHandler({ enableUserNotifications: false });
      const error = new Error('Test error');

      quietHandler.handleError(error);

      // Should still create container but not add notifications
      expect(mockDocument.createElement).toHaveBeenCalled();
    });
  });

  describe('Error Statistics', () => {
    test('should track error statistics correctly', () => {
      handler.handleError(new ResumeBuilderError('Error 1', ErrorCategory.VALIDATION, ErrorSeverity.HIGH));
      handler.handleError(new ResumeBuilderError('Error 2', ErrorCategory.NETWORK, ErrorSeverity.MEDIUM));
      handler.handleError(new ResumeBuilderError('Error 3', ErrorCategory.VALIDATION, ErrorSeverity.LOW));

      const stats = handler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.counts[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.counts[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.counts[ErrorSeverity.LOW]).toBe(1);
      expect(stats.categories[ErrorCategory.VALIDATION]).toBe(2);
      expect(stats.categories[ErrorCategory.NETWORK]).toBe(1);
    });

    test('should provide recent errors', () => {
      handler.handleError(new Error('Error 1'));
      handler.handleError(new Error('Error 2'));

      const stats = handler.getErrorStats();

      expect(stats.recent).toHaveLength(2);
      expect(stats.recent[0].message).toBe('Error 2'); // Most recent first
    });
  });

  describe('Cleanup and Reset', () => {
    test('should clear all notifications', () => {
      const mockNotifications = [
        { classList: { remove: jest.fn(), add: jest.fn() }, parentElement: { removeChild: jest.fn() } },
        { classList: { remove: jest.fn(), add: jest.fn() }, parentElement: { removeChild: jest.fn() } }
      ];

      handler.errorContainer = {
        querySelectorAll: jest.fn(() => mockNotifications)
      };

      handler.clearAllNotifications();

      mockNotifications.forEach(notification => {
        expect(notification.classList.remove).toHaveBeenCalledWith('show');
        expect(notification.classList.add).toHaveBeenCalledWith('hide');
      });
    });

    test('should reset error handler state', () => {
      // Add some errors
      handler.handleError(new Error('Error 1'));
      handler.handleError(new Error('Error 2'));

      // Reset
      handler.reset();

      expect(handler.errorHistory).toHaveLength(0);
      expect(handler.errorCount[ErrorSeverity.LOW]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.MEDIUM]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.HIGH]).toBe(0);
      expect(handler.errorCount[ErrorSeverity.CRITICAL]).toBe(0);
    });
  });
});

describe('ErrorUtils', () => {
  test('should create validation error', () => {
    const error = ErrorUtils.createValidationError('Invalid field', 'name', 'test');

    expect(error).toBeInstanceOf(ResumeBuilderError);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.details.field).toBe('name');
    expect(error.details.value).toBe('test');
    expect(error.details.type).toBe('validation');
  });

  test('should create network error', () => {
    const error = ErrorUtils.createNetworkError('Request failed', '/api/data', 404);

    expect(error).toBeInstanceOf(ResumeBuilderError);
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.details.url).toBe('/api/data');
    expect(error.details.status).toBe(404);
    expect(error.details.type).toBe('network');
  });

  test('should create rendering error', () => {
    const error = ErrorUtils.createRenderingError('Render failed', 'modern', { name: 'test' });

    expect(error).toBeInstanceOf(ResumeBuilderError);
    expect(error.category).toBe(ErrorCategory.RENDERING);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.details.template).toBe('modern');
    expect(error.details.data).toEqual({ name: 'test' });
    expect(error.details.type).toBe('rendering');
  });

  describe('Function Wrapping', () => {
    test('should wrap async function with error handling', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = ErrorUtils.wrapAsync(mockFn, 'test operation');

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should handle async function errors', async () => {
      const mockError = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      const wrappedFn = ErrorUtils.wrapAsync(mockFn, 'test operation');

      await expect(wrappedFn()).rejects.toThrow('Async error');
      expect(errorHandler.errorHistory).toHaveLength(1);
      expect(errorHandler.errorHistory[0].details.context).toBe('test operation');
    });

    test('should wrap sync function with error handling', () => {
      const mockFn = jest.fn().mockReturnValue('success');
      const wrappedFn = ErrorUtils.wrap(mockFn, 'test operation');

      const result = wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should handle sync function errors', () => {
      const mockError = new Error('Sync error');
      const mockFn = jest.fn().mockImplementation(() => { throw mockError; });
      const wrappedFn = ErrorUtils.wrap(mockFn, 'test operation');

      expect(() => wrappedFn()).toThrow('Sync error');
      expect(errorHandler.errorHistory).toHaveLength(1);
      expect(errorHandler.errorHistory[0].details.context).toBe('test operation');
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete error workflow', () => {
    const error = new Error('Integration test error');

    const result = errorHandler.handleError(error, {
      operation: 'integration test',
      component: 'test suite'
    });

    expect(result).toBeInstanceOf(ResumeBuilderError);
    expect(result.details.operation).toBe('integration test');
    expect(result.details.component).toBe('test suite');
    expect(errorHandler.errorHistory).toContain(result);
  });

  test('should handle multiple errors of different types', () => {
    const errors = [
      new Error('Validation error in form'),
      new Error('Network connection failed'),
      new Error('PDF generation error'),
      new Error('Template rendering failed')
    ];

    errors.forEach(error => errorHandler.handleError(error));

    const stats = errorHandler.getErrorStats();
    expect(stats.total).toBe(4);
    expect(stats.categories[ErrorCategory.VALIDATION]).toBe(1);
    expect(stats.categories[ErrorCategory.NETWORK]).toBe(1);
    expect(stats.categories[ErrorCategory.PDF_EXPORT]).toBe(1);
    expect(stats.categories[ErrorCategory.RENDERING]).toBe(1);
  });
});

describe('Performance Tests', () => {
  test('should handle large number of errors efficiently', () => {
    const startTime = Date.now();

    // Generate many errors
    for (let i = 0; i < 1000; i++) {
      errorHandler.handleError(new Error(`Error ${i}`));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);

    // Should respect max error limit
    expect(errorHandler.errorHistory.length).toBeLessThanOrEqual(50);
  });

  test('should handle rapid error bursts', () => {
    const errors = Array.from({ length: 100 }, (_, i) => new Error(`Burst error ${i}`));

    const startTime = Date.now();
    errors.forEach(error => errorHandler.handleError(error));
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // Should be very fast
  });
});

describe('Error Reporting', () => {
  test('should call reportError when enabled', () => {
    const reportingHandler = new ErrorHandler({ enableErrorReporting: true });
    const spy = jest.spyOn(reportingHandler, 'reportError');

    const error = new Error('Test error');
    reportingHandler.handleError(error);

    expect(spy).toHaveBeenCalled();
  });

  test('should not call reportError when disabled', () => {
    const handler = new ErrorHandler({ enableErrorReporting: false });
    const spy = jest.spyOn(handler, 'reportError');

    const error = new Error('Test error');
    handler.handleError(error);

    expect(spy).not.toHaveBeenCalled();
  });
});