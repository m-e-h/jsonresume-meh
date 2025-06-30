import {formatDateRange} from '../utils/helpers.js'

/**
 * Volunteer Experience component
 */
export function volunteerExperience({volunteer = []}) {
	if (volunteer.length === 0) {
		return ''
	}

	return `
    <section class="section volunteer-section">
      <h3 class="section-title">Contributions</h3>
      <div class="section-content">
        ${volunteer.map(vol => volunteerItem(vol)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual volunteer item component
 */
function volunteerItem(vol) {
	const {organization, position, url, summary, highlights = [], formattedDates} = vol

	return `
    <div class="volunteer-item section-item">
      <div class="volunteer-header item-header">
        <div class="item-header-left">
          <h4 class="volunteer-position item-title">${position || ''}</h4>
          <div class="volunteer-organization item-subtitle">
            ${url ? `<a href="${url}" target="_blank">${organization}</a>` : organization}
          </div>
        </div>
        <div class="item-header-right">
          <div class="volunteer-dates item-dates">
            ${formattedDates}
          </div>
        </div>
      </div>

      ${summary
			? `
        <div class="volunteer-summary item-summary">
          <p>${summary}</p>
        </div>
      `
			: ''}

      ${highlights.length > 0
			? `
        <ul class="volunteer-highlights item-list">
          ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
        </ul>
      `
			: ''}
    </div>
  `
}
