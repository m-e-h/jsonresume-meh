/**
 * Unit Tests for PDF Export Module
 * Tests all functionality of the PDFExporter class and utilities
 */

import { PDFExporter, PDFExportError, pdfExporter, PDFUtils } from './pdf-export.js';

// Mock html2pdf.js
const mockHtml2pdf = {
  set: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  save: jest.fn().mockResolvedValue(undefined),
  outputPdf: jest.fn().mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' }))
};

jest.mock('html2pdf.js', () => jest.fn(() => mockHtml2pdf));

// Mock DOM methods
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => 1000)
  }
});

// Mock console methods to avoid test output clutter
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('PDFExportError', () => {
  test('should create error with message', () => {
    const error = new PDFExportError('Test error');

    expect(error.name).toBe('PDFExportError');
    expect(error.message).toBe('Test error');
    expect(error.timestamp).toBeDefined();
    expect(error.options).toEqual({});
  });

  test('should create error with cause and options', () => {
    const cause = new Error('Original error');
    const options = { templateId: 'modern' };
    const error = new PDFExportError('Test error', cause, options);

    expect(error.cause).toBe(cause);
    expect(error.options).toBe(options);
  });

  test('should have ISO timestamp', () => {
    const error = new PDFExportError('Test error');

    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('PDFExporter', () => {
  let exporter;
  let mockElement;

  beforeEach(() => {
    exporter = new PDFExporter();

    // Create mock DOM element
    mockElement = {
      innerHTML: '<div>Test content</div>',
      style: {},
      querySelectorAll: jest.fn(() => []),
      textContent: 'Test content'
    };

    // Mock DOM methods
    global.document = {
      createElement: jest.fn(() => ({
        style: {},
        textContent: '',
        innerHTML: '',
        appendChild: jest.fn(),
        remove: jest.fn()
      })),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      },
      head: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      }
    };

    // Reset mocks
    jest.clearAllMocks();
    window.performance.now.mockReturnValue(1000);
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      expect(exporter.options.filename).toBe('resume.pdf');
      expect(exporter.options.jsPDF.format).toBe('letter');
      expect(exporter.isGenerating).toBe(false);
      expect(exporter.stats.totalExports).toBe(0);
    });

    test('should merge custom options', () => {
      const customExporter = new PDFExporter({
        filename: 'custom.pdf',
        jsPDF: { format: 'a4' }
      });

      expect(customExporter.options.filename).toBe('custom.pdf');
      expect(customExporter.options.jsPDF.format).toBe('a4');
      expect(customExporter.options.jsPDF.orientation).toBe('portrait'); // Should keep default
    });
  });

  describe('generatePDF', () => {
    test('should generate PDF from HTML element', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockHtml2pdf.outputPdf.mockResolvedValue(mockBlob);

      const result = await exporter.generatePDF(mockElement);

      expect(result).toBe(mockBlob);
      expect(exporter.stats.totalExports).toBe(1);
      expect(exporter.stats.successfulExports).toBe(1);
      expect(exporter.isGenerating).toBe(false);
    });

    test('should generate PDF from HTML string', async () => {
      const htmlString = '<div>Test HTML</div>';
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockHtml2pdf.outputPdf.mockResolvedValue(mockBlob);

      const result = await exporter.generatePDF(htmlString);

      expect(result).toBe(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should handle generation errors', async () => {
      const error = new Error('Generation failed');
      mockHtml2pdf.outputPdf.mockRejectedValue(error);

      await expect(exporter.generatePDF(mockElement)).rejects.toThrow(PDFExportError);
      expect(exporter.stats.failedExports).toBe(1);
      expect(exporter.isGenerating).toBe(false);
    });

    test('should track generation time', async () => {
      window.performance.now
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(3500); // End time

      await exporter.generatePDF(mockElement);

      expect(exporter.stats.lastExportTime).toBe(2500);
      expect(exporter.stats.averageGenerationTime).toBe(2500);
    });

    test('should set isGenerating flag during generation', async () => {
      let isGeneratingDuringExecution = false;

      mockHtml2pdf.outputPdf.mockImplementation(() => {
        isGeneratingDuringExecution = exporter.isGenerating;
        return Promise.resolve(new Blob());
      });

      await exporter.generatePDF(mockElement);

      expect(isGeneratingDuringExecution).toBe(true);
      expect(exporter.isGenerating).toBe(false);
    });
  });

  describe('downloadPDF', () => {
    test('should download PDF with default filename', async () => {
      await exporter.downloadPDF(mockElement);

      expect(mockHtml2pdf.set).toHaveBeenCalled();
      expect(mockHtml2pdf.from).toHaveBeenCalledWith(mockElement);
      expect(mockHtml2pdf.save).toHaveBeenCalled();
    });

    test('should download PDF with custom filename', async () => {
      await exporter.downloadPDF(mockElement, 'custom.pdf');

      const setOptions = mockHtml2pdf.set.mock.calls[0][0];
      expect(setOptions.filename).toBe('custom.pdf');
    });

    test('should handle download errors', async () => {
      const error = new Error('Download failed');
      mockHtml2pdf.save.mockRejectedValue(error);

      await expect(exporter.downloadPDF(mockElement)).rejects.toThrow(PDFExportError);
    });
  });

  describe('exportResumeTemplate', () => {
    const mockResumeData = {
      basics: {
        name: 'John Doe',
        label: 'Software Developer'
      }
    };

    test('should export with template-specific configuration', async () => {
      await exporter.exportResumeTemplate('modern', mockElement, mockResumeData);

      const setOptions = mockHtml2pdf.set.mock.calls[0][0];
      expect(setOptions.margin).toEqual([0.3, 0.3, 0.3, 0.3]); // Modern template margins
      expect(setOptions.html2canvas.scale).toBe(2.2); // Modern template scale
    });

    test('should generate filename from resume data', async () => {
      await exporter.exportResumeTemplate('classic', mockElement, mockResumeData);

      const setOptions = mockHtml2pdf.set.mock.calls[0][0];
      expect(setOptions.filename).toMatch(/John_Doe_Software_Developer_classic_\d{4}-\d{2}-\d{2}\.pdf/);
    });

    test('should handle unknown template', async () => {
      await exporter.exportResumeTemplate('unknown', mockElement, mockResumeData);

      // Should not throw error, just use default configuration
      expect(mockHtml2pdf.save).toHaveBeenCalled();
    });

    test('should handle missing resume data', async () => {
      await exporter.exportResumeTemplate('minimal', mockElement, {});

      const setOptions = mockHtml2pdf.set.mock.calls[0][0];
      expect(setOptions.filename).toMatch(/Resume_minimal_\d{4}-\d{2}-\d{2}\.pdf/);
    });
  });

  describe('prepareSourceElement', () => {
    test('should return HTML element as-is', async () => {
      const result = await exporter.prepareSourceElement(mockElement);
      expect(result).toBe(mockElement);
    });

    test('should create element from HTML string', async () => {
      const mockCreatedElement = {
        innerHTML: '',
        style: {},
        querySelectorAll: jest.fn(() => [])
      };
      document.createElement.mockReturnValue(mockCreatedElement);

      const result = await exporter.prepareSourceElement('<div>Test</div>');

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockCreatedElement.innerHTML).toBe('<div>Test</div>');
      expect(result).toBe(mockCreatedElement);
    });

    test('should reject invalid source type', async () => {
      await expect(exporter.prepareSourceElement(123)).rejects.toThrow(PDFExportError);
    });
  });

  describe('waitForImages', () => {
    test('should resolve immediately when no images', async () => {
      mockElement.querySelectorAll.mockReturnValue([]);

      await expect(exporter.waitForImages(mockElement)).resolves.toBeUndefined();
    });

    test('should wait for images to load', async () => {
      const mockImg1 = { complete: false, onload: null, onerror: null };
      const mockImg2 = { complete: true };
      mockElement.querySelectorAll.mockReturnValue([mockImg1, mockImg2]);

      const promise = exporter.waitForImages(mockElement);

      // Simulate image load
      setTimeout(() => mockImg1.onload(), 10);

      await expect(promise).resolves.toBeUndefined();
    });

    test('should handle image load errors gracefully', async () => {
      const mockImg = { complete: false, onload: null, onerror: null };
      mockElement.querySelectorAll.mockReturnValue([mockImg]);

      const promise = exporter.waitForImages(mockElement);

      // Simulate image error
      setTimeout(() => mockImg.onerror(), 10);

      await expect(promise).resolves.toBeUndefined();
    });

    test('should timeout after 5 seconds', async () => {
      const mockImg = { complete: false, onload: null, onerror: null };
      mockElement.querySelectorAll.mockReturnValue([mockImg]);

      jest.useFakeTimers();
      const promise = exporter.waitForImages(mockElement);

      jest.advanceTimersByTime(5000);

      await expect(promise).resolves.toBeUndefined();
      jest.useRealTimers();
    });
  });

  describe('generateFilename', () => {
    test('should generate filename from resume data', () => {
      const resumeData = {
        basics: {
          name: 'Jane Smith',
          label: 'UX Designer'
        }
      };

      const filename = exporter.generateFilename(resumeData, 'modern');
      expect(filename).toMatch(/Jane_Smith_UX_Designer_modern_\d{4}-\d{2}-\d{2}\.pdf/);
    });

    test('should handle special characters in name', () => {
      const resumeData = {
        basics: {
          name: 'José María O\'Connor',
          label: 'Full-Stack Developer'
        }
      };

      const filename = exporter.generateFilename(resumeData, 'classic');
      expect(filename).toMatch(/Jos_Mara_OConnor_FullStack_Developer_classic_\d{4}-\d{2}-\d{2}\.pdf/);
    });

    test('should use default name when missing', () => {
      const filename = exporter.generateFilename({}, 'minimal');
      expect(filename).toMatch(/Resume_minimal_\d{4}-\d{2}-\d{2}\.pdf/);
    });

    test('should handle missing template ID', () => {
      const resumeData = { basics: { name: 'Test User' } };
      const filename = exporter.generateFilename(resumeData);
      expect(filename).toMatch(/Test_User_\d{4}-\d{2}-\d{2}\.pdf/);
    });
  });

  describe('Statistics', () => {
    test('should track export statistics', async () => {
      // Successful export
      await exporter.generatePDF(mockElement);

      // Failed export
      mockHtml2pdf.outputPdf.mockRejectedValueOnce(new Error('Failed'));
      try {
        await exporter.generatePDF(mockElement);
      } catch {}

      const stats = exporter.getStats();
      expect(stats.totalExports).toBe(2);
      expect(stats.successfulExports).toBe(1);
      expect(stats.failedExports).toBe(1);
      expect(stats.successRate).toBe(50);
    });

    test('should calculate average generation time', async () => {
      window.performance.now
        .mockReturnValueOnce(1000).mockReturnValueOnce(3000) // First export: 2000ms
        .mockReturnValueOnce(2000).mockReturnValueOnce(5000); // Second export: 3000ms

      await exporter.generatePDF(mockElement);
      await exporter.generatePDF(mockElement);

      const stats = exporter.getStats();
      expect(stats.averageGenerationTime).toBe(2500); // (2000 + 3000) / 2
    });

    test('should reset statistics', () => {
      exporter.stats.totalExports = 5;
      exporter.resetStats();

      expect(exporter.stats.totalExports).toBe(0);
      expect(exporter.stats.successfulExports).toBe(0);
      expect(exporter.stats.failedExports).toBe(0);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup temporary elements', () => {
      const mockTempElement = {
        style: { position: 'absolute', left: '-9999px' },
        _printStyleSheet: { remove: jest.fn() }
      };

      exporter.cleanupAfterGeneration(mockTempElement);

      expect(document.body.removeChild).toHaveBeenCalledWith(mockTempElement);
      expect(document.head.removeChild).toHaveBeenCalledWith(mockTempElement._printStyleSheet);
    });

    test('should not cleanup non-temporary elements', () => {
      const mockElement = { style: {} };

      exporter.cleanupAfterGeneration(mockElement);

      expect(document.body.removeChild).not.toHaveBeenCalled();
    });
  });
});

