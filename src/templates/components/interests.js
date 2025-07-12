/**
 * Interests component
 */
export function interests({interests = []}) {
	if (interests.length === 0) {
		return ''
	}

	return `
    <section class="resume-section interests-section">
      <h3 class="section-title">Interests</h3>
      <div class="section-content">
        ${interests.map(interest => `
          <div class="interest-item section-item">
            <h4 class="interest-name item-title">${interest.name || ''}</h4>
            ${interest.keywords && interest.keywords.length > 0
				? `
              <div class="interest-keywords">
                ${interest.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
              </div>
            `
				: ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}
