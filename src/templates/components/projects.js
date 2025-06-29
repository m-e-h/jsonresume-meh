import {formatDateRange} from '../utils/helpers.js'

/**
 * Projects component
 */
export function projects({projects = []}) {
	if (projects.length === 0) {
		return ''
	}

	return `
    <section class="section projects-section">
      <h3 class="section-title">Projects</h3>
      <div class="section-content">
        ${projects.map(project => ProjectItem(project)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual project item component
 */
function ProjectItem(project) {
	const {name, description, highlights = [], url, startDate, endDate, roles = [], entity, type, formattedDates} = project

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
          ${startDate
				? `
            <div class="project-dates item-dates">
              ${formattedDates || formatDateRange(startDate, endDate)}
            </div>
          `
				: ''}
          ${type ? `<div class="project-type item-other-label">${type}</div>` : ''}
        </div>
      </div>

      ${roles.length > 0
			? `
        <div class="project-roles">
          <strong>Roles:</strong> ${roles.join(', ')}
        </div>
      `
			: ''}

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
