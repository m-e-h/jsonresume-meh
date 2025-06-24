/**
 * Data Processor for JSON Resume
 * Handles reading, parsing, validation, and processing of resume.json
 */

import { jsonSchemaValidator } from './json-schema-validator.js';

/**
 * Data Processor Class
 * Manages all resume data operations including loading, validation, and caching
 */
class DataProcessor {
  constructor() {
    this.resumeData = null;
    this.isLoaded = false;
    this.lastModified = null;
    this.cache = new Map();
    this.validationResult = null;
    this.watcherId = null;

    // Default values for missing optional fields
    this.defaultValues = {
      basics: {
        name: '',
        label: '',
        email: '',
        phone: '',
        url: '',
        summary: '',
        location: {},
        profiles: []
      },
      work: [],
      volunteer: [],
      education: [],
      awards: [],
      certificates: [],
      publications: [],
      skills: [],
      languages: [],
      interests: [],
      references: [],
      projects: [],
      meta: {
        canonical: '',
        version: '1.0.0',
        lastModified: new Date().toISOString()
      }
    };

    console.log('📊 Data Processor initialized');
  }

  /**
   * Load resume data from file
   * @param {string} filePath - Path to resume.json file (defaults to /resume.json)
   * @returns {Promise<Object>} Processed resume data
   */
  async loadResumeData(filePath = '/resume.json') {
    try {
      console.log(`📄 Loading resume data from ${filePath}...`);
      const startTime = performance.now();

      // Fetch the resume.json file
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new DataProcessorError(
          `Failed to load resume file: ${response.status} ${response.statusText}`,
          'FILE_LOAD_ERROR',
          { status: response.status, filePath }
        );
      }

      // Get the last modified timestamp
      this.lastModified = response.headers.get('last-modified') || new Date().toISOString();

      // Parse JSON
      const rawData = await response.json();
      const loadTime = performance.now() - startTime;

      console.log(`✅ Resume file loaded in ${Math.round(loadTime)}ms`);

      // Process and validate the data
      return await this.processResumeData(rawData);

    } catch (error) {
      if (error instanceof DataProcessorError) {
        throw error;
      }

      // Handle different types of errors
      if (error instanceof SyntaxError) {
        throw new DataProcessorError(
          `Invalid JSON format in resume file: ${error.message}`,
          'JSON_PARSE_ERROR',
          { originalError: error.message }
        );
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new DataProcessorError(
          `Network error loading resume file: ${error.message}`,
          'NETWORK_ERROR',
          { originalError: error.message }
        );
      }

      throw new DataProcessorError(
        `Unexpected error loading resume data: ${error.message}`,
        'UNKNOWN_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Process and validate resume data
   * @param {Object} rawData - Raw resume data from JSON file
   * @returns {Promise<Object>} Processed and validated resume data
   */
  async processResumeData(rawData) {
    try {
      console.log('🔍 Processing and validating resume data...');
      const startTime = performance.now();

      // Apply default values for missing optional fields
      const processedData = this.applyDefaults(rawData);

      // Validate the data against JSON Resume schema
      this.validationResult = jsonSchemaValidator.validateResume(processedData);

      // Handle validation results
      if (!this.validationResult.isValid) {
        console.warn(`⚠️  Resume validation issues found:`, this.validationResult.errors);
      }

      // Process data sections
      const enhancedData = this.enhanceData(processedData);

      // Cache the processed data
      this.resumeData = enhancedData;
      this.isLoaded = true;

      // Cache common queries for performance
      this.updateCache(enhancedData);

      const processTime = performance.now() - startTime;
      console.log(`✅ Resume data processed in ${Math.round(processTime)}ms`);

      return {
        data: enhancedData,
        validation: this.validationResult,
        metadata: {
          loadedAt: new Date().toISOString(),
          lastModified: this.lastModified,
          processingTime: Math.round(processTime),
          isValid: this.validationResult.isValid,
          hasWarnings: this.validationResult.warnings.length > 0
        }
      };

    } catch (error) {
      throw new DataProcessorError(
        `Error processing resume data: ${error.message}`,
        'DATA_PROCESSING_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Apply default values for missing optional fields
   * @param {Object} data - Raw resume data
   * @returns {Object} Data with defaults applied
   */
  applyDefaults(data) {
    if (!data || typeof data !== 'object') {
      console.warn('⚠️  Invalid resume data, using defaults');
      return { ...this.defaultValues };
    }

    const result = { ...data };

    // Apply defaults for each section
    Object.keys(this.defaultValues).forEach(section => {
      if (!result[section]) {
        result[section] = Array.isArray(this.defaultValues[section])
          ? []
          : { ...this.defaultValues[section] };
      } else if (typeof result[section] === 'object' && !Array.isArray(result[section])) {
        // Merge defaults for object sections
        result[section] = { ...this.defaultValues[section], ...result[section] };
      }
    });

    // Ensure meta section has required fields
    if (!result.meta) {
      result.meta = { ...this.defaultValues.meta };
    } else {
      result.meta = { ...this.defaultValues.meta, ...result.meta };
    }

    // Apply graceful fallbacks for corrupted data
    return this.sanitizeAndRepairData(result);
  }

  /**
   * Sanitize and repair corrupted or malformed data
   * @param {Object} data - Resume data to sanitize
   * @returns {Object} Sanitized data
   */
  sanitizeAndRepairData(data) {
    const sanitized = { ...data };

    try {
      // Repair basics section
      if (sanitized.basics && typeof sanitized.basics === 'object') {
        sanitized.basics = this.repairBasicsSection(sanitized.basics);
      }

      // Repair array sections
      const arraySections = ['work', 'volunteer', 'education', 'awards', 'certificates', 'publications', 'skills', 'languages', 'interests', 'references', 'projects'];

      arraySections.forEach(section => {
        if (sanitized[section]) {
          if (!Array.isArray(sanitized[section])) {
            console.warn(`⚠️  ${section} section is not an array, converting to array`);
            sanitized[section] = [sanitized[section]];
          }
          sanitized[section] = this.repairArraySection(sanitized[section], section);
        }
      });

      // Ensure critical fields exist
      if (!sanitized.basics?.name) {
        sanitized.basics.name = 'Resume';
        console.warn('⚠️  Missing name in basics, using default');
      }

    } catch (error) {
      console.error('❌ Error sanitizing data, using defaults:', error);
      return { ...this.defaultValues };
    }

    return sanitized;
  }

  /**
   * Repair basics section
   * @param {Object} basics - Basics section data
   * @returns {Object} Repaired basics data
   */
  repairBasicsSection(basics) {
    const repaired = { ...basics };

    // Ensure string fields are strings
    const stringFields = ['name', 'label', 'email', 'phone', 'url', 'summary'];
    stringFields.forEach(field => {
      if (repaired[field] && typeof repaired[field] !== 'string') {
        repaired[field] = String(repaired[field]);
      }
    });

    // Repair location object
    if (repaired.location && typeof repaired.location !== 'object') {
      repaired.location = {};
    }

    // Repair profiles array
    if (repaired.profiles) {
      if (!Array.isArray(repaired.profiles)) {
        repaired.profiles = [repaired.profiles];
      }
      repaired.profiles = repaired.profiles.filter(profile =>
        profile && typeof profile === 'object' && (profile.network || profile.url)
      );
    }

    return repaired;
  }

  /**
   * Repair array section by filtering out invalid entries
   * @param {Array} array - Array section data
   * @param {string} sectionName - Name of the section for logging
   * @returns {Array} Repaired array
   */
  repairArraySection(array, sectionName) {
    return array.filter((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`⚠️  Invalid ${sectionName} item at index ${index}, removing`);
        return false;
      }

      // Section-specific validation
      switch (sectionName) {
        case 'work':
        case 'volunteer':
          return item.name || item.company || item.organization;

        case 'education':
          return item.institution || item.area || item.studyType;

        case 'skills':
          return item.name || (item.keywords && item.keywords.length > 0);

        case 'languages':
          return item.language;

        case 'interests':
          return item.name || (item.keywords && item.keywords.length > 0);

        case 'awards':
        case 'certificates':
        case 'publications':
          return item.title || item.name;

        case 'references':
          return item.name || item.reference;

        case 'projects':
          return item.name || item.title;

        default:
          return true;
      }
    });
  }

  /**
   * Enhance data with computed fields and formatting
   * @param {Object} data - Resume data with defaults applied
   * @returns {Object} Enhanced resume data
   */
  enhanceData(data) {
    const enhanced = { ...data };

    try {
      // Enhance work experience
      if (enhanced.work && Array.isArray(enhanced.work)) {
        enhanced.work = enhanced.work.map(job => ({
          ...job,
          duration: this.calculateDuration(job.startDate, job.endDate),
          isCurrentJob: !job.endDate,
          formattedDates: this.formatDateRange(job.startDate, job.endDate)
        }));
      }

      // Enhance education
      if (enhanced.education && Array.isArray(enhanced.education)) {
        enhanced.education = enhanced.education.map(edu => ({
          ...edu,
          duration: this.calculateDuration(edu.startDate, edu.endDate),
          formattedDates: this.formatDateRange(edu.startDate, edu.endDate)
        }));
      }

      // Enhance volunteer experience
      if (enhanced.volunteer && Array.isArray(enhanced.volunteer)) {
        enhanced.volunteer = enhanced.volunteer.map(vol => ({
          ...vol,
          duration: this.calculateDuration(vol.startDate, vol.endDate),
          formattedDates: this.formatDateRange(vol.startDate, vol.endDate)
        }));
      }

      // Add computed metadata
      enhanced._computed = {
        totalWorkExperience: this.calculateTotalExperience(enhanced.work || []),
        skillCategories: this.categorizeSkills(enhanced.skills || []),
        profileUrls: this.extractProfileUrls(enhanced.basics?.profiles || []),
        lastUpdated: new Date().toISOString(),
        sections: this.analyzeSections(enhanced)
      };

    } catch (error) {
      console.warn('⚠️  Error enhancing data:', error);
      // Continue with unenhanced data if enhancement fails
    }

    return enhanced;
  }

  /**
   * Calculate duration between two dates
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string (optional)
   * @returns {Object} Duration information
   */
  calculateDuration(startDate, endDate) {
    if (!startDate) return null;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime()) || (endDate && isNaN(end.getTime()))) {
      return null;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30.44); // Average days per month
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;

    return {
      days: diffDays,
      months: diffMonths,
      years: diffYears,
      remainingMonths,
      humanReadable: this.formatDuration(diffYears, remainingMonths)
    };
  }

  /**
   * Format duration in human-readable format
   * @param {number} years - Number of years
   * @param {number} months - Number of remaining months
   * @returns {string} Formatted duration
   */
  formatDuration(years, months) {
    if (years === 0 && months === 0) return 'Less than a month';
    if (years === 0) return `${months} month${months > 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
  }

  /**
   * Format date range for display
   * @param {string} startDate - Start date
   * @param {string} endDate - End date (optional)
   * @returns {string} Formatted date range
   */
  formatDateRange(startDate, endDate) {
    if (!startDate) return '';

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    };

    const start = formatDate(startDate);
    const end = endDate ? formatDate(endDate) : 'Present';

    return `${start} - ${end}`;
  }

  /**
   * Calculate total work experience in months
   * @param {Array} workExperience - Array of work experience objects
   * @returns {Object} Total experience information
   */
  calculateTotalExperience(workExperience) {
    let totalMonths = 0;

    workExperience.forEach(job => {
      const duration = this.calculateDuration(job.startDate, job.endDate);
      if (duration) {
        totalMonths += duration.months;
      }
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return {
      totalMonths,
      years,
      months,
      humanReadable: this.formatDuration(years, months)
    };
  }

  /**
   * Categorize skills by level or type
   * @param {Array} skills - Array of skill objects
   * @returns {Object} Categorized skills
   */
  categorizeSkills(skills) {
    const categories = {
      byLevel: {},
      byType: {},
      all: skills
    };

    skills.forEach(skill => {
      // Categorize by level
      const level = skill.level || 'Unspecified';
      if (!categories.byLevel[level]) {
        categories.byLevel[level] = [];
      }
      categories.byLevel[level].push(skill);

      // Try to categorize by type based on keywords
      if (skill.keywords && skill.keywords.length > 0) {
        const type = this.inferSkillType(skill.keywords);
        if (!categories.byType[type]) {
          categories.byType[type] = [];
        }
        categories.byType[type].push(skill);
      }
    });

    return categories;
  }

  /**
   * Infer skill type from keywords
   * @param {Array} keywords - Skill keywords
   * @returns {string} Inferred skill type
   */
  inferSkillType(keywords) {
    const programmingLanguages = ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript'];
    const frameworks = ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel'];
    const databases = ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle'];
    const cloudServices = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'];

    const keywordStr = keywords.join(' ').toLowerCase();

    if (programmingLanguages.some(lang => keywordStr.includes(lang))) return 'Programming Languages';
    if (frameworks.some(fw => keywordStr.includes(fw))) return 'Frameworks & Libraries';
    if (databases.some(db => keywordStr.includes(db))) return 'Databases';
    if (cloudServices.some(cloud => keywordStr.includes(cloud))) return 'Cloud & DevOps';

    return 'Other';
  }

  /**
   * Extract profile URLs for easy access
   * @param {Array} profiles - Array of profile objects
   * @returns {Object} Profile URLs by network
   */
  extractProfileUrls(profiles) {
    const urls = {};
    profiles.forEach(profile => {
      if (profile.network && profile.url) {
        urls[profile.network.toLowerCase()] = profile.url;
      }
    });
    return urls;
  }

  /**
   * Analyze sections to provide metadata
   * @param {Object} data - Resume data
   * @returns {Object} Section analysis
   */
  analyzeSections(data) {
    const sections = {};

    Object.keys(data).forEach(section => {
      if (section.startsWith('_')) return; // Skip computed fields

      const sectionData = data[section];
      sections[section] = {
        exists: !!sectionData,
        isEmpty: Array.isArray(sectionData) ? sectionData.length === 0 : Object.keys(sectionData || {}).length === 0,
        itemCount: Array.isArray(sectionData) ? sectionData.length : (sectionData ? 1 : 0),
        type: Array.isArray(sectionData) ? 'array' : typeof sectionData
      };
    });

    return sections;
  }

  /**
   * Update cache with commonly accessed data
   * @param {Object} data - Resume data to cache
   */
  updateCache(data) {
    try {
      this.cache.clear();

      // Cache commonly accessed data
      this.cache.set('name', data.basics?.name || '');
      this.cache.set('email', data.basics?.email || '');
      this.cache.set('phone', data.basics?.phone || '');
      this.cache.set('summary', data.basics?.summary || '');
      this.cache.set('workCount', (data.work || []).length);
      this.cache.set('skillCount', (data.skills || []).length);
      this.cache.set('educationCount', (data.education || []).length);

    } catch (error) {
      console.warn('⚠️  Error updating cache:', error);
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCached(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Get current resume data
   * @returns {Object|null} Current resume data or null if not loaded
   */
  getResumeData() {
    return this.resumeData;
  }

  /**
   * Get validation result
   * @returns {Object|null} Validation result or null if not validated
   */
  getValidationResult() {
    return this.validationResult;
  }

  /**
   * Check if data is loaded
   * @returns {boolean} Whether data is loaded
   */
  isDataLoaded() {
    return this.isLoaded;
  }

  /**
   * Reload resume data
   * @param {string} filePath - Optional file path
   * @returns {Promise<Object>} Reloaded resume data
   */
  async reload(filePath) {
    console.log('🔄 Reloading resume data...');
    this.isLoaded = false;
    this.resumeData = null;
    this.validationResult = null;
    this.cache.clear();

    return await this.loadResumeData(filePath);
  }

  /**
   * Watch for file changes (development mode)
   * @param {Function} callback - Callback function when file changes
   * @param {string} filePath - File path to watch
   */
  watchFile(callback, filePath = '/resume.json') {
    if (typeof callback !== 'function') {
      console.warn('⚠️  Watch callback must be a function');
      return;
    }

    // Note: File watching in the browser is limited
    // This is a basic implementation using periodic checks
    if (this.watcherId) {
      clearInterval(this.watcherId);
    }

    console.log(`👀 Watching ${filePath} for changes...`);

    this.watcherId = setInterval(async () => {
      try {
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          const lastModified = response.headers.get('last-modified');
          if (lastModified && lastModified !== this.lastModified) {
            console.log('📄 Resume file changed, reloading...');
            const result = await this.reload(filePath);
            callback(result);
          }
        }
      } catch (error) {
        // Silently ignore errors during file watching
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Stop watching file changes
   */
  stopWatching() {
    if (this.watcherId) {
      clearInterval(this.watcherId);
      this.watcherId = null;
      console.log('👁️  Stopped watching file changes');
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopWatching();
    this.cache.clear();
    this.resumeData = null;
    this.isLoaded = false;
    this.validationResult = null;
  }
}

/**
 * Custom error class for data processor errors
 */
class DataProcessorError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DataProcessorError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Export singleton instance and class
export const dataProcessor = new DataProcessor();
export { DataProcessor, DataProcessorError };
export default dataProcessor;