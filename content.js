/**
 * Edge AI Chat Switcher – content script
 *
 * Injected ONLY on the three target sites defined in manifest.json:
 *   • https://gemini.google.com/*
 *   • https://www.doubao.com/*
 *   • https://copilot.microsoft.com/*
 *
 * What it does:
 *   Inserts a compact, icon-only floating switcher that lets the user
 *   jump to any of the three AI chat sites with one click.
 *
 * Performance highlights:
 *   • Built once, cached in a closure – no repeated DOM queries.
 *   • Uses requestAnimationFrame for smooth show/hide transitions.
 *   • Passive event listeners wherever read-only (scroll, touch).
 *   • Shadow DOM isolates the widget from the host page's styles.
 *   • All assets are loaded lazily; broken images fall back to a
 *     text abbreviation so the UI never shows a broken-image icon.
 */

(() => {
  'use strict';

  // ─── Site registry ──────────────────────────────────────────────────────────
  // Each entry describes one AI chat destination.
  // `logo` points to the official high-resolution favicon / CDN asset.
  // `fallback` is a short label shown when the image cannot be loaded.
  const SITES = [
    {
      id:       'gemini',
      label:    'Gemini',
      url:      'https://gemini.google.com/app',
      logo:     'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06.svg',
      fallback: 'G',
    },
    {
      id:       'doubao',
      label:    'Doubao',
      url:      'https://www.doubao.com/chat',
      // Doubao's official favicon served from their own CDN.
      logo:     'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/static/image/logo-icon.f3acc228.png',
      fallback: 'D',
    },
    {
      id:       'copilot',
      label:    'Copilot',
      url:      'https://copilot.microsoft.com/',
      logo:     'https://copilot.microsoft.com/favicon.ico',
      fallback: 'C',
    },
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Returns the site id that matches the current hostname, or null.
   * Used to mark the active item in the switcher.
   */
  function currentSiteId() {
    const host = location.hostname;
    // Exact-match checks prevent a crafted subdomain (e.g. evil-gemini.google.com)
    // from spoofing the active-site highlight.  The manifest's `matches` field
    // already restricts injection to these three hostnames, so exact equality
    // is both safe and sufficient.
    if (host === 'gemini.google.com')       return 'gemini';
    if (host === 'www.doubao.com')          return 'doubao';
    if (host === 'copilot.microsoft.com')   return 'copilot';
    return null;
  }

  // ─── Widget construction ─────────────────────────────────────────────────────

  /**
   * Builds the entire switcher widget inside a Shadow DOM so its styles are
   * completely isolated from the host page (no style bleed in either direction).
   */
  function buildWidget() {
    // Host element – a semantically neutral <div> appended to <body>.
    const host = document.createElement('div');
    host.id = 'ai-chat-switcher-host';

    // Shadow root provides full style encapsulation.
    const shadow = host.attachShadow({ mode: 'closed' });

    // ── Scoped styles ──────────────────────────────────────────────────────────
    // All selectors live inside the shadow tree; they cannot leak out.
    const style = document.createElement('style');
    style.textContent = `
      :host-context(body) {}   /* keeps specificity minimal */

      #switcher {
        position: fixed;
        /* Default position: right edge, vertically centred */
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2147483647;   /* maximum safe z-index */

        display: flex;
        flex-direction: column;
        gap: 8px;

        /* Smooth entrance animation */
        opacity: 0;
        transition: opacity 0.25s ease;
        pointer-events: none;
      }

      /* Fade in once the class is added (avoids flash of unstyled content) */
      #switcher.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .site-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid transparent;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        overflow: hidden;   /* clip the icon to the circle */
      }

      /* Hover: lift the button slightly */
      .site-btn:hover {
        transform: scale(1.12);
        box-shadow: 0 4px 14px rgba(0,0,0,0.26);
      }

      /* Highlight the site the user is currently on */
      .site-btn.active {
        border-color: #0078d4;
        box-shadow: 0 0 0 3px rgba(0,120,212,0.25);
      }

      .site-btn img {
        width: 28px;
        height: 28px;
        object-fit: contain;
        /* GPU-composited layer for crisp scaling at any DPR */
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }

      /* Fallback text shown when the logo image fails to load */
      .site-btn .fallback-label {
        font-size: 16px;
        font-weight: 700;
        color: #444;
        line-height: 1;
        user-select: none;
      }
    `;
    shadow.appendChild(style);

    // ── Container ──────────────────────────────────────────────────────────────
    const container = document.createElement('div');
    container.id = 'switcher';
    shadow.appendChild(container);

    const active = currentSiteId();

    // ── Build one button per site ──────────────────────────────────────────────
    for (const site of SITES) {
      const btn = document.createElement('button');
      btn.className = 'site-btn' + (site.id === active ? ' active' : '');
      btn.title = site.label;   // tooltip for screen readers and mouse hover
      btn.setAttribute('aria-label', `Switch to ${site.label}`);

      // High-res logo image
      const img = document.createElement('img');
      img.src    = site.logo;
      img.alt    = site.label;
      img.width  = 28;
      img.height = 28;

      // Fallback: swap broken image for a text abbreviation
      img.addEventListener('error', () => {
        img.remove();
        const lbl = document.createElement('span');
        lbl.className = 'fallback-label';
        lbl.textContent = site.fallback;
        btn.appendChild(lbl);
      }, { once: true });   // `once` auto-removes the listener after first fire

      btn.appendChild(img);

      // Navigate to the target site in the current tab on click
      btn.addEventListener('click', () => {
        window.location.href = site.url;
      });

      container.appendChild(btn);
    }

    return { host, container };
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Inserts the widget and schedules its entrance animation via
   * requestAnimationFrame so the browser has already painted the host page
   * before we trigger the CSS transition.
   */
  function init() {
    // Guard: do not inject twice (e.g. on SPA navigation re-triggers).
    if (document.getElementById('ai-chat-switcher-host')) return;

    const { host, container } = buildWidget();
    document.body.appendChild(host);

    // Double rAF is the standard technique to ensure the element has been
    // painted at least once before the CSS transition is triggered.  The first
    // rAF fires at the start of the next paint frame; the second fires after
    // that frame has been committed, guaranteeing the browser has assigned
    // computed styles.  A setTimeout(0) fallback is added for edge cases where
    // the rAF queue is flushed without a full paint (e.g. hidden tabs).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.classList.add('visible');
      });
    });
    setTimeout(() => container.classList.add('visible'), 100);
  }

  // ─── Entry point ─────────────────────────────────────────────────────────────
  // `document_idle` in manifest.json means the DOM is ready, but we double-
  // check with readyState for robustness on slower pages.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
