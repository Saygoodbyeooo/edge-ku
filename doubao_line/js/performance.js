/**
 * performance.js – Doubao DOM recycling & performance optimiser
 *
 * When a conversation grows beyond 30 messages, Doubao can become sluggish,
 * especially while the AI is generating a response.  This script:
 *
 *  1. Finds the scroll container (nearest overflow:auto/scroll ancestor of the
 *     first user-message element).
 *  2. On every scroll event (throttled via requestAnimationFrame), identifies
 *     messages that are outside a 2-viewport buffer zone above and below the
 *     visible area.
 *  3. "Recycles" those distant message nodes by saving their innerHTML to a
 *     Map, collapsing their content, and preserving their layout height via
 *     minHeight.
 *  4. Restores nodes as they scroll back into the buffer zone.
 *  5. Pauses all recycling while the AI is generating (break-btn present).
 */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  const USER_MSG_SEL = '[data-testid="send_message"]';
  /** Selector for AI reply messages (adjust if doubao DOM changes). */
  const AI_MSG_SEL = '[data-testid="receive_message"]';
  const BREAK_BTN_SEL = '[class*="break-btn-"]';
  const RECYCLED_ATTR = 'data-doubao-recycled';
  /** Minimum conversation count before recycling activates. */
  const MIN_MSGS = 30;
  /** Number of viewport-heights to keep as buffer above & below visible area. */
  const BUFFER_VH = 2;

  // ─── State ─────────────────────────────────────────────────────────────────
  /** Map<Element, string> – saved innerHTML for recycled nodes. */
  const savedContent = new Map();
  let scrollContainer = null;
  let rafPending = false;
  let observer = null;
  let debounceTimer = null;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Return true when the AI is currently generating a response. */
  function isAiGenerating() {
    return document.querySelector(BREAK_BTN_SEL) !== null;
  }

  /**
   * Walk up from startEl to find the nearest ancestor with
   * overflow auto or scroll (the scroll container).
   */
  function findScrollContainer(startEl) {
    let el = startEl.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      if (/auto|scroll/.test(style.overflow + style.overflowY)) return el;
      el = el.parentElement;
    }
    return document.documentElement;
  }

  /** Return all message elements (both user and AI). */
  function getAllMessages() {
    const user = Array.from(document.querySelectorAll(USER_MSG_SEL));
    const ai = Array.from(document.querySelectorAll(AI_MSG_SEL));
    // Sort by document order
    return [...user, ...ai].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
  }

  // ─── Recycling ─────────────────────────────────────────────────────────────

  function recycleElement(el) {
    if (el.getAttribute(RECYCLED_ATTR) === 'true') return;
    const height = el.getBoundingClientRect().height;
    if (height === 0) return; // skip elements with no height
    savedContent.set(el, el.innerHTML);
    el.innerHTML = '';
    el.style.minHeight = height + 'px';
    el.setAttribute(RECYCLED_ATTR, 'true');
  }

  function restoreElement(el) {
    if (el.getAttribute(RECYCLED_ATTR) !== 'true') return;
    const html = savedContent.get(el);
    if (html === undefined) return;
    el.innerHTML = html;
    el.style.minHeight = '';
    el.removeAttribute(RECYCLED_ATTR);
    savedContent.delete(el);
  }

  // ─── Main recycle pass ─────────────────────────────────────────────────────

  function runRecycle() {
    if (!scrollContainer) return;
    if (isAiGenerating()) return;

    const messages = getAllMessages();
    if (messages.length <= MIN_MSGS) {
      // Restore everything if we dropped below threshold
      messages.forEach(restoreElement);
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const vh = scrollContainer.clientHeight;
    const bufferPx = BUFFER_VH * vh;

    // Visible range in viewport coordinates (relative to container top)
    const visTop = containerRect.top;
    const visBottom = containerRect.bottom;

    messages.forEach((el) => {
      const rect = el.getBoundingClientRect();

      // Is this element within the buffer zone?
      const inBuffer =
        rect.bottom >= visTop - bufferPx &&
        rect.top <= visBottom + bufferPx;

      if (inBuffer) {
        restoreElement(el);
      } else {
        recycleElement(el);
      }
    });
  }

  function scheduleRecycle() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      runRecycle();
    });
  }

  // ─── Scroll binding ────────────────────────────────────────────────────────

  function bindScroll(container) {
    container.addEventListener('scroll', scheduleRecycle, { passive: true });
  }

  function unbindScroll(container) {
    if (container) container.removeEventListener('scroll', scheduleRecycle);
  }

  // ─── Observer for new messages ─────────────────────────────────────────────

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(init, 800);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Init / teardown ───────────────────────────────────────────────────────

  function teardown() {
    unbindScroll(scrollContainer);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(debounceTimer);
    // Restore all recycled nodes
    savedContent.forEach((html, el) => {
      el.innerHTML = html;
      el.style.minHeight = '';
      el.removeAttribute(RECYCLED_ATTR);
    });
    savedContent.clear();
    scrollContainer = null;
  }

  function init() {
    // Only activate on /chat/ pages
    if (!location.pathname.includes('/chat/')) return;

    const firstMsg = document.querySelector(USER_MSG_SEL);
    if (!firstMsg) return;

    const newContainer = findScrollContainer(firstMsg);
    if (newContainer !== scrollContainer) {
      unbindScroll(scrollContainer);
      scrollContainer = newContainer;
      bindScroll(scrollContainer);
    }

    scheduleRecycle();
  }

  // ─── SPA navigation hook ───────────────────────────────────────────────────

  let lastUrl = location.href;

  function handleNavigation() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      teardown();
      setTimeout(init, 800);
    }
  }

  ['pushState', 'replaceState'].forEach((method) => {
    const original = history[method];
    history[method] = function (...args) {
      original.apply(this, args);
      handleNavigation();
    };
  });

  window.addEventListener('popstate', handleNavigation);

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  function bootstrap() {
    init();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
