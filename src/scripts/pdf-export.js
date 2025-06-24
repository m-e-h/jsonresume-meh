/**
 * PDF Export Module
 * Handles client-side PDF generation from HTML templates using html2pdf.js
 * Optimized for resume templates with proper styling and performance
 */

import html2pdf from 'html2pdf.js';

/**
 * Custom error class for PDF export operations
 */
export class PDFExportError extends Error {
  constructor(message, cause = null, options = {}) {
    super(message);
    this.name = 'PDFExportError';
    this.cause = cause;
    this.timestamp = new Date().toISOString();
    this.options = options;
  }
}

/**
 * PDF Export Configuration
 */
const DEFAULT_PDF_OPTIONS = {
  margin: [0.5, 0.5, 0.5, 0.5], // Top, Right, Bottom, Left (inches)
  filename: 'resume.pdf',
  image: {
    type: 'jpeg',
    quality: 0.98
  },
  html2canvas: {
    scale: 2,           // Higher scale for better quality
    useCORS: true,      // Enable CORS for external images
    allowTaint: true,   // Allow cross-origin images
    letterRendering: true,
    scrollX: 0,
    scrollY: 0,
    backgroundColor: '#ffffff'
  },
  jsPDF: {
    unit: 'in',
    format: 'letter',   // US Letter size (8.5" x 11")
    orientation: 'portrait',
    compress: true      // Compress PDF for smaller file size
  },
  pagebreak: {
    mode: ['avoid-all', 'css', 'legacy'],
    before: '.page-break-before',
    after: '.page-break-after',
    avoid: '.page-break-inside-avoid'
  }
};

/**
 * Template-specific PDF configurations
 */
const TEMPLATE_PDF_CONFIGS = {
  classic: {
    margin: [0.4, 0.4, 0.4, 0.4],
    html2canvas: {
      scale: 2.5,
      backgroundColor: '#ffffff'
    }
  },
  modern: {
    margin: [0.3, 0.3, 0.3, 0.3],
    html2canvas: {
      scale: 2.2,
      backgroundColor: '#ffffff'
    }
  },
  minimal: {
    margin: [0.6, 0.6, 0.6, 0.6],
    html2canvas: {
      scale: 2.3,
      backgroundColor: '#ffffff'
    }
  }
};

/**
 * PDF Export Class
 */
export class PDFExporter {
  constructor(options = {}) {
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
    this.isGenerating = false;
    this.generationStartTime = null;
    this.stats = {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      averageGenerationTime: 0,
      lastExportTime: null
    };

    console.log('✅ PDF Exporter initialized');
  }

