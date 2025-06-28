/**
 * Unit Tests for Data Processor
 * Tests core resume data processing functionality
 */

import {jest} from '@jest/globals'
import {dataProcessor, DataProcessor, DataProcessorError} from '../data-processor.js'

// Test data fixtures
const MOCK_RESUME_DATA = {
	basics: {
		name: 'John Doe',
		email: 'john@example.com',
		summary: 'Experienced developer',
	},
	work: [{
		name: 'Tech Corp',
		position: 'Developer',
		startDate: '2020-01-01',
		endDate: '2023-12-31',
	}],
	skills: [{name: 'JavaScript', level: 'Expert'}],
}

// Mock utilities
const createMockResponse = (data, options = {}) => ({
	ok: options.ok ?? true,
	status: options.status ?? 200,
	statusText: options.statusText ?? 'OK',
	headers: {
		get(header) {
			if (header === 'last-modified') {
				return options.lastModified ?? null
			}

			if (header === 'content-type' && options.headers) {
				return options.headers['content-type']
			}

			return null
		},
	},
	json: () => Promise.resolve(data),
	text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
})

const createMockError = (message, type = 'NetworkError') => {
	const error = new Error(message)
	error.name = type
	return error
}

describe('DataProcessor', () => {
	beforeEach(() => {
		globalThis.fetch = jest.fn()
		globalThis.performance = {now: jest.fn(() => Date.now())}
		dataProcessor.cleanup()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('Initialization', () => {
		it('should initialize with correct default state', () => {
			expect(dataProcessor).toBeInstanceOf(DataProcessor)
			expect(dataProcessor.resumeData).toBeNull()
			expect(dataProcessor.isLoaded).toBe(false)
			expect(dataProcessor.defaultValues).toBeDefined()
		})
	})

	describe('Data Loading', () => {
		it('should load resume data successfully', async () => {
			globalThis.fetch.mockResolvedValue(createMockResponse(MOCK_RESUME_DATA))

			const result = await dataProcessor.loadResumeData()

			expect(fetch).toHaveBeenCalledWith('/resume.json')
			expect(result.data).toBeDefined()
			expect(dataProcessor.isLoaded).toBe(true)
		})

		it('should fallback to sample.resume.json when resume.json returns 404', async () => {
			const sampleData = {basics: {name: 'Sample User'}}

			globalThis.fetch
				.mockResolvedValueOnce(createMockResponse(null, {
					ok: false,
					status: 404,
					statusText: 'Not Found',
				}))
				.mockResolvedValueOnce(createMockResponse(sampleData))

			const result = await dataProcessor.loadResumeData()

			expect(fetch).toHaveBeenCalledWith('/resume.json')
			expect(fetch).toHaveBeenCalledWith('/sample.resume.json')
			expect(result.data.basics.name).toBe('Sample User')
		})

		it('should fallback to sample.resume.json when resume.json returns HTML (Vite dev server)', async () => {
			const sampleData = {basics: {name: 'Sample User'}}

			globalThis.fetch
				.mockResolvedValueOnce(createMockResponse('<html><body>Not Found</body></html>', {
					ok: true,
					status: 200,
					statusText: 'OK',
					headers: {'content-type': 'text/html'},
				}))
				.mockResolvedValueOnce(createMockResponse(sampleData))

			const result = await dataProcessor.loadResumeData()

			expect(fetch).toHaveBeenCalledWith('/resume.json')
			expect(fetch).toHaveBeenCalledWith('/sample.resume.json')
			expect(result.data.basics.name).toBe('Sample User')
		})

		it('should handle HTTP errors for non-404 errors', async () => {
			globalThis.fetch.mockResolvedValue(createMockResponse(null, {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			}))

			await expect(dataProcessor.loadResumeData())
				.rejects.toThrow('Failed to load resume file: 500 Internal Server Error')
		})

		it('should handle errors when both resume.json and sample.resume.json are missing', async () => {
			globalThis.fetch
				.mockResolvedValueOnce(createMockResponse(null, {
					ok: false,
					status: 404,
					statusText: 'Not Found',
				}))
				.mockResolvedValueOnce(createMockResponse(null, {
					ok: false,
					status: 404,
					statusText: 'Not Found',
				}))

			await expect(dataProcessor.loadResumeData())
				.rejects.toThrow('Failed to load resume file: 404 Not Found')
		})

		it('should handle JSON parsing errors', async () => {
			globalThis.fetch.mockResolvedValue({
				ok: true,
				headers: {get: () => null},
				json: () => Promise.reject(new SyntaxError('Invalid JSON')),
			})

			await expect(dataProcessor.loadResumeData())
				.rejects.toThrow('Invalid JSON format in resume file')
		})

		it('should handle network errors', async () => {
			globalThis.fetch.mockRejectedValue(createMockError('Network failed'))

			await expect(dataProcessor.loadResumeData())
				.rejects.toThrow('Unexpected error loading resume data')
		})
	})

	describe('Default Value Application', () => {
		it('should apply defaults to incomplete data', () => {
			const incompleteData = {basics: {name: 'John Doe'}}
			const result = dataProcessor.applyDefaults(incompleteData)

			expect(result.basics.name).toBe('John Doe')
			expect(result.basics.email).toBe('')
			expect(result.work).toEqual([])
			expect(result.skills).toEqual([])
			expect(result.meta).toBeDefined()
		})

		it('should preserve existing data while adding defaults', () => {
			const partialData = {
				basics: {name: 'John Doe'},
				work: [{name: 'Company'}],
			}
			const result = dataProcessor.applyDefaults(partialData)

			expect(result.basics.name).toBe('John Doe')
			expect(result.work).toHaveLength(1)
			expect(result.skills).toEqual([])
		})

		it('should handle invalid input gracefully', () => {
			for (const invalidInput of [null, 'invalid', 123]) {
				const result = dataProcessor.applyDefaults(invalidInput)
				expect(result).toEqual(dataProcessor.defaultValues)
			}
		})
	})

	describe('State Management', () => {
		it('should return current data when loaded', () => {
			dataProcessor.resumeData = MOCK_RESUME_DATA
			dataProcessor.isLoaded = true

			expect(dataProcessor.getResumeData()).toEqual(MOCK_RESUME_DATA)
			expect(dataProcessor.isDataLoaded()).toBe(true)
		})

		it('should return null when no data is loaded', () => {
			expect(dataProcessor.getResumeData()).toBeNull()
			expect(dataProcessor.isDataLoaded()).toBe(false)
		})

		it('should clean up resources', () => {
			dataProcessor.resumeData = {test: 'data'}
			dataProcessor.isLoaded = true

			dataProcessor.cleanup()

			expect(dataProcessor.resumeData).toBeNull()
			expect(dataProcessor.isLoaded).toBe(false)
		})

		it('should reload data', async () => {
			globalThis.fetch.mockResolvedValue(createMockResponse(MOCK_RESUME_DATA))

			// Set initial state
			dataProcessor.resumeData = {old: 'data'}
			dataProcessor.isLoaded = true

			const result = await dataProcessor.reload('/test.json')

			expect(dataProcessor.isLoaded).toBe(true)
			expect(result.data).toBeDefined()
			expect(fetch).toHaveBeenCalledWith('/test.json')
		})
	})

	describe('Validation', () => {
		it('should validate resume data', async () => {
			const validData = {
				basics: {
					name: 'John Doe',
					email: 'john@example.com',
				},
			}

			const result = await dataProcessor.validateResumeData(validData)

			expect(result).toBeDefined()
			expect(result.isValid).toBeDefined()
			expect(result.errors).toBeDefined()
			expect(result.validationTime).toBeDefined()
			expect(result.schema).toBe('JSON Resume Schema (Official @jsonresume/schema)')
		})
	})

	describe('Error Handling', () => {
		it('should create DataProcessorError with correct properties', () => {
			const error = new DataProcessorError('Test error', 'TEST_CODE', {detail: 'test'})

			expect(error.name).toBe('DataProcessorError')
			expect(error.message).toBe('Test error')
			expect(error.code).toBe('TEST_CODE')
			expect(error.details).toEqual({detail: 'test'})
			expect(error.timestamp).toBeDefined()
		})
	})
})
