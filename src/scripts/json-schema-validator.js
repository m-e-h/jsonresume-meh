/**
 * JSON Schema Validator for JSON Resume Schema v1.0.0
 * Uses AJV (Another JSON Schema Validator) for validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * JSON Resume Schema v1.0.0 Definition
 * Based on: https://jsonresume.org/schema/
 */
const JSON_RESUME_SCHEMA = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "basics": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "name": { "type": "string" },
        "label": { "type": "string" },
        "image": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "url": { "type": "string", "format": "uri" },
        "summary": { "type": "string" },
        "location": {
          "type": "object",
          "additionalProperties": true,
          "properties": {
            "address": { "type": "string" },
            "postalCode": { "type": "string" },
            "city": { "type": "string" },
            "countryCode": { "type": "string" },
            "region": { "type": "string" }
          }
        },
        "profiles": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": true,
            "properties": {
              "network": { "type": "string" },
              "username": { "type": "string" },
              "url": { "type": "string", "format": "uri" }
            }
          }
        }
      }
    },
    "work": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "position": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "startDate": { "type": "string", "format": "date" },
          "endDate": { "type": "string", "format": "date" },
          "summary": { "type": "string" },
          "highlights": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "volunteer": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "organization": { "type": "string" },
          "position": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "startDate": { "type": "string", "format": "date" },
          "endDate": { "type": "string", "format": "date" },
          "summary": { "type": "string" },
          "highlights": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "institution": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "area": { "type": "string" },
          "studyType": { "type": "string" },
          "startDate": { "type": "string", "format": "date" },
          "endDate": { "type": "string", "format": "date" },
          "score": { "type": "string" },
          "courses": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "awards": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "title": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "awarder": { "type": "string" },
          "summary": { "type": "string" }
        }
      }
    },
    "certificates": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "url": { "type": "string", "format": "uri" },
          "issuer": { "type": "string" }
        }
      }
    },
    "publications": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "publisher": { "type": "string" },
          "releaseDate": { "type": "string", "format": "date" },
          "url": { "type": "string", "format": "uri" },
          "summary": { "type": "string" }
        }
      }
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "level": {
            "type": "string",
            "enum": ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master"]
          },
          "keywords": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "languages": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "language": { "type": "string" },
          "fluency": {
            "type": "string",
            "enum": ["Native speaker", "Fluent", "Conversational", "Basic", "Elementary proficiency", "Limited working proficiency", "Professional working proficiency", "Full professional proficiency", "Native or bilingual proficiency"]
          }
        }
      }
    },
    "interests": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "keywords": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "references": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "reference": { "type": "string" }
        }
      }
    },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "highlights": {
            "type": "array",
            "items": { "type": "string" }
          },
          "keywords": {
            "type": "array",
            "items": { "type": "string" }
          },
          "startDate": { "type": "string", "format": "date" },
          "endDate": { "type": "string", "format": "date" },
          "url": { "type": "string", "format": "uri" },
          "roles": {
            "type": "array",
            "items": { "type": "string" }
          },
          "entity": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "meta": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "canonical": { "type": "string", "format": "uri" },
        "version": { "type": "string" },
        "lastModified": { "type": "string", "format": "date-time" }
      }
    }
  }
};

/**
 * JSON Schema Validator Class
 */
class JSONSchemaValidator {
  constructor() {
    // Initialize AJV with options for better error reporting
    this.ajv = new Ajv({
      allErrors: true,          // Report all errors, not just the first one
      verbose: true,            // Include validated data in error messages
      strict: false,            // Don't fail on unknown keywords
      removeAdditional: false,  // Don't remove additional properties
      useDefaults: true,        // Apply default values
      coerceTypes: false,       // Don't coerce types automatically
      addUsedSchema: false      // Don't add schemas automatically
    });

    // Add format validation support (email, uri, date, etc.)
    addFormats(this.ajv);

    // Add custom formats if needed
    this.addCustomFormats();

    // Compile the JSON Resume schema
    this.validate = this.ajv.compile(JSON_RESUME_SCHEMA);

    console.log('✅ JSON Schema Validator initialized');
  }

  /**
   * Add custom format validators
   */
  addCustomFormats() {
    // Add custom date format that's more flexible
    this.ajv.addFormat('flexible-date', {
      type: 'string',
      validate: (dateString) => {
        // Allow various date formats: YYYY-MM-DD, YYYY-MM, YYYY
        const dateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
        return dateRegex.test(dateString);
      }
    });

    // Add URL format that allows relative URLs
    this.ajv.addFormat('flexible-url', {
      type: 'string',
      validate: (url) => {
        try {
          // Allow relative URLs or absolute URLs
          return url.startsWith('/') || url.startsWith('http') || url.startsWith('mailto:');
        } catch {
          return false;
        }
      }
    });
  }

