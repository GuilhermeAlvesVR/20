const Checklist = {
  _unsub: null,
  _activeItemId: null,
  _dragSrcId: null,
  _touchDragState: null,

  init() {
    this._setupEventListeners();
    this._setupFileInput();
    this._setupDelegatedEvents();
    this._setupPhotoPreview();
    this.render();
    Router.on('checklist', () => this.render());
    this._unsub = Store.on('checklist', () => this.render());
  },

  _setupEventListeners() {
    const input = document.getElementById('checklist-add-input');
    const btn = document.getElementById('checklist-add-btn');
    btn.addEventListener('click', () => this._handleAdd());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleAdd();
    });
  },

  _setupFileInput() {
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !this._activeItemId) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        this._setPhoto(this._activeItemId, ev.target.result);
        this._activeItemId = null;
        Utils.showToast('Foto adicionada');
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
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
      photo: null,
      comment: '',
      order: items.length,
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

  _setPhoto(id, dataUrl) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.photo = dataUrl;
    Store.set('checklist', items);
  },

  _setComment(id, text) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.comment = text;
    Store.set('checklist', items);
  },

  _openPhoto(id) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item || !item.photo) return;

    document.getElementById('photo-preview-img').src = item.photo;
    document.getElementById('photo-preview').classList.remove('hidden');
  },

  _promptComment(id) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;

    Modal.prompt('Comentário', [
      { id: 'comment', label: '', value: item.comment || '', placeholder: 'Escreva um comentário...' }
    ]).then(result => {
      if (result) {
        this._setComment(id, result.comment.trim());
        Utils.showToast('Comentário salvo');
      }
    });
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
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
        '<div class="checklist-drag-handle">≡</div>' +
        '<div class="checklist-checkbox' + (item.checked ? ' checked' : '') + '" data-action="toggle"></div>' +
        (item.photo
          ? '<div class="checklist-thumb" data-action="view-photo" style="background-image:url(' + item.photo + ')"></div>'
          : '<div class="checklist-thumb checklist-thumb-add" data-action="add-photo">📷</div>') +
        '<div class="checklist-content" data-action="edit">' +
          '<span class="checklist-text' + (item.checked ? ' done' : '') + '">' + Utils.escapeHtml(item.text) + '</span>' +
          (item.comment ? '<span class="checklist-comment-badge">💬</span>' : '') +
        '</div>' +
        '<button class="checklist-add-comment' + (item.comment ? ' has-comment' : '') + '" data-action="comment">💬</button>' +
        '<button class="checklist-delete" data-action="delete">✕</button>' +
      '</div>'
    ).join('');
  },

  _renderSortBar() {
    const current = this.getSortMethod();
    return '<div class="checklist-sort">' +
      '<span class="checklist-sort-label">Ordem</span>' +
      '<button class="checklist-sort-btn' + (current === 'manual' ? ' active' : '') + '" data-sort="manual">📋 Manual</button>' +
      '<button class="checklist-sort-btn' + (current === 'alpha' ? ' active' : '') + '" data-sort="alpha">🔤 A-Z</button>' +
    '</div>';
  },

  _setupDelegatedEvents() {
    const list = document.getElementById('checklist-list');
    if (!list) return;

    let swipeState = null;

    const actionMap = {
      'toggle': (el, id) => this.toggleItem(id),
      'delete': (el, id) => this.removeItem(id),
      'add-photo': (el, id) => {
        this._activeItemId = id;
        document.getElementById('file-input').click();
      },
      'view-photo': (el, id) => this._openPhoto(id),
      'comment': (el, id) => this._promptComment(id),
      'edit': (el, id) => {
        const items = Store.get('checklist', []);
        const item = items.find(i => i.id === id);
        if (!item) return;
        Modal.prompt('Editar Item', [
          { id: 'text', label: 'Nome', value: item.text, placeholder: 'Nome do item' }
        ]).then(result => {
          if (result && result.text.trim()) {
            item.text = result.text.trim();
            Store.set('checklist', items);
            Utils.showToast('Item atualizado');
          }
        });
      }
    };

    list.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const item = target.closest('.checklist-item');
      if (!item) return;
      const handler = actionMap[target.dataset.action];
      if (handler) handler(target, item.dataset.id);
    });

    list.addEventListener('click', (e) => {
      const sortBtn = e.target.closest('.checklist-sort-btn');
      if (sortBtn) this.setSortMethod(sortBtn.dataset.sort);
    });

    list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.checklist-item');
      if (!item) return;
      this._dragSrcId = item.dataset.id;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this._dragSrcId);
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.checklist-item');
      if (!target || target.dataset.id === this._dragSrcId) return;

      const rect = target.getBoundingClientRect();
      target.classList.toggle('drag-before', e.clientY < rect.top + rect.height / 2);
      target.classList.toggle('drag-after', e.clientY >= rect.top + rect.height / 2);
    });

    list.addEventListener('dragleave', (e) => {
      const target = e.target.closest('.checklist-item');
      if (target) target.classList.remove('drag-before', 'drag-after');
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target.closest('.checklist-item');
      if (!target || !this._dragSrcId) return;
      if (target.dataset.id !== this._dragSrcId) {
        this._reorderItems(this._dragSrcId, target.dataset.id);
      }
    });

    list.addEventListener('dragend', () => {
      document.querySelectorAll('.checklist-item').forEach(el => {
        el.classList.remove('dragging', 'drag-before', 'drag-after');
      });
      this._dragSrcId = null;
    });

    list.addEventListener('touchstart', (e) => {
      const handle = e.target.closest('.checklist-drag-handle');
      if (handle) {
        const item = e.target.closest('.checklist-item');
        if (!item) return;
        const t = e.touches[0];
        this._touchDragState = {
          item, id: item.dataset.id,
          startY: t.clientY, startX: t.clientX,
          started: false, ghost: null
        };
        return;
      }

      const swipeItem = e.target.closest('.checklist-item');
      if (!swipeItem) { swipeState = null; return; }
      swipeState = {
        item: swipeItem,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        swiping: false
      };
    }, { passive: true });

    list.addEventListener('touchmove', (e) => {
      const ds = this._touchDragState;
      if (ds) {
        const t = e.touches[0];
        const dy = t.clientY - ds.startY;
        const dx = t.clientX - ds.startX;

        if (!ds.started) {
          if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
          if (Math.abs(dx) > Math.abs(dy)) { this._touchDragState = null; return; }
          ds.started = true;
          const rect = ds.item.getBoundingClientRect();
          ds.ghost = ds.item.cloneNode(true);
          ds.ghost.classList.add('dragging-ghost');
          Object.assign(ds.ghost.style, {
            position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
            width: rect.width + 'px', pointerEvents: 'none', zIndex: '1000'
          });
          ds.item.style.opacity = '0.3';
          document.body.appendChild(ds.ghost);
        }

        e.preventDefault();
        const gh = ds.ghost.getBoundingClientRect().height;
        ds.ghost.style.top = (t.clientY - gh / 2) + 'px';

        const dropTarget = this._getItemAtPoint(t.clientX, t.clientY, list);
        document.querySelectorAll('.checklist-item').forEach(el => el.classList.remove('drag-before', 'drag-after'));
        if (dropTarget && dropTarget.dataset.id !== ds.id) {
          const r = dropTarget.getBoundingClientRect();
          dropTarget.classList.add(t.clientY < r.top + r.height / 2 ? 'drag-before' : 'drag-after');
        }
        return;
      }

      if (!swipeState || !swipeState.item) return;
      const touch = e.touches[0];
      const dx = touch.clientX - swipeState.startX;
      const dy = touch.clientY - swipeState.startY;

      if (Math.abs(dy) > Math.abs(dx)) { swipeState = null; return; }
      if (Math.abs(dx) < 5) return;

      swipeState.swiping = true;
      e.preventDefault();
      if (dx < 0) {
        const offset = Math.max(dx, -100);
        swipeState.item.style.transform = 'translateX(' + offset + 'px)';
        swipeState.item.style.opacity = 1 + (offset / 100);
        swipeState.item.style.transition = 'none';
      }
    }, { passive: false });

    list.addEventListener('touchend', (e) => {
      const ds = this._touchDragState;
      if (ds) {
        document.querySelectorAll('.checklist-item').forEach(el => el.classList.remove('drag-before', 'drag-after'));
        if (ds.ghost) ds.ghost.remove();
        if (ds.item) ds.item.style.opacity = '';
        if (ds.started && ds.id) {
          const t = e.changedTouches[0];
          const target = this._getItemAtPoint(t.clientX, t.clientY, list);
          if (target && target.dataset.id !== ds.id) {
            this._reorderItems(ds.id, target.dataset.id);
          }
        }
        this._touchDragState = null;
        return;
      }

      if (!swipeState || !swipeState.swiping) { swipeState = null; return; }
      const item = swipeState.item;
      const match = item.style.transform.match(/-?\d+/);
      const offset = match ? parseInt(match[0]) : 0;
      item.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      if (offset < -60) {
        item.style.transform = 'translateX(-120%)';
        item.style.opacity = '0';
        setTimeout(() => { if (item.dataset.id) this.removeItem(item.dataset.id); }, 200);
      } else {
        item.style.transform = 'translateX(0)';
        item.style.opacity = '1';
      }
      swipeState = null;
    }, { passive: true });
  },

  _getItemAtPoint(x, y, list) {
    const els = list.querySelectorAll('.checklist-item:not(.dragging-ghost)');
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) return el;
    }
    return null;
  },

  _reorderItems(fromId, toId) {
    const items = Store.get('checklist', []);
    const fromIdx = items.findIndex(i => i.id === fromId);
    const toIdx = items.findIndex(i => i.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const [moved] = items.splice(fromIdx, 1);
    const newToIdx = items.findIndex(i => i.id === toId);
    items.splice(newToIdx, 0, moved);
    items.forEach((item, i) => item.order = i);
    Store.set('checklist', items);
  },

  _setupPhotoPreview() {
    const el = document.querySelector('.photo-preview-close');
    if (el) el.addEventListener('click', () => {
      document.getElementById('photo-preview').classList.add('hidden');
    });
    const backdrop = document.querySelector('.photo-preview-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => {
      document.getElementById('photo-preview').classList.add('hidden');
    });
  }
};
