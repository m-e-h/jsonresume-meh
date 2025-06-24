/**
 * Main Entry Point for JSON Resume Builder
 * Initializes the application and coordinates all modules
 */

import { getSelectedTemplate, templateConfig } from '../template.config.js';
import './styles/shared/_variables.scss';

// Module imports (will be created in subsequent tasks)
// import { DataProcessor } from './scripts/data-processor.js';
// import { TemplateRenderer } from './scripts/template-renderer.js';
// import { PDFExporter } from './scripts/pdf-export.js';
// import { ErrorHandler } from './scripts/error-handler.js';

/**
 * Main Application Class
 */
class ResumeBuilder {
  constructor() {
    this.isInitialized = false;
    this.currentTemplate = null;
    this.resumeData = null;
    this.modules = {};
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
      this.initializeTemplateSystem();

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
    // This will be implemented when ErrorHandler module is created
    console.log('🛡️  Error handling initialized');

    // Global error handler for unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Global error handler for JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error);
    });
  }

  /**
   * Load and validate resume data
   */
  async loadResumeData() {
    try {
      console.log('📄 Loading resume data...');

      // For now, we'll fetch the resume.json from the project root
      // Later this will use the DataProcessor module
      const response = await fetch('/resume.json');
      if (!response.ok) {
        throw new Error(`Failed to load resume.json: ${response.statusText}`);
      }

      this.resumeData = await response.json();
      console.log('✅ Resume data loaded successfully');

    } catch (error) {
      throw new Error(`Resume data loading failed: ${error.message}`);
    }
  }

  /**
   * Initialize template system
   */
  initializeTemplateSystem() {
    console.log('🎨 Initializing template system...');

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
    // This will be implemented when we have multiple templates
    console.log('🔄 Template selector ready for development mode');
  }

  /**
   * Setup PDF export button
   */
  setupPDFExportButton() {
    // Create PDF export button
    const exportButton = document.createElement('button');
    exportButton.id = 'pdf-export-btn';
    exportButton.className = 'pdf-export-button';
    exportButton.textContent = 'Export to PDF';
    exportButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;

    exportButton.addEventListener('click', () => {
      this.exportToPDF();
    });

    document.body.appendChild(exportButton);
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

      // For now, create a basic template structure
      // This will be replaced by the TemplateRenderer module
      container.innerHTML = `
        <div class="resume-content ${this.currentTemplate.id}">
          <h1>Resume Preview</h1>
          <p>Template: ${this.currentTemplate.name}</p>
          <p>Data loaded: ${this.resumeData ? 'Yes' : 'No'}</p>
          <div id="template-content">
            <!-- Template content will be rendered here -->
            <p>Template rendering system will be implemented in Task 3.0</p>
          </div>
        </div>
      `;

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
    // PDF export will be implemented in Task 4.0
  }

  /**
   * Export resume to PDF
   */
  async exportToPDF() {
    try {
      console.log('📄 Exporting to PDF...');
      alert('PDF export will be implemented in Task 4.0');
    } catch (error) {
      console.error('PDF export failed:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle application errors
   */
  handleError(error) {
    console.error('Application error:', error);
    // Error handling will be improved when ErrorHandler module is created

    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #dc3545;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 1001;
      max-width: 400px;
    `;
    errorMessage.innerHTML = `
      <strong>Error:</strong> ${error.message || 'An unexpected error occurred'}
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer;">×</button>
    `;

    document.body.appendChild(errorMessage);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentElement) {
        errorMessage.remove();
      }
    }, 5000);
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