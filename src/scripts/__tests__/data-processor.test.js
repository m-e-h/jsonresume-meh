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
			expect(dataProcessor.cache).toBeInstanceOf(Map)
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

	describe('Data Enhancement', () => {
		const testData = {
			basics: {name: 'John Doe'},
			work: [{
				name: 'Company A',
				position: 'Developer',
				startDate: '2020-01-01',
				endDate: '2022-12-31',
			}],
			skills: [{
				name: 'JavaScript',
				level: 'Expert',
				keywords: ['react', 'node.js'],
			}],
		}

		it('should enhance work experience with computed properties', () => {
			const enhanced = dataProcessor.enhanceData(testData)

			expect(enhanced.work[0].duration).toBeDefined()
			expect(enhanced.work[0].formattedDates).toBeDefined()
			expect(enhanced.work[0].isCurrentJob).toBe(false)
		})

		it('should add computed metadata', () => {
			const enhanced = dataProcessor.enhanceData(testData)

			expect(enhanced._computed).toBeDefined()
			expect(enhanced._computed.totalWorkExperience).toBeDefined()
			expect(enhanced._computed.skillCategories).toBeDefined()
			expect(enhanced._computed.sections).toBeDefined()
		})

		it('should handle malformed data gracefully', () => {
			const malformedData = {work: [{startDate: 'invalid-date'}]}

			expect(() => dataProcessor.enhanceData(malformedData)).not.toThrow()
		})
	})

	describe('Duration Calculations', () => {
		it('should calculate duration correctly', () => {
			const duration = dataProcessor.calculateDuration('2020-01-01', '2022-12-31')

			expect(duration).toBeDefined()
			expect(duration.years).toBeGreaterThan(0)
			expect(duration.humanReadable).toBeDefined()
		})

		it('should handle current positions', () => {
			const duration = dataProcessor.calculateDuration('2020-01-01', null)

			expect(duration).toBeDefined()
			expect(duration.years).toBeGreaterThan(0)
		})

		it('should return null for invalid dates', () => {
			expect(dataProcessor.calculateDuration('invalid-date', '2022-01-01')).toBeNull()
			expect(dataProcessor.calculateDuration(null, '2022-01-01')).toBeNull()
		})

		it('should format duration in human-readable format', () => {
			expect(dataProcessor.formatDuration(2, 6)).toBe('2 years, 6 months')
			expect(dataProcessor.formatDuration(0, 3)).toBe('3 months')
			expect(dataProcessor.formatDuration(1, 0)).toBe('1 year')
			expect(dataProcessor.formatDuration(0, 0)).toBe('Less than a month')
		})
	})

	describe('Skill Categorization', () => {
		const skills = [
			{name: 'JavaScript', level: 'Expert', keywords: ['react', 'node.js']},
			{name: 'Python', level: 'Advanced', keywords: ['django', 'flask']},
			{name: 'AWS', keywords: ['ec2', 's3']},
		]

		it('should categorize skills by level', () => {
			const categories = dataProcessor.categorizeSkills(skills)

			expect(categories.byLevel.Expert).toHaveLength(1)
			expect(categories.byLevel.Advanced).toHaveLength(1)
			expect(categories.byLevel.Unspecified).toHaveLength(1)
		})

		it('should infer skill types from keywords', () => {
			expect(dataProcessor.inferSkillType(['javascript', 'react'])).toBe('Programming Languages')
			expect(dataProcessor.inferSkillType(['mysql', 'postgresql'])).toBe('Databases')
			expect(dataProcessor.inferSkillType(['aws', 'docker'])).toBe('Cloud & DevOps')
			expect(dataProcessor.inferSkillType(['unknown'])).toBe('Other')
		})
	})

	describe('Caching and State Management', () => {
		it('should cache commonly accessed data', () => {
			const testData = {
				basics: {name: 'John Doe', email: 'john@example.com'},
				work: [{name: 'Company'}],
				skills: [{name: 'JavaScript'}],
			}

			dataProcessor.updateCache(testData)

			expect(dataProcessor.getCached('name')).toBe('John Doe')
			expect(dataProcessor.getCached('workCount')).toBe(1)
			expect(dataProcessor.getCached('skillCount')).toBe(1)
		})

		it('should return current data when loaded', () => {
			dataProcessor.resumeData = MOCK_RESUME_DATA
			dataProcessor.isLoaded = true

			expect(dataProcessor.getResumeData()).toEqual(MOCK_RESUME_DATA)
			expect(dataProcessor.isDataLoaded()).toBe(true)
		})

		it('should clean up resources', () => {
			dataProcessor.resumeData = {test: 'data'}
			dataProcessor.isLoaded = true
			dataProcessor.cache.set('test', 'value')

			dataProcessor.cleanup()

			expect(dataProcessor.resumeData).toBeNull()
			expect(dataProcessor.isLoaded).toBe(false)
			expect(dataProcessor.cache.size).toBe(0)
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
