const Cronograma = {
  _dragSrcId: null,
  _cleanupFns: [],

  init() {
    this._setupEventListeners();
    this.render();
    Router.on('cronograma', () => this.render());

    const unsub = Store.on('schedule', () => this.render());
    this._cleanupFns.push(unsub);
  },

  destroy() {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
  },

  _setupEventListeners() {
    document.getElementById('cronograma-add-save').addEventListener('click', () => this._handleAdd());
    document.getElementById('cronograma-empty-btn').addEventListener('click', () => {
      document.getElementById('cronograma-add-card').classList.remove('hidden');
    });
  },

  _handleAdd() {
    const time = document.getElementById('cronograma-add-time').value;
    const title = document.getElementById('cronograma-add-title').value.trim();
    const desc = document.getElementById('cronograma-add-desc').value.trim();

    if (!title) {
      Utils.showToast('Digite um título para o evento');
      return;
    }

    this.addItem(time, title, desc);
    document.getElementById('cronograma-add-time').value = '';
    document.getElementById('cronograma-add-title').value = '';
    document.getElementById('cronograma-add-desc').value = '';
    document.getElementById('cronograma-add-card').classList.add('hidden');
    Utils.showToast('Evento adicionado');
  },

  addItem(time, title, desc) {
    const items = Store.get('schedule', []);
    items.push({
      id: Utils.generateId(),
      time: time || '',
      title: title,
      desc: desc || ''
    });
    Store.set('schedule', items);
  },

  removeItem(id) {
    let items = Store.get('schedule', []);
    items = items.filter(i => i.id !== id);
    Store.set('schedule', items);
  },

  editItem(id, time, title, desc) {
    const items = Store.get('schedule', []);
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.time = time || '';
    item.title = title;
    item.desc = desc || '';
    Store.set('schedule', items);
  },

  moveItem(fromIndex, toIndex) {
    const items = Store.get('schedule', []);
    if (fromIndex < 0 || fromIndex >= items.length ||
        toIndex < 0 || toIndex >= items.length) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    Store.set('schedule', items);
  },

  render() {
    const items = Store.get('schedule', []);
    const list = document.getElementById('cronograma-list');
    const empty = document.getElementById('cronograma-empty');
    const addCard = document.getElementById('cronograma-add-card');

    if (items.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    list.innerHTML = items.map((item, index) =>
      '<div class="cronograma-item" draggable="true" data-id="' + item.id + '" data-index="' + index + '">' +
        '<div class="cronograma-item-header">' +
          '<span class="cronograma-time">' + (item.time || '--:--') + '</span>' +
          '<span class="cronograma-drag">⋮⋮</span>' +
        '</div>' +
        '<div class="cronograma-title">' + Utils.escapeHtml(item.title) + '</div>' +
        (item.desc ? '<div class="cronograma-desc">' + Utils.escapeHtml(item.desc) + '</div>' : '') +
        '<div class="cronograma-actions">' +
          '<button class="cronograma-edit-btn" data-action="edit">Editar</button>' +
          '<button class="cronograma-delete-btn" data-action="delete">Excluir</button>' +
        '</div>' +
      '</div>'
    ).join('');

    this._setupDragDrop();
    this._setupItemActions();
  },

  _setupDragDrop() {
    const items = document.querySelectorAll('.cronograma-item');
    let touchDragId = null;
    let touchStartY = 0;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        if (window.matchMedia('(pointer: coarse)').matches) {
          e.preventDefault();
          return;
        }
        this._dragSrcId = item.dataset.id;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.id);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        document.querySelectorAll('.cronograma-item').forEach(el => {
          el.classList.remove('drag-over');
        });
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.cronograma-item').forEach(el => {
          el.classList.remove('drag-over');
        });
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');

        const srcId = this._dragSrcId;
        const targetId = item.dataset.id;
        if (!srcId || srcId === targetId) return;

        const items = Store.get('schedule', []);
        const fromIndex = items.findIndex(i => i.id === srcId);
        const toIndex = items.findIndex(i => i.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return;

        this.moveItem(fromIndex, toIndex);
      });

      const handle = item.querySelector('.cronograma-drag');
      if (handle) {
        handle.addEventListener('touchstart', (e) => {
          touchDragId = item.dataset.id;
          touchStartY = e.touches[0].clientY;
          item.classList.add('dragging');
        }, { passive: true });

        handle.addEventListener('touchmove', (e) => {
          if (!touchDragId) return;
          e.preventDefault();

          const touchY = e.touches[0].clientY;
          const target = document.elementFromPoint(e.touches[0].clientX, touchY);
          const targetItem = target ? target.closest('.cronograma-item') : null;

          document.querySelectorAll('.cronograma-item').forEach(el => {
            el.classList.remove('drag-over');
          });

          if (targetItem && targetItem.dataset.id !== touchDragId) {
            targetItem.classList.add('drag-over');
          }
        }, { passive: false });

        handle.addEventListener('touchend', (e) => {
          if (!touchDragId) return;

          const touch = e.changedTouches[0];
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          const targetItem = target ? target.closest('.cronograma-item') : null;

          document.querySelectorAll('.cronograma-item').forEach(el => {
            el.classList.remove('dragging', 'drag-over');
          });

          if (targetItem && targetItem.dataset.id !== touchDragId) {
            const items = Store.get('schedule', []);
            const fromIndex = items.findIndex(i => i.id === touchDragId);
            const toIndex = items.findIndex(i => i.id === targetItem.dataset.id);
            if (fromIndex !== -1 && toIndex !== -1) {
              this.moveItem(fromIndex, toIndex);
            }
          }

          touchDragId = null;
        }, { passive: true });
      }
    });
  },

  _setupItemActions() {
    document.querySelectorAll('.cronograma-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.cronograma-item').dataset.id;
        this._promptEdit(id);
      });
    });

    document.querySelectorAll('.cronograma-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('.cronograma-item').dataset.id;
        const ok = await Modal.confirm('Remover evento', 'Remover este evento do cronograma?');
        if (ok) {
          this.removeItem(id);
          Utils.vibrate();
        }
      });
    });
  },

  async _promptEdit(id) {
    const items = Store.get('schedule', []);
    const item = items.find(i => i.id === id);
    if (!item) return;

    const result = await Modal.prompt('Editar Evento', [
      { id: 'time', label: 'Hora', value: item.time, placeholder: '--:--', type: 'time' },
      { id: 'title', label: 'Título', value: item.title, placeholder: 'Título do evento' },
      { id: 'desc', label: 'Descrição (opcional)', value: item.desc, placeholder: 'Descrição' }
    ]);

    if (!result) return;
    if (!result.title.trim()) {
      Utils.showToast('O título é obrigatório');
      return;
    }

    this.editItem(id, result.time, result.title.trim(), (result.desc || '').trim());
    Utils.showToast('Evento atualizado');
    Utils.vibrate();
  }
};
