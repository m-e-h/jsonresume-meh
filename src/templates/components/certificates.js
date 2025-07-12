import {formatDate} from '../utils/helpers.js'

/**
 * Certificates component
 */
export function certificates({certificates = []}) {
	if (certificates.length === 0) {
		return ''
	}

	return `
    <section class="resume-section certificates-section">
      <h3 class="section-title">Certifications</h3>
      <div class="section-content">
        ${certificates.map(cert => `
          <div class="certificate-item section-item">
            <div class="certificate-details item-header">
              <div class="item-header-left">
                <h4 class="certificate-name item-title">
                  ${cert.url ? `<a href="${cert.url}" target="_blank">${cert.name}</a>` : cert.name}
                </h4>
                ${cert.issuer ? `<span class="certificate-issuer item-subtitle">${cert.issuer}</span>` : ''}
              </div>
              <div class="item-header-right">
                ${cert.date ? `<span class="certificate-date item-dates">${formatDate(cert.date)}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `
}
