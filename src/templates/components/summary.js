/**
 * Summary component
 */
export function summary({basics = {}}) {
	if (!basics.summary) {
		return ''
	}

	return `
    <section class="section summary-section">
      <h3 class="section-title">Summary</h3>
      <div class="section-content">
        <p class="summary-text">${basics.summary}</p>
      </div>
    </section>
  `
}
