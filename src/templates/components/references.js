/**
 * References component
 */
export function references({references = []}) {
	if (references.length === 0) {
		return ''
	}

	return `
    <section class="resume-section references-section">
      <h3 class="section-title">References</h3>
      <div class="section-content">
        ${references.map(reference => referenceItem(reference)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual reference item component
 */
function referenceItem(reference) {
	const {name, reference: referenceText} = reference

	return `
    <div class="reference-item section-item">
      <h4 class="reference-name item-title">${name || ''}</h4>
      ${referenceText
			? `
        <blockquote class="reference-text">
          "${referenceText}"
        </blockquote>
      `
			: ''}
    </div>
  `
}
