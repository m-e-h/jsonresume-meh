/**
 * Manages all UI interactions and DOM manipulations for the resume builder.
 */
export class UIManager {
	constructor() {
		this.appContainer = document.querySelector('#app')
		if (!this.appContainer) {
			throw new Error('App container with id "app" not found in the DOM.')
		}

		this.resumeContainer = null
	}

	/**
   * Displays a loading indicator in the main app container.
   */
	showLoadingState() {
		const loadingHTML = `
      <div id="loading-state" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your resume...</p>
      </div>
    `
		this.appContainer.innerHTML = loadingHTML
	}

	/**
   * Hides the loading indicator.
   */
	hideLoadingState() {
		const loadingElement = document.querySelector('#loading-state')
		if (loadingElement) {
			loadingElement.remove()
		}
	}

	/**
   * Creates the main container for the resume content if it doesn't exist.
   * @returns {HTMLElement} The resume container element.
   */
	createResumeContainer() {
		let container = document.querySelector('#resume-container')
		if (!container) {
			container = document.createElement('div')
			container.id = 'resume-container'
			container.className = 'resume-container'
			document.body.append(container)
		}

		this.resumeContainer = container
		return container
	}

	/**
   * Sets up the template selector dropdown in the UI.
   * @param {Array<object>} availableTemplates - A list of available template objects.
   * @param {string} currentTemplateId - The ID of the currently active template.
   * @param {Function} switchCallback - The function to call when a new template is selected.
   */
	setupTemplateSelector(availableTemplates, currentTemplateId, switchCallback) {
		if (availableTemplates.length <= 1) {
			return
		}

		const selectorContainer = document.createElement('div')
		selectorContainer.id = 'template-selector'
		selectorContainer.className = 'template-selector no-print'

		const label = document.createElement('label')
		label.textContent = 'Template: '
		label.htmlFor = 'template-select-dropdown'

		const select = document.createElement('select')
		select.id = 'template-select-dropdown'

		for (const template of availableTemplates) {
			const option = document.createElement('option')
			option.value = template.id
			option.textContent = template.name
			option.selected = template.id === currentTemplateId
			select.append(option)
		}

		select.addEventListener('change', e => switchCallback(e.target.value))

		selectorContainer.append(label)
		selectorContainer.append(select)
		document.body.append(selectorContainer)

		console.log('🔄 Template selector initialized with', availableTemplates.length, 'templates')
	}

	/**
   * Sets up the print button in the UI.
   * @param {Function} printCallback - The function to call when the print button is clicked.
   */
	setupPrintButton(printCallback) {
		const buttonContainer = document.createElement('div')
		buttonContainer.id = 'action-buttons'
		buttonContainer.className = 'action-buttons no-print'

		const printButton = document.createElement('button')
		printButton.id = 'print-btn'
		printButton.className = 'print-button'
		printButton.textContent = '🖨️ Print'

		printButton.addEventListener('click', () => printCallback())

		buttonContainer.append(printButton)
		document.body.append(buttonContainer)
	}

	/**
   * Renders the provided HTML into the resume container.
   * @param {string} renderedHTML - The HTML string to render.
   * @param {string} templateId - The ID of the current template.
   */
	renderTemplate(renderedHTML, templateId) {
		const resumeContainerHTML = `
      <div id="resume-container" class="resume-container ${templateId}-template">
        ${renderedHTML}
      </div>
    `
		this.appContainer.innerHTML = resumeContainerHTML
		this.resumeContainer = this.appContainer.querySelector('#resume-container')

		// Add template class to body for global styling
		document.body.className = `${templateId}-template`
	}

	/**
   * Displays a success message notification.
   * @param {string} message - The message to display.
   */
	showSuccessMessage(message) {
		const successMessage = document.createElement('div')
		successMessage.className = 'success-message'

		successMessage.innerHTML = `
      <span>✅ ${message}</span>
      <button onclick="this.parentElement.remove()" class="close-btn">×</button>
    `

		document.body.append(successMessage)

		setTimeout(() => {
			if (successMessage.parentElement) {
				successMessage.classList.add('fade-out')
				successMessage.addEventListener('animationend', () => successMessage.remove())
			}
		}, 4000)
	}

	/**
   * Displays a fatal initialization error message.
   * @param {Error} error - The error object.
   */
	showInitializationError(error) {
		this.appContainer.innerHTML = `
      <div class="initialization-error">
        <h1>Failed to Initialize Resume Builder</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check the console for more details and ensure resume.json is properly formatted.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `
	}
}
