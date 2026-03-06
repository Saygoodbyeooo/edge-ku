(function () {
  'use strict';

  // ===== 站点配置（高清 logo） =====
  const AI_SITES = [
    {
      name: 'Gemini',
      url: 'https://gemini.google.com/app?hl=zh-cn',
      // Google Gemini 官方 favicon（高清）
      favicon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690b6.svg',
      matchPatterns: ['gemini.google.com'],
    },
    {
      name: '豆包',
      url: 'https://www.doubao.com/chat/',
      // 豆包官方 favicon
      favicon: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/logo-icon-white-bg.png',
      matchPatterns: ['doubao.com'],
    },
    {
      name: 'GitHub Copilot',
      url: 'https://github.com/copilot',
      // GitHub 官方高清 logo
      favicon: 'https://github.githubassets.com/favicons/favicon-dark.svg',
      matchPatterns: ['github.com/copilot', 'copilot.microsoft.com'],
    },
  ];

  const href = window.location.href;
  const currentSite = AI_SITES.find((s) =>
    s.matchPatterns.some((p) => href.includes(p))
  );

  function navigateTo(url) {
    try { window.location.assign(url); }
    catch (e) { window.open(url, '_self'); }
  }

  // ===== 悬浮按钮 =====
  const fab = document.createElement('button');
  fab.id = 'ai-switcher-fab';
  fab.textContent = '⚡';
  fab.title = 'AI 切换器';
  document.body.appendChild(fab);

  // ===== 菜单懒加载 =====
  let menu = null;
  let isOpen = false;

  function createMenu() {
    if (menu) return menu;

    menu = document.createElement('div');
    menu.id = 'ai-switcher-menu';

    const fragment = document.createDocumentFragment();

    AI_SITES.forEach((site) => {
      const isCurrent = currentSite && currentSite.name === site.name;

      const item = document.createElement('a');
      item.className = 'switcher-item' + (isCurrent ? ' current' : '');
      item.href = isCurrent ? 'javascript:void(0)' : site.url;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isCurrent) navigateTo(site.url);
      });

      const icon = document.createElement('img');
      icon.className = 'item-icon';
      icon.alt = site.name;
      icon.loading = 'lazy';
      icon.src = site.favicon;
      // 图标加载失败时显示首字母
      icon.onerror = function () {
        this.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.className = 'item-icon-fallback';
        fallback.textContent = site.name.charAt(0);
        this.parentNode.insertBefore(fallback, this);
      };

      const tooltip = document.createElement('span');
      tooltip.className = 'item-tooltip';
      tooltip.textContent = site.name;

      item.appendChild(icon);
      item.appendChild(tooltip);
      fragment.appendChild(item);
    });

    menu.appendChild(fragment);
    document.body.appendChild(menu);
    return menu;
  }

  function toggleMenu() {
    isOpen = !isOpen;
    if (isOpen) {
      createMenu();
      requestAnimationFrame(() => {
        menu.classList.add('visible');
      });
    } else if (menu) {
      menu.classList.remove('visible');
    }
    fab.classList.toggle('active', isOpen);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    if (menu) menu.classList.remove('visible');
    fab.classList.remove('active');
  }

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener('click', (e) => {
    if (menu && !menu.contains(e.target) && e.target !== fab) {
      closeMenu();
    }
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  }, { passive: true });

  // ===== 拖拽 =====
  let isDragging = false;
  let dragStartX, dragStartY, fabStartX, fabStartY;
  let rafId = null;
  let pendingX, pendingY;

  function updateDragPosition() {
    fab.style.transform = 'translate(' + pendingX + 'px,' + pendingY + 'px)';
    if (menu && isOpen) {
      menu.style.transform = 'translate(' + pendingX + 'px,' + pendingY + 'px)';
    }
    rafId = null;
  }

  fab.addEventListener('mousedown', (e) => {
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = fab.getBoundingClientRect();
    fabStartX = rect.left;
    fabStartY = rect.top;
    isDragging = false;
    pendingX = 0;
    pendingY = 0;

    const onMouseMove = (e) => {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
        fab.classList.add('dragging');
      }
      if (isDragging) {
        pendingX = dx;
        pendingY = dy;
        if (!rafId) rafId = requestAnimationFrame(updateDragPosition);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (isDragging) {
        const newX = fabStartX + pendingX;
        const newY = fabStartY + pendingY;
        fab.style.transform = '';
        fab.style.left = newX + 'px';
        fab.style.top = newY + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        if (menu) {
          menu.style.transform = '';
          menu.style.left = newX + 'px';
          menu.style.top = (newY - menu.offsetHeight - 8) + 'px';
          menu.style.right = 'auto';
          menu.style.bottom = 'auto';
        }
        fab.classList.remove('dragging');
        setTimeout(() => (isDragging = false), 0);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  fab.addEventListener('click', (e) => {
    if (isDragging) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) closeMenu();
  }, { passive: true });

})();