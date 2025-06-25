/**
 * Summary component
 */
export function Summary({ basics = {} }) {
  if (!basics.summary) return '';

  return `
    <section class="section summary-section page-break-inside-avoid">
      <h3 class="section-title keep-with-next">Summary</h3>
      <div class="section-content">
        <p class="summary-text">${basics.summary}</p>
      </div>
    </section>
  `;
}