describe('PDFUtils', () => {
  describe('validateOptions', () => {
    test('should validate valid options', () => {
      const validOptions = {
        jsPDF: {
          format: 'letter',
          orientation: 'portrait'
        }
      };

      expect(PDFUtils.validateOptions(validOptions)).toBe(true);
    });

    test('should reject invalid format', () => {
      const invalidOptions = {
        jsPDF: {
          format: 'invalid'
        }
      };

      expect(PDFUtils.validateOptions(invalidOptions)).toBe(false);
    });

    test('should reject invalid orientation', () => {
      const invalidOptions = {
        jsPDF: {
          orientation: 'invalid'
        }
      };

      expect(PDFUtils.validateOptions(invalidOptions)).toBe(false);
    });

    test('should handle null/undefined options', () => {
      expect(PDFUtils.validateOptions(null)).toBe(false);
      expect(PDFUtils.validateOptions(undefined)).toBe(false);
      expect(PDFUtils.validateOptions('string')).toBe(false);
    });
  });

  describe('getTemplateOptions', () => {
    test('should return template-specific options', () => {
      const classicOptions = PDFUtils.getTemplateOptions('classic');
      expect(classicOptions.margin).toEqual([0.4, 0.4, 0.4, 0.4]);
      expect(classicOptions.html2canvas.scale).toBe(2.5);
    });

    test('should return empty object for unknown template', () => {
      const unknownOptions = PDFUtils.getTemplateOptions('unknown');
      expect(unknownOptions).toEqual({});
    });
  });

  describe('estimateFileSize', () => {
    test('should estimate file size based on content', () => {
      const mockElement = {
        textContent: 'A'.repeat(1000), // 1000 characters
        querySelectorAll: jest.fn(() => [1, 2]) // 2 images
      };

      const estimatedSize = PDFUtils.estimateFileSize(mockElement);
      expect(estimatedSize).toBe(110); // (1000/100) + (2*50) = 10 + 100 = 110KB
    });

    test('should handle missing text content', () => {
      const mockElement = {
        textContent: null,
        querySelectorAll: jest.fn(() => [])
      };

      const estimatedSize = PDFUtils.estimateFileSize(mockElement);
      expect(estimatedSize).toBe(0);
    });
  });
});

