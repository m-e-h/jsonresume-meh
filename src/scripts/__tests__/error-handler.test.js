/**
 * Unit Tests for Error Handler Module
 * Tests error handling, categorization, and notification functionality
 */

import {jest} from '@jest/globals'
import {
	ErrorHandler,
	ResumeBuilderError,
	errorHandler,
	ErrorUtils,
	ErrorSeverity,
	ErrorCategory,
} from '../error-handler.js'

// Test utilities
const createMockElement = (overrides = {}) => ({
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
	classList: {add: jest.fn(), remove: jest.fn()},
	...overrides,
})

const setupDOMmocks = () => {
	globalThis.document = {
		createElement: jest.fn(() => createMockElement()),
		body: {appendChild: jest.fn(), removeChild: jest.fn()},
		head: {appendChild: jest.fn(), removeChild: jest.fn()},
		getElementById: jest.fn(),
	}

	globalThis.window = {
		addEventListener: jest.fn(),
		location: {href: 'http://localhost/'},
	}

	globalThis.navigator = {
		userAgent: 'Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/26.1.0',
	}
}

// Suppress console output during tests
const setupConsoleMocks = () => {
	const originalConsole = {...console}
	beforeAll(() => {
		console.log = jest.fn()
		console.warn = jest.fn()
		console.error = jest.fn()
		console.info = jest.fn()
	})
	afterAll(() => Object.assign(console, originalConsole))
}

describe('ResumeBuilderError', () => {
	setupConsoleMocks()

	test('should create error with correct properties', () => {
		const error = new ResumeBuilderError('Test error')

		expect(error.name).toBe('ResumeBuilderError')
		expect(error.message).toBe('Test error')
		expect(error.category).toBe(ErrorCategory.UNKNOWN)
		expect(error.severity).toBe(ErrorSeverity.MEDIUM)
		expect(error.details).toEqual({})
		expect(error.timestamp).toBeDefined()
		expect(error.userAgent).toBe('Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/26.1.0')
		expect(error.url).toBe('http://localhost/')
	})

	test('should create error with custom values', () => {
		const details = {field: 'name', value: 'test'}
		const error = new ResumeBuilderError(
			'Validation error',
			ErrorCategory.VALIDATION,
			ErrorSeverity.HIGH,
			details,
		)

		expect(error.category).toBe(ErrorCategory.VALIDATION)
		expect(error.severity).toBe(ErrorSeverity.HIGH)
		expect(error.details).toBe(details)
	})

	test('should convert to JSON correctly', () => {
		const error = new ResumeBuilderError('Test error', ErrorCategory.VALIDATION)
		const json = error.toJSON()

		expect(json.name).toBe('ResumeBuilderError')
		expect(json.message).toBe('Test error')
		expect(json.category).toBe(ErrorCategory.VALIDATION)
		expect(json.timestamp).toBeDefined()
		expect(json.stack).toBeDefined()
	})
})

