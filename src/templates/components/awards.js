import {formatDate} from '../utils/helpers.js'

/**
 * Awards component
 */
export function awards({awards = []}) {
	if (awards.length === 0) {
		return ''
	}

	return `
    <section class="section awards-section">
      <h3 class="section-title">Awards & Recognition</h3>
      <div class="section-content">
        ${awards.map(award => `
          <div class="award-item section-item">
            <div class="award-details item-header">
              <div class="item-header-left">
                <h4 class="award-title item-title">${award.title || ''}</h4>
                ${award.awarder ? `<span class="award-awarder item-subtitle">${award.awarder}</span>` : ''}
              </div>
              <div class="item-header-right">
                ${award.date ? `<span class="award-date item-dates">${formatDate(award.date)}</span>` : ''}
              </div>
            </div>
            ${award.summary ? `<p class="award-summary item-summary">${award.summary}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}
