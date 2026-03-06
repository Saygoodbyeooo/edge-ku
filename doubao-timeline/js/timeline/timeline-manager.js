/**
 * js/timeline/timeline-manager.js
 * TimelineManager – core logic for the doubao-timeline extension.
 *
 * Responsibilities:
 *  - Scan user messages in the conversation
 *  - Build and render the timeline bar (dots / compact lines)
 *  - Keep the active dot in sync with the viewport via scroll + IntersectionObserver
 *  - Handle SPA navigation (URL changes)
 *  - Expose collapse / expand functionality
 */

(function (global) {
  'use strict';

  /** Number of messages above which we switch to compact (line) mode. */
  const COMPACT_THRESHOLD = 20;
  /** Vertical spacing (px) between items in compact mode. */
  const LINE_ITEM_HEIGHT = 8;
  /** Debounce delay for MutationObserver reactions (ms). */
  const DEBOUNCE_MS = 500;
  /**
   * Delay (ms) before init runs after a navigation event.
   * Doubao is a SPA – we need to wait for the chat messages to render
   * before we can scan the DOM and build the timeline.
   */
  const INIT_DELAY_MS = 800;
  /** Tooltip id used with GlobalTooltipManager. */
  const TOOLTIP_ID = 'ait-timeline-tooltip';

  class TimelineManager {
    /**
     * @param {object} adapter - Site-specific adapter (e.g. DoubaoAdapter).
     */
    constructor(adapter) {
      this.adapter = adapter;

      /** @type {Array<{id: string, element: HTMLElement, text: string}>} */
      this.turns = [];
      /** @type {Set<string>} IDs of turns currently in the viewport */
      this.visibleTurns = new Set();
      /** @type {string|null} */
      this.activeTurnId = null;

      this._barEl = null;
      this._trackEl = null;
      this._nodesEl = null;
      this._toggleBtn = null;
      this._scrollContainer = null;
      this._collapsed = false;

      this._mutationObserver = null;
      this._intersectionObserver = null;
      this._debounceTimer = null;
      this._rafPending = false;

      // Bind handlers once so we can remove them later
      this._onScroll = this._onScroll.bind(this);
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Initialise the timeline: scan messages and render.
     * Delays slightly to allow the SPA page to paint its content.
     */
    init() {
      this.destroy();
      setTimeout(() => {
        this.scanMessages();
        if (this.turns.length > 0) {
          this.render();
          this.setupObservers();
        }
      }, INIT_DELAY_MS);
    }

    /** Remove the timeline from the DOM and clean up all listeners. */
    destroy() {
      this._unbindScroll();

      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
        this._mutationObserver = null;
      }
      if (this._intersectionObserver) {
        this._intersectionObserver.disconnect();
        this._intersectionObserver = null;
      }

      clearTimeout(this._debounceTimer);

      if (this._barEl) {
        this._barEl.remove();
        this._barEl = null;
      }

      if (global.GlobalTooltipManager) {
        global.GlobalTooltipManager.hide(TOOLTIP_ID);
      }

      this.turns = [];
      this.visibleTurns.clear();
      this.activeTurnId = null;
      this._trackEl = null;
      this._nodesEl = null;
      this._toggleBtn = null;
      this._scrollContainer = null;
    }

    /**
     * Scan the page for user messages and populate `this.turns`.
     */
    scanMessages() {
      const selector = this.adapter.getUserMessageSelector();
      const elements = Array.from(document.querySelectorAll(selector));

      this.turns = elements.map((el, idx) => ({
        id: `ait-turn-${idx}`,
        element: el,
        text: this.adapter.extractText(el),
      }));
    }

    /**
     * Build and insert the timeline bar into the DOM.
     */
    render() {
      // Remove any stale bar
      const existing = document.getElementById('ait-timeline-bar');
      if (existing) existing.remove();

      const useCompact = this.turns.length > COMPACT_THRESHOLD;

      // ── Bar ──
      const bar = document.createElement('div');
      bar.id = 'ait-timeline-bar';
      bar.className = 'ait-timeline-bar';
      if (this._collapsed) bar.classList.add('collapsed');
      this._barEl = bar;

      // ── Toggle button ──
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'ait-timeline-toggle';
      toggleBtn.title = this._collapsed ? '展开时间轴' : '收起时间轴';
      toggleBtn.innerHTML = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <polygon points="5,2 9,8 1,8"/>
      </svg>`;
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
      bar.appendChild(toggleBtn);
      this._toggleBtn = toggleBtn;

      if (useCompact) {
        this._renderCompact(bar);
      } else {
        this._renderTrack(bar);
      }

      document.body.appendChild(bar);

      // Set the initial scroll container reference
      if (this.turns.length > 0) {
        this._scrollContainer = this.adapter.findConversationContainer(
          this.turns[0].element
        );
      }

      this.updateActiveDot();
    }

    /**
     * Render dots along a proportional vertical track.
     * @param {HTMLElement} bar
     */
    _renderTrack(bar) {
      const track = document.createElement('div');
      track.className = 'ait-timeline-track';
      bar.appendChild(track);
      this._trackEl = track;
      this._nodesEl = null;

      this.turns.forEach((turn, idx) => {
        const node = document.createElement('div');
        node.className = 'ait-timeline-node';

        const pct = this.turns.length === 1 ? 50 : (idx / (this.turns.length - 1)) * 100;
        node.style.top = pct + '%';

        const dot = document.createElement('div');
        dot.className = 'ait-timeline-dot';
        dot.dataset.turnId = turn.id;

        this._attachDotEvents(dot, turn);

        node.appendChild(dot);
        track.appendChild(node);
      });
    }

    /**
     * Render compact horizontal lines in a scrollable nodes container.
     * @param {HTMLElement} bar
     */
    _renderCompact(bar) {
      const nodesEl = document.createElement('div');
      nodesEl.className = 'ait-timeline-nodes';
      nodesEl.style.position = 'relative';
      nodesEl.style.flex = '1';
      nodesEl.style.minHeight = (this.turns.length * LINE_ITEM_HEIGHT) + 'px';
      bar.appendChild(nodesEl);
      this._nodesEl = nodesEl;
      this._trackEl = null;

      this.turns.forEach((turn, idx) => {
        const line = document.createElement('div');
        line.className = 'timeline-compact-line';
        line.style.top = (idx * LINE_ITEM_HEIGHT) + 'px';
        line.dataset.turnId = turn.id;

        this._attachDotEvents(line, turn);

        nodesEl.appendChild(line);
      });
    }

    /**
     * Attach hover (tooltip) and click (scroll) events to a dot/line element.
     * @param {HTMLElement} dotEl
     * @param {{id: string, element: HTMLElement, text: string}} turn
     */
    _attachDotEvents(dotEl, turn) {
      dotEl.addEventListener('mouseenter', () => {
        if (global.GlobalTooltipManager) {
          global.GlobalTooltipManager.show(TOOLTIP_ID, 'dark', dotEl, turn.text);
        }
      });
      dotEl.addEventListener('mouseleave', () => {
        if (global.GlobalTooltipManager) {
          global.GlobalTooltipManager.hide(TOOLTIP_ID);
        }
      });
      dotEl.addEventListener('click', () => this.handleDotClick(turn.id));
    }

    /**
     * Smooth-scroll to the message for the given turn id.
     * @param {string} turnId
     */
    handleDotClick(turnId) {
      const turn = this.turns.find((t) => t.id === turnId);
      if (!turn) return;
      turn.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Update which dot is "active" based on the currently visible messages.
     * The active dot is the one whose message center is closest to the
     * vertical midpoint of the scroll container.
     */
    updateActiveDot() {
      if (!this._scrollContainer || this.turns.length === 0) return;

      const midY =
        this._scrollContainer.getBoundingClientRect().top +
        this._scrollContainer.clientHeight / 2;

      let bestTurnId = this.turns[0].id;
      let minDist = Infinity;

      this.turns.forEach((turn) => {
        const rect = turn.element.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - midY);
        if (dist < minDist) {
          minDist = dist;
          bestTurnId = turn.id;
        }
      });

      if (bestTurnId === this.activeTurnId) return;
      this.activeTurnId = bestTurnId;

      // Update DOM active states
      const container = this._trackEl || this._nodesEl;
      if (!container) return;

      const dotSelector = '.ait-timeline-dot, .timeline-compact-line';
      container.querySelectorAll(dotSelector).forEach((dotEl) => {
        dotEl.classList.toggle('active', dotEl.dataset.turnId === bestTurnId);
      });

      // Scroll the active dot into view within the timeline itself
      const activeDotEl = container.querySelector(
        `[data-turn-id="${bestTurnId}"]`
      );
      if (activeDotEl) {
        activeDotEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }

    // ─── Observers ───────────────────────────────────────────────────────────

    /**
     * Set up MutationObserver (to react to new messages) and
     * scroll listener (to keep active dot in sync).
     */
    setupObservers() {
      // MutationObserver: rebuild when the conversation DOM changes
      this._mutationObserver = new MutationObserver(() => {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
          this.scanMessages();
          if (this.turns.length > 0) {
            this.render();
            this.setupObservers();
          } else {
            this.destroy();
          }
        }, DEBOUNCE_MS);
      });
      this._mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Scroll listener: throttled via rAF
      this._bindScroll();
    }

    _bindScroll() {
      if (!this._scrollContainer) return;
      this._scrollContainer.addEventListener('scroll', this._onScroll, {
        passive: true,
      });
    }

    _unbindScroll() {
      if (this._scrollContainer) {
        this._scrollContainer.removeEventListener('scroll', this._onScroll);
      }
    }

    _onScroll() {
      if (this._rafPending) return;
      this._rafPending = true;
      requestAnimationFrame(() => {
        this._rafPending = false;
        this.updateActiveDot();
      });
    }

    // ─── URL / SPA ───────────────────────────────────────────────────────────

    /**
     * Called when the page URL changes (SPA navigation).
     * Tears down the current timeline and re-initialises if on a chat route.
     */
    handleUrlChange() {
      this.destroy();
      if (this.adapter.isConversationRoute(location.pathname)) {
        this.init();
      }
    }

    // ─── Collapse ────────────────────────────────────────────────────────────

    /**
     * Toggle the collapsed state of the timeline bar.
     */
    toggleCollapse() {
      this._collapsed = !this._collapsed;
      if (this._barEl) {
        this._barEl.classList.toggle('collapsed', this._collapsed);
      }
      if (this._toggleBtn) {
        this._toggleBtn.title = this._collapsed ? '展开时间轴' : '收起时间轴';
      }
    }
  }

  global.TimelineManager = TimelineManager;
})(window);
