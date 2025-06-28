import {formatDateRange} from '../utils/helpers.js'

/**
 * Education component
 */
export function Education({education = []}) {
	if (education.length === 0) {
		return ''
	}

	return `
    <section class="section education-section">
      <h3 class="section-title keep-with-next">Education</h3>
      <div class="section-content">
        ${education.map(edu => EducationItem(edu)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual education item component
 */
function EducationItem(edu) {
	const {institution, url, area, studyType, startDate, endDate, score, courses = [], formattedDates} = edu

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

      ${score
			? `
        <div class="education-score">
          <strong>GPA:</strong> ${score}
        </div>
      `
			: ''}

      ${courses.length > 0
			? `
        <div class="education-courses">
          <strong>Relevant Coursework:</strong>
          <ul class="courses-list">
            ${courses.map(course => `<li>${course}</li>`).join('')}
          </ul>
        </div>
      `
			: ''}
    </div>
  `
}
