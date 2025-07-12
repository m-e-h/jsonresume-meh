#!/usr/bin/env node

/**
 * Static HTML Generator for Resume Builder
 * Generates a complete HTML file with resume content and inlined CSS
 */

import fs, {readFileSync, writeFileSync, existsSync} from 'fs'
import path, {join, dirname} from 'path'
import {fileURLToPath} from 'url'
import {minimalTemplate} from '../templates/layouts.js'
import {formatDateRange} from '../templates/utils/helpers.js'

// Get the project root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getProjectRoot() {
	let dir = __dirname
	while (!fs.existsSync(path.join(dir, 'package.json'))) {
		const parent = path.dirname(dir)
		if (parent === dir) {
			break
		} // Reached filesystem root

		dir = parent
	}

	return dir
}

function getCSSFile() {
	try {
		const manifest = JSON.parse(readFileSync(join(process.cwd(), 'dist/.vite', 'manifest.json'), 'utf-8'))

		// Find the CSS file entry in the manifest
		const cssEntry = manifest['index.html'].css
		if (cssEntry) {
			return cssEntry
		}
	} catch (error) {
		console.error('Error reading manifest:', error.message)
		process.exit(1)
	}
}

// Main build function
async function buildStaticHTML() {
	try {
		// Get template from environment variable or use default
		const templateId = 'minimal'
		console.log(`🏗️  Building static HTML with template: ${templateId}`)

		// Load resume data
		const resumeDataPath = join(getProjectRoot(), 'public', 'resume.json')
		if (!existsSync(resumeDataPath)) {
			throw new Error(`Resume data not found at: ${resumeDataPath}`)
		}

		const resumeData = JSON.parse(readFileSync(resumeDataPath, 'utf-8'))
		console.log('📄 Resume data loaded successfully')

		// Process resume data
		const processedData = await processResumeData(resumeData)

		// Generate HTML using template
		const resumeHTML = minimalTemplate(processedData)

		// Generate document title
		const nameWithUnderscores = resumeData.basics?.name
			? resumeData.basics.name.replace(/\s+/g, '_')
			: 'Resume'
		const prospect = resumeData.meta?.prospect
			? resumeData.meta.prospect.replace(/\s+/g, '_')
			: ''
		const title = prospect
			? `${nameWithUnderscores}_Resume_${prospect}`
			: `${nameWithUnderscores}_Resume`

		// Create complete HTML document
		const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="Professional resume for ${resumeData.basics?.name || 'Professional'}">
	<link rel="stylesheet" href="${getCSSFile()}">
</head>
<body>
    <div id="app" class="resume-container ${templateId}">
        ${resumeHTML}
    </div>
</body>
</html>`

		// Write the complete HTML to dist folder
		const distPath = join(getProjectRoot(), 'dist')
		const outputPath = join(distPath, 'index.html')

		writeFileSync(outputPath, completeHTML, 'utf-8')
		console.log(`✅ Static HTML generated successfully: ${outputPath}`)

		return outputPath
	} catch (error) {
		console.error('❌ Failed to build static HTML:', error.message)
		process.exit(1)
	}
}

/**
* Process resume data for template rendering
* Adds formatted date ranges to work, education, projects, and volunteer experience
* @param {Object} data - Raw resume data
* @returns {Object} Processed resume data with formatted dates
* @throws {TemplateRenderError} When data processing fails
*/
async function processResumeData(data) {
	try {
		// Create a deep copy to avoid modifying original data
		const processedData = structuredClone(data)

		// Process work experience dates
		processedData.work &&= processedData.work.map(job => ({
			...job,
			formattedDates: formatDateRange(job.startDate, job.endDate)
		}))

		// Process education dates
		processedData.education &&= processedData.education.map(edu => ({
			...edu,
			formattedDates: formatDateRange(edu.startDate, edu.endDate)
		}))

		// Process project dates
		processedData.projects &&= processedData.projects.map(project => ({
			...project,
			formattedDates: formatDateRange(project.startDate, project.endDate)
		}))

		// Process volunteer dates
		processedData.volunteer &&= processedData.volunteer.map(vol => ({
			...vol,
			formattedDates: formatDateRange(vol.startDate, vol.endDate)
		}))

		return processedData
	} catch (error) {
		console.error(`Data processing failed: ${error.message}`)
	}
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	buildStaticHTML()
}

export {buildStaticHTML}
