/**
 * timeline.js – Doubao conversation timeline navigation
 *
 * Renders a fixed vertical timeline on the right side of doubao.com chat pages.
 * Each user message becomes a dot; clicking it smooth-scrolls to that message.
 * The dot for the currently visible message is highlighted (active).
 *
 * Handles:
 *  - SPA navigation (history.pushState / replaceState + popstate)
 *  - Reverse-scroll layout (scrollTop is negative / 0 at bottom)
 *  - MutationObserver with debounce for dynamic messages
 *  - Scroll synchronisation with throttle via requestAnimationFrame
 *  - Tooltip showing first 30 chars of the message
 *  - Collapse / expand toggle button
 */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  const USER_MSG_SEL = '[data-testid="send_message"]';
  const MSG_TEXT_SEL = '[data-testid="message_text_content"]';
  const HOST_ID = 'doubao-timeline-host';
  const TOOLTIP_CLASS = 'doubao-dot-tooltip';
  const DEBOUNCE_MS = 500;
  const TIMELINE_THRESHOLD = 20;

  // ─── State ─────────────────────────────────────────────────────────────────
  let host = null;
  let dotsContainer = null;
  let tooltip = null;
  let scrollContainer = null;
  let observer = null;
  let debounceTimer = null;
  let rafPending = false;
  let collapsed = false;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Return the text summary (≤30 chars) for a user-message element. */
  function getSummary(msgEl) {
    const textEl = msgEl.querySelector(MSG_TEXT_SEL);
    const raw = textEl ? textEl.textContent.trim() : msgEl.textContent.trim();
    return raw.length > 30 ? raw.slice(0, 30) + '…' : raw;
  }

  /**
   * Walk up from a user-message element to find the scroll container
   * (the nearest ancestor with overflow auto or scroll).
   */
  function findScrollContainer(startEl) {
    let el = startEl.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const overflow = style.overflow + style.overflowY;
      if (/auto|scroll/.test(overflow)) return el;
      el = el.parentElement;
    }
    return document.documentElement;
  }

  // ─── Tooltip ───────────────────────────────────────────────────────────────

  function createTooltip() {
    const el = document.createElement('div');
    el.className = TOOLTIP_CLASS;
    document.body.appendChild(el);
    return el;
  }

  function showTooltip(text, dotEl) {
    if (!tooltip) return;
    tooltip.textContent = text;
    const rect = dotEl.getBoundingClientRect();
    tooltip.style.top = rect.top + 'px';
    tooltip.style.left = (rect.left - 210) + 'px';
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove('visible');
  }

  // ─── Timeline rendering ────────────────────────────────────────────────────

  function buildTimeline() {
    // Clean up any existing host
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();

    // Only render inside /chat/ routes
    if (!location.pathname.includes('/chat/')) return;

    const messages = Array.from(document.querySelectorAll(USER_MSG_SEL));
    if (messages.length === 0) return;

    // Identify scroll container from first message
    scrollContainer = findScrollContainer(messages[0]);

    // Build host
    host = document.createElement('div');
    host.id = HOST_ID;
    if (collapsed) host.classList.add('collapsed');

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'doubao-timeline-toggle';
    toggleBtn.title = collapsed ? '展开时间线' : '收起时间线';
    toggleBtn.innerHTML = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,2 9,8 1,8"/>
    </svg>`;
    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      host.classList.toggle('collapsed', collapsed);
      toggleBtn.title = collapsed ? '展开时间线' : '收起时间线';
    });
    host.appendChild(toggleBtn);

    // Vertical line
    const line = document.createElement('div');
    line.id = 'doubao-timeline-line';
    host.appendChild(line);

    // Dots container
    dotsContainer = document.createElement('div');
    dotsContainer.id = 'doubao-timeline-dots';
    host.appendChild(dotsContainer);

    document.body.appendChild(host);

    renderDots(messages);
    bindScroll();
    updateActiveDot();
  }

  function renderDots(messages) {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    const dotClass = messages.length > TIMELINE_THRESHOLD ? 'doubao-line' : 'doubao-dot';

    messages.forEach((msgEl, idx) => {
      const dot = document.createElement('div');
      dot.className = dotClass;

      // Position proportionally along the timeline
      const pct = messages.length === 1 ? 0.5 : idx / (messages.length - 1);
      dot.style.top = (pct * 100) + '%';

      const summary = getSummary(msgEl);

      dot.addEventListener('mouseenter', () => showTooltip(summary, dot));
      dot.addEventListener('mouseleave', hideTooltip);
      dot.addEventListener('click', () => {
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      dot.dataset.idx = idx;
      dotsContainer.appendChild(dot);
    });
  }

  // ─── Active dot update ─────────────────────────────────────────────────────

  function updateActiveDot() {
    if (!dotsContainer || !scrollContainer) return;

    const messages = Array.from(document.querySelectorAll(USER_MSG_SEL));
    if (messages.length === 0) return;

    const viewportTop = scrollContainer.getBoundingClientRect().top;
    const viewportBottom = viewportTop + scrollContainer.clientHeight;
    const midY = viewportTop + scrollContainer.clientHeight / 2;

    let activeIdx = 0;
    let minDist = Infinity;

    messages.forEach((msgEl, idx) => {
      const rect = msgEl.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(centerY - midY);
      if (dist < minDist) {
        minDist = dist;
        activeIdx = idx;
      }
    });

    const dots = dotsContainer.querySelectorAll('.doubao-dot, .doubao-line');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIdx);
    });
  }

  // ─── Scroll handling ───────────────────────────────────────────────────────

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      updateActiveDot();
    });
  }

  function bindScroll() {
    if (!scrollContainer) return;
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
  }

  function unbindScroll() {
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', onScroll);
    }
  }

  // ─── MutationObserver ──────────────────────────────────────────────────────

  function startObserver() {
    if (observer) observer.disconnect();

    const target = document.body;
    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(buildTimeline, DEBOUNCE_MS);
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  // ─── Init / teardown ───────────────────────────────────────────────────────

  function init() {
    unbindScroll();
    if (observer) observer.disconnect();
    clearTimeout(debounceTimer);

    if (!tooltip) tooltip = createTooltip();

    // Delay to allow the page to render messages
    setTimeout(() => {
      buildTimeline();
      startObserver();
    }, 800);
  }

  function teardown() {
    unbindScroll();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    host = null;
    dotsContainer = null;
    scrollContainer = null;
  }

  // ─── SPA navigation hook ───────────────────────────────────────────────────

  let lastUrl = location.href;

  function handleNavigation() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      teardown();
      init();
    }
  }

  // Patch history methods
  ['pushState', 'replaceState'].forEach((method) => {
    const original = history[method];
    history[method] = function (...args) {
      original.apply(this, args);
      handleNavigation();
    };
  });

  window.addEventListener('popstate', handleNavigation);

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
