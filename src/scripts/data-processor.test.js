/**
 * Unit Tests for Data Processor
 * Tests resume data loading, processing, validation, and caching functionality
 */

import { dataProcessor, DataProcessor, DataProcessorError } from './data-processor.js';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock performance.now for consistent timing
global.performance = {
  now: jest.fn(() => Date.now())
};

describe('Data Processor', () => {

  beforeEach(() => {
    // Reset mocks and data processor state
    fetch.mockClear();
    performance.now.mockClear();
    dataProcessor.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize data processor instance', () => {
      expect(dataProcessor).toBeInstanceOf(DataProcessor);
      expect(dataProcessor.resumeData).toBeNull();
      expect(dataProcessor.isLoaded).toBe(false);
      expect(dataProcessor.cache).toBeInstanceOf(Map);
    });

    it('should have default values defined', () => {
      expect(dataProcessor.defaultValues).toBeDefined();
      expect(dataProcessor.defaultValues.basics).toBeDefined();
      expect(dataProcessor.defaultValues.work).toEqual([]);
      expect(dataProcessor.defaultValues.skills).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    const mockResumeData = {
      basics: {
        name: "John Doe",
        email: "john@example.com",
        summary: "Experienced developer"
      },
      work: [{
        name: "Tech Corp",
        position: "Developer",
        startDate: "2020-01-01",
        endDate: "2023-12-31"
      }],
      skills: [{
        name: "JavaScript",
        level: "Expert"
      }]
    };

    it('should load resume data successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn((header) => {
            if (header === 'last-modified') return '2023-01-01T00:00:00Z';
            return null;
          })
        },
        json: () => Promise.resolve(mockResumeData)
      });

      const result = await dataProcessor.loadResumeData();

      expect(fetch).toHaveBeenCalledWith('/resume.json');
      expect(result.data).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(dataProcessor.isLoaded).toBe(true);
    });

    it('should handle file load errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(dataProcessor.loadResumeData()).rejects.toThrow(DataProcessorError);
      await expect(dataProcessor.loadResumeData()).rejects.toThrow('Failed to load resume file: 404 Not Found');
    });

    it('should handle JSON parse errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      await expect(dataProcessor.loadResumeData()).rejects.toThrow(DataProcessorError);
      await expect(dataProcessor.loadResumeData()).rejects.toThrow('Invalid JSON format');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(dataProcessor.loadResumeData()).rejects.toThrow(DataProcessorError);
      await expect(dataProcessor.loadResumeData()).rejects.toThrow('Network error');
    });

    it('should load from custom file path', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.resolve(mockResumeData)
      });

      await dataProcessor.loadResumeData('/custom/path.json');
      expect(fetch).toHaveBeenCalledWith('/custom/path.json');
    });
  });

  describe('Default Value Application', () => {
    it('should apply defaults for missing sections', () => {
      const incompleteData = {
        basics: { name: "John Doe" }
      };

      const result = dataProcessor.applyDefaults(incompleteData);

      expect(result.basics.email).toBe('');
      expect(result.basics.phone).toBe('');
      expect(result.work).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.meta).toBeDefined();
    });

    it('should merge defaults with existing data', () => {
      const partialData = {
        basics: { name: "John Doe" },
        work: [{ name: "Company" }]
      };

      const result = dataProcessor.applyDefaults(partialData);

      expect(result.basics.name).toBe("John Doe"); // Preserved
      expect(result.basics.email).toBe(''); // Added default
      expect(result.work).toHaveLength(1); // Preserved
      expect(result.skills).toEqual([]); // Added default
    });

    it('should handle invalid data gracefully', () => {
      const result1 = dataProcessor.applyDefaults(null);
      const result2 = dataProcessor.applyDefaults("invalid");
      const result3 = dataProcessor.applyDefaults(123);

      expect(result1).toEqual(dataProcessor.defaultValues);
      expect(result2).toEqual(dataProcessor.defaultValues);
      expect(result3).toEqual(dataProcessor.defaultValues);
    });

    it('should ensure meta section is complete', () => {
      const dataWithoutMeta = {
        basics: { name: "John Doe" }
      };

      const result = dataProcessor.applyDefaults(dataWithoutMeta);

      expect(result.meta).toBeDefined();
      expect(result.meta.version).toBe('1.0.0');
      expect(result.meta.lastModified).toBeDefined();
    });
  });

  describe('Data Enhancement', () => {
    const testData = {
      basics: { name: "John Doe" },
      work: [{
        name: "Company A",
        position: "Developer",
        startDate: "2020-01-01",
        endDate: "2022-12-31"
      }, {
        name: "Company B",
        position: "Senior Developer",
        startDate: "2023-01-01"
        // No end date (current job)
      }],
      education: [{
        institution: "University",
        startDate: "2016-09-01",
        endDate: "2020-05-31"
      }],
      skills: [{
        name: "JavaScript",
        level: "Expert",
        keywords: ["react", "node.js"]
      }, {
        name: "Python",
        keywords: ["django", "flask"]
      }]
    };

    it('should enhance work experience with duration', () => {
      const enhanced = dataProcessor.enhanceData(testData);

      expect(enhanced.work[0].duration).toBeDefined();
      expect(enhanced.work[0].formattedDates).toBeDefined();
      expect(enhanced.work[0].isCurrentJob).toBe(false);
      expect(enhanced.work[1].isCurrentJob).toBe(true);
    });

    it('should enhance education with duration', () => {
      const enhanced = dataProcessor.enhanceData(testData);

      expect(enhanced.education[0].duration).toBeDefined();
      expect(enhanced.education[0].formattedDates).toBeDefined();
    });

    it('should add computed metadata', () => {
      const enhanced = dataProcessor.enhanceData(testData);

      expect(enhanced._computed).toBeDefined();
      expect(enhanced._computed.totalWorkExperience).toBeDefined();
      expect(enhanced._computed.skillCategories).toBeDefined();
      expect(enhanced._computed.lastUpdated).toBeDefined();
      expect(enhanced._computed.sections).toBeDefined();
    });

    it('should handle enhancement errors gracefully', () => {
      const malformedData = {
        work: [{ startDate: "invalid-date" }]
      };

      const enhanced = dataProcessor.enhanceData(malformedData);
      expect(enhanced).toBeDefined();
      // Should not throw even with invalid data
    });
  });

  describe('Duration Calculations', () => {
    it('should calculate duration correctly', () => {
      const duration = dataProcessor.calculateDuration("2020-01-01", "2022-12-31");

      expect(duration).toBeDefined();
      expect(duration.years).toBeGreaterThan(0);
      expect(duration.months).toBeDefined();
      expect(duration.humanReadable).toBeDefined();
    });

    it('should handle current positions (no end date)', () => {
      const duration = dataProcessor.calculateDuration("2020-01-01", null);

      expect(duration).toBeDefined();
      expect(duration.years).toBeGreaterThan(0);
    });

    it('should handle invalid dates', () => {
      const duration1 = dataProcessor.calculateDuration("invalid-date", "2022-01-01");
      const duration2 = dataProcessor.calculateDuration("2020-01-01", "invalid-date");
      const duration3 = dataProcessor.calculateDuration(null, "2022-01-01");

      expect(duration1).toBeNull();
      expect(duration2).toBeNull();
      expect(duration3).toBeNull();
    });

    it('should format duration in human-readable format', () => {
      const formatted1 = dataProcessor.formatDuration(2, 6);
      const formatted2 = dataProcessor.formatDuration(0, 3);
      const formatted3 = dataProcessor.formatDuration(1, 0);
      const formatted4 = dataProcessor.formatDuration(0, 0);

      expect(formatted1).toBe("2 years, 6 months");
      expect(formatted2).toBe("3 months");
      expect(formatted3).toBe("1 year");
      expect(formatted4).toBe("Less than a month");
    });
  });

  describe('Date Range Formatting', () => {
    it('should format date ranges correctly', () => {
      const formatted1 = dataProcessor.formatDateRange("2020-01-01", "2022-12-31");
      const formatted2 = dataProcessor.formatDateRange("2020-01-01", null);
      const formatted3 = dataProcessor.formatDateRange("2020-01-01", undefined);

      expect(formatted1).toContain("Jan 2020");
      expect(formatted1).toContain("Dec 2022");
      expect(formatted2).toContain("Present");
      expect(formatted3).toContain("Present");
    });

    it('should handle invalid dates', () => {
      const formatted1 = dataProcessor.formatDateRange("invalid-date", "2022-01-01");
      const formatted2 = dataProcessor.formatDateRange(null, "2022-01-01");

      expect(formatted1).toBe("");
      expect(formatted2).toBe("");
    });
  });

  describe('Skill Categorization', () => {
    const skills = [{
      name: "JavaScript",
      level: "Expert",
      keywords: ["react", "node.js"]
    }, {
      name: "Python",
      level: "Advanced",
      keywords: ["django", "flask"]
    }, {
      name: "AWS",
      keywords: ["ec2", "s3"]
    }];

    it('should categorize skills by level', () => {
      const categories = dataProcessor.categorizeSkills(skills);

      expect(categories.byLevel.Expert).toHaveLength(1);
      expect(categories.byLevel.Advanced).toHaveLength(1);
      expect(categories.byLevel.Unspecified).toHaveLength(1);
    });

    it('should categorize skills by type', () => {
      const categories = dataProcessor.categorizeSkills(skills);

      expect(categories.byType).toBeDefined();
      expect(categories.all).toEqual(skills);
    });

    it('should infer skill types from keywords', () => {
      const type1 = dataProcessor.inferSkillType(["javascript", "react"]);
      const type2 = dataProcessor.inferSkillType(["mysql", "postgresql"]);
      const type3 = dataProcessor.inferSkillType(["aws", "docker"]);
      const type4 = dataProcessor.inferSkillType(["unknown", "skill"]);

      expect(type1).toBe("Programming Languages");
      expect(type2).toBe("Databases");
      expect(type3).toBe("Cloud & DevOps");
      expect(type4).toBe("Other");
    });
  });

  describe('Profile URL Extraction', () => {
    it('should extract profile URLs by network', () => {
      const profiles = [{
        network: "LinkedIn",
        url: "https://linkedin.com/in/johndoe"
      }, {
        network: "GitHub",
        url: "https://github.com/johndoe"
      }];

      const urls = dataProcessor.extractProfileUrls(profiles);

      expect(urls.linkedin).toBe("https://linkedin.com/in/johndoe");
      expect(urls.github).toBe("https://github.com/johndoe");
    });

    it('should handle empty or invalid profiles', () => {
      const urls1 = dataProcessor.extractProfileUrls([]);
      const urls2 = dataProcessor.extractProfileUrls([{ network: "LinkedIn" }]); // Missing URL
      const urls3 = dataProcessor.extractProfileUrls([{ url: "https://example.com" }]); // Missing network

      expect(urls1).toEqual({});
      expect(urls2).toEqual({});
      expect(urls3).toEqual({});
    });
  });

  describe('Section Analysis', () => {
    const testData = {
      basics: { name: "John Doe" },
      work: [{ name: "Company" }],
      skills: [],
      education: null
    };

    it('should analyze section completeness', () => {
      const analysis = dataProcessor.analyzeSections(testData);

      expect(analysis.basics.exists).toBe(true);
      expect(analysis.basics.isEmpty).toBe(false);
      expect(analysis.basics.itemCount).toBe(1);
      expect(analysis.basics.type).toBe('object');

      expect(analysis.work.exists).toBe(true);
      expect(analysis.work.isEmpty).toBe(false);
      expect(analysis.work.itemCount).toBe(1);
      expect(analysis.work.type).toBe('array');

      expect(analysis.skills.exists).toBe(true);
      expect(analysis.skills.isEmpty).toBe(true);
      expect(analysis.skills.itemCount).toBe(0);
    });
  });

  describe('Caching', () => {
    const testData = {
      basics: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567"
      },
      work: [{ name: "Company" }],
      skills: [{ name: "JavaScript" }, { name: "Python" }],
      education: [{ institution: "University" }]
    };

    it('should cache commonly accessed data', () => {
      dataProcessor.updateCache(testData);

      expect(dataProcessor.getCached('name')).toBe("John Doe");
      expect(dataProcessor.getCached('email')).toBe("john@example.com");
      expect(dataProcessor.getCached('workCount')).toBe(1);
      expect(dataProcessor.getCached('skillCount')).toBe(2);
      expect(dataProcessor.getCached('educationCount')).toBe(1);
    });

    it('should return null for non-existent cache keys', () => {
      expect(dataProcessor.getCached('nonexistent')).toBeNull();
    });

    it('should handle cache errors gracefully', () => {
      // Test with invalid data that might cause caching issues
      expect(() => dataProcessor.updateCache(null)).not.toThrow();
    });
  });

  describe('Data Access Methods', () => {
    it('should return current resume data', () => {
      dataProcessor.resumeData = { basics: { name: "Test" } };
      dataProcessor.isLoaded = true;

      expect(dataProcessor.getResumeData()).toEqual({ basics: { name: "Test" } });
      expect(dataProcessor.isDataLoaded()).toBe(true);
    });

    it('should return null when no data is loaded', () => {
      dataProcessor.resumeData = null;
      dataProcessor.isLoaded = false;

      expect(dataProcessor.getResumeData()).toBeNull();
      expect(dataProcessor.isDataLoaded()).toBe(false);
    });

    it('should return validation result', () => {
      const mockValidation = { isValid: true, errors: [] };
      dataProcessor.validationResult = mockValidation;

      expect(dataProcessor.getValidationResult()).toEqual(mockValidation);
    });
  });

  describe('File Watching', () => {
    it('should setup file watching with callback', () => {
      const callback = jest.fn();

      dataProcessor.watchFile(callback);

      expect(dataProcessor.watcherId).toBeDefined();

      // Clean up
      dataProcessor.stopWatching();
    });

    it('should stop file watching', () => {
      const callback = jest.fn();
      dataProcessor.watchFile(callback);

      dataProcessor.stopWatching();

      expect(dataProcessor.watcherId).toBeNull();
    });

    it('should handle invalid callback', () => {
      expect(() => dataProcessor.watchFile("not-a-function")).not.toThrow();
      expect(dataProcessor.watcherId).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources', () => {
      // Set up some state
      dataProcessor.resumeData = { test: "data" };
      dataProcessor.isLoaded = true;
      dataProcessor.cache.set('test', 'value');
      dataProcessor.watchFile(() => {});

      // Clean up
      dataProcessor.cleanup();

      expect(dataProcessor.resumeData).toBeNull();
      expect(dataProcessor.isLoaded).toBe(false);
      expect(dataProcessor.cache.size).toBe(0);
      expect(dataProcessor.watcherId).toBeNull();
    });
  });

  describe('Total Work Experience Calculation', () => {
    const workExperience = [{
      startDate: "2020-01-01",
      endDate: "2022-12-31"
    }, {
      startDate: "2023-01-01"
      // Current job, no end date
    }];

    it('should calculate total work experience', () => {
      const totalExp = dataProcessor.calculateTotalExperience(workExperience);

      expect(totalExp.totalMonths).toBeGreaterThan(0);
      expect(totalExp.years).toBeGreaterThan(0);
      expect(totalExp.humanReadable).toBeDefined();
    });

    it('should handle empty work experience', () => {
      const totalExp = dataProcessor.calculateTotalExperience([]);

      expect(totalExp.totalMonths).toBe(0);
      expect(totalExp.years).toBe(0);
      expect(totalExp.months).toBe(0);
      expect(totalExp.humanReadable).toBe("Less than a month");
    });
  });

  describe('Error Handling', () => {
    it('should create DataProcessorError correctly', () => {
      const error = new DataProcessorError("Test error", "TEST_CODE", { detail: "test" });

      expect(error.name).toBe("DataProcessorError");
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.details).toEqual({ detail: "test" });
      expect(error.timestamp).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a successful fetch but failing validation
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.resolve("invalid-data")
      });

      await expect(dataProcessor.loadResumeData()).rejects.toThrow(DataProcessorError);
    });
  });

  describe('Reload Functionality', () => {
    it('should reload data and reset state', async () => {
      // Set up initial state
      dataProcessor.resumeData = { old: "data" };
      dataProcessor.isLoaded = true;
      dataProcessor.cache.set('old', 'value');

      // Mock successful reload
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.resolve({ basics: { name: "New Data" } })
      });

      const result = await dataProcessor.reload();

      expect(result).toBeDefined();
      expect(dataProcessor.cache.size).toBeGreaterThan(0);
      expect(dataProcessor.isLoaded).toBe(true);
    });
  });
});

test('data processor initialization', () => {
  expect(dataProcessor).toBeDefined();
});