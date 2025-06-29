/**
 * Languages component
 */
export function languages({languages = []}) {
	if (languages.length === 0) {
		return ''
	}

	return `
    <section class="section languages-section">
      <h3 class="section-title">Languages</h3>
      <div class="section-content">
        ${languages.map(lang => `
          <div class="language-item section-item">
            <h4 class="language-name item-title">${lang.language || ''}</h4>
            ${lang.fluency ? `<div class="language-fluency item-other-label">${lang.fluency}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}
