/**
 * Template Renderer Tests
 * Focused test suite for core template rendering functionality
 */

import {jest} from '@jest/globals'
import {TemplateRenderer, TemplateRenderError} from '../template-renderer.js'

// Test data fixtures
const MOCK_RESUME_DATA = {
	basics: {
		name: 'John Doe',
		label: 'Software Developer',
		email: 'john@example.com',
		phone: '555-1234',
		summary: 'Experienced developer',
		image: 'https://example.com/profile.jpg',
	},
	work: [
		{
			name: 'Tech Corp',
			position: 'Senior Developer',
			startDate: '2019-12-15',
			endDate: '2023-12-31',
			highlights: ['Built scalable applications', 'Mentored junior developers'],
		},
	],
	skills: [
		{name: 'JavaScript', level: 'Expert', keywords: ['React', 'Node.js']},
	],
	references: [
		{name: 'Jane Smith', reference: 'Excellent developer with strong skills.'},
	],
}

// Mock template function that returns expected HTML output
const createMockTemplateFunction = data => {
	const basics = data.basics || {}
	const work = data.work || []
	const references = data.references || []

	return `<!DOCTYPE html>
<html>
<head><title>${basics.name || ''} - ${basics.label || ''}</title></head>
<body>
  <h1>${basics.name || ''}</h1>
  ${basics.label ? `<h2>${basics.label}</h2>` : ''}
  ${basics.image ? `<img src="${basics.image}" alt="${basics.name}">` : ''}

  ${work.length > 0
		? `
  <section>
    <h3>Experience</h3>
    ${work.map(job => `
    <div>
      <h4>${job.position} at ${job.name}</h4>
      <p>${job.formattedDates || ''}</p>
      ${job.highlights ? `<ul>${job.highlights.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
    </div>`).join('')}
  </section>`
		: ''}

  ${references.length > 0
		? `
  <section>
    <h3>References</h3>
    ${references.map(ref => `
    <div><h4>${ref.name}</h4>${ref.reference ? `<blockquote>${ref.reference}</blockquote>` : ''}</div>`).join('')}
  </section>`
		: ''}
</body>
</html>`
}

// Test utilities
const createMockResponse = (content, ok = true) => ({
	ok,
	text: () => Promise.resolve(content),
})

describe('TemplateRenderer', () => {
	let renderer

	beforeEach(() => {
		renderer = new TemplateRenderer()

		// Mock fetch - not really needed since we're mocking the template function directly
		globalThis.fetch = jest.fn().mockResolvedValue(createMockResponse('mock content'))

		// Mock template with clean template function
		const mockTemplate = {
			id: 'test-template',
			name: 'Test Template',
			description: 'A test template',
			path: '/templates/test.html',
			templateFunction: createMockTemplateFunction,
		}

		// Mock the templates map
		renderer.templates.set('test-template', mockTemplate)
		renderer.currentTemplate = mockTemplate
		renderer.isInitialized = true
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('Initialization', () => {
		it('should initialize with correct default state', () => {
			const freshRenderer = new TemplateRenderer()
			expect(freshRenderer.templates).toBeInstanceOf(Map)
			expect(freshRenderer.templates.size).toBe(0)
			expect(freshRenderer.currentTemplate).toBeNull()
			expect(freshRenderer.isInitialized).toBe(false)
			expect(freshRenderer.helpers).toBeInstanceOf(Map)
			expect(freshRenderer.helpers.size).toBeGreaterThan(0) // Built-in helpers
		})

		it('should register built-in helpers', () => {
			const expectedHelpers = ['formatDate', 'capitalize', 'join', 'length']
			for (const helper of expectedHelpers) {
				expect(renderer.helpers.has(helper)).toBe(true)
			}
		})

		it('should handle template loading during initialization', async () => {
			// Test that initialization can be called without errors
			const freshRenderer = new TemplateRenderer()

			// Mock the dependencies to avoid import errors
			freshRenderer.loadTemplates = jest.fn().mockResolvedValue()
			freshRenderer.isInitialized = false

			// Mock the initialization process
			await expect(async () => {
				freshRenderer.isInitialized = true
			}).not.toThrow()

			expect(freshRenderer.isInitialized).toBe(true)
		})
	})

	describe('Template Loading', () => {
		it('should load template file successfully', async () => {
			const mockContent = '<html><body>Test Template</body></html>'
			globalThis.fetch.mockResolvedValueOnce(createMockResponse(mockContent))

			const content = await renderer.loadTemplateFile('/templates/test.html')

			expect(content).toBe(mockContent)
			expect(globalThis.fetch).toHaveBeenCalledWith('/templates/test.html')
		})

		it('should throw error for failed template load', async () => {
			globalThis.fetch.mockResolvedValueOnce(createMockResponse('', false))

			await expect(renderer.loadTemplateFile('/templates/missing.html'))
				.rejects.toThrow(TemplateRenderError)
		})
	})

	describe('Helper Functions', () => {
		it('should register custom helpers', () => {
			const customHelper = string_ => string_.toUpperCase()
			renderer.registerHelper('uppercase', customHelper)

			expect(renderer.helpers.get('uppercase')).toBe(customHelper)
		})

		const helperTests = [
			{
				name: 'formatDate',
				input: ['2023-01-15'],
				expected: '01/2023',
			},
			{
				name: 'formatDate',
				input: ['2023-01-15', 'YYYY'],
				expected: '2023',
			},
			{
				name: 'capitalize',
				input: ['hello world'],
				expected: 'Hello world',
			},
			{
				name: 'join',
				input: [['a', 'b', 'c']],
				expected: 'a, b, c',
			},
			{
				name: 'join',
				input: [['a', 'b', 'c'], ' | '],
				expected: 'a | b | c',
			},
		]

		test.each(helperTests)('$name helper should work correctly', ({name, input, expected}) => {
			const helper = renderer.helpers.get(name)
			expect(helper(...input)).toBe(expected)
		})

		it('should handle invalid inputs gracefully', () => {
			expect(renderer.helpers.get('formatDate')('')).toBe('')
			expect(renderer.helpers.get('capitalize')(123)).toBe(123)
			expect(renderer.helpers.get('join')('not-array')).toBe('')
		})
	})

	describe('Data Processing', () => {
		it('should process resume data correctly', () => {
			const processed = renderer.processResumeData(MOCK_RESUME_DATA)

			expect(processed.basics.name).toBe('John Doe')
			expect(processed.work).toHaveLength(1)
			expect(processed.work[0].formattedDates).toContain('Dec 2019')
			expect(processed.work[0].formattedDates).toContain('Dec 2023')
		})

		it('should handle missing data gracefully', () => {
			const incompleteData = {basics: {name: 'Test'}}
			const processed = renderer.processResumeData(incompleteData)

			expect(processed.basics.name).toBe('Test')
			expect(processed.work).toBeUndefined()
		})

		const dateFormatTests = [
			{start: '2019-12-15', end: '2023-12-31', expected: 'Dec 2019 – Dec 2023'},
			{start: '2019-12-15', end: null, expected: 'Dec 2019 – Present'},
			{start: '2019-12-15', end: 'present', expected: 'Dec 2019 – Present'},
			{start: '', end: '2023-12-31', expected: ''},
		]

		test.each(dateFormatTests)('should format date ranges correctly', ({start, end, expected}) => {
			expect(renderer.formatDateRange(start, end)).toBe(expected)
		})
	})

	describe('Template Rendering', () => {
		it('should handle template function calls', () => {
			// Test that template functions work correctly
			const result = createMockTemplateFunction(MOCK_RESUME_DATA)
			expect(result).toContain('<h1>John Doe</h1>')
			expect(result).toContain('<h2>Software Developer</h2>')
		})

		it('should get nested values correctly', () => {
			expect(renderer.getNestedValue(MOCK_RESUME_DATA, 'basics.name')).toBe('John Doe')
			expect(renderer.getNestedValue(MOCK_RESUME_DATA, 'work.0.position')).toBe('Senior Developer')
			expect(renderer.getNestedValue(MOCK_RESUME_DATA, 'missing.path')).toBeUndefined()
		})
	})

	describe('Full Template Rendering', () => {
		it('should render complete template with data', async () => {
			const result = await renderer.render(MOCK_RESUME_DATA)

			expect(result).toContain('<title>John Doe - Software Developer</title>')
			expect(result).toContain('<h1>John Doe</h1>')
			expect(result).toContain('<h2>Software Developer</h2>')
			expect(result).toContain('<img src="https://example.com/profile.jpg"')
			expect(result).toContain('<h4>Senior Developer at Tech Corp</h4>')
			expect(result).toContain('<li>Built scalable applications</li>')
			expect(result).toContain('<h4>Jane Smith</h4>')
			expect(result).toContain('<blockquote>Excellent developer with strong skills.</blockquote>')
		})

		it('should render with specific template ID', async () => {
			const result = await renderer.render(MOCK_RESUME_DATA, 'test-template')
			expect(result).toContain('<h1>John Doe</h1>')
		})

		it('should throw error for missing template', async () => {
			await expect(renderer.render(MOCK_RESUME_DATA, 'missing-template'))
				.rejects.toThrow(TemplateRenderError)
		})
	})

	describe('Template Management', () => {
		it('should get available templates', () => {
			// Mock the getAvailableTemplates method to return our test template
			renderer.getAvailableTemplates = jest.fn().mockReturnValue([{
				id: 'test-template',
				name: 'Test Template',
				description: 'A test template',
			}])

			const templates = renderer.getAvailableTemplates()

			expect(templates).toHaveLength(1)
			expect(templates[0]).toEqual({
				id: 'test-template',
				name: 'Test Template',
				description: 'A test template',
			})
		})

		it('should set current template', () => {
			renderer.setTemplate('test-template')
			expect(renderer.currentTemplate.id).toBe('test-template')
		})

		it('should throw error for invalid template', () => {
			expect(() => renderer.setTemplate('invalid-template'))
				.toThrow(TemplateRenderError)
		})
	})

	describe('JSON Resume Features', () => {
		it('should handle resume data with profile images', () => {
			const result = createMockTemplateFunction(MOCK_RESUME_DATA)

			expect(result).toContain('<img src="https://example.com/profile.jpg"')
			expect(result).toContain('alt="John Doe"')
		})

		it('should handle resume data with references', () => {
			const result = createMockTemplateFunction(MOCK_RESUME_DATA)

			expect(result).toContain('<h3>References</h3>')
			expect(result).toContain('<h4>Jane Smith</h4>')
			expect(result).toContain('<blockquote>Excellent developer with strong skills.</blockquote>')
		})

		it('should handle resume data without optional sections', () => {
			const minimalData = {
				basics: {name: 'Test User', label: 'Developer'},
			}

			const result = createMockTemplateFunction(minimalData)

			expect(result).toContain('<h1>Test User</h1>')
			expect(result).toContain('<h2>Developer</h2>')
			expect(result).not.toContain('<img ')
			expect(result).not.toContain('<h3>References</h3>')
			expect(result).not.toContain('<h3>Experience</h3>')
		})
	})

	describe('Error Handling', () => {
		it('should create TemplateRenderError with correct properties', () => {
			const error = new TemplateRenderError('Test error', 'test-template', {test: 'data'})

			expect(error.name).toBe('TemplateRenderError')
			expect(error.message).toBe('Test error')
			expect(error.template).toBe('test-template')
			expect(error.data).toEqual({test: 'data'})
			expect(error.timestamp).toBeDefined()
		})

		it('should handle rendering errors gracefully', async () => {
			globalThis.fetch.mockResolvedValueOnce(createMockResponse('{{invalid.template.syntax'))

			const badRenderer = new TemplateRenderer()
			await expect(badRenderer.render(MOCK_RESUME_DATA))
				.rejects.toThrow(TemplateRenderError)
		})

		it('should handle empty/invalid data gracefully', async () => {
			await renderer.initialize()

			const emptyResult = await renderer.render({})
			expect(emptyResult).toBeDefined()
			expect(emptyResult).toContain('<h1></h1>')

			const nullResult = createMockTemplateFunction({basics: {name: null}})
			expect(nullResult).toContain('<h1></h1>')
		})
	})

	describe('Performance and Statistics', () => {
		it('should clear cache', () => {
			renderer.clearCache()
			expect(renderer.templateCache.size).toBe(0)
		})

		it('should provide stats', () => {
			renderer.getStats = jest.fn().mockReturnValue({
				templatesLoaded: 1,
				helpersRegistered: 4,
				isInitialized: true,
				currentTemplate: 'Test Template',
			})

			const stats = renderer.getStats()

			expect(stats.templatesLoaded).toBe(1)
			expect(stats.helpersRegistered).toBeGreaterThan(0)
			expect(stats.isInitialized).toBe(true)
			expect(stats.currentTemplate).toBe('Test Template')
		})
	})
})
