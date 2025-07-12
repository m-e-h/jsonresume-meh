import {formatDateRange} from '../utils/helpers.js'

/**
 * Projects component
 */
export function projects({projects = []}) {
	if (projects.length === 0) {
		return ''
	}

	return `
    <section class="resume-section projects-section">
      <h3 class="section-title">Projects</h3>
      <div class="section-content">
        ${projects.map(project => projectItem(project)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual project item component
 */
function projectItem(project) {
	const {name, description, highlights = [], url, startDate, endDate, roles = [], entity, type, formattedDates} = project

	return `
    <div class="project-item section-item">
      <div class="project-header item-header">
        <div class="item-header-left">
          <h4 class="project-name item-title">
            ${url ? `<a href="${url}" target="_blank">${name}</a>` : name}
          </h4>
        ${roles.length > 0
			? `<div class="project-roles item-subtitle">
            ${roles.join(', ')}</div>`
			: ''}
        </div>
        <div class="item-header-right">
          ${startDate
				? `
            <div class="project-dates item-dates">
              ${formattedDates || formatDateRange(startDate, endDate)}
            </div>
          `
				: ''}
        ${entity ? `<div class="project-entity">${entity}</div>` : ''}
        </div>
      </div>

      ${description
			? `
        <div class="project-description item-summary">
          <p>${description}</p>
        </div>
      `
			: ''}

      ${highlights.length > 0
			? `
        <ul class="project-highlights item-list">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      `
			: ''}
    </div>
  `
}
