/**
 * @fileoverview Template Helper Functions
 * Utility functions for date formatting and icon rendering in resume templates
 * @author m-e-h
 * @version 1.0.0
 */

/**
 * Helper function to format dates
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string (e.g., "Jan 2020") or original string if invalid
 */
export function formatDate(dateString) {
	if (!dateString) {
		return ''
	}

	try {
		const date = new Date(dateString)
		if (Number.isNaN(date.getTime())) {
			return dateString
		}

		return date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})
	} catch {
		return dateString
	}
}

/**
 * Helper function to format date ranges
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string (optional, "present" for current)
 * @returns {string} Formatted date range (e.g., "Jan 2020 – Present" or "Jan 2020 – Dec 2022")
 */
export function formatDateRange(startDate, endDate) {
	if (!startDate && !endDate) {
		return ''
	}

	const start = startDate ? formatDate(startDate) + ' – ' : ''
	const end = endDate && endDate.toLowerCase() !== 'present' ? formatDate(endDate) : 'Present'
	return `${start}${end}`
}

/**
 * Helper function to render SVG icons
 * @param {string} name - Icon name (e.g., 'mail', 'phone', 'github', 'linkedin', etc.)
 * @returns {string} SVG markup for the specified icon, or empty string if icon not found
 */
export function icon(name) {
	switch (name.toLowerCase()) {
		case 'map-pin': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 9c-.8 0-1.5.7-1.5 1.5S11.2 12 12 12s1.5-.7 1.5-1.5S12.8 9 12 9zm0-5c-3.6 0-6.5 2.8-6.5 6.2 0 .8.3 1.8.9 3.1.5 1.1 1.2 2.3 2 3.6.7 1 3 3.8 3.2 3.9l.4.5.4-.5c.2-.2 2.6-2.9 3.2-3.9.8-1.2 1.5-2.5 2-3.6.6-1.3.9-2.3.9-3.1C18.5 6.8 15.6 4 12 4zm4.3 8.7c-.5 1-1.1 2.2-1.9 3.4-.5.7-1.7 2.2-2.4 3-.7-.8-1.9-2.3-2.4-3-.8-1.2-1.4-2.3-1.9-3.3-.6-1.4-.7-2.2-.7-2.5 0-2.6 2.2-4.7 5-4.7s5 2.1 5 4.7c0 .2-.1 1-.7 2.4z"/></svg>'
		}

		case 'mail': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm.5 12c0 .3-.2.5-.5.5H5c-.3 0-.5-.2-.5-.5V9.8l7.5 5.6 7.5-5.6V17zm0-9.1L12 13.6 4.5 7.9V7c0-.3.2-.5.5-.5h14c.3 0 .5.2.5.5v.9z"/></svg>'
		}

		case 'phone': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 4H9c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 14c0 .3-.2.5-.5.5H9c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h6c.3 0 .5.2.5.5v12zm-4.5-.5h2V16h-2v1.5z" /></svg>'
		}

		case 'github': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1f2328"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.09.682-.218.682-.484 0-.236-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.455-1.157-1.11-1.465-1.11-1.465-.909-.62.069-.608.069-.608 1.004.071 1.532 1.03 1.532 1.03.891 1.529 2.341 1.089 2.91.833.091-.647.349-1.086.635-1.337-2.22-.251-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.097-2.646 0 0 .84-.269 2.75 1.025A9.548 9.548 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.307.679.917.679 1.852 0 1.335-.012 2.415-.012 2.741 0 .269.18.579.688.481A9.997 9.997 0 0 0 22 12c0-5.523-4.477-10-10-10z"/></svg>'
		}

		case 'linkedin': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19.7 3H4.3A1.3 1.3 0 0 0 3 4.3v15.4A1.3 1.3 0 0 0 4.3 21h15.4a1.3 1.3 0 0 0 1.3-1.3V4.3A1.3 1.3 0 0 0 19.7 3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 1 1-.002-3.096 1.548 1.548 0 0 1 .002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.249h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z"/></svg>'
		}

		case 'npm': {
			return '<svg class="icon-npm" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#cb3837"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>'
		}

		case 'wordpress': {
			return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3858e9"><path d="M12.158 12.786 9.46 20.625a8.984 8.984 0 0 0 5.526-.144.852.852 0 0 1-.065-.124l-2.763-7.571zM3.009 12a8.993 8.993 0 0 0 5.067 8.092L3.788 8.341A8.952 8.952 0 0 0 3.009 12zm15.06-.454c0-1.112-.399-1.881-.741-2.48-.456-.741-.883-1.368-.883-2.109 0-.826.627-1.596 1.51-1.596.04 0 .078.005.116.007A8.963 8.963 0 0 0 12 3.009a8.982 8.982 0 0 0-7.512 4.052c.211.007.41.011.579.011.94 0 2.396-.114 2.396-.114.484-.028.541.684.057.741 0 0-.487.057-1.029.085l3.274 9.739 1.968-5.901-1.401-3.838c-.484-.028-.943-.085-.943-.085-.485-.029-.428-.769.057-.741 0 0 1.484.114 2.368.114.94 0 2.397-.114 2.397-.114.485-.028.542.684.057.741 0 0-.488.057-1.029.085l3.249 9.665.897-2.996c.456-1.169.684-2.137.684-2.907zm1.82-3.86c.039.286.06.593.06.924 0 .912-.171 1.938-.684 3.22l-2.746 7.94a8.984 8.984 0 0 0 4.47-7.771 8.922 8.922 0 0 0-1.1-4.313zM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>'
		}

		default: {
			return ''
		}
	}
}
