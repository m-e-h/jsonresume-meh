/**
 * Error Handler Module
 * Centralized error management system for the JSON Resume Builder
 * Provides user-friendly error display and detailed error reporting
 */

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error categories for better classification
 */
export const ErrorCategory = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  RENDERING: 'rendering',
  PDF_EXPORT: 'pdf_export',
  FILE_SYSTEM: 'file_system',
  TEMPLATE: 'template',
  CONFIGURATION: 'configuration',
  UNKNOWN: 'unknown'
};

/**
 * Custom error class for Resume Builder errors
 */
export class ResumeBuilderError extends Error {
  constructor(message, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.MEDIUM, details = {}) {
    super(message);
    this.name = 'ResumeBuilderError';
    this.category = category;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    this.url = typeof window !== 'undefined' ? window.location.href : 'Unknown';
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      userAgent: this.userAgent,
      url: this.url,
      stack: this.stack
    };
  }
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableConsoleLogging: true,
      enableUserNotifications: true,
      enableErrorReporting: false,
      maxErrorsToStore: 50,
      autoHideDelay: 5000,
      ...options
    };

    this.errorHistory = [];
    this.errorContainer = null;
    this.isInitialized = false;
    this.errorCount = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    this.init();
  }

  /**
   * Initialize error handler
   */
  init() {
    if (this.isInitialized) return;

    // Create error display container
    this.createErrorContainer();

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Initialize styles
    this.initializeStyles();

    this.isInitialized = true;
    console.log('✅ Error Handler initialized');
  }

  /**
   * Create error display container
   */
  createErrorContainer() {
    if (typeof document === 'undefined') return;

    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'error-container';
    this.errorContainer.className = 'error-container';
    this.errorContainer.setAttribute('role', 'alert');
    this.errorContainer.setAttribute('aria-live', 'polite');

    document.body.appendChild(this.errorContainer);
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new ResumeBuilderError(
          `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
          ErrorCategory.UNKNOWN,
          ErrorSeverity.HIGH,
          {
            reason: event.reason,
            promise: event.promise,
            type: 'unhandledrejection'
          }
        )
      );
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new ResumeBuilderError(
          `JavaScript Error: ${event.message}`,
          ErrorCategory.UNKNOWN,
          ErrorSeverity.HIGH,
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            type: 'javascript'
          }
        )
      );
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(
          new ResumeBuilderError(
            `Resource Loading Error: Failed to load ${event.target.tagName}`,
            ErrorCategory.NETWORK,
            ErrorSeverity.MEDIUM,
            {
              tagName: event.target.tagName,
              src: event.target.src || event.target.href,
              type: 'resource'
            }
          )
        );
      }
    }, true);
  }

  /**
   * Initialize error display styles
   */
  initializeStyles() {
    if (typeof document === 'undefined') return;

    const styleId = 'error-handler-styles';
    if (document.getElementById(styleId)) return;

    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .error-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      }

      .error-notification {
        background: #fff;
        border-left: 4px solid #dc3545;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 10px;
        padding: 16px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        opacity: 0;
        position: relative;
        word-wrap: break-word;
      }

      .error-notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .error-notification.hide {
        transform: translateX(100%);
        opacity: 0;
      }

      .error-notification--low {
        border-left-color: #17a2b8;
      }

      .error-notification--medium {
        border-left-color: #ffc107;
      }

      .error-notification--high {
        border-left-color: #fd7e14;
      }

      .error-notification--critical {
        border-left-color: #dc3545;
        background: #f8d7da;
      }

      .error-notification__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .error-notification__title {
        font-weight: 600;
        font-size: 14px;
        color: #333;
        margin: 0;
      }

      .error-notification__close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        margin-left: 10px;
        line-height: 1;
      }

      .error-notification__close:hover {
        color: #333;
      }

      .error-notification__message {
        font-size: 13px;
        color: #555;
        margin: 0 0 8px 0;
        line-height: 1.4;
      }

      .error-notification__details {
        font-size: 12px;
        color: #777;
        margin: 0;
        padding-top: 8px;
        border-top: 1px solid #eee;
      }

      .error-notification__timestamp {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }

      .error-notification__actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
      }

      .error-notification__action {
        background: #007bff;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }

      .error-notification__action:hover {
        background: #0056b3;
        color: white;
      }

      .error-notification__action--secondary {
        background: #6c757d;
      }

      .error-notification__action--secondary:hover {
        background: #545b62;
      }

      @media (max-width: 480px) {
        .error-container {
          left: 10px;
          right: 10px;
          top: 10px;
          max-width: none;
        }

        .error-notification {
          margin-bottom: 8px;
          padding: 12px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Handle an error
   * @param {Error|ResumeBuilderError} error - The error to handle
   * @param {Object} context - Additional context
   */
  handleError(error, context = {}) {
    // Convert to ResumeBuilderError if needed
    const resumeError = error instanceof ResumeBuilderError ?
      error :
      new ResumeBuilderError(
        error.message || 'Unknown error occurred',
        this.categorizeError(error),
        this.determineSeverity(error),
        { originalError: error, ...context }
      );

    // Add to error history
    this.addToHistory(resumeError);

    // Update error counts
    this.errorCount[resumeError.severity]++;

    // Console logging
    if (this.options.enableConsoleLogging) {
      this.logError(resumeError);
    }

    // User notifications
    if (this.options.enableUserNotifications) {
      this.showErrorNotification(resumeError);
    }

    // Error reporting (if enabled)
    if (this.options.enableErrorReporting) {
      this.reportError(resumeError);
    }

    return resumeError;
  }

  /**
   * Categorize error based on error type and message
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    if (name.includes('validation') || message.includes('validation') || message.includes('schema')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('render') || message.includes('template')) {
      return ErrorCategory.RENDERING;
    }
    if (message.includes('pdf') || name.includes('pdf')) {
      return ErrorCategory.PDF_EXPORT;
    }
    if (message.includes('file') || message.includes('read') || message.includes('write')) {
      return ErrorCategory.FILE_SYSTEM;
    }
    if (message.includes('config') || message.includes('setting')) {
      return ErrorCategory.CONFIGURATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('validation') || message.includes('required')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Add error to history
   */
  addToHistory(error) {
    this.errorHistory.unshift(error);

    // Keep only the most recent errors
    if (this.errorHistory.length > this.options.maxErrorsToStore) {
      this.errorHistory = this.errorHistory.slice(0, this.options.maxErrorsToStore);
    }
  }

  /**
   * Log error to console
   */
  logError(error) {
    const logMethod = this.getConsoleMethod(error.severity);
    const prefix = `[${error.category.toUpperCase()}] [${error.severity.toUpperCase()}]`;

    logMethod(`${prefix} ${error.message}`, error);
  }

  /**
   * Get appropriate console method for severity
   */
  getConsoleMethod(severity) {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(error) {
    if (!this.errorContainer) return;

    const notification = this.createErrorNotification(error);
    this.errorContainer.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto-hide after delay (except for critical errors)
    if (error.severity !== ErrorSeverity.CRITICAL && this.options.autoHideDelay > 0) {
      setTimeout(() => {
        this.hideErrorNotification(notification);
      }, this.options.autoHideDelay);
    }
  }

  /**
   * Create error notification element
   */
  createErrorNotification(error) {
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification--${error.severity}`;
    notification.setAttribute('data-error-id', error.timestamp);

    const title = this.getErrorTitle(error);
    const message = this.getUserFriendlyMessage(error);
    const details = this.getErrorDetails(error);

    notification.innerHTML = `
      <div class="error-notification__header">
        <h4 class="error-notification__title">${title}</h4>
        <button class="error-notification__close" aria-label="Close error notification">&times;</button>
      </div>
      <p class="error-notification__message">${message}</p>
      ${details ? `<div class="error-notification__details">${details}</div>` : ''}
      <div class="error-notification__timestamp">${new Date(error.timestamp).toLocaleString()}</div>
    `;

    // Add close button functionality
    const closeButton = notification.querySelector('.error-notification__close');
    closeButton.addEventListener('click', () => {
      this.hideErrorNotification(notification);
    });

    return notification;
  }

  /**
   * Get user-friendly error title
   */
  getErrorTitle(error) {
    const titles = {
      [ErrorCategory.VALIDATION]: 'Validation Error',
      [ErrorCategory.NETWORK]: 'Network Error',
      [ErrorCategory.RENDERING]: 'Display Error',
      [ErrorCategory.PDF_EXPORT]: 'PDF Export Error',
      [ErrorCategory.FILE_SYSTEM]: 'File Error',
      [ErrorCategory.TEMPLATE]: 'Template Error',
      [ErrorCategory.CONFIGURATION]: 'Configuration Error',
      [ErrorCategory.UNKNOWN]: 'Application Error'
    };

    return titles[error.category] || 'Error';
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error) {
    // Map technical errors to user-friendly messages
    const message = error.message.toLowerCase();

    if (message.includes('json') && message.includes('parse')) {
      return 'Your resume data contains formatting errors. Please check your JSON syntax.';
    }
    if (message.includes('validation')) {
      return 'Some required information is missing or invalid in your resume.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to load resume data. Please check your internet connection.';
    }
    if (message.includes('pdf')) {
      return 'Failed to generate PDF. Please try again or use the print function.';
    }
    if (message.includes('template')) {
      return 'There was an issue displaying your resume. The template may be corrupted.';
    }

    return error.message;
  }

  /**
   * Get error details for display
   */
  getErrorDetails(error) {
    if (!error.details || Object.keys(error.details).length === 0) {
      return null;
    }

    const details = [];

    if (error.details.filename) {
      details.push(`File: ${error.details.filename}`);
    }
    if (error.details.lineno) {
      details.push(`Line: ${error.details.lineno}`);
    }
    if (error.details.validationErrors) {
      details.push(`Validation issues: ${error.details.validationErrors.length}`);
    }

    return details.length > 0 ? details.join(' • ') : null;
  }

  /**
   * Hide error notification
   */
  hideErrorNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');

    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Report error to external service (if configured)
   */
  reportError(error) {
    // This would integrate with error reporting services like Sentry, LogRocket, etc.
    console.log('Error reported:', error.toJSON());
  }

  /**
   * Clear all error notifications
   */
  clearAllNotifications() {
    if (!this.errorContainer) return;

    const notifications = this.errorContainer.querySelectorAll('.error-notification');
    notifications.forEach(notification => {
      this.hideErrorNotification(notification);
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      total: this.errorHistory.length,
      counts: { ...this.errorCount },
      recent: this.errorHistory.slice(0, 10),
      categories: this.getErrorsByCategory(),
      severities: this.getErrorsBySeverity()
    };
  }

  /**
   * Get errors grouped by category
   */
  getErrorsByCategory() {
    const categories = {};
    this.errorHistory.forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Get errors grouped by severity
   */
  getErrorsBySeverity() {
    const severities = {};
    this.errorHistory.forEach(error => {
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    });
    return severities;
  }

  /**
   * Reset error handler state
   */
  reset() {
    this.errorHistory = [];
    this.errorCount = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };
    this.clearAllNotifications();
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export utility functions
export const ErrorUtils = {
  /**
   * Create a validation error
   */
  createValidationError(message, field, value) {
    return new ResumeBuilderError(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.HIGH,
      { field, value, type: 'validation' }
    );
  },

  /**
   * Create a network error
   */
  createNetworkError(message, url, status) {
    return new ResumeBuilderError(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      { url, status, type: 'network' }
    );
  },

  /**
   * Create a rendering error
   */
  createRenderingError(message, template, data) {
    return new ResumeBuilderError(
      message,
      ErrorCategory.RENDERING,
      ErrorSeverity.MEDIUM,
      { template, data, type: 'rendering' }
    );
  },

  /**
   * Wrap async function with error handling
   */
  wrapAsync(fn, context = 'Unknown operation') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        errorHandler.handleError(error, { context, args });
        throw error;
      }
    };
  },

  /**
   * Wrap function with error handling
   */
  wrap(fn, context = 'Unknown operation') {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        errorHandler.handleError(error, { context, args });
        throw error;
      }
    };
  }
};

export default errorHandler;