/**
 * js/timeline/adapters/doubao.js
 * Adapter for doubao.com.
 *
 * Implements the adapter interface expected by TimelineManager:
 *   matches, getUserMessageSelector, extractText, getTextContainer,
 *   isConversationRoute, extractConversationId,
 *   findConversationContainer, getTimelinePosition, isAIGenerating
 */

(function (global) {
  'use strict';

  /** Maximum number of characters to show in the tooltip summary. */
  const MAX_TOOLTIP_TEXT_LENGTH = 50;

  const DoubaoAdapter = {
    /**
     * Returns true if the current page is doubao.com.
     * @param {string} url
     * @returns {boolean}
     */
    matches(url) {
      return /^https?:\/\/(www\.)?doubao\.com\//.test(url);
    },

    /**
     * CSS selector for user-sent messages.
     * @returns {string}
     */
    getUserMessageSelector() {
      return '[data-testid="send_message"]';
    },

    /**
     * Extract the display text from a user-message element.
     * @param {HTMLElement} element
     * @returns {string}
     */
    extractText(element) {
      const textEl = element.querySelector('[data-testid="message_text_content"]');
      const raw = textEl ? textEl.textContent.trim() : element.textContent.trim();
      return raw.length > MAX_TOOLTIP_TEXT_LENGTH ? raw.slice(0, MAX_TOOLTIP_TEXT_LENGTH) + '…' : raw;
    },

    /**
     * Return the inner text container element for a user message.
     * @param {HTMLElement} element
     * @returns {HTMLElement}
     */
    getTextContainer(element) {
      return element.querySelector('[data-testid="message_text_content"]') || element;
    },

    /**
     * Returns true when the current pathname is a conversation route.
     * @param {string} pathname
     * @returns {boolean}
     */
    isConversationRoute(pathname) {
      return pathname.includes('/chat/');
    },

    /**
     * Extract a conversation ID from the current pathname.
     * e.g. /chat/7391234567890 → '7391234567890'
     * @param {string} pathname
     * @returns {string|null}
     */
    extractConversationId(pathname) {
      const match = pathname.match(/\/chat\/([^/?#]+)/);
      return match ? match[1] : null;
    },

    /**
     * Given the first user-message element, walk up the DOM to find the
     * nearest scrollable conversation container.
     * @param {HTMLElement} firstMessage
     * @returns {HTMLElement}
     */
    findConversationContainer(firstMessage) {
      let el = firstMessage.parentElement;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflow = style.overflow + style.overflowY;
        if (/auto|scroll/.test(overflow)) return el;
        el = el.parentElement;
      }
      return document.documentElement;
    },

    /**
     * Return the preferred position configuration for the timeline bar.
     * @returns {{ side: 'right', topOffset: number, bottomOffset: number }}
     */
    getTimelinePosition() {
      return {
        side: 'right',
        topOffset: 80,
        bottomOffset: 80,
      };
    },

    /**
     * Detect whether the AI assistant is currently generating a response.
     * Looks for a streaming / loading indicator in the DOM.
     * @returns {boolean}
     */
    isAIGenerating() {
      // Common streaming/loading indicators on doubao.com
      return !!(
        document.querySelector('[data-testid="stop_generate"]') ||
        document.querySelector('.generating') ||
        document.querySelector('[class*="loading"]')
      );
    },
  };

  // Expose on global so other scripts can import it
  global.DoubaoAdapter = DoubaoAdapter;
})(window);
