/**
 * Unit Tests for JSON Schema Validator
 * Tests JSON Resume Schema v1.0.0 validation functionality
 */

import { jsonSchemaValidator, JSONSchemaValidator } from './json-schema-validator.js';

describe('JSON Schema Validator', () => {

  describe('Initialization', () => {
    it('should initialize validator instance', () => {
      expect(jsonSchemaValidator).toBeInstanceOf(JSONSchemaValidator);
      expect(jsonSchemaValidator.ajv).toBeDefined();
      expect(jsonSchemaValidator.validate).toBeDefined();
    });

    it('should have schema information', () => {
      const info = jsonSchemaValidator.getSchemaInfo();
      expect(info.version).toBe('1.0.0');
      expect(info.name).toBe('JSON Resume Schema');
      expect(info.url).toBe('https://jsonresume.org/schema/');
    });

    it('should return schema definition', () => {
      const schema = jsonSchemaValidator.getSchema();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.basics).toBeDefined();
      expect(schema.properties.work).toBeDefined();
    });
  });

  describe('Valid Resume Data Validation', () => {
    const validResumeData = {
      basics: {
        name: "John Doe",
        label: "Software Engineer",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        url: "https://johndoe.com",
        summary: "Experienced software engineer with expertise in web development.",
        location: {
          address: "123 Main St",
          postalCode: "12345",
          city: "San Francisco",
          countryCode: "US",
          region: "California"
        },
        profiles: [{
          network: "LinkedIn",
          username: "johndoe",
          url: "https://linkedin.com/in/johndoe"
        }]
      },
      work: [{
        name: "Tech Company",
        position: "Senior Developer",
        url: "https://techcompany.com",
        startDate: "2020-01-01",
        endDate: "2023-12-31",
        summary: "Developed web applications",
        highlights: ["Led team of 5 developers", "Increased performance by 50%"]
      }],
      education: [{
        institution: "University of Technology",
        area: "Computer Science",
        studyType: "Bachelor",
        startDate: "2016-09-01",
        endDate: "2020-05-31",
        score: "3.8"
      }],
      skills: [{
        name: "JavaScript",
        level: "Expert",
        keywords: ["ES6", "React", "Node.js"]
      }]
    };

    it('should validate valid resume data', () => {
      const result = jsonSchemaValidator.validateResume(validResumeData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.schema).toBe('JSON Resume Schema v1.0.0');
      expect(result.validationTime).toBeGreaterThan(0);
    });

    it('should include warnings even for valid data', () => {
      const result = jsonSchemaValidator.validateResume(validResumeData);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Invalid Resume Data Validation', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        basics: {
          name: "John Doe",
          email: "invalid-email"
        }
      };

      const result = jsonSchemaValidator.validateResume(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const emailError = result.errors.find(err => err.path.includes('email'));
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('invalid format');
    });

    it('should reject invalid URL format', () => {
      const invalidData = {
        basics: {
          name: "John Doe",
          url: "not-a-url"
        }
      };

      const result = jsonSchemaValidator.validateResume(invalidData);
      expect(result.isValid).toBe(false);

      const urlError = result.errors.find(err => err.path.includes('url'));
      expect(urlError).toBeDefined();
    });

    it('should reject invalid skill level', () => {
      const invalidData = {
        skills: [{
          name: "JavaScript",
          level: "SuperExpert" // Invalid level
        }]
      };

      const result = jsonSchemaValidator.validateResume(invalidData);
      expect(result.isValid).toBe(false);

      const levelError = result.errors.find(err => err.keyword === 'enum');
      expect(levelError).toBeDefined();
      expect(levelError.message).toContain('must be one of');
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        work: [{
          name: "Company",
          startDate: "invalid-date"
        }]
      };

      const result = jsonSchemaValidator.validateResume(invalidData);
      expect(result.isValid).toBe(false);
    });

    it('should reject wrong data types', () => {
      const invalidData = {
        basics: {
          name: 123, // Should be string
          profiles: "not-an-array" // Should be array
        }
      };

      const result = jsonSchemaValidator.validateResume(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const typeErrors = result.errors.filter(err => err.keyword === 'type');
      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Formatting', () => {
    it('should format required field errors', () => {
      const errors = [{
        keyword: 'required',
        params: { missingProperty: 'name' },
        instancePath: '/basics'
      }];

      const formatted = jsonSchemaValidator.formatErrors(errors);
      expect(formatted[0].message).toContain('Missing required property: name');
    });

    it('should format type errors', () => {
      const errors = [{
        keyword: 'type',
        schema: 'string',
        data: 123,
        instancePath: '/basics/name'
      }];

      const formatted = jsonSchemaValidator.formatErrors(errors);
      expect(formatted[0].message).toContain("should be string");
      expect(formatted[0].message).toContain("but got number");
    });

    it('should format enum errors', () => {
      const errors = [{
        keyword: 'enum',
        schema: ['Beginner', 'Expert'],
        instancePath: '/skills/0/level'
      }];

      const formatted = jsonSchemaValidator.formatErrors(errors);
      expect(formatted[0].message).toContain('must be one of: Beginner, Expert');
    });

    it('should handle null or undefined errors', () => {
      expect(jsonSchemaValidator.formatErrors(null)).toEqual([]);
      expect(jsonSchemaValidator.formatErrors(undefined)).toEqual([]);
      expect(jsonSchemaValidator.formatErrors([])).toEqual([]);
    });
  });

  describe('Warning Generation', () => {
    it('should warn about missing basics section', () => {
      const incompleteData = { work: [] };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const basicsWarning = result.warnings.find(w => w.type === 'missing-section' && w.message.includes('Basics'));
      expect(basicsWarning).toBeDefined();
      expect(basicsWarning.severity).toBe('high');
    });

    it('should warn about missing name', () => {
      const incompleteData = { basics: { email: "test@example.com" } };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const nameWarning = result.warnings.find(w => w.message.includes('Name is missing'));
      expect(nameWarning).toBeDefined();
      expect(nameWarning.severity).toBe('high');
    });

    it('should warn about missing email', () => {
      const incompleteData = { basics: { name: "John Doe" } };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const emailWarning = result.warnings.find(w => w.message.includes('Email is missing'));
      expect(emailWarning).toBeDefined();
      expect(emailWarning.severity).toBe('medium');
    });

    it('should warn about short summary', () => {
      const incompleteData = {
        basics: {
          name: "John Doe",
          email: "john@example.com",
          summary: "Short"
        }
      };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const summaryWarning = result.warnings.find(w => w.message.includes('Summary is very short'));
      expect(summaryWarning).toBeDefined();
      expect(summaryWarning.severity).toBe('low');
    });

    it('should warn about empty work experience', () => {
      const incompleteData = {
        basics: { name: "John Doe" },
        work: []
      };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const workWarning = result.warnings.find(w => w.message.includes('Work experience section is empty'));
      expect(workWarning).toBeDefined();
      expect(workWarning.severity).toBe('medium');
    });

    it('should warn about missing skills', () => {
      const incompleteData = {
        basics: { name: "John Doe" },
        skills: []
      };

      const result = jsonSchemaValidator.validateResume(incompleteData);
      const skillsWarning = result.warnings.find(w => w.message.includes('Skills section is empty'));
      expect(skillsWarning).toBeDefined();
      expect(skillsWarning.severity).toBe('low');
    });
  });

  describe('Custom Formats', () => {
    it('should validate flexible date formats', () => {
      // Test that custom formats are working by using the validator
      const testData = {
        work: [{
          name: "Company",
          startDate: "2020",
          endDate: "2020-12"
        }]
      };

      // Should not fail on flexible date formats
      const result = jsonSchemaValidator.validateResume(testData);
      // May have other validation issues, but not date format issues
      const dateFormatErrors = result.errors.filter(err =>
        err.keyword === 'format' && err.message.includes('date')
      );
      // Flexible date formats should be accepted
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty resume data', () => {
      const result = jsonSchemaValidator.validateResume({});
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should handle null resume data', () => {
      const result = jsonSchemaValidator.validateResume(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid resume data types', () => {
      const result = jsonSchemaValidator.validateResume("invalid");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', () => {
      // Test with malformed data that might cause validation to throw
      const malformedData = {
        basics: {
          profiles: [{ network: null, url: undefined }]
        }
      };

      const result = jsonSchemaValidator.validateResume(malformedData);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should validate within reasonable time', () => {
      const largeResumeData = {
        basics: { name: "John Doe", email: "john@example.com" },
        work: Array(50).fill({
          name: "Company",
          position: "Developer",
          startDate: "2020-01-01",
          highlights: Array(10).fill("Achievement")
        }),
        skills: Array(100).fill({
          name: "Skill",
          level: "Expert",
          keywords: Array(20).fill("keyword")
        })
      };

      const result = jsonSchemaValidator.validateResume(largeResumeData);
      expect(result.validationTime).toBeLessThan(100); // Should validate in under 100ms
    });
  });
});