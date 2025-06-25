/**
 * References component
 */
export function References({ references = [] }) {
  if (!references.length) return '';

  return `
    <section class="section references-section">
      <h3 class="section-title">References</h3>
      <div class="section-content">
        ${references.map(reference => ReferenceItem(reference)).join('')}
      </div>
    </section>
  `;
}

/**
 * Individual reference item component
 */
function ReferenceItem(reference) {
  const { name, reference: referenceText } = reference;

  return `
    <div class="reference-item section-item page-break-inside-avoid">
      <h4 class="reference-name item-title">${name || ''}</h4>
      ${referenceText ? `
        <blockquote class="reference-text">
          "${referenceText}"
        </blockquote>
      ` : ''}
    </div>
  `;
}