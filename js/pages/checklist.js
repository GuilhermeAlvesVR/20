const Checklist = {
  _unsub: null,
  _activeItemId: null,

  init() {
    this._setupEventListeners();
    this._setupFileInput();
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

  _removePhoto(id) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.photo = null;
    Store.set('checklist', items);
    Utils.showToast('Foto removida');
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

    this._attachEvents();
    this._setupSwipe();
    this._setupPhotoPreview();
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
    this._attachClickEvents('add-photo', (el, id) => {
      this._activeItemId = id;
      document.getElementById('file-input').click();
    });
    this._attachClickEvents('view-photo', (el, id) => this._openPhoto(id));
    this._attachClickEvents('comment', (el, id) => this._promptComment(id));
    this._attachClickEvents('edit', (el, id) => {
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
    });

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

  _setupPhotoPreview() {
    document.querySelector('.photo-preview-close').addEventListener('click', () => {
      document.getElementById('photo-preview').classList.add('hidden');
    });
    document.querySelector('.photo-preview-backdrop').addEventListener('click', () => {
      document.getElementById('photo-preview').classList.add('hidden');
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