describe('ErrorHandler', () => {
	let handler

	beforeEach(() => {
		setupDOMmocks()
		jest.clearAllMocks()

		handler = new ErrorHandler({
			enableConsoleLogging: true,
			enableUserNotifications: true,
			autoHideDelay: 1000,
		})
	})

	setupConsoleMocks()

	describe('Initialization', () => {
		test('should initialize with default options', () => {
			const defaultHandler = new ErrorHandler()

			expect(defaultHandler.options.enableConsoleLogging).toBe(true)
			expect(defaultHandler.options.enableUserNotifications).toBe(true)
			expect(defaultHandler.options.maxErrorsToStore).toBe(50)
			expect(defaultHandler.options.autoHideDelay).toBe(5000)
		})

		test('should initialize error statistics', () => {
			expect(handler.errorCount[ErrorSeverity.LOW]).toBe(0)
			expect(handler.errorCount[ErrorSeverity.MEDIUM]).toBe(0)
			expect(handler.errorCount[ErrorSeverity.HIGH]).toBe(0)
			expect(handler.errorCount[ErrorSeverity.CRITICAL]).toBe(0)
			expect(handler.errorHistory).toEqual([])
		})
	})

	describe('Error Categorization', () => {
		const testCases = [
			{message: 'Validation failed', expected: ErrorCategory.VALIDATION},
			{message: 'Network request failed', expected: ErrorCategory.NETWORK},
			{message: 'Template rendering failed', expected: ErrorCategory.RENDERING},
			{message: 'File read error', expected: ErrorCategory.FILE_SYSTEM},
			{message: 'Configuration setting invalid', expected: ErrorCategory.CONFIGURATION},
			{message: 'Random error', expected: ErrorCategory.UNKNOWN},
		]

		test.each(testCases)('should categorize "$message" as $expected', ({message, expected}) => {
			const error = new Error(message)
			const category = handler.categorizeError(error)
			expect(category).toBe(expected)
		})
	})

	describe('Severity Determination', () => {
		const severityTests = [
			{message: 'Critical system failure', expected: ErrorSeverity.CRITICAL},
			{message: 'Required field validation failed', expected: ErrorSeverity.HIGH},
			{message: 'Warning: deprecated feature', expected: ErrorSeverity.LOW},
			{message: 'Some error', expected: ErrorSeverity.MEDIUM},
		]

		test.each(severityTests)('should determine "$message" as $expected severity', ({message, expected}) => {
			const error = new Error(message)
			const severity = handler.determineSeverity(error)
			expect(severity).toBe(expected)
		})
	})

	describe('Error Handling', () => {
		test('should handle standard Error objects', () => {
			const error = new Error('Test error')
			const result = handler.handleError(error)

			expect(result).toBeInstanceOf(ResumeBuilderError)
			expect(result.message).toBe('Test error')
			expect(handler.errorHistory).toHaveLength(1)
			expect(handler.errorCount[result.severity]).toBe(1)
		})

		test('should handle ResumeBuilderError objects', () => {
			const error = new ResumeBuilderError('Test error', ErrorCategory.VALIDATION, ErrorSeverity.HIGH)
			const result = handler.handleError(error)

			expect(result).toBe(error)
			expect(handler.errorHistory).toHaveLength(1)
			expect(handler.errorCount[ErrorSeverity.HIGH]).toBe(1)
		})

		test('should add context to errors', () => {
			const error = new Error('Test error')
			const context = {operation: 'test', data: {id: 1}}
			const result = handler.handleError(error, context)

			expect(result.details.originalError.message).toBe('Test error')
			expect(result.details.operation).toBe('test')
			expect(result.details.data).toEqual({id: 1})
		})

		test('should limit error history size', () => {
			const smallHandler = new ErrorHandler({maxErrorsToStore: 3})

			for (let i = 0; i < 5; i++) {
				smallHandler.handleError(new Error(`Error ${i}`))
			}

			expect(smallHandler.errorHistory).toHaveLength(3)
			expect(smallHandler.errorHistory[0].message).toBe('Error 4')
		})
	})

	describe('Console Logging', () => {
		test('should log errors to console when enabled', () => {
			const error = new ResumeBuilderError('Test error', ErrorCategory.VALIDATION, ErrorSeverity.HIGH)
			handler.handleError(error)

			expect(console.error).toHaveBeenCalledWith('[VALIDATION] [HIGH] Test error', error)
		})

		test('should not log when console logging disabled', () => {
			const quietHandler = new ErrorHandler({enableConsoleLogging: false})
			quietHandler.handleError(new Error('Test error'))

			expect(console.error).not.toHaveBeenCalled()
		})

		test('should use appropriate console method for severity', () => {
			const errors = [
				{error: new ResumeBuilderError('Low', ErrorCategory.UNKNOWN, ErrorSeverity.LOW), method: 'info'},
				{error: new ResumeBuilderError('Medium', ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM), method: 'warn'},
				{error: new ResumeBuilderError('High', ErrorCategory.UNKNOWN, ErrorSeverity.HIGH), method: 'error'},
				{error: new ResumeBuilderError('Critical', ErrorCategory.UNKNOWN, ErrorSeverity.CRITICAL), method: 'error'},
			]

			for (const {error, method} of errors) {
				handler.handleError(error)
				expect(console[method]).toHaveBeenCalledWith(
					`[UNKNOWN] [${error.severity.toUpperCase()}] ${error.message}`,
					error,
				)
			}
		})
	})

	describe('Error Statistics', () => {
		test('should track error statistics correctly', () => {
			handler.handleError(new ResumeBuilderError('Error 1', ErrorCategory.VALIDATION, ErrorSeverity.HIGH))
			handler.handleError(new ResumeBuilderError('Error 2', ErrorCategory.NETWORK, ErrorSeverity.MEDIUM))
			handler.handleError(new ResumeBuilderError('Error 3', ErrorCategory.VALIDATION, ErrorSeverity.LOW))

			const stats = handler.getErrorStats()

			expect(stats.total).toBe(3)
			expect(stats.counts[ErrorSeverity.HIGH]).toBe(1)
			expect(stats.counts[ErrorSeverity.MEDIUM]).toBe(1)
			expect(stats.counts[ErrorSeverity.LOW]).toBe(1)
			expect(stats.categories[ErrorCategory.VALIDATION]).toBe(2)
			expect(stats.categories[ErrorCategory.NETWORK]).toBe(1)
			expect(stats.recent[0].message).toBe('Error 3') // Most recent first
		})
	})

	describe('State Management', () => {
		test('should reset error handler state', () => {
			handler.handleError(new Error('Error 1'))
			handler.handleError(new Error('Error 2'))

			handler.reset()

			expect(handler.errorHistory).toHaveLength(0)
			for (const severity of Object.values(ErrorSeverity)) {
				expect(handler.errorCount[severity]).toBe(0)
			}
		})
	})
})

