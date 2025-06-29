/**
 * Skills component
 */
export function skills({skills = []}) {
	if (skills.length === 0) {
		return ''
	}

	return `
    <section class="section skills-section">
      <h3 class="section-title">Skills</h3>
      <div class="section-content">
        ${skills.map(skill => SkillItem(skill)).join('')}
      </div>
    </section>
  `
}

/**
 * Individual skill item component
 */
function SkillItem(skill) {
	const {name, level, keywords = []} = skill

	return `
    <div class="skill-item">
      <div class="skill-header">
        <h4 class="skill-name">${name || ''}</h4>
        ${level ? `<span class="skill-level">${level}</span>` : ''}
      </div>
      ${keywords.length > 0
			? `
        <div class="skill-keywords">
          ${keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
        </div>
      `
			: ''}
    </div>
  `
}
