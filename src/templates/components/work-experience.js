import {formatDateRange} from '../utils/helpers.js'

/**
 * Work Experience component
 */
export function workExperience({work = []}) {
	if (work.length === 0) {
		return ''
	}

	return `
    <section class="section work-section">
      <h3 class="section-title keep-with-next">Experience</h3>
      <div class="section-content">
        ${work.map(job => workItem(job)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual work item component
 */
function workItem(job) {
	const {position, name, url, startDate, endDate, summary, location, highlights = [], formattedDates} = job

	return `
    <div class="work-item section-item experience-item">
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
          <div class="work-location item-other-label">
            ${location || ''}
          </div>
        </div>
      </div>

      ${summary
			? `
        <div class="work-summary item-summary">
          <p>${summary}</p>
        </div>
      `
			: ''}

      ${highlights.length > 0
			? `
        <ul class="work-highlights item-list">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      `
			: ''}
    </div>
  `
}