  /**
   * Generate PDF from HTML element or content
   * @param {HTMLElement|string} source - HTML element or HTML string
   * @param {Object} options - PDF generation options
   * @returns {Promise<Blob>} PDF blob
   */
  async generatePDF(source, options = {}) {
    this.generationStartTime = performance.now();
    this.isGenerating = true;
    this.stats.totalExports++;

    try {
      // Merge options with defaults
      const pdfOptions = this.mergeOptions(options);

      // Prepare the source element
      const element = await this.prepareSourceElement(source);

      // Apply print-specific optimizations
      this.applyPrintOptimizations(element);

      // Generate PDF
      console.log('🔄 Starting PDF generation...');
      const pdfBlob = await this.convertToPDF(element, pdfOptions);

      // Cleanup
      this.cleanupAfterGeneration(element);

      // Update stats
      this.updateStats(true);

      console.log(`✅ PDF generated successfully in ${this.getLastGenerationTime()}ms`);
      return pdfBlob;

    } catch (error) {
      this.updateStats(false);
      console.error('❌ PDF generation failed:', error);
      throw new PDFExportError(
        `PDF generation failed: ${error.message}`,
        error,
        options
      );
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate and download PDF
   * @param {HTMLElement|string} source - HTML element or HTML string
   * @param {string} filename - Download filename
   * @param {Object} options - PDF generation options
   */
  async downloadPDF(source, filename = 'resume.pdf', options = {}) {
    try {
      const pdfOptions = { ...options, filename };
      const element = await this.prepareSourceElement(source);

      this.applyPrintOptimizations(element);

      console.log(`🔄 Generating and downloading PDF: ${filename}`);

      // Use html2pdf's save method for direct download
      await html2pdf()
        .set(this.mergeOptions(pdfOptions))
        .from(element)
        .save();

      this.cleanupAfterGeneration(element);
      this.updateStats(true);

      console.log(`✅ PDF downloaded successfully: ${filename}`);

    } catch (error) {
      this.updateStats(false);
      console.error('❌ PDF download failed:', error);
      throw new PDFExportError(
        `PDF download failed: ${error.message}`,
        error,
        { filename, ...options }
      );
    }
  }

  /**
   * Generate PDF for specific resume template
   * @param {string} templateId - Template identifier (classic, modern, minimal)
   * @param {HTMLElement|string} source - HTML source
   * @param {Object} resumeData - Resume data for filename generation
   * @param {Object} options - Additional options
   */
  async exportResumeTemplate(templateId, source, resumeData = {}, options = {}) {
    try {
      // Get template-specific configuration
      const templateConfig = TEMPLATE_PDF_CONFIGS[templateId] || {};

      // Generate filename from resume data
      const filename = this.generateFilename(resumeData, templateId);

      // Merge template-specific options
      const pdfOptions = {
        ...templateConfig,
        ...options,
        filename
      };

      console.log(`🔄 Exporting ${templateId} template as PDF: ${filename}`);

      return await this.downloadPDF(source, filename, pdfOptions);

    } catch (error) {
      throw new PDFExportError(
        `Template export failed for ${templateId}: ${error.message}`,
        error,
        { templateId, resumeData, options }
      );
    }
  }

  /**
   * Prepare source element for PDF generation
   * @param {HTMLElement|string} source - HTML element or string
   * @returns {HTMLElement} Prepared element
   */
  async prepareSourceElement(source) {
    let element;

    if (typeof source === 'string') {
      // Create temporary element from HTML string
      element = document.createElement('div');
      element.innerHTML = source;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';
      document.body.appendChild(element);
    } else if (source instanceof HTMLElement) {
      element = source;
    } else {
      throw new PDFExportError('Invalid source type. Must be HTMLElement or HTML string.');
    }

    // Wait for images to load
    await this.waitForImages(element);

    return element;
  }

  /**
   * Apply print-specific optimizations to element
   * @param {HTMLElement} element - Element to optimize
   */
  applyPrintOptimizations(element) {
    // Force print media query styles
    const printStyleSheet = document.createElement('style');
    printStyleSheet.textContent = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        .no-print {
          display: none !important;
        }

        .page-break-before {
          page-break-before: always !important;
        }

        .page-break-after {
          page-break-after: always !important;
        }

        .page-break-inside-avoid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .keep-with-next {
          page-break-after: avoid !important;
        }
      }
    `;

    document.head.appendChild(printStyleSheet);

    // Store reference for cleanup
    element._printStyleSheet = printStyleSheet;
  }

  /**
   * Convert element to PDF using html2pdf
   * @param {HTMLElement} element - Element to convert
   * @param {Object} options - PDF options
   * @returns {Promise<Blob>} PDF blob
   */
  async convertToPDF(element, options) {
    return new Promise((resolve, reject) => {
      html2pdf()
        .set(options)
        .from(element)
        .outputPdf('blob')
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Wait for all images in element to load
   * @param {HTMLElement} element - Element containing images
   * @returns {Promise<void>}
   */
  async waitForImages(element) {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails to load
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });
    });

    await Promise.all(imagePromises);
  }

  /**
   * Cleanup after PDF generation
   * @param {HTMLElement} element - Element to cleanup
   */
  cleanupAfterGeneration(element) {
    // Remove temporary elements
    if (element.style.position === 'absolute' && element.style.left === '-9999px') {
      document.body.removeChild(element);
    }

    // Remove print stylesheet
    if (element._printStyleSheet) {
      document.head.removeChild(element._printStyleSheet);
    }
  }

  /**
   * Generate filename from resume data
   * @param {Object} resumeData - Resume data
   * @param {string} templateId - Template identifier
   * @returns {string} Generated filename
   */
  generateFilename(resumeData, templateId = '') {
    const name = resumeData.basics?.name || 'Resume';
    const label = resumeData.basics?.label || '';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let filename = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    if (label) {
      const cleanLabel = label.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      filename += `_${cleanLabel}`;
    }

    if (templateId) {
      filename += `_${templateId}`;
    }

    filename += `_${timestamp}.pdf`;

    return filename;
  }

  /**
   * Merge options with defaults and template-specific configs
   * @param {Object} options - User options
   * @returns {Object} Merged options
   */
  mergeOptions(options) {
    return {
      ...this.options,
      ...options,
      html2canvas: {
        ...this.options.html2canvas,
        ...options.html2canvas
      },
      jsPDF: {
        ...this.options.jsPDF,
        ...options.jsPDF
      }
    };
  }

  /**
   * Update generation statistics
   * @param {boolean} success - Whether generation was successful
   */
  updateStats(success) {
    const generationTime = this.getLastGenerationTime();

    if (success) {
      this.stats.successfulExports++;
      this.stats.lastExportTime = generationTime;

      // Update average generation time
      const totalTime = (this.stats.averageGenerationTime * (this.stats.successfulExports - 1)) + generationTime;
      this.stats.averageGenerationTime = Math.round(totalTime / this.stats.successfulExports);
    } else {
      this.stats.failedExports++;
    }
  }

  /**
   * Get last generation time in milliseconds
   * @returns {number} Generation time in ms
   */
  getLastGenerationTime() {
    return this.generationStartTime ?
      Math.round(performance.now() - this.generationStartTime) : 0;
  }

  /**
   * Get PDF export statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalExports > 0 ?
        Math.round((this.stats.successfulExports / this.stats.totalExports) * 100) : 0,
      isGenerating: this.isGenerating
    };
  }

  /**
   * Check if PDF generation is currently in progress
   * @returns {boolean} True if generating
   */
  isGeneratingPDF() {
    return this.isGenerating;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      averageGenerationTime: 0,
      lastExportTime: null
    };
    console.log('📊 PDF export statistics reset');
  }
}

// Export singleton instance
export const pdfExporter = new PDFExporter();

// Export utility functions
export const PDFUtils = {
  /**
   * Validate PDF options
   * @param {Object} options - Options to validate
   * @returns {boolean} True if valid
   */
  validateOptions(options) {
    if (!options || typeof options !== 'object') return false;

    // Check required properties
    if (options.jsPDF) {
      const validFormats = ['a4', 'letter', 'legal'];
      const validOrientations = ['portrait', 'landscape'];

      if (options.jsPDF.format && !validFormats.includes(options.jsPDF.format)) {
        return false;
      }

      if (options.jsPDF.orientation && !validOrientations.includes(options.jsPDF.orientation)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Get recommended options for template
   * @param {string} templateId - Template identifier
   * @returns {Object} Recommended options
   */
  getTemplateOptions(templateId) {
    return TEMPLATE_PDF_CONFIGS[templateId] || {};
  },

  /**
   * Estimate PDF file size based on content
   * @param {HTMLElement} element - Element to analyze
   * @returns {number} Estimated size in KB
   */
  estimateFileSize(element) {
    const textLength = element.textContent?.length || 0;
    const imageCount = element.querySelectorAll('img').length;

    // Rough estimation: 1KB per 100 characters + 50KB per image
    return Math.round((textLength / 100) + (imageCount * 50));
  }
};

export default pdfExporter;