  /**
   * Validate JSON Resume data
   * @param {Object} resumeData - The resume data to validate
   * @returns {Object} Validation result with isValid flag and errors
   */
  validateResume(resumeData) {
    const startTime = performance.now();

    try {
      const isValid = this.validate(resumeData);
      const endTime = performance.now();

      const result = {
        isValid,
        errors: isValid ? [] : this.formatErrors(this.validate.errors),
        warnings: this.generateWarnings(resumeData),
        validationTime: Math.round(endTime - startTime),
        schema: 'JSON Resume Schema v1.0.0'
      };

      if (isValid) {
        console.log(`✅ Resume validation passed in ${result.validationTime}ms`);
      } else {
        console.warn(`❌ Resume validation failed with ${result.errors.length} errors`);
      }

      return result;
    } catch (error) {
      console.error('Schema validation error:', error);
      return {
        isValid: false,
        errors: [{
          type: 'validation-error',
          message: `Schema validation failed: ${error.message}`,
          path: '',
          value: null
        }],
        warnings: [],
        validationTime: 0,
        schema: 'JSON Resume Schema v1.0.0'
      };
    }
  }

  /**
   * Format AJV errors into user-friendly messages
   * @param {Array} errors - Raw AJV errors
   * @returns {Array} Formatted error objects
   */
  formatErrors(errors) {
    if (!errors) return [];

    return errors.map(error => ({
      type: 'schema-error',
      path: error.instancePath || error.dataPath || '',
      property: error.instancePath ? error.instancePath.split('/').pop() : '',
      message: this.getHumanReadableMessage(error),
      value: error.data,
      allowedValues: error.schema,
      keyword: error.keyword
    }));
  }

  /**
   * Convert AJV error messages to human-readable format
   * @param {Object} error - AJV error object
   * @returns {string} Human-readable error message
   */
  getHumanReadableMessage(error) {
    const path = error.instancePath || error.dataPath || '';
    const property = path ? path.split('/').pop() : 'data';

    switch (error.keyword) {
      case 'required':
        return `Missing required property: ${error.params.missingProperty}`;
      case 'type':
        return `Property '${property}' should be ${error.schema}, but got ${typeof error.data}`;
      case 'format':
        return `Property '${property}' has invalid format. Expected: ${error.schema}`;
      case 'enum':
        return `Property '${property}' must be one of: ${error.schema.join(', ')}`;
      case 'minItems':
        return `Array '${property}' should have at least ${error.schema} items`;
      case 'maxItems':
        return `Array '${property}' should have no more than ${error.schema} items`;
      case 'minimum':
        return `Property '${property}' should be >= ${error.schema}`;
      case 'maximum':
        return `Property '${property}' should be <= ${error.schema}`;
      case 'additionalProperties':
        return `Additional property '${error.params.additionalProperty}' is not allowed`;
      default:
        return error.message || `Validation error in '${property}'`;
    }
  }

  /**
   * Generate warnings for potential issues (not schema violations)
   * @param {Object} resumeData - The resume data
   * @returns {Array} Array of warning objects
   */
  generateWarnings(resumeData) {
    const warnings = [];

    try {
      // Check for empty or missing basics section
      if (!resumeData.basics || Object.keys(resumeData.basics).length === 0) {
        warnings.push({
          type: 'missing-section',
          message: 'Basics section is missing or empty. This section typically contains name, email, and contact information.',
          severity: 'high'
        });
      }

      // Check for missing name
      if (!resumeData.basics?.name) {
        warnings.push({
          type: 'missing-field',
          message: 'Name is missing from basics section. This is highly recommended.',
          severity: 'high'
        });
      }

      // Check for missing email
      if (!resumeData.basics?.email) {
        warnings.push({
          type: 'missing-field',
          message: 'Email is missing from basics section. This is important for contact.',
          severity: 'medium'
        });
      }

      // Check for empty work experience
      if (!resumeData.work || resumeData.work.length === 0) {
        warnings.push({
          type: 'missing-section',
          message: 'Work experience section is empty. Consider adding your professional experience.',
          severity: 'medium'
        });
      }

      // Check for very short summary
      if (resumeData.basics?.summary && resumeData.basics.summary.length < 50) {
        warnings.push({
          type: 'content-quality',
          message: 'Summary is very short. Consider adding more details about your background.',
          severity: 'low'
        });
      }

      // Check for missing skills
      if (!resumeData.skills || resumeData.skills.length === 0) {
        warnings.push({
          type: 'missing-section',
          message: 'Skills section is empty. Adding skills can help highlight your expertise.',
          severity: 'low'
        });
      }

    } catch (error) {
      console.warn('Error generating warnings:', error);
    }

    return warnings;
  }

  /**
   * Get the JSON Resume schema definition
   * @returns {Object} The schema object
   */
  getSchema() {
    return JSON_RESUME_SCHEMA;
  }

  /**
   * Get schema version information
   * @returns {Object} Schema version info
   */
  getSchemaInfo() {
    return {
      version: '1.0.0',
      name: 'JSON Resume Schema',
      url: 'https://jsonresume.org/schema/',
      description: 'Standard schema for resume data'
    };
  }
}

// Export singleton instance
export const jsonSchemaValidator = new JSONSchemaValidator();
export default JSONSchemaValidator;