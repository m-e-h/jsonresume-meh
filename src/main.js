/**
 * Main Entry Point for JSON Resume Builder
 * Initializes the application and coordinates all modules
 */

import { getSelectedTemplate, templateConfig } from '../template.config.js';

// Import simplified CSS styles
import './styles/resume.css';

// Module imports
import { DataProcessor } from './scripts/data-processor.js';
import { TemplateRenderer } from './scripts/template-renderer.js';
import { errorHandler } from './scripts/error-handler.js';
import { UIManager } from './scripts/ui-manager.js';

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
    this.uiManager = new UIManager();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing JSON Resume Builder...');

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

      this.isInitialized = true;
      console.log('✅ Resume Builder initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Resume Builder:', error);
      this.uiManager.showInitializationError(error);
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
      const result = await this.dataProcessor.loadResumeData('/resume.json');

      // Extract the actual resume data from the result
      this.resumeData = result.data;
      this.validationResult = result.validation;
      this.metadata = result.metadata;

      console.log('✅ Resume data loaded and validated successfully');
      console.log('📊 Data structure:', this.resumeData);

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

    // The UIManager now handles the creation of the container during render
  }

  /**
   * Set up UI event listeners
   */
  setupEventListeners() {
    console.log('🎯 Setting up event listeners...');

    // Template selector (if in development mode)
    if (templateConfig.buildOptions.includeTemplateSelector) {
      if (!this.templateRenderer.isInitialized) return;

      const availableTemplates = this.templateRenderer.getAvailableTemplates();
      this.uiManager.setupTemplateSelector(
        availableTemplates,
        this.currentTemplate.id,
        this.switchTemplate.bind(this)
      );
    }

    // Print button
    this.uiManager.setupPrintButton(this.printResume.bind(this));

    // File watcher for resume.json changes (development mode)
    if (import.meta.env.DEV) {
      this.setupFileWatcher();
    }
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

      // Use TemplateRenderer to render the template with data
      const renderedHTML = await this.templateRenderer.render(this.resumeData);

      // UIManager renders the complete template into the app container
      this.uiManager.renderTemplate(renderedHTML, this.currentTemplate.id);

      console.log('✅ Template rendered successfully');

    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
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