/**
 * Resume Template Components
 * JavaScript functions that generate HTML using template literals
 */

/**
 * Header component with contact information
 */
export function Header({ basics = {} }) {
  const { name, label, email, phone, url, location = {}, profiles = [] } = basics;

  return `
    <header class="resume-header page-break-inside-avoid">
      ${basics.image ? `
        <div class="profile-image">
          <img src="${basics.image}" alt="${name}" class="profile-photo">
        </div>
      ` : ''}

      <div class="header-content">
        <h1 class="name">${name || ''}</h1>
        ${label ? `<h2 class="title">${label}</h2>` : ''}

        <div class="contact-info">
          ${email ? `
            <div class="contact-item">
              <span class="contact-label">Email:</span>
              <a href="mailto:${email}" class="contact-value">${email}</a>
            </div>
          ` : ''}

          ${phone ? `
            <div class="contact-item">
              <span class="contact-label">Phone:</span>
              <span class="contact-value">${phone}</span>
            </div>
          ` : ''}

          ${url ? `
            <div class="contact-item">
              <span class="contact-label">Website:</span>
              <a href="${url}" class="contact-value" target="_blank">${url}</a>
            </div>
          ` : ''}

          ${location.city || location.region ? `
            <div class="contact-item">
              <span class="contact-label">Location:</span>
              <span class="contact-value">
                ${[location.city, location.region, location.countryCode].filter(Boolean).join(', ')}
              </span>
            </div>
          ` : ''}
        </div>

        ${profiles.length > 0 ? `
          <div class="social-profiles">
            ${profiles.map(profile => `
              <a href="${profile.url}" class="profile-link" target="_blank">
                <span class="profile-network">${profile.network}</span>
                ${profile.username ? `: ${profile.username}` : ''}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </header>
  `;
}

/**
 * Professional Summary component
 */
export function Summary({ basics = {} }) {
  if (!basics.summary) return '';

  return `
    <section class="section summary-section page-break-inside-avoid">
      <h3 class="section-title keep-with-next">Professional Summary</h3>
      <div class="section-content">
        <p class="summary-text">${basics.summary}</p>
      </div>
    </section>
  `;
}

/**
 * Work Experience component
 */
export function WorkExperience({ work = [] }) {
  if (!work.length) return '';

  return `
    <section class="section work-section">
      <h3 class="section-title keep-with-next">Professional Experience</h3>
      <div class="section-content">
        ${work.map(job => WorkItem(job)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual work item component
 */
function WorkItem(job) {
  const { position, name, url, startDate, endDate, summary, highlights = [], formattedDates } = job;

  return `
    <div class="work-item experience-item page-break-inside-avoid">
      <div class="work-header">
        <h4 class="work-position">${position || ''}</h4>
        <div class="work-company">
          ${url ? `<a href="${url}" target="_blank">${name}</a>` : name}
        </div>
        <div class="work-dates">
          ${formattedDates || formatDateRange(startDate, endDate)}
        </div>
      </div>

      ${summary ? `
        <div class="work-summary">
          <p>${summary}</p>
        </div>
      ` : ''}

      ${highlights.length > 0 ? `
        <ul class="work-highlights">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}

/**
 * Education component
 */
export function Education({ education = [] }) {
  if (!education.length) return '';

  return `
    <section class="section education-section">
      <h3 class="section-title keep-with-next">Education</h3>
      <div class="section-content">
        ${education.map(edu => EducationItem(edu)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual education item component
 */
function EducationItem(edu) {
  const { institution, url, area, studyType, startDate, endDate, score, courses = [], formattedDates } = edu;

  return `
    <div class="education-item page-break-inside-avoid">
      <div class="education-header">
        <h4 class="education-degree">
          ${[studyType, area].filter(Boolean).join(' in ')}
        </h4>
        <div class="education-institution">
          ${url ? `<a href="${url}" target="_blank">${institution}</a>` : institution}
        </div>
        <div class="education-dates">
          ${formattedDates || formatDateRange(startDate, endDate)}
        </div>
      </div>

      ${score ? `
        <div class="education-score">
          <strong>GPA:</strong> ${score}
        </div>
      ` : ''}

      ${courses.length > 0 ? `
        <div class="education-courses">
          <strong>Relevant Coursework:</strong>
          <ul class="courses-list">
            ${courses.map(course => `<li>${course}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Skills component
 */
export function Skills({ skills = [] }) {
  if (!skills.length) return '';

  return `
    <section class="section skills-section">
      <h3 class="section-title">Skills</h3>
      <div class="section-content">
        ${skills.map(skill => SkillItem(skill)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual skill item component
 */
function SkillItem(skill) {
  const { name, level, keywords = [] } = skill;

  return `
    <div class="skill-item">
      <div class="skill-header">
        <h4 class="skill-name">${name || ''}</h4>
        ${level ? `<span class="skill-level">${level}</span>` : ''}
      </div>
      ${keywords.length > 0 ? `
        <div class="skill-keywords">
          ${keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Languages component
 */
export function Languages({ languages = [] }) {
  if (!languages.length) return '';

  return `
    <section class="section languages-section">
      <h3 class="section-title">Languages</h3>
      <div class="section-content">
        ${languages.map(lang => `
          <div class="language-item">
            <span class="language-name">${lang.language || ''}</span>
            ${lang.fluency ? `<span class="language-fluency">${lang.fluency}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Volunteer Experience component
 */
export function VolunteerExperience({ volunteer = [] }) {
  if (!volunteer.length) return '';

  return `
    <section class="section volunteer-section">
      <h3 class="section-title">Volunteer Experience</h3>
      <div class="section-content">
        ${volunteer.map(vol => VolunteerItem(vol)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual volunteer item component
 */
function VolunteerItem(vol) {
  const { organization, position, url, startDate, endDate, summary, highlights = [], formattedDates } = vol;

  return `
    <div class="volunteer-item page-break-inside-avoid">
      <div class="volunteer-header">
        <h4 class="volunteer-position">${position || ''}</h4>
        <div class="volunteer-organization">
          ${url ? `<a href="${url}" target="_blank">${organization}</a>` : organization}
        </div>
        <div class="volunteer-dates">
          ${formattedDates || formatDateRange(startDate, endDate)}
        </div>
      </div>

      ${summary ? `
        <div class="volunteer-summary">
          <p>${summary}</p>
        </div>
      ` : ''}

      ${highlights.length > 0 ? `
        <ul class="volunteer-highlights">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}

/**
 * Publications component
 */
export function Publications({ publications = [] }) {
  if (!publications.length) return '';

  return `
    <section class="section publications-section">
      <h3 class="section-title">Publications</h3>
      <div class="section-content">
        ${publications.map(pub => `
          <div class="publication-item page-break-inside-avoid">
            <h4 class="publication-name">
              ${pub.url ? `<a href="${pub.url}" target="_blank">${pub.name}</a>` : pub.name}
            </h4>
            <div class="publication-details">
              ${pub.publisher ? `<span class="publication-publisher">${pub.publisher}</span>` : ''}
              ${pub.releaseDate ? `<span class="publication-date">${formatDate(pub.releaseDate)}</span>` : ''}
            </div>
            ${pub.summary ? `<p class="publication-summary">${pub.summary}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Awards component
 */
export function Awards({ awards = [] }) {
  if (!awards.length) return '';

  return `
    <section class="section awards-section">
      <h3 class="section-title">Awards & Recognition</h3>
      <div class="section-content">
        ${awards.map(award => `
          <div class="award-item page-break-inside-avoid">
            <h4 class="award-title">${award.title || ''}</h4>
            <div class="award-details">
              ${award.awarder ? `<span class="award-awarder">${award.awarder}</span>` : ''}
              ${award.date ? `<span class="award-date">${formatDate(award.date)}</span>` : ''}
            </div>
            ${award.summary ? `<p class="award-summary">${award.summary}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Certificates component
 */
export function Certificates({ certificates = [] }) {
  if (!certificates.length) return '';

  return `
    <section class="section certificates-section">
      <h3 class="section-title">Certifications</h3>
      <div class="section-content">
        ${certificates.map(cert => `
          <div class="certificate-item page-break-inside-avoid">
            <h4 class="certificate-name">
              ${cert.url ? `<a href="${cert.url}" target="_blank">${cert.name}</a>` : cert.name}
            </h4>
            <div class="certificate-details">
              ${cert.issuer ? `<span class="certificate-issuer">${cert.issuer}</span>` : ''}
              ${cert.date ? `<span class="certificate-date">${formatDate(cert.date)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Interests component
 */
export function Interests({ interests = [] }) {
  if (!interests.length) return '';

  return `
    <section class="section interests-section">
      <h3 class="section-title">Interests</h3>
      <div class="section-content">
        ${interests.map(interest => `
          <div class="interest-item">
            <h4 class="interest-name">${interest.name || ''}</h4>
            ${interest.keywords && interest.keywords.length > 0 ? `
              <div class="interest-keywords">
                ${interest.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Helper function to format dates
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Helper function to format date ranges
 */
function formatDateRange(startDate, endDate) {
  if (!startDate) return '';
  const start = formatDate(startDate);
  const end = endDate && endDate.toLowerCase() !== 'present' ? formatDate(endDate) : 'Present';
  return end === 'Present' || !endDate ? `${start} – ${end}` : `${start} – ${end}`;
}