/**
 * Header component with contact information
 */
import {icon} from '../utils/helpers.js'

export function header({basics = {}}) {
	const {name, label, email, phone, url, location = {}, profiles = []} = basics

	return `
    <header class="resume-header">
      ${basics.image
			? `
        <div class="profile-image">
          <img src="${basics.image}" alt="${name}" class="profile-photo">
        </div>
      `
			: ''}

      <div class="header-content">
        <h1 class="name">${name || ''}</h1>
        ${label ? `<h2 class="title">${label}</h2>` : ''}

        <div class="contact-info">
          ${email
				? `
            <a href="mailto:${email}" class="contact-item">
              <span class="contact-label icon">${icon('mail')}</span>
              <span class="contact-value">${email}</span>
            </a>
          `
				: ''}

          ${phone
				? `
            <div class="contact-item">
              <span class="contact-label icon">${icon('phone')}</span>
              <span class="contact-value">${phone}</span>
            </div>
          `
				: ''}

          ${url
				? `
            <div class="contact-item">
              <span class="contact-label icon">${icon('globe')}</span>
              <a href="${url}" class="contact-value" target="_blank">${url}</a>
            </div>
          `
				: ''}

          ${location.city || location.region
				? `
            <div class="contact-item">
              <span class="contact-label icon">${icon('map-pin')}</span>
              <span class="contact-value">
                ${[location.city, location.region, location.countryCode].filter(Boolean).join(', ')}
              </span>
            </div>
          `
				: ''}
        </div>

        ${profiles.length > 0
			? `
          <div class="social-profiles">
            ${profiles.map(profile => `
              <a href="${profile.url}" class="profile-link" target="_blank">
                <span class="icon icon-${profile.network} profile-network">${icon(profile.network)}</span>
                <span class="profile-username">${profile.username ? ` ${profile.username}` : ''}</span>
              </a>
            `).join('')}
          </div>
        `
			: ''}
      </div>
    </header>
  `
}
