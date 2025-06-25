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
              <span class="contact-label icon">${Icon('mail')}</span>
              <a href="mailto:${email}" class="contact-value">${email}</a>
            </div>
          ` : ''}

          ${phone ? `
            <div class="contact-item">
              <span class="contact-label icon">${Icon('phone')}</span>
              <span class="contact-value">${phone}</span>
            </div>
          ` : ''}

          ${url ? `
            <div class="contact-item">
              <span class="contact-label icon">${Icon('globe')}</span>
              <a href="${url}" class="contact-value" target="_blank">${url}</a>
            </div>
          ` : ''}

          ${location.city || location.region ? `
            <div class="contact-item">
              <span class="contact-label icon">${Icon('map-pin')}</span>
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
                <span class="icon icon-${profile.network} profile-network">${Icon(profile.network)}</span>
                ${profile.username ? ` ${profile.username}` : ''}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </header>
  `;
}

/**
 * Summary component
 */
export function Summary({ basics = {} }) {
  if (!basics.summary) return '';

  return `
    <section class="section summary-section page-break-inside-avoid">
      <h3 class="section-title keep-with-next">Summary</h3>
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
      <h3 class="section-title keep-with-next">Experience</h3>
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
  const { position, name, url, startDate, endDate, summary, location, highlights = [], formattedDates } = job;

  return `
    <div class="work-item section-item experience-item page-break-inside-avoid">
      <div class="work-header item-header">
        <div class="item-header-left">
          <h4 class="work-company item-title">
            ${url ? `<a href="${url}" target="_blank">${name}</a>` : name}
          </h4>
          <div class="work-position item-subtitle">
            ${position || ''}
          </div>
        </div>
        <div class="item-header-right">
          <div class="work-dates item-dates">
            ${formattedDates || formatDateRange(startDate, endDate)}
          </div>
          <div class="work-location">
            ${location || ''}
          </div>
        </div>
      </div>

      ${summary ? `
        <div class="work-summary">
          <p>${summary}</p>
        </div>
      ` : ''}

      ${highlights.length > 0 ? `
        <ul class="work-highlights item-list">
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
      <div class="education-header item-header">
        <div class="item-header-left">
          <h4 class="education-degree item-title">
            ${[studyType, area].filter(Boolean).join(' in ')}
          </h4>
          <div class="education-institution item-subtitle">
            ${url ? `<a href="${url}" target="_blank">${institution}</a>` : institution}
          </div>
        </div>
        <div class="item-header-right">
          <div class="education-dates item-dates">
            ${formattedDates || formatDateRange(startDate, endDate)}
          </div>
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
    <div class="volunteer-item section-item page-break-inside-avoid">
      <div class="volunteer-header item-header">
        <div class="item-header-left">
          <h4 class="volunteer-position item-title">${position || ''}</h4>
          <div class="volunteer-organization item-subtitle">
            ${url ? `<a href="${url}" target="_blank">${organization}</a>` : organization}
          </div>
        </div>
        <div class="item-header-right">
          <div class="volunteer-dates item-dates">
            ${formattedDates || formatDateRange(startDate, endDate)}
          </div>
        </div>
      </div>

      ${summary ? `
        <div class="volunteer-summary">
          <p>${summary}</p>
        </div>
      ` : ''}

      ${highlights.length > 0 ? `
        <ul class="volunteer-highlights item-list">
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
          <div class="publication-item section-item page-break-inside-avoid">
            <div class="publication-header item-header">
              <div class="item-header-left">
                <h4 class="publication-name item-title">
                  ${pub.url ? `<a href="${pub.url}" target="_blank">${pub.name}</a>` : pub.name}
                </h4>
                ${pub.publisher ? `<div class="publication-publisher item-subtitle">${pub.publisher}</div>` : ''}
              </div>
              <div class="item-header-right">
                ${pub.releaseDate ? `<div class="publication-date item-dates">${formatDate(pub.releaseDate)}</div>` : ''}
              </div>
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
 * Projects component
 */
export function Projects({ projects = [] }) {
  if (!projects.length) return '';

  return `
    <section class="section projects-section">
      <h3 class="section-title">Projects</h3>
      <div class="section-content">
        ${projects.map(project => ProjectItem(project)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual project item component
 */
function ProjectItem(project) {
  const { name, description, highlights = [], url, startDate, endDate, roles = [], entity, type, formattedDates } = project;

  return `
    <div class="project-item section-item page-break-inside-avoid">
      <div class="project-header item-header">
        <div class="item-header-left">
          <h4 class="project-name item-title">
            ${url ? `<a href="${url}" target="_blank">${name}</a>` : name}
          </h4>
          ${entity ? `<div class="project-entity item-subtitle">${entity}</div>` : ''}
        </div>
        <div class="item-header-right">
          ${startDate ? `
            <div class="project-dates item-dates">
              ${formattedDates || formatDateRange(startDate, endDate)}
            </div>
          ` : ''}
          ${type ? `<div class="project-type">${type}</div>` : ''}
        </div>
      </div>

      ${roles.length > 0 ? `
        <div class="project-roles">
          <strong>Roles:</strong> ${roles.join(', ')}
        </div>
      ` : ''}

      ${description ? `
        <div class="project-description">
          <p>${description}</p>
        </div>
      ` : ''}

      ${highlights.length > 0 ? `
        <ul class="project-highlights item-list">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}

/**
 * References component
 */
export function References({ references = [] }) {
  if (!references.length) return '';

  return `
    <section class="section references-section">
      <h3 class="section-title">References</h3>
      <div class="section-content">
        ${references.map(reference => ReferenceItem(reference)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual reference item component
 */
function ReferenceItem(reference) {
  const { name, reference: referenceText } = reference;

  return `
    <div class="reference-item page-break-inside-avoid">
      <h4 class="reference-name">${name || ''}</h4>
      ${referenceText ? `
        <blockquote class="reference-text">
          "${referenceText}"
        </blockquote>
      ` : ''}
    </div>
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

export default function Icon(name) {

  switch (name.toLowerCase()) {
    case 'map-pin':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 9c-.8 0-1.5.7-1.5 1.5S11.2 12 12 12s1.5-.7 1.5-1.5S12.8 9 12 9zm0-5c-3.6 0-6.5 2.8-6.5 6.2 0 .8.3 1.8.9 3.1.5 1.1 1.2 2.3 2 3.6.7 1 3 3.8 3.2 3.9l.4.5.4-.5c.2-.2 2.6-2.9 3.2-3.9.8-1.2 1.5-2.5 2-3.6.6-1.3.9-2.3.9-3.1C18.5 6.8 15.6 4 12 4zm4.3 8.7c-.5 1-1.1 2.2-1.9 3.4-.5.7-1.7 2.2-2.4 3-.7-.8-1.9-2.3-2.4-3-.8-1.2-1.4-2.3-1.9-3.3-.6-1.4-.7-2.2-.7-2.5 0-2.6 2.2-4.7 5-4.7s5 2.1 5 4.7c0 .2-.1 1-.7 2.4z"/></svg>`
    case 'mail':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm.5 12c0 .3-.2.5-.5.5H5c-.3 0-.5-.2-.5-.5V9.8l7.5 5.6 7.5-5.6V17zm0-9.1L12 13.6 4.5 7.9V7c0-.3.2-.5.5-.5h14c.3 0 .5.2.5.5v.9z"/></svg>`
    case 'phone':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M763-145q-121-9-229.5-59.5T339-341q-86-86-135.5-194T144-764q-2-21 12.29-36.5Q170.57-816 192-816h136q17 0 29.5 10.5T374-779l24 106q2 13-1.5 25T385-628l-97 98q20 38 46 73t57.97 65.98Q422-361 456-335.5q34 25.5 72 45.5l99-96q8-8 20-11.5t25-1.5l107 23q17 5 27 17.5t10 29.5v136q0 21.43-16 35.71Q784-143 763-145ZM255-600l70-70-17.16-74H218q5 38 14 73.5t23 70.5Zm344 344q35.1 14.24 71.55 22.62Q707-225 744-220v-90l-75-16-70 70ZM255-600Zm344 344Z"/></svg>`
    case 'github':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1f2328"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.09.682-.218.682-.484 0-.236-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.455-1.157-1.11-1.465-1.11-1.465-.909-.62.069-.608.069-.608 1.004.071 1.532 1.03 1.532 1.03.891 1.529 2.341 1.089 2.91.833.091-.647.349-1.086.635-1.337-2.22-.251-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.097-2.646 0 0 .84-.269 2.75 1.025A9.548 9.548 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.307.679.917.679 1.852 0 1.335-.012 2.415-.012 2.741 0 .269.18.579.688.481A9.997 9.997 0 0 0 22 12c0-5.523-4.477-10-10-10z"/></svg>`
    case 'linkedin':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0a66c2"><path d="M19.7 3H4.3A1.3 1.3 0 0 0 3 4.3v15.4A1.3 1.3 0 0 0 4.3 21h15.4a1.3 1.3 0 0 0 1.3-1.3V4.3A1.3 1.3 0 0 0 19.7 3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 1 1-.002-3.096 1.548 1.548 0 0 1 .002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.249h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z"/></svg>`
    case 'npm':
      return `<svg class="icon-npm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cb3837"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>`
    case 'wordpress':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3858e9"><path d="M12.158 12.786 9.46 20.625a8.984 8.984 0 0 0 5.526-.144.852.852 0 0 1-.065-.124l-2.763-7.571zM3.009 12a8.993 8.993 0 0 0 5.067 8.092L3.788 8.341A8.952 8.952 0 0 0 3.009 12zm15.06-.454c0-1.112-.399-1.881-.741-2.48-.456-.741-.883-1.368-.883-2.109 0-.826.627-1.596 1.51-1.596.04 0 .078.005.116.007A8.963 8.963 0 0 0 12 3.009a8.982 8.982 0 0 0-7.512 4.052c.211.007.41.011.579.011.94 0 2.396-.114 2.396-.114.484-.028.541.684.057.741 0 0-.487.057-1.029.085l3.274 9.739 1.968-5.901-1.401-3.838c-.484-.028-.943-.085-.943-.085-.485-.029-.428-.769.057-.741 0 0 1.484.114 2.368.114.94 0 2.397-.114 2.397-.114.485-.028.542.684.057.741 0 0-.488.057-1.029.085l3.249 9.665.897-2.996c.456-1.169.684-2.137.684-2.907zm1.82-3.86c.039.286.06.593.06.924 0 .912-.171 1.938-.684 3.22l-2.746 7.94a8.984 8.984 0 0 0 4.47-7.771 8.922 8.922 0 0 0-1.1-4.313zM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>`
    default:
      return ''
  }
}