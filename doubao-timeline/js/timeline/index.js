/**
 * js/timeline/index.js
 * Main entry point for the doubao-timeline extension.
 *
 * - Verifies that the current site is doubao.com
 * - Initialises TimelineManager with the DoubaoAdapter
 * - Patches history methods to catch SPA navigation
 * - Retries init if necessary (e.g. chat not yet loaded)
 */

(function () {
  'use strict';

  // Guard: only run on doubao.com
  if (!window.DoubaoAdapter || !window.DoubaoAdapter.matches(location.href)) {
    return;
  }

  // Guard: require dependencies
  if (!window.TimelineManager || !window.GlobalTooltipManager) {
    console.warn('[doubao-timeline] Missing dependencies, aborting.');
    return;
  }

  /** Singleton TimelineManager instance. */
  let manager = null;

  /** The last seen URL, used to detect SPA navigation. */
  let lastUrl = location.href;

  /**
   * Create the manager (if needed) and initialise the timeline.
   * Only acts when we are on a /chat/ route.
   */
  function maybeInit() {
    if (!window.DoubaoAdapter.isConversationRoute(location.pathname)) {
      // Not a chat page – tear down if something was rendered
      if (manager) {
        manager.destroy();
      }
      return;
    }

    if (!manager) {
      manager = new window.TimelineManager(window.DoubaoAdapter);
    }
    manager.init();
  }

  /**
   * Handle a URL change (SPA navigation).
   */
  function handleNavigation() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    if (manager) {
      manager.handleUrlChange();
    } else {
      maybeInit();
    }
  }

  // ─── Patch SPA navigation ─────────────────────────────────────────────────

  ['pushState', 'replaceState'].forEach((method) => {
    const original = history[method];
    history[method] = function (...args) {
      original.apply(this, args);
      handleNavigation();
    };
  });

  window.addEventListener('popstate', handleNavigation);

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInit);
  } else {
    maybeInit();
  }
})();