describe('ErrorUtils', () => {
	const testCases = [
		{
			name: 'validation error',
			method: 'createValidationError',
			args: ['Invalid field', 'name', 'test'],
			expectedCategory: ErrorCategory.VALIDATION,
			expectedSeverity: ErrorSeverity.HIGH,
		},
		{
			name: 'network error',
			method: 'createNetworkError',
			args: ['Request failed', '/api/data', 404],
			expectedCategory: ErrorCategory.NETWORK,
			expectedSeverity: ErrorSeverity.MEDIUM,
		},
		{
			name: 'rendering error',
			method: 'createRenderingError',
			args: ['Render failed', 'modern', {name: 'test'}],
			expectedCategory: ErrorCategory.RENDERING,
			expectedSeverity: ErrorSeverity.MEDIUM,
		},
	]

	test.each(testCases)('should create $name', ({method, args, expectedCategory, expectedSeverity}) => {
		const error = ErrorUtils[method](...args)

		expect(error).toBeInstanceOf(ResumeBuilderError)
		expect(error.category).toBe(expectedCategory)
		expect(error.severity).toBe(expectedSeverity)
		expect(error.details.type).toBe(expectedCategory.toLowerCase())
	})

	describe('Function Wrapping', () => {
		beforeEach(() => {
			errorHandler.reset()
		})

		test('should wrap async function with error handling', async () => {
			const mockFn = jest.fn().mockResolvedValue('success')
			const wrappedFn = ErrorUtils.wrapAsync(mockFn, 'test operation')

			const result = await wrappedFn('arg1', 'arg2')

			expect(result).toBe('success')
			expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
		})

		test('should handle async function errors', async () => {
			const mockError = new Error('Async error')
			const mockFn = jest.fn().mockRejectedValue(mockError)
			const wrappedFn = ErrorUtils.wrapAsync(mockFn, 'test operation')

			await expect(wrappedFn()).rejects.toThrow('Async error')

			// Wait a bit for async error handling to complete
			await new Promise(resolve => setTimeout(resolve, 10))

			expect(errorHandler.errorHistory.length).toBeGreaterThan(0)
			if (errorHandler.errorHistory.length > 0) {
				expect(errorHandler.errorHistory[0].details.context).toBe('test operation')
			}
		})

		test('should wrap sync function with error handling', () => {
			const mockFn = jest.fn().mockReturnValue('success')
			const wrappedFn = ErrorUtils.wrap(mockFn, 'test operation')

			const result = wrappedFn('arg1', 'arg2')

			expect(result).toBe('success')
			expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
		})

		test('should handle sync function errors', () => {
			const mockError = new Error('Sync error')
			const mockFn = jest.fn().mockImplementation(() => {
				throw mockError
			})
			const wrappedFn = ErrorUtils.wrap(mockFn, 'test operation')

			expect(() => wrappedFn()).toThrow('Sync error')
			expect(errorHandler.errorHistory.length).toBeGreaterThan(0)
			if (errorHandler.errorHistory.length > 0) {
				expect(errorHandler.errorHistory[0].details.context).toBe('test operation')
			}
		})
	})
})

describe('Integration Tests', () => {
	setupConsoleMocks()

	beforeEach(() => {
		errorHandler.reset()
	})

	test('should handle complete error workflow', () => {
		const error = new Error('Integration test error')
		const context = {operation: 'integration test', component: 'test suite'}

		const result = errorHandler.handleError(error, context)

		expect(result).toBeInstanceOf(ResumeBuilderError)
		expect(result.details.operation).toBe('integration test')
		expect(result.details.component).toBe('test suite')
		expect(errorHandler.errorHistory).toContain(result)
	})

	test('should handle multiple error types efficiently', () => {
		const errors = [
			'Validation error in form',
			'Network connection failed',
			'File system error',
			'Template rendering failed',
		].map(message => new Error(message))

		const startTime = Date.now()
		for (const error of errors) {
			errorHandler.handleError(error)
		}

		const duration = Date.now() - startTime

		expect(duration).toBeLessThan(100) // Should be fast

		const stats = errorHandler.getErrorStats()
		expect(stats.total).toBe(4)
		expect(stats.categories[ErrorCategory.VALIDATION]).toBe(1)
		expect(stats.categories[ErrorCategory.NETWORK]).toBe(1)
		expect(stats.categories[ErrorCategory.FILE_SYSTEM]).toBe(1)
		expect(stats.categories[ErrorCategory.RENDERING]).toBe(1)
	})
})
