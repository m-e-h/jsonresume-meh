/**
 * Main Entry Point for JSON Resume Builder
 * Initializes the application and coordinates all modules
 */

import { getSelectedTemplate, templateConfig } from '../template.config.js';
import './styles/shared/_variables.scss';

// Module imports
import { DataProcessor } from './scripts/data-processor.js';
import { TemplateRenderer } from './scripts/template-renderer.js';
import { pdfExporter } from './scripts/pdf-export.js';
import { errorHandler } from './scripts/error-handler.js';

/**
 * Main Application Class
 */
class ResumeBuilder {
  constructor() {
    this.isInitialized = false;
    this.currentTemplate = null;
    this.resumeData = null;
    this.modules = {};

    // Initialize modules
    this.dataProcessor = new DataProcessor();
    this.templateRenderer = new TemplateRenderer();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing JSON Resume Builder...');

      // Show loading state
      this.showLoadingState();

      // Initialize error handling first
      this.initializeErrorHandling();

      // Load and validate resume data
      await this.loadResumeData();

      // Initialize template system
      await this.initializeTemplateSystem();

      // Set up UI event listeners
      this.setupEventListeners();

      // Render the initial template
      await this.renderTemplate();

      // Initialize PDF export functionality
      this.initializePDFExport();

      // Hide loading state
      this.hideLoadingState();

      this.isInitialized = true;
      console.log('✅ Resume Builder initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Resume Builder:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Show loading state in the UI
   */
  showLoadingState() {
    const loadingHTML = `
      <div id="loading-state" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your resume...</p>
      </div>
    `;
    document.body.innerHTML = loadingHTML;
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const loadingElement = document.getElementById('loading-state');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  /**
   * Initialize error handling system
   */
  initializeErrorHandling() {
    console.log('🛡️  Error handling initialized');

    // The errorHandler module automatically sets up global error handlers
    // We just need to ensure it's initialized (it auto-initializes on import)
    if (!errorHandler.isInitialized) {
      errorHandler.init();
    }

    // Make error handler available globally for debugging
    window.errorHandler = errorHandler;
  }

  /**
   * Load and validate resume data
   */
  async loadResumeData() {
    try {
      console.log('📄 Loading resume data...');

      // Use DataProcessor to load and validate resume data
      this.resumeData = await this.dataProcessor.loadResumeData('/resume.json');
      console.log('✅ Resume data loaded and validated successfully');

    } catch (error) {
      throw new Error(`Resume data loading failed: ${error.message}`);
    }
  }

  /**
   * Initialize template system
   */
  async initializeTemplateSystem() {
    console.log('🎨 Initializing template system...');

    // Initialize template renderer
    await this.templateRenderer.initialize();

    this.currentTemplate = getSelectedTemplate();
    console.log(`📝 Selected template: ${this.currentTemplate.name}`);

    // Create template container if it doesn't exist
    if (!document.getElementById('resume-container')) {
      const container = document.createElement('div');
      container.id = 'resume-container';
      container.className = 'resume-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Set up UI event listeners
   */
  setupEventListeners() {
    console.log('🎯 Setting up event listeners...');

    // Template selector (if in development mode)
    if (templateConfig.buildOptions.includeTemplateSelector) {
      this.setupTemplateSelector();
    }

    // PDF export button (will be created when PDF module is ready)
    this.setupPDFExportButton();

    // File watcher for resume.json changes (development mode)
    if (import.meta.env.DEV) {
      this.setupFileWatcher();
    }
  }

  /**
   * Setup template selector for development
   */
  setupTemplateSelector() {
    if (!this.templateRenderer.isInitialized) return;

    const availableTemplates = this.templateRenderer.getAvailableTemplates();
    if (availableTemplates.length <= 1) return;

    // Create template selector UI
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'template-selector';
    selectorContainer.className = 'template-selector no-print';
    selectorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    `;

    const label = document.createElement('label');
    label.textContent = 'Template: ';
    label.style.marginRight = '10px';

    const select = document.createElement('select');
    select.style.padding = '5px';

    availableTemplates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      option.selected = template.id === this.currentTemplate.id;
      select.appendChild(option);
    });

    select.addEventListener('change', async (e) => {
      await this.switchTemplate(e.target.value);
    });

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    document.body.appendChild(selectorContainer);

    console.log('🔄 Template selector initialized with', availableTemplates.length, 'templates');
  }

  /**
   * Switch to a different template
   */
  async switchTemplate(templateId) {
    try {
      console.log(`🔄 Switching to template: ${templateId}`);

      this.templateRenderer.setTemplate(templateId);
      this.currentTemplate = this.templateRenderer.currentTemplate;

      // Re-render with new template
      await this.renderTemplate();

      console.log(`✅ Template switched to: ${this.currentTemplate.name}`);

    } catch (error) {
      console.error('Template switch failed:', error);
      this.handleError(error);
    }
  }

  /**
   * Setup PDF export and print buttons
   */
  setupPDFExportButton() {
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'action-buttons';
    buttonContainer.className = 'action-buttons no-print';
    buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    `;

    // Create print button
    const printButton = document.createElement('button');
    printButton.id = 'print-btn';
    printButton.className = 'print-button';
    printButton.textContent = '🖨️ Print';
    printButton.style.cssText = `
      padding: 10px 20px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
    `;

    printButton.addEventListener('click', () => {
      this.printResume();
    });

    // Create PDF export button
    const exportButton = document.createElement('button');
    exportButton.id = 'pdf-export-btn';
    exportButton.className = 'pdf-export-button';
    exportButton.textContent = '📄 Export PDF';
    exportButton.style.cssText = `
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
    `;

    exportButton.addEventListener('click', () => {
      this.exportToPDF();
    });

    // Add buttons to container and append to body
    buttonContainer.appendChild(printButton);
    buttonContainer.appendChild(exportButton);
    document.body.appendChild(buttonContainer);
  }

  /**
   * Print the resume using browser's print functionality
   */
  printResume() {
    try {
      console.log('🖨️ Printing resume...');

      // Trigger the browser's print dialog
      window.print();

    } catch (error) {
      console.error('Print failed:', error);
      this.handleError(error, { operation: 'Print resume' });
    }
  }

  /**
   * Setup file watcher for development
   */
  setupFileWatcher() {
    console.log('👀 File watcher ready for development mode');
    // Hot reload functionality will be handled by Vite
  }

  /**
   * Render the current template with resume data
   */
  async renderTemplate() {
    try {
      console.log('🎨 Rendering template...');

      const container = document.getElementById('resume-container');
      if (!container) {
        throw new Error('Resume container not found');
      }

      // Use TemplateRenderer to render the template with data
      const renderedHTML = await this.templateRenderer.render(this.resumeData);

      // Apply template-specific styling
      container.innerHTML = renderedHTML;
      container.className = `resume-container ${this.currentTemplate.id}-template`;

      console.log('✅ Template rendered successfully');

    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Initialize PDF export functionality
   */
  initializePDFExport() {
    console.log('📄 PDF export system ready');

    // Update export button with loading state capability
    const exportButton = document.getElementById('pdf-export-btn');
    if (exportButton) {
      exportButton.setAttribute('data-original-text', exportButton.textContent);
    }
  }

  /**
   * Export resume to PDF
   */
  async exportToPDF() {
    const exportButton = document.getElementById('pdf-export-btn');
    const originalText = exportButton?.getAttribute('data-original-text') || '📄 Export PDF';

    try {
      console.log('📄 Exporting to PDF...');

      // Update button to show loading state
      if (exportButton) {
        exportButton.textContent = '⏳ Generating PDF...';
        exportButton.disabled = true;
        exportButton.style.opacity = '0.7';
      }

      // Get the resume container element
      const resumeContainer = document.getElementById('resume-container');
      if (!resumeContainer) {
        throw new Error('Resume container not found');
      }

      // Get current template ID
      const templateId = this.currentTemplate?.id || 'classic';

      // Export using the PDF exporter
      await pdfExporter.exportResumeTemplate(
        templateId,
        resumeContainer,
        this.resumeData
      );

      console.log('✅ PDF exported successfully');

      // Show success feedback
      this.showSuccessMessage('PDF downloaded successfully!');

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      this.handleError(error, { operation: 'PDF export', templateId });
    } finally {
      // Reset button state
      if (exportButton) {
        exportButton.textContent = originalText;
        exportButton.disabled = false;
        exportButton.style.opacity = '1';
      }
    }
  }

  /**
   * Show success message to user
   */
  showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1001;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      animation: slideDown 0.3s ease-out;
    `;

    successMessage.innerHTML = `
      <span>✅ ${message}</span>
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">×</button>
    `;

    // Add animation styles
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(successMessage);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (successMessage.parentElement) {
        successMessage.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => successMessage.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Handle application errors
   */
  handleError(error, context = {}) {
    // Use the centralized error handler
    return errorHandler.handleError(error, {
      component: 'ResumeBuilder',
      ...context
    });
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    document.body.innerHTML = `
      <div class="initialization-error">
        <h1>Failed to Initialize Resume Builder</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check the console for more details and ensure resume.json is properly formatted.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  const app = new ResumeBuilder();
  await app.init();

  // Make app instance globally available for debugging
  window.resumeBuilder = app;
});

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}