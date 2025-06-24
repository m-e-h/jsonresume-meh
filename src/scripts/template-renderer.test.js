/**
 * Template Renderer Tests
 * Comprehensive test suite for template rendering functionality
 */

import { TemplateRenderer, TemplateRenderError } from './template-renderer.js';

// Mock template config
const mockTemplateConfig = {
  templates: [
    {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      path: '/templates/test.html'
    }
  ]
};

// Mock template content
const mockTemplateContent = `
<!DOCTYPE html>
<html>
<head><title>{{basics.name}} - {{basics.label}}</title></head>
<body>
  <h1>{{basics.name}}</h1>
  {{#if basics.label}}
  <h2>{{basics.label}}</h2>
  {{/if}}

  {{#if work}}
  <section>
    <h3>Experience</h3>
    {{#each work}}
    <div>
      <h4>{{position}} at {{name}}</h4>
      <p>{{formattedDates}}</p>
      {{#if highlights}}
      <ul>
        {{#each highlights}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}
</body>
</html>
`;

// Mock resume data
const mockResumeData = {
  basics: {
    name: 'John Doe',
    label: 'Software Developer',
    email: 'john@example.com',
    phone: '555-1234',
    summary: 'Experienced developer'
  },
  work: [
    {
      name: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      highlights: ['Built scalable applications', 'Mentored junior developers']
    },
    {
      name: 'Startup Inc',
      position: 'Developer',
      startDate: '2018-06-01',
      endDate: '2019-12-31',
      highlights: ['Developed MVP', 'Implemented CI/CD']
    }
  ]
};

// Additional comprehensive test data for complete JSON Resume Schema
const completeResumeData = {
  basics: {
    name: 'Jane Smith',
    label: 'Full Stack Developer',
    image: 'https://example.com/profile.jpg',
    email: 'jane@example.com',
    phone: '+1-555-0123',
    url: 'https://janesmith.dev',
    summary: 'Passionate full-stack developer with 8+ years of experience building scalable web applications.',
    location: {
      address: '123 Tech Street',
      postalCode: '12345',
      city: 'San Francisco',
      countryCode: 'US',
      region: 'California'
    },
    profiles: [
      {
        network: 'GitHub',
        username: 'janesmith',
        url: 'https://github.com/janesmith'
      },
      {
        network: 'LinkedIn',
        username: 'jane-smith-dev',
        url: 'https://linkedin.com/in/jane-smith-dev'
      }
    ]
  },
  work: [
    {
      name: 'TechCorp Inc',
      position: 'Senior Full Stack Developer',
      url: 'https://techcorp.com',
      startDate: '2020-03-01',
      endDate: '2024-01-01',
      summary: 'Led development of microservices architecture serving 1M+ users.',
      highlights: [
        'Reduced API response time by 40% through optimization',
        'Mentored 5 junior developers',
        'Implemented CI/CD pipeline reducing deployment time by 60%'
      ]
    }
  ],
  volunteer: [
    {
      organization: 'Code for Good',
      position: 'Technical Mentor',
      url: 'https://codeforgood.org',
      startDate: '2019-01-01',
      summary: 'Mentoring underrepresented students in programming.',
      highlights: [
        'Taught Python fundamentals to 50+ students',
        'Organized 3 coding bootcamps'
      ]
    }
  ],
  education: [
    {
      institution: 'University of Technology',
      url: 'https://utech.edu',
      area: 'Computer Science',
      studyType: 'Bachelor of Science',
      startDate: '2012-09-01',
      endDate: '2016-05-01',
      score: '3.8/4.0',
      courses: [
        'Data Structures and Algorithms',
        'Software Engineering',
        'Database Systems'
      ]
    }
  ],
  awards: [
    {
      title: 'Developer of the Year',
      date: '2023-12-01',
      awarder: 'TechCorp Inc',
      summary: 'Recognized for outstanding contributions to product development.'
    }
  ],
  certificates: [
    {
      name: 'AWS Certified Solutions Architect',
      date: '2023-06-15',
      url: 'https://aws.amazon.com/certification/',
      issuer: 'Amazon Web Services'
    }
  ],
  publications: [
    {
      name: 'Microservices Architecture Patterns',
      publisher: 'Tech Journal',
      releaseDate: '2023-08-01',
      url: 'https://techjournal.com/microservices-patterns',
      summary: 'Comprehensive guide to designing scalable microservices.'
    }
  ],
  skills: [
    {
      name: 'Frontend Development',
      level: 'Expert',
      keywords: ['React', 'Vue.js', 'TypeScript', 'CSS3', 'HTML5']
    },
    {
      name: 'Backend Development',
      level: 'Advanced',
      keywords: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis']
    }
  ],
  languages: [
    {
      language: 'English',
      fluency: 'Native speaker'
    },
    {
      language: 'Spanish',
      fluency: 'Conversational'
    }
  ],
  interests: [
    {
      name: 'Open Source',
      keywords: ['Contributing', 'Maintaining projects', 'Community building']
    },
    {
      name: 'Photography',
      keywords: ['Landscape', 'Street photography', 'Digital editing']
    }
  ],
  references: [
    {
      name: 'John Johnson',
      reference: 'Jane is an exceptional developer with strong leadership skills. She consistently delivers high-quality code and mentors team members effectively.'
    },
    {
      name: 'Sarah Wilson',
      reference: 'I had the pleasure of working with Jane on several critical projects. Her technical expertise and problem-solving abilities are outstanding.'
    }
  ],
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce solution with real-time inventory management.',
      highlights: [
        'Built with React and Node.js',
        'Handles 10,000+ concurrent users',
        'Integrated with multiple payment gateways'
      ],
      keywords: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
      startDate: '2022-01-01',
      endDate: '2022-12-01',
      url: 'https://github.com/janesmith/ecommerce-platform'
    }
  ],
  meta: {
    canonical: 'https://janesmith.dev/resume',
    version: 'v1.0.0',
    lastModified: '2024-01-15T10:30:00.000Z'
  }
};

