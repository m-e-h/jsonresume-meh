/**
 * Error Handler Module
 * Centralized error management system for the JSON Resume Builder
 * Provides user-friendly error display and detailed error reporting
 *
 * @fileoverview This module is designed for browser environments and uses DOM APIs
 * @module ErrorHandler
 * @requires globalThis
 * @requires document - Browser DOM API
 * @requires console - Browser/Node console API
 */

/**
 * Error severity levels enumeration
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = {
	/** Low priority errors - informational */
	LOW: 'low',
	/** Medium priority errors - warnings */
	MEDIUM: 'medium',
	/** High priority errors - significant issues */
	HIGH: 'high',
	/** Critical errors - application breaking */
	CRITICAL: 'critical',
}

/**
 * Error categories for better classification and handling
 * @readonly
 * @enum {string}
 */
export const ErrorCategory = {
	/** Data validation errors */
	VALIDATION: 'validation',
	/** Network and connectivity errors */
	NETWORK: 'network',
	/** Template rendering errors */
	RENDERING: 'rendering',
	/** File system operation errors */
	FILE_SYSTEM: 'file_system',
	/** Template processing errors */
	TEMPLATE: 'template',
	/** Configuration and setup errors */
	CONFIGURATION: 'configuration',
	/** Uncategorized errors */
	UNKNOWN: 'unknown',
}

/**
 * Custom error class for Resume Builder specific errors
 * Extends the native Error class with additional metadata
 * @extends Error
 */
export class ResumeBuilderError extends Error {
	/**
	 * Create a new ResumeBuilderError
	 * @param {string} message - The error message
	 * @param {string} [category=ErrorCategory.UNKNOWN] - Error category
	 * @param {string} [severity=ErrorSeverity.MEDIUM] - Error severity level
	 * @param {Object} [details={}] - Additional error details and context
	 */
	constructor(message, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.MEDIUM, details = {}) {
		super(message)

		/** @type {string} Error name identifier */
		this.name = 'ResumeBuilderError'

		/** @type {string} Error category for classification */
		this.category = category

		/** @type {string} Error severity level */
		this.severity = severity

		/** @type {Object} Additional error details and context */
		this.details = details

		/** @type {string} ISO timestamp when error occurred */
		this.timestamp = new Date().toISOString()

		/** @type {string} User agent string for debugging */
		this.userAgent = typeof navigator === 'undefined' ? 'Unknown' : navigator.userAgent

		/** @type {string} Current page URL when error occurred */
		this.url = globalThis.window === undefined ? 'Unknown' : globalThis.location.href
	}

	/**
	 * Convert error to JSON for logging and reporting
	 * @returns {Object} JSON representation of the error
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
			stack: this.stack,
		}
	}
}

/**
 * Main Error Handler Class
 * Provides centralized error management, user notifications, and logging
 * @class
 */
export class ErrorHandler {
	/**
	 * Create a new ErrorHandler instance
	 * @param {Object} [options={}] - Configuration options
	 * @param {boolean} [options.enableConsoleLogging=true] - Enable console error logging
	 * @param {boolean} [options.enableUserNotifications=true] - Enable user-facing error notifications
	 * @param {boolean} [options.enableErrorReporting=false] - Enable external error reporting
	 * @param {number} [options.maxErrorsToStore=50] - Maximum number of errors to keep in history
	 * @param {number} [options.autoHideDelay=5000] - Auto-hide delay for notifications (milliseconds)
	 */
	constructor(options = {}) {
		/** @type {Object} Configuration options */
		this.options = {
			enableConsoleLogging: true,
			enableUserNotifications: true,
			enableErrorReporting: false,
			maxErrorsToStore: 50,
			autoHideDelay: 5000,
			...options,
		}

		/** @type {ResumeBuilderError[]} Array of recent errors for debugging */
		this.errorHistory = []

		/** @type {HTMLElement|null} DOM container for error notifications */
		this.errorContainer = null

		/** @type {boolean} Whether the error handler has been initialized */
		this.isInitialized = false

		/** @type {Object.<string, number>} Count of errors by severity level */
		this.errorCount = {
			[ErrorSeverity.LOW]: 0,
			[ErrorSeverity.MEDIUM]: 0,
			[ErrorSeverity.HIGH]: 0,
			[ErrorSeverity.CRITICAL]: 0,
		}

		this.init()
	}