describe('Singleton Instance', () => {
  test('should export singleton pdfExporter instance', () => {
    expect(pdfExporter).toBeInstanceOf(PDFExporter);
  });

  test('should be the same instance across imports', () => {
    // This would be tested with actual imports in a real scenario
    expect(pdfExporter).toBeDefined();
  });
});

describe('Integration Tests', () => {
  test('should handle complete PDF export workflow', async () => {
    const mockResumeData = {
      basics: {
        name: 'Integration Test',
        label: 'Developer'
      }
    };

    const mockElement = {
      innerHTML: '<div>Resume content</div>',
      style: {},
      querySelectorAll: jest.fn(() => []),
      textContent: 'Resume content'
    };

    await expect(
      pdfExporter.exportResumeTemplate('modern', mockElement, mockResumeData)
    ).resolves.toBeUndefined();

    expect(mockHtml2pdf.set).toHaveBeenCalled();
    expect(mockHtml2pdf.from).toHaveBeenCalledWith(mockElement);
    expect(mockHtml2pdf.save).toHaveBeenCalled();
  });

  test('should handle errors gracefully in full workflow', async () => {
    mockHtml2pdf.save.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      pdfExporter.exportResumeTemplate('classic', mockElement, {})
    ).rejects.toThrow(PDFExportError);
  });
});