describe('TemplateRenderer', () => {
  let renderer;
  let originalFetch;

  beforeEach(() => {
    renderer = new TemplateRenderer();

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockTemplateContent)
    });

    // Mock template config
    jest.doMock('../../template.config.js', () => ({
      templateConfig: mockTemplateConfig,
      getSelectedTemplate: () => mockTemplateConfig.templates[0]
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(renderer.templates).toBeInstanceOf(Map);
      expect(renderer.templates.size).toBe(0);
      expect(renderer.currentTemplate).toBeNull();
      expect(renderer.isInitialized).toBe(false);
      expect(renderer.helpers).toBeInstanceOf(Map);
      expect(renderer.helpers.size).toBeGreaterThan(0); // Built-in helpers
    });

    test('should register built-in helpers', () => {
      expect(renderer.helpers.has('formatDate')).toBe(true);
      expect(renderer.helpers.has('capitalize')).toBe(true);
      expect(renderer.helpers.has('join')).toBe(true);
      expect(renderer.helpers.has('length')).toBe(true);
    });
  });

  describe('Template Loading', () => {
    test('should load template file successfully', async () => {
      const content = await renderer.loadTemplateFile('/templates/test.html');
      expect(content).toBe(mockTemplateContent);
      expect(global.fetch).toHaveBeenCalledWith('/templates/test.html');
    });

    test('should throw error for failed template load', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(renderer.loadTemplateFile('/templates/missing.html'))
        .rejects.toThrow(TemplateRenderError);
    });

    test('should load all templates during initialization', async () => {
      await renderer.initialize();

      expect(renderer.templates.size).toBe(1);
      expect(renderer.templates.has('test-template')).toBe(true);
      expect(renderer.isInitialized).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    test('should register custom helpers', () => {
      const customHelper = (str) => str.toUpperCase();
      renderer.registerHelper('uppercase', customHelper);

      expect(renderer.helpers.get('uppercase')).toBe(customHelper);
    });

    test('formatDate helper should format dates correctly', () => {
      const formatDate = renderer.helpers.get('formatDate');

      expect(formatDate('2023-01-15')).toBe('01/2023');
      expect(formatDate('2023-01-15', 'YYYY')).toBe('2023');
      expect(formatDate('2023-01-15', 'Month YYYY')).toBe('January 2023');
      expect(formatDate('')).toBe('');
      expect(formatDate('invalid-date')).toBe('invalid-date');
    });

    test('capitalize helper should capitalize strings', () => {
      const capitalize = renderer.helpers.get('capitalize');

      expect(capitalize('hello world')).toBe('Hello world');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('')).toBe('');
      expect(capitalize(123)).toBe(123);
    });

    test('join helper should join arrays', () => {
      const join = renderer.helpers.get('join');

      expect(join(['a', 'b', 'c'])).toBe('a, b, c');
      expect(join(['a', 'b', 'c'], ' | ')).toBe('a | b | c');
      expect(join([])).toBe('');
      expect(join('not-array')).toBe('');
    });
  });

  describe('Data Processing', () => {
    test('should process resume data correctly', () => {
      const processed = renderer.processResumeData(mockResumeData);

      expect(processed.basics.name).toBe('John Doe');
      expect(processed.work).toHaveLength(2);
      expect(processed.work[0].formattedDates).toContain('Jan 2020');
      expect(processed.work[0].formattedDates).toContain('Dec 2023');
    });

    test('should handle missing data gracefully', () => {
      const incompleteData = { basics: { name: 'Test' } };
      const processed = renderer.processResumeData(incompleteData);

      expect(processed.basics.name).toBe('Test');
      expect(processed.work).toBeUndefined();
    });

    test('should format date ranges correctly', () => {
      expect(renderer.formatDateRange('2020-01-01', '2023-12-31'))
        .toBe('Jan 2020 – Dec 2023');
      expect(renderer.formatDateRange('2020-01-01', null))
        .toBe('Jan 2020 – Present');
      expect(renderer.formatDateRange('2020-01-01', 'present'))
        .toBe('Jan 2020 – Present');
      expect(renderer.formatDateRange('', '2023-12-31'))
        .toBe('');
    });

    test('should format display dates correctly', () => {
      expect(renderer.formatDisplayDate('2023-01-15')).toBe('Jan 2023');
      expect(renderer.formatDisplayDate('2023-12-31')).toBe('Dec 2023');
      expect(renderer.formatDisplayDate('')).toBe('');
      expect(renderer.formatDisplayDate('invalid')).toBe('invalid');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should render simple variables', () => {
      const template = '<h1>{{basics.name}}</h1><p>{{basics.email}}</p>';
      const result = renderer.renderTemplate(template, mockResumeData);

      expect(result).toContain('<h1>John Doe</h1>');
      expect(result).toContain('<p>john@example.com</p>');
    });

    test('should handle missing variables gracefully', () => {
      const template = '<h1>{{basics.name}}</h1><p>{{basics.missing}}</p>';
      const result = renderer.renderTemplate(template, mockResumeData);

      expect(result).toContain('<h1>John Doe</h1>');
      expect(result).toContain('<p></p>');
    });

    test('should process conditional blocks', () => {
      const template = `
        <h1>{{basics.name}}</h1>
        {{#if basics.label}}
        <h2>{{basics.label}}</h2>
        {{/if}}
        {{#if basics.missing}}
        <p>This should not appear</p>
        {{/if}}
      `;

      const result = renderer.renderTemplate(template, mockResumeData);

      expect(result).toContain('<h1>John Doe</h1>');
      expect(result).toContain('<h2>Software Developer</h2>');
      expect(result).not.toContain('This should not appear');
    });

    test('should process loops correctly', () => {
      const template = `
        {{#each work}}
        <div>{{position}} at {{name}}</div>
        {{/each}}
      `;

      const result = renderer.renderTemplate(template, mockResumeData);

      expect(result).toContain('Senior Developer at Tech Corp');
      expect(result).toContain('Developer at Startup Inc');
    });

    test('should handle nested loops', () => {
      const template = `
        {{#each work}}
        <div>
          <h3>{{position}}</h3>
          {{#each highlights}}
          <li>{{this}}</li>
          {{/each}}
        </div>
        {{/each}}
      `;

      const result = renderer.renderTemplate(template, mockResumeData);

      expect(result).toContain('<h3>Senior Developer</h3>');
      expect(result).toContain('<li>Built scalable applications</li>');
      expect(result).toContain('<li>Mentored junior developers</li>');
    });

    test('should get nested values correctly', () => {
      expect(renderer.getNestedValue(mockResumeData, 'basics.name')).toBe('John Doe');
      expect(renderer.getNestedValue(mockResumeData, 'work.0.position')).toBe('Senior Developer');
      expect(renderer.getNestedValue(mockResumeData, 'missing.path')).toBeUndefined();
    });
  });

  describe('Full Rendering', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should render complete template with data', async () => {
      const result = await renderer.render(mockResumeData);

      expect(result).toContain('<title>John Doe - Software Developer</title>');
      expect(result).toContain('<h1>John Doe</h1>');
      expect(result).toContain('<h2>Software Developer</h2>');
      expect(result).toContain('<h4>Senior Developer at Tech Corp</h4>');
      expect(result).toContain('<li>Built scalable applications</li>');
    });

    test('should render with specific template ID', async () => {
      const result = await renderer.render(mockResumeData, 'test-template');

      expect(result).toContain('<h1>John Doe</h1>');
    });

    test('should throw error for missing template', async () => {
      await expect(renderer.render(mockResumeData, 'missing-template'))
        .rejects.toThrow(TemplateRenderError);
    });
  });

  describe('Template Management', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should get available templates', () => {
      const templates = renderer.getAvailableTemplates();

      expect(templates).toHaveLength(1);
      expect(templates[0]).toEqual({
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template'
      });
    });

    test('should set current template', () => {
      renderer.setTemplate('test-template');
      expect(renderer.currentTemplate.id).toBe('test-template');
    });

    test('should throw error for invalid template', () => {
      expect(() => renderer.setTemplate('invalid-template'))
        .toThrow(TemplateRenderError);
    });
  });

  describe('Error Handling', () => {
    test('should create TemplateRenderError with correct properties', () => {
      const error = new TemplateRenderError('Test error', 'test-template', { test: 'data' });

      expect(error.name).toBe('TemplateRenderError');
      expect(error.message).toBe('Test error');
      expect(error.template).toBe('test-template');
      expect(error.data).toEqual({ test: 'data' });
      expect(error.timestamp).toBeDefined();
    });

    test('should handle rendering errors gracefully', async () => {
      // Mock a template that will cause an error
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{{invalid.template.syntax')
      });

      const badRenderer = new TemplateRenderer();
      await expect(badRenderer.render(mockResumeData))
        .rejects.toThrow(TemplateRenderError);
    });
  });

  describe('Performance and Caching', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should clear cache', () => {
      renderer.clearCache();
      expect(renderer.templateCache.size).toBe(0);
    });

    test('should provide stats', () => {
      const stats = renderer.getStats();

      expect(stats.templatesLoaded).toBe(1);
      expect(stats.helpersRegistered).toBeGreaterThan(0);
      expect(stats.isInitialized).toBe(true);
      expect(stats.currentTemplate).toBe('Test Template');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty data', async () => {
      await renderer.initialize();
      const result = await renderer.render({});

      expect(result).toBeDefined();
      expect(result).toContain('<h1></h1>'); // Empty name
    });

    test('should handle null/undefined values', () => {
      const template = '{{basics.name}} - {{basics.missing}}';
      const result = renderer.renderTemplate(template, { basics: { name: null } });

      expect(result).toBe(' - ');
    });

    test('should handle arrays in conditionals', () => {
      const template = `
        {{#if work}}
        <p>Has work experience</p>
        {{/if}}
        {{#if education}}
        <p>Has education</p>
        {{/if}}
      `;

      const result = renderer.renderTemplate(template, { work: ['job1'], education: [] });

      expect(result).toContain('Has work experience');
      expect(result).not.toContain('Has education');
    });
  });

  describe('Complete JSON Resume Schema Support', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should render all JSON Resume Schema sections', async () => {
      const template = `
        <!-- Basics -->
        <h1>{{basics.name}}</h1>
        {{#if basics.image}}
        <img src="{{basics.image}}" alt="{{basics.name}}">
        {{/if}}
        {{#if basics.label}}<h2>{{basics.label}}</h2>{{/if}}

        <!-- Contact -->
        {{#if basics.email}}<p>{{basics.email}}</p>{{/if}}
        {{#if basics.phone}}<p>{{basics.phone}}</p>{{/if}}
        {{#if basics.url}}<a href="{{basics.url}}">{{basics.url}}</a>{{/if}}

        <!-- Location -->
        {{#if basics.location}}
        <div>{{basics.location.city}}, {{basics.location.region}} {{basics.location.countryCode}}</div>
        {{/if}}

        <!-- Profiles -->
        {{#if basics.profiles}}
        {{#each basics.profiles}}
        <a href="{{url}}">{{network}}</a>
        {{/each}}
        {{/if}}

        <!-- Summary -->
        {{#if basics.summary}}<p>{{basics.summary}}</p>{{/if}}

        <!-- Work -->
        {{#if work}}
        <section>
          {{#each work}}
          <div>{{position}} at {{name}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Volunteer -->
        {{#if volunteer}}
        <section>
          {{#each volunteer}}
          <div>{{position}} at {{organization}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Education -->
        {{#if education}}
        <section>
          {{#each education}}
          <div>{{studyType}} in {{area}} from {{institution}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Awards -->
        {{#if awards}}
        <section>
          {{#each awards}}
          <div>{{title}} from {{awarder}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Certificates -->
        {{#if certificates}}
        <section>
          {{#each certificates}}
          <div>{{name}} from {{issuer}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Publications -->
        {{#if publications}}
        <section>
          {{#each publications}}
          <div>{{name}} by {{publisher}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Skills -->
        {{#if skills}}
        <section>
          {{#each skills}}
          <div>{{name}} - {{level}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Languages -->
        {{#if languages}}
        <section>
          {{#each languages}}
          <div>{{language}} - {{fluency}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Interests -->
        {{#if interests}}
        <section>
          {{#each interests}}
          <div>{{name}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- References -->
        {{#if references}}
        <section>
          {{#each references}}
          <div>{{name}}: {{reference}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Projects -->
        {{#if projects}}
        <section>
          {{#each projects}}
          <div>{{name}}: {{description}}</div>
          {{/each}}
        </section>
        {{/if}}

        <!-- Meta -->
        {{#if meta.lastModified}}
        <div>Last updated: {{meta.lastModified}}</div>
        {{/if}}
      `;

      const result = renderer.renderTemplate(template, completeResumeData);

      // Test all sections are rendered
      expect(result).toContain('<h1>Jane Smith</h1>');
      expect(result).toContain('<img src="https://example.com/profile.jpg"');
      expect(result).toContain('<h2>Full Stack Developer</h2>');
      expect(result).toContain('jane@example.com');
      expect(result).toContain('+1-555-0123');
      expect(result).toContain('https://janesmith.dev');
      expect(result).toContain('San Francisco, California US');
      expect(result).toContain('GitHub');
      expect(result).toContain('LinkedIn');
      expect(result).toContain('Passionate full-stack developer');
      expect(result).toContain('Senior Full Stack Developer at TechCorp Inc');
      expect(result).toContain('Technical Mentor at Code for Good');
      expect(result).toContain('Bachelor of Science in Computer Science from University of Technology');
      expect(result).toContain('Developer of the Year from TechCorp Inc');
      expect(result).toContain('AWS Certified Solutions Architect from Amazon Web Services');
      expect(result).toContain('Microservices Architecture Patterns by Tech Journal');
      expect(result).toContain('Frontend Development - Expert');
      expect(result).toContain('English - Native speaker');
      expect(result).toContain('Open Source');
      expect(result).toContain('John Johnson: Jane is an exceptional developer');
      expect(result).toContain('E-commerce Platform: Full-stack e-commerce solution');
      expect(result).toContain('Last updated: 2024-01-15T10:30:00.000Z');
    });

    test('should handle missing optional sections gracefully', () => {
      const template = `
        {{#if basics.name}}<h1>{{basics.name}}</h1>{{/if}}
        {{#if awards}}<div>Has awards</div>{{/if}}
        {{#if certificates}}<div>Has certificates</div>{{/if}}
        {{#if references}}<div>Has references</div>{{/if}}
        {{#if publications}}<div>Has publications</div>{{/if}}
        {{#if volunteer}}<div>Has volunteer</div>{{/if}}
        {{#if projects}}<div>Has projects</div>{{/if}}
      `;

      const minimalData = {
        basics: { name: 'Test User' }
      };

      const result = renderer.renderTemplate(template, minimalData);

      expect(result).toContain('<h1>Test User</h1>');
      expect(result).not.toContain('Has awards');
      expect(result).not.toContain('Has certificates');
      expect(result).not.toContain('Has references');
      expect(result).not.toContain('Has publications');
      expect(result).not.toContain('Has volunteer');
      expect(result).not.toContain('Has projects');
    });
  });

  describe('Profile Image Support', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should render profile image when present', () => {
      const template = `
        {{#if basics.image}}
        <div class="profile-image">
          <img src="{{basics.image}}" alt="{{basics.name}}" class="profile-photo">
        </div>
        {{/if}}
      `;

      const dataWithImage = {
        basics: {
          name: 'Test User',
          image: 'https://example.com/photo.jpg'
        }
      };

      const result = renderer.renderTemplate(template, dataWithImage);

      expect(result).toContain('<div class="profile-image">');
      expect(result).toContain('<img src="https://example.com/photo.jpg"');
      expect(result).toContain('alt="Test User"');
      expect(result).toContain('class="profile-photo"');
    });

    test('should not render profile image section when not present', () => {
      const template = `
        {{#if basics.image}}
        <div class="profile-image">
          <img src="{{basics.image}}" alt="{{basics.name}}">
        </div>
        {{/if}}
        <h1>{{basics.name}}</h1>
      `;

      const dataWithoutImage = {
        basics: { name: 'Test User' }
      };

      const result = renderer.renderTemplate(template, dataWithoutImage);

      expect(result).not.toContain('<div class="profile-image">');
      expect(result).not.toContain('<img');
      expect(result).toContain('<h1>Test User</h1>');
    });
  });

  describe('References Section Support', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should render references section correctly', () => {
      const template = `
        {{#if references}}
        <section class="references-section">
          <h3>References</h3>
          {{#each references}}
          <div class="reference-item">
            <h4>{{name}}</h4>
            {{#if reference}}
            <blockquote>{{reference}}</blockquote>
            {{/if}}
          </div>
          {{/each}}
        </section>
        {{/if}}
      `;

      const dataWithReferences = {
        references: [
          {
            name: 'Alice Johnson',
            reference: 'Excellent developer with strong problem-solving skills.'
          },
          {
            name: 'Bob Smith',
            reference: 'Great team player and mentor.'
          },
          {
            name: 'Carol Wilson'
            // No reference text
          }
        ]
      };

      const result = renderer.renderTemplate(template, dataWithReferences);

      expect(result).toContain('<section class="references-section">');
      expect(result).toContain('<h3>References</h3>');
      expect(result).toContain('<h4>Alice Johnson</h4>');
      expect(result).toContain('<blockquote>Excellent developer with strong problem-solving skills.</blockquote>');
      expect(result).toContain('<h4>Bob Smith</h4>');
      expect(result).toContain('<blockquote>Great team player and mentor.</blockquote>');
      expect(result).toContain('<h4>Carol Wilson</h4>');
      // Should not contain blockquote for Carol Wilson since no reference text
      expect(result.match(/<blockquote>/g)).toHaveLength(2);
    });

    test('should not render references section when empty', () => {
      const template = `
        {{#if references}}
        <section class="references-section">
          <h3>References</h3>
        </section>
        {{/if}}
        <h1>Main Content</h1>
      `;

      const dataWithoutReferences = {
        basics: { name: 'Test User' }
      };

      const result = renderer.renderTemplate(template, dataWithoutReferences);

      expect(result).not.toContain('<section class="references-section">');
      expect(result).not.toContain('<h3>References</h3>');
      expect(result).toContain('<h1>Main Content</h1>');
    });
  });

  describe('Template-Specific Rendering Tests', () => {
    const templateTests = [
      {
        name: 'Classic Template',
        templateId: 'classic',
        expectedClasses: ['classic-template', 'resume-container', 'resume-header']
      },
      {
        name: 'Modern Template',
        templateId: 'modern',
        expectedClasses: ['modern-template', 'resume-container', 'sidebar', 'main-content']
      },
      {
        name: 'Minimal Template',
        templateId: 'minimal',
        expectedClasses: ['minimal-template', 'resume-container', 'resume-header']
      }
    ];

    // Mock template configurations for each template
    beforeEach(() => {
      // Mock different template files
      global.fetch = jest.fn().mockImplementation((url) => {
        let content = '';

        if (url.includes('classic')) {
          content = `
            <body class="classic-template">
              <div class="resume-container">
                <header class="resume-header">
                  {{#if basics.image}}
                  <div class="profile-image">
                    <img src="{{basics.image}}" alt="{{basics.name}}" class="profile-photo">
                  </div>
                  {{/if}}
                  <h1>{{basics.name}}</h1>
                  {{#if references}}
                  <section class="references-section">
                    {{#each references}}
                    <div class="reference-item">
                      <h4>{{name}}</h4>
                      {{#if reference}}<blockquote>{{reference}}</blockquote>{{/if}}
                    </div>
                    {{/each}}
                  </section>
                  {{/if}}
                </header>
              </div>
            </body>
          `;
        } else if (url.includes('modern')) {
          content = `
            <body class="modern-template">
              <div class="resume-container">
                <aside class="sidebar">
                  {{#if basics.image}}
                  <div class="profile-image">
                    <img src="{{basics.image}}" alt="{{basics.name}}" class="profile-photo">
                  </div>
                  {{/if}}
                  <h1>{{basics.name}}</h1>
                </aside>
                <main class="main-content">
                  {{#if references}}
                  <section class="references-section">
                    {{#each references}}
                    <div class="reference-item">
                      <h3>{{name}}</h3>
                      {{#if reference}}<blockquote><p>{{reference}}</p></blockquote>{{/if}}
                    </div>
                    {{/each}}
                  </section>
                  {{/if}}
                </main>
              </div>
            </body>
          `;
        } else if (url.includes('minimal')) {
          content = `
            <body class="minimal-template">
              <div class="resume-container">
                <header class="resume-header">
                  {{#if basics.image}}
                  <div class="profile-image">
                    <img src="{{basics.image}}" alt="{{basics.name}}" class="profile-photo">
                  </div>
                  {{/if}}
                  <h1>{{basics.name}}</h1>
                </header>
                {{#if references}}
                <section class="references-section">
                  {{#each references}}
                  <div class="reference-item">
                    <h4>{{name}}</h4>
                    {{#if reference}}<blockquote>{{reference}}</blockquote>{{/if}}
                  </div>
                  {{/each}}
                </section>
                {{/if}}
              </div>
            </body>
          `;
        }

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content)
        });
      });
    });

    templateTests.forEach(({ name, templateId, expectedClasses }) => {
      test(`should render ${name} with proper structure and classes`, async () => {
        // Mock template config for specific template
        const mockConfig = {
          templates: [{
            id: templateId,
            name: name,
            description: `${name} template`,
            path: `/templates/${templateId}.html`
          }]
        };

        const testRenderer = new TemplateRenderer();

        // Mock the template config import
        jest.doMock('../../template.config.js', () => ({
          templateConfig: mockConfig,
          getSelectedTemplate: () => mockConfig.templates[0]
        }));

        await testRenderer.initialize();
        const result = await testRenderer.render(completeResumeData, templateId);

        // Check for template-specific classes
        expectedClasses.forEach(className => {
          expect(result).toContain(`class="${className}"`);
        });

        // Check that profile image is rendered
        expect(result).toContain('<img src="https://example.com/profile.jpg"');
        expect(result).toContain('alt="Jane Smith"');

        // Check that references section is rendered
        expect(result).toContain('John Johnson');
        expect(result).toContain('Jane is an exceptional developer');
      });
    });
  });

  describe('Complex Data Structure Rendering', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should handle nested object properties correctly', () => {
      const template = `
        {{#if basics.location}}
        <div class="location">
          {{#if basics.location.address}}{{basics.location.address}}, {{/if}}
          {{#if basics.location.city}}{{basics.location.city}}{{/if}}
          {{#if basics.location.region}}, {{basics.location.region}}{{/if}}
          {{#if basics.location.postalCode}} {{basics.location.postalCode}}{{/if}}
          {{#if basics.location.countryCode}} {{basics.location.countryCode}}{{/if}}
        </div>
        {{/if}}
      `;

      const result = renderer.renderTemplate(template, completeResumeData);

      expect(result).toContain('<div class="location">');
      expect(result).toContain('123 Tech Street, San Francisco, California 12345 US');
    });

    test('should handle arrays with complex objects', () => {
      const template = `
        {{#if skills}}
        {{#each skills}}
        <div class="skill">
          <h4>{{name}} - {{level}}</h4>
          {{#if keywords}}
          <ul>
            {{#each keywords}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          {{/if}}
        </div>
        {{/each}}
        {{/if}}
      `;

      const result = renderer.renderTemplate(template, completeResumeData);

      expect(result).toContain('<h4>Frontend Development - Expert</h4>');
      expect(result).toContain('<li>React</li>');
      expect(result).toContain('<li>Vue.js</li>');
      expect(result).toContain('<li>TypeScript</li>');
      expect(result).toContain('<h4>Backend Development - Advanced</h4>');
      expect(result).toContain('<li>Node.js</li>');
      expect(result).toContain('<li>Python</li>');
    });

    test('should handle date formatting in work experience', () => {
      const processedData = renderer.processResumeData(completeResumeData);

      expect(processedData.work[0].formattedDates).toContain('Mar 2020');
      expect(processedData.work[0].formattedDates).toContain('Jan 2024');
    });
  });

  describe('Error Handling for New Features', () => {
    beforeEach(async () => {
      await renderer.initialize();
    });

    test('should handle malformed references data', () => {
      const template = `
        {{#if references}}
        {{#each references}}
        <div>{{name}}: {{reference}}</div>
        {{/each}}
        {{/if}}
      `;

      const malformedData = {
        references: [
          { name: 'Valid Reference', reference: 'Good feedback' },
          { reference: 'Missing name' }, // Missing name
          { name: 'Missing reference' }, // Missing reference
          null, // Null reference
          'invalid' // Invalid type
        ]
      };

      const result = renderer.renderTemplate(template, malformedData);

      expect(result).toContain('Valid Reference: Good feedback');
      expect(result).toContain(': Missing name'); // Empty name
      expect(result).toContain('Missing reference: '); // Empty reference
      // Should handle null and invalid entries gracefully
    });

    test('should handle invalid image URLs gracefully', () => {
      const template = `
        {{#if basics.image}}
        <img src="{{basics.image}}" alt="{{basics.name}}" onerror="this.style.display='none'">
        {{/if}}
      `;

      const dataWithBadImage = {
        basics: {
          name: 'Test User',
          image: 'not-a-valid-url'
        }
      };

      const result = renderer.renderTemplate(template, dataWithBadImage);

      expect(result).toContain('<img src="not-a-valid-url"');
      expect(result).toContain('onerror="this.style.display=\'none\'"');
    });
  });
});

// Test utilities
export const testHelpers = {
  createMockResumeData: (overrides = {}) => ({
    ...mockResumeData,
    ...overrides
  }),

  createMockTemplate: (content, overrides = {}) => ({
    id: 'mock-template',
    name: 'Mock Template',
    description: 'A mock template for testing',
    path: '/templates/mock.html',
    content,
    ...overrides
  })
};