	/**
	 * Initialize the error handler
	 * Sets up DOM elements, global error listeners, and styles
	 * @returns {void}
	 */
	init() {
		if (this.isInitialized) {
			return
		}

		// Create error display container
		this.createErrorContainer()

		// Set up global error handlers
		this.setupGlobalErrorHandlers()

		// Initialize styles
		this.initializeStyles()

		this.isInitialized = true
		console.log('✅ Error Handler initialized')
	}

	/**
	 * Create error display container in the DOM
	 * Safely handles server-side rendering environments
	 * @private
	 * @returns {void}
	 */
	createErrorContainer() {
		// Safe check for browser environment
		if (typeof document === 'undefined') {
			return
		}

		this.errorContainer = document.createElement('div')
		this.errorContainer.id = 'error-container'
		this.errorContainer.className = 'error-container'
		this.errorContainer.setAttribute('role', 'alert')
		this.errorContainer.setAttribute('aria-live', 'polite')

		document.body.append(this.errorContainer)
	}

	/**
	 * Set up global error event listeners
	 * Handles unhandled promise rejections, JavaScript errors, and resource loading errors
	 * @private
	 * @returns {void}
	 */
	setupGlobalErrorHandlers() {
		if (globalThis.window === undefined) {
			return
		}

		// Handle unhandled promise rejections
		globalThis.addEventListener('unhandledrejection', event => {
			this.handleError(new ResumeBuilderError(
				`Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
				ErrorCategory.UNKNOWN,
				ErrorSeverity.HIGH,
				{
					reason: event.reason,
					promise: event.promise,
					type: 'unhandledrejection',
				},
			))
		})

		// Handle JavaScript errors
		globalThis.addEventListener('error', event => {
			this.handleError(new ResumeBuilderError(
				`JavaScript Error: ${event.message}`,
				ErrorCategory.UNKNOWN,
				ErrorSeverity.HIGH,
				{
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					error: event.error,
					type: 'javascript',
				},
			))
		})

		// Handle resource loading errors
		globalThis.addEventListener('error', event => {
			if (event.target !== globalThis) {
				this.handleError(new ResumeBuilderError(
					`Resource Loading Error: Failed to load ${event.target.tagName}`,
					ErrorCategory.NETWORK,
					ErrorSeverity.MEDIUM,
					{
						tagName: event.target.tagName,
						src: event.target.src || event.target.href,
						type: 'resource',
					},
				))
			}
		}, true)
	}

	/**
	 * Initialize error display styles by injecting CSS into the document
	 * Safely handles server-side rendering environments
	 * @private
	 * @returns {void}
	 */
	initializeStyles() {
		// Safe check for browser environment
		if (typeof document === 'undefined') {
			return
		}

		const styleId = 'error-handler-styles'
		if (document.querySelector(`#${styleId}`)) {
			return
		}

		const styles = document.createElement('style')
		styles.id = styleId
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
    `

		document.head.append(styles)
	}

	/**
	 * Main error handling method
	 * Processes errors, logs them, shows notifications, and maintains history
	 * @param {Error|ResumeBuilderError} error - The error to handle
	 * @param {Object} [context={}] - Additional context information
	 * @returns {ResumeBuilderError} The processed error object
	 */
	handleError(error, context = {}) {
		// Convert to ResumeBuilderError if needed
		const resumeError = error instanceof ResumeBuilderError
			? error
			: new ResumeBuilderError(
				error.message || 'Unknown error occurred',
				this.categorizeError(error),
				this.determineSeverity(error),
				{originalError: error, ...context},
			)

		// Add to error history
		this.addToHistory(resumeError)

		// Update error counts
		this.errorCount[resumeError.severity]++

		// Console logging
		if (this.options.enableConsoleLogging) {
			this.logError(resumeError)
		}

		// User notifications
		if (this.options.enableUserNotifications) {
			this.showErrorNotification(resumeError)
		}

		// Error reporting (if enabled)
		if (this.options.enableErrorReporting) {
			this.reportError(resumeError)
		}

		return resumeError
	}

	/**
	 * Automatically categorize error based on error type and message content
	 * @private
	 * @param {Error} error - The error to categorize
	 * @returns {string} The determined error category
	 */
	categorizeError(error) {
		const message = error.message?.toLowerCase() || ''
		const name = error.name?.toLowerCase() || ''

		if (name.includes('validation') || message.includes('validation') || message.includes('schema')) {
			return ErrorCategory.VALIDATION
		}

		if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
			return ErrorCategory.NETWORK
		}

		if (message.includes('render') || message.includes('template')) {
			return ErrorCategory.RENDERING
		}

		if (message.includes('file') || message.includes('read') || message.includes('write')) {
			return ErrorCategory.FILE_SYSTEM
		}

		if (message.includes('config') || message.includes('setting')) {
			return ErrorCategory.CONFIGURATION
		}

		return ErrorCategory.UNKNOWN
	}

	/**
	 * Automatically determine error severity based on error content
	 * @private
	 * @param {Error} error - The error to analyze
	 * @returns {string} The determined error severity level
	 */
	determineSeverity(error) {
		const message = error.message?.toLowerCase() || ''

		if (message.includes('critical') || message.includes('fatal')) {
			return ErrorSeverity.CRITICAL
		}

		if (message.includes('validation') || message.includes('required')) {
			return ErrorSeverity.HIGH
		}

		if (message.includes('warning') || message.includes('deprecated')) {
			return ErrorSeverity.LOW
		}

		return ErrorSeverity.MEDIUM
	}

	/**
	 * Add error to history with automatic cleanup of old entries
	 * @private
	 * @param {ResumeBuilderError} error - The error to add to history
	 * @returns {void}
	 */
	addToHistory(error) {
		this.errorHistory.unshift(error)

		// Keep only the most recent errors
		if (this.errorHistory.length > this.options.maxErrorsToStore) {
			this.errorHistory = this.errorHistory.slice(0, this.options.maxErrorsToStore)
		}
	}

	/**
	 * Log error to console with appropriate formatting and method
	 * @private
	 * @param {ResumeBuilderError} error - The error to log
	 * @returns {void}
	 */
	logError(error) {
		const logMethod = this.getConsoleMethod(error.severity)
		const prefix = `[${error.category.toUpperCase()}] [${error.severity.toUpperCase()}]`

		logMethod(`${prefix} ${error.message}`, error)
	}

	/**
	 * Get appropriate console method based on error severity
	 * @private
	 * @param {string} severity - The error severity level
	 * @returns {Function} The appropriate console method
	 */
	getConsoleMethod(severity) {
		switch (severity) {
			case ErrorSeverity.LOW: {
				return console.info
			}

			case ErrorSeverity.MEDIUM: {
				return console.warn
			}

			case ErrorSeverity.HIGH:
			case ErrorSeverity.CRITICAL: {
				return console.error
			}

			default: {
				return console.log
			}
		}
	}

	/**
	 * Display error notification to user with auto-hide functionality
	 * @private
	 * @param {ResumeBuilderError} error - The error to display
	 * @returns {void}
	 */
	showErrorNotification(error) {
		if (!this.errorContainer) {
			return
		}

		const notification = this.createErrorNotification(error)
		this.errorContainer.append(notification)

		// Trigger animation
		setTimeout(() => {
			notification.classList.add('show')
		}, 10)

		// Auto-hide after delay (except for critical errors)
		if (error.severity !== ErrorSeverity.CRITICAL && this.options.autoHideDelay > 0) {
			setTimeout(() => {
				this.hideErrorNotification(notification)
			}, this.options.autoHideDelay)
		}
	}

	/**
	 * Create DOM element for error notification
	 * @private
	 * @param {ResumeBuilderError} error - The error to create notification for
	 * @returns {HTMLElement} The created notification element
	 */
	createErrorNotification(error) {
		const notification = document.createElement('div')
		notification.className = `error-notification error-notification--${error.severity}`
		notification.dataset.errorId = error.timestamp

		const title = this.getErrorTitle(error)
		const message = this.getUserFriendlyMessage(error)
		const details = this.getErrorDetails(error)

		notification.innerHTML = `
      <div class="error-notification__header">
        <h4 class="error-notification__title">${title}</h4>
        <button class="error-notification__close" aria-label="Close error notification">&times;</button>
      </div>
      <p class="error-notification__message">${message}</p>
      ${details ? `<div class="error-notification__details">${details}</div>` : ''}
      <div class="error-notification__timestamp">${new Date(error.timestamp).toLocaleString()}</div>
    `

		// Add close button functionality
		const closeButton = notification.querySelector('.error-notification__close')
		closeButton.addEventListener('click', () => {
			this.hideErrorNotification(notification)
		})

		return notification
	}

	/**
	 * Get user-friendly error title based on error category
	 * @private
	 * @param {ResumeBuilderError} error - The error to get title for
	 * @returns {string} User-friendly error title
	 */
	getErrorTitle(error) {
		const titles = {
			[ErrorCategory.VALIDATION]: 'Validation Error',
			[ErrorCategory.NETWORK]: 'Network Error',
			[ErrorCategory.RENDERING]: 'Display Error',
			[ErrorCategory.FILE_SYSTEM]: 'File Error',
			[ErrorCategory.TEMPLATE]: 'Template Error',
			[ErrorCategory.CONFIGURATION]: 'Configuration Error',
			[ErrorCategory.UNKNOWN]: 'Application Error',
		}

		return titles[error.category] || 'Error'
	}

	/**
	 * Convert technical error messages to user-friendly descriptions
	 * @private
	 * @param {ResumeBuilderError} error - The error to get message for
	 * @returns {string} User-friendly error message
	 */
	getUserFriendlyMessage(error) {
		// Map technical errors to user-friendly messages
		const message = error.message.toLowerCase()

		if (message.includes('json') && message.includes('parse')) {
			return 'Your resume data contains formatting errors. Please check your JSON syntax.'
		}

		if (message.includes('validation')) {
			return 'Some required information is missing or invalid in your resume.'
		}

		if (message.includes('network') || message.includes('fetch')) {
			return 'Unable to load resume data. Please check your internet connection.'
		}

		if (message.includes('template')) {
			return 'There was an issue displaying your resume. The template may be corrupted.'
		}

		return error.message
	}

	/**
	 * Extract and format error details for display
	 * @private
	 * @param {ResumeBuilderError} error - The error to get details for
	 * @returns {string|null} Formatted error details or null if none
	 */
	getErrorDetails(error) {
		if (!error.details || Object.keys(error.details).length === 0) {
			return null
		}

		const details = []

		if (error.details.filename) {
			details.push(`File: ${error.details.filename}`)
		}

		if (error.details.lineno) {
			details.push(`Line: ${error.details.lineno}`)
		}

		if (error.details.validationErrors) {
			details.push(`Validation issues: ${error.details.validationErrors.length}`)
		}

		return details.length > 0 ? details.join(' • ') : null
	}

	/**
	 * Hide error notification with animation
	 * @private
	 * @param {HTMLElement} notification - The notification element to hide
	 * @returns {void}
	 */
	hideErrorNotification(notification) {
		notification.classList.remove('show')
		notification.classList.add('hide')

		setTimeout(() => {
			if (notification.parentElement) {
				notification.remove()
			}
		}, 300)
	}

	/**
	 * Report error to external service (currently just console logging)
	 * @private
	 * @param {ResumeBuilderError} error - The error to report
	 * @returns {void}
	 */
	reportError(error) {
		// Simple console logging for now
		// This could be extended to integrate with services like Sentry, LogRocket, etc.
		console.log('Error reported:', error.toJSON())
	}
}

// Export singleton instance for use throughout the application
export const errorHandler = new ErrorHandler()

export default errorHandler