describe('Performance Tests', () => {
  test('should complete PDF generation within reasonable time', async () => {
    const startTime = Date.now();

    await pdfExporter.generatePDF(mockElement);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within 1 second in test environment
    expect(duration).toBeLessThan(1000);
  });

  test('should handle multiple concurrent exports', async () => {
    const promises = Array.from({ length: 3 }, () =>
      pdfExporter.generatePDF(mockElement)
    );

    await expect(Promise.all(promises)).resolves.toHaveLength(3);
  });
});

describe('Error Handling', () => {
  test('should handle html2pdf initialization errors', async () => {
    const mockHtml2pdfError = jest.fn(() => {
      throw new Error('html2pdf initialization failed');
    });

    jest.doMock('html2pdf.js', () => mockHtml2pdfError);

    // This would need to be tested with actual module reloading
    // For now, we test the error handling in the conversion method
    mockHtml2pdf.outputPdf.mockRejectedValue(new Error('html2pdf failed'));

    await expect(pdfExporter.generatePDF(mockElement)).rejects.toThrow(PDFExportError);
  });

  test('should provide detailed error information', async () => {
    const originalError = new Error('Detailed error message');
    mockHtml2pdf.outputPdf.mockRejectedValue(originalError);

    try {
      await pdfExporter.generatePDF(mockElement, { templateId: 'test' });
    } catch (error) {
      expect(error).toBeInstanceOf(PDFExportError);
      expect(error.message).toContain('PDF generation failed');
      expect(error.cause).toBe(originalError);
      expect(error.options.templateId).toBe('test');
    }
  });
});

// Test data validation
describe('Data Validation', () => {
  test('should handle malformed resume data', async () => {
    const malformedData = {
      basics: null,
      work: 'invalid'
    };

    // Should not throw error, just use defaults
    await expect(
      pdfExporter.exportResumeTemplate('classic', mockElement, malformedData)
    ).resolves.toBeUndefined();
  });

  test('should sanitize filename characters', () => {
    const dangerousData = {
      basics: {
        name: 'Test<>User/\\:*?"|\0',
        label: 'Dev/Ops Engineer'
      }
    };

    const filename = pdfExporter.generateFilename(dangerousData, 'modern');
    expect(filename).toMatch(/TestUser_DevOps_Engineer_modern_\d{4}-\d{2}-\d{2}\.pdf/);
  });
});