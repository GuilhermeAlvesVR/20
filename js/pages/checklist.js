const Checklist = {
  init() {
    this._setupEventListeners();
    this.render();
    Router.on('checklist', () => this.render());
  },

  _setupEventListeners() {
    const input = document.getElementById('checklist-add-input');
    const btn = document.getElementById('checklist-add-btn');

    btn.addEventListener('click', () => this._handleAdd());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleAdd();
    });
  },

  _handleAdd() {
    const input = document.getElementById('checklist-add-input');
    const text = input.value.trim();
    if (!text) return;

    this.addItem(text);
    input.value = '';
    input.focus();
  },

  addItem(text) {
    const items = Store.get('checklist', []);
    items.push({
      id: Utils.generateId(),
      text: text,
      checked: false,
      createdAt: Date.now()
    });
    Store.set('checklist', items);
    Utils.showToast('Item adicionado');
    Utils.vibrate();
  },

  removeItem(id) {
    const items = Store.get('checklist', []);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items.splice(idx, 1);
    Store.set('checklist', items);
    Utils.vibrate(12);
  },

  toggleItem(id) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.checked = !item.checked;
    Store.set('checklist', items);
    Utils.vibrate(6);
  },

  getSortMethod() {
    return Store.get('checklistSort', 'manual');
  },

  setSortMethod(method) {
    Store.set('checklistSort', method);
    this.render();
    Utils.vibrate();
  },

  _sortItems(items) {
    const method = this.getSortMethod();
    if (method === 'alpha') {
      return [...items].sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'));
    }
    return items;
  },

  render() {
    const items = Store.get('checklist', []);
    const list = document.getElementById('checklist-list');
    const doneEl = document.getElementById('checklist-done');
    const totalEl = document.getElementById('checklist-total');

    const done = items.filter(i => i.checked).length;
    doneEl.textContent = done;
    totalEl.textContent = items.length;

    if (items.length === 0) {
      list.innerHTML = '<div class="checklist-empty">Nenhum item na lista</div>';
      return;
    }

    const sorted = this._sortItems(items);
    const unchecked = sorted.filter(i => !i.checked);
    const checked = sorted.filter(i => i.checked);
    const ordered = [...unchecked, ...checked];

    list.innerHTML = this._renderSortBar() + ordered.map(item =>
      '<div class="checklist-item" data-id="' + item.id + '">' +
        '<div class="checklist-checkbox' + (item.checked ? ' checked' : '') + '" data-action="toggle"></div>' +
        '<span class="checklist-text' + (item.checked ? ' done' : '') + '">' + Utils.escapeHtml(item.text) + '</span>' +
        '<button class="checklist-delete" data-action="delete">✕</button>' +
      '</div>'
    ).join('');

    this._attachEvents();
    this._setupSwipe();
  },

  _renderSortBar() {
    const current = this.getSortMethod();
    return '<div class="checklist-sort">' +
      '<span class="checklist-sort-label">Ordem</span>' +
      '<button class="checklist-sort-btn' + (current === 'manual' ? ' active' : '') + '" data-sort="manual">📋 Criados</button>' +
      '<button class="checklist-sort-btn' + (current === 'alpha' ? ' active' : '') + '" data-sort="alpha">🔤 A-Z</button>' +
    '</div>';
  },

  _attachEvents() {
    this._attachClickEvents('toggle', (el, id) => this.toggleItem(id));
    this._attachClickEvents('delete', (el, id) => this.removeItem(id));

    document.querySelectorAll('.checklist-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setSortMethod(btn.dataset.sort));
    });
  },

  _attachClickEvents(action, handler) {
    document.querySelectorAll('[data-action="' + action + '"]').forEach(el => {
      el.addEventListener('click', (e) => {
        const item = e.target.closest('.checklist-item');
        if (!item) return;
        handler(el, item.dataset.id);
      });
    });
  },

  _setupSwipe() {
    document.querySelectorAll('.checklist-item').forEach(item => {
      const start = {};
      let swiping = false;

      item.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        start.x = touch.clientX;
        start.y = touch.clientY;
        swiping = false;
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;

        if (Math.abs(dy) > Math.abs(dx)) return;
        if (Math.abs(dx) < 5) return;

        swiping = true;
        e.preventDefault();

        if (dx < 0) {
          const offset = Math.max(dx, -100);
          item.style.transform = 'translateX(' + offset + 'px)';
          item.style.opacity = 1 + (offset / 100);
          item.style.transition = 'none';
        } else if (dx > 0 && item.style.transform) {
          item.style.transform = 'translateX(0)';
          item.style.opacity = '1';
        }
      }, { passive: false });

      item.addEventListener('touchend', () => {
        if (!swiping) return;

        const match = item.style.transform.match(/-?\d+/);
        const offset = match ? parseInt(match[0]) : 0;

        item.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

        if (offset < -60) {
          item.style.transform = 'translateX(-120%)';
          item.style.opacity = '0';
          setTimeout(() => {
            const id = item.dataset.id;
            if (id) this.removeItem(id);
          }, 200);
        } else {
          item.style.transform = 'translateX(0)';
          item.style.opacity = '1';
        }

        swiping = false;
      }, { passive: true });
    });
  }
};
