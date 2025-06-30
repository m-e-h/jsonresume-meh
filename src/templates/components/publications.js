import {formatDate} from '../utils/helpers.js'

/**
 * Publications component
 */
export function publications({publications = []}) {
	if (publications.length === 0) {
		return ''
	}

	return `
    <section class="section publications-section">
      <h3 class="section-title">Publications</h3>
      <div class="section-content">
        ${publications.map(pub => `
          <div class="publication-item section-item">
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
            ${pub.summary ? `<p class="publication-summary item-summary">${pub.summary}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}
