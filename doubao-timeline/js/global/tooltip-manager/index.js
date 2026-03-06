/**
 * js/global/tooltip-manager/index.js
 * GlobalTooltipManager – shared tooltip component for the doubao-timeline extension.
 *
 * Usage:
 *   window.GlobalTooltipManager.show('my-id', 'dark', targetElement, 'Tooltip text');
 *   window.GlobalTooltipManager.hide('my-id');
 */

(function (global) {
  'use strict';

  /** Map of id → tooltip DOM element */
  const tooltips = new Map();

  /**
   * Create or retrieve the tooltip DOM element for the given id.
   * @param {string} id  - Unique identifier for this tooltip instance.
   * @param {string} type - Theme type ('dark' or 'light').
   * @returns {HTMLElement}
   */
  function getOrCreate(id, type) {
    if (tooltips.has(id)) return tooltips.get(id);

    const el = document.createElement('div');
    el.className = `timeline-tooltip-base timeline-tooltip-${type}`;
    el.dataset.tooltipId = id;
    document.body.appendChild(el);
    tooltips.set(id, el);
    return el;
  }

  /**
   * Determine the best placement for a tooltip given the target element rect.
   * Prefers placing the tooltip to the LEFT of the target (for right-side timeline).
   * Falls back to right, above, or below if there's insufficient space.
   *
   * @param {DOMRect} targetRect
   * @param {number} tooltipWidth
   * @param {number} tooltipHeight
   * @returns {{ top: number, left: number, arrowClass: string }}
   */
  function computePosition(targetRect, tooltipWidth, tooltipHeight) {
    const GAP = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Try left
    if (targetRect.left - tooltipWidth - GAP > 0) {
      const top = Math.max(
        GAP,
        Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          vh - tooltipHeight - GAP
        )
      );
      return {
        top,
        left: targetRect.left - tooltipWidth - GAP,
        arrowClass: 'arrow-right',
      };
    }

    // Try right
    if (targetRect.right + tooltipWidth + GAP < vw) {
      const top = Math.max(
        GAP,
        Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          vh - tooltipHeight - GAP
        )
      );
      return {
        top,
        left: targetRect.right + GAP,
        arrowClass: 'arrow-left',
      };
    }

    // Try above
    if (targetRect.top - tooltipHeight - GAP > 0) {
      const left = Math.max(
        GAP,
        Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          vw - tooltipWidth - GAP
        )
      );
      return {
        top: targetRect.top - tooltipHeight - GAP,
        left,
        arrowClass: 'arrow-down',
      };
    }

    // Fallback: below
    const left = Math.max(
      GAP,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        vw - tooltipWidth - GAP
      )
    );
    return {
      top: targetRect.bottom + GAP,
      left,
      arrowClass: 'arrow-up',
    };
  }

  /**
   * Show a tooltip next to the given target element.
   *
   * @param {string}      id      - Unique tooltip id.
   * @param {string}      type    - Theme type ('dark').
   * @param {HTMLElement} target  - The element the tooltip should point to.
   * @param {string}      content - Text content to display.
   */
  function show(id, type, target, content) {
    const el = getOrCreate(id, type);

    // Remove previous arrow classes
    el.classList.remove('arrow-right', 'arrow-left', 'arrow-up', 'arrow-down');

    // Set content (temporarily off-screen to measure)
    el.textContent = content;
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
    el.classList.remove('visible');
    el.style.top = '-9999px';
    el.style.left = '-9999px';

    // Force layout to get dimensions
    const tooltipWidth = el.offsetWidth;
    const tooltipHeight = el.offsetHeight;

    const targetRect = target.getBoundingClientRect();
    const { top, left, arrowClass } = computePosition(targetRect, tooltipWidth, tooltipHeight);

    el.style.top = top + 'px';
    el.style.left = left + 'px';
    el.classList.add(arrowClass);
    el.style.visibility = '';
    el.classList.add('visible');
  }

  /**
   * Hide the tooltip with the given id.
   * @param {string} id
   */
  function hide(id) {
    const el = tooltips.get(id);
    if (el) {
      el.classList.remove('visible');
    }
  }

  /**
   * Remove all tooltips from the DOM (called on URL change).
   */
  function destroyAll() {
    tooltips.forEach((el) => el.remove());
    tooltips.clear();
  }

  // Clean up tooltips on SPA navigation by patching history methods.
  // We use the same technique as timeline/index.js to avoid polling overhead.
  let _lastUrl = location.href;
  function _handleUrlChange() {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      destroyAll();
    }
  }

  ['pushState', 'replaceState'].forEach((method) => {
    const _original = history[method];
    history[method] = function (...args) {
      _original.apply(this, args);
      _handleUrlChange();
    };
  });

  window.addEventListener('popstate', _handleUrlChange);

  // Expose as a global singleton
  global.GlobalTooltipManager = { show, hide, destroyAll };
})(window);
