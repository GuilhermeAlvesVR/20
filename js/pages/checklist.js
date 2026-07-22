const Checklist = {
  _cleanupFns: [],

  init() {
    this._setupEventListeners();
    this.render();
    Router.on('checklist', () => this.render());

    const unsub = Store.on('checklist', () => this.render());
    this._cleanupFns.push(unsub);
  },

  destroy() {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
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
    const newItem = {
      id: Utils.generateId(),
      text: text,
      checked: false
    };
    items.push(newItem);
    Store.set('checklist', items);
    Utils.showToast('Item adicionado');
  },

  removeItem(id) {
    const items = Store.get('checklist', []);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;

    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => {
        items.splice(idx, 1);
        Store.set('checklist', items);
      }, 200);
    } else {
      items.splice(idx, 1);
      Store.set('checklist', items);
    }
  },

  toggleItem(id) {
    const items = Store.get('checklist', []);
    const item = items.find(i => i.id === id);
    if (!item) return;

    item.checked = !item.checked;
    Store.set('checklist', items);
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
      list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--text-muted);font-style:italic;">Nenhum item na lista</div>';
      return;
    }

    list.innerHTML = items.map(item =>
      '<div class="checklist-item" data-id="' + item.id + '">' +
        '<div class="checklist-checkbox' + (item.checked ? ' checked' : '') + '" data-action="toggle"></div>' +
        '<span class="checklist-text' + (item.checked ? ' done' : '') + '">' + Utils.escapeHtml(item.text) + '</span>' +
        '<button class="checklist-delete" data-action="delete">✕</button>' +
      '</div>'
    ).join('');

    list.querySelectorAll('.checklist-checkbox').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.target.closest('.checklist-item').dataset.id;
        this.toggleItem(id);
      });
    });

    list.querySelectorAll('.checklist-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.target.closest('.checklist-item').dataset.id;
        this.removeItem(id);
      });
    });
  }
};
