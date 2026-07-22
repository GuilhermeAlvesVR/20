const Modal = {
  _resolve: null,
  _reject: null,

  init() {
    document.getElementById('modal-cancel').addEventListener('click', () => this._dismiss(false));
    document.getElementById('modal-confirm').addEventListener('click', () => this._confirm());
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this._dismiss(false);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._dismiss(false);
    });
  },

  confirm(title, message) {
    return new Promise((resolve) => {
      this._show({
        title,
        message,
        type: 'confirm',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        resolve
      });
    });
  },

  alert(title, message) {
    return new Promise((resolve) => {
      this._show({
        title,
        message,
        type: 'alert',
        confirmText: 'OK',
        cancelText: null,
        resolve
      });
    });
  },

  prompt(title, fields) {
    return new Promise((resolve) => {
      this._show({
        title,
        fields,
        type: 'prompt',
        confirmText: 'Salvar',
        cancelText: 'Cancelar',
        resolve
      });
    });
  },

  _show(opts) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const fieldsEl = document.getElementById('modal-fields');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    titleEl.textContent = opts.title || '';
    this._resolve = opts.resolve;

    if (opts.message) {
      messageEl.textContent = opts.message;
      messageEl.classList.remove('hidden');
    } else {
      messageEl.classList.add('hidden');
    }

    if (opts.fields) {
      fieldsEl.innerHTML = opts.fields.map(f =>
        '<div class="modal-field">' +
          (f.label ? '<label class="modal-field-label">' + f.label + '</label>' : '') +
          '<input type="' + (f.type || 'text') + '" class="modal-field-input" id="modal-field-' + f.id + '" ' +
            'value="' + Utils.escapeHtml(f.value || '') + '" ' +
            'placeholder="' + Utils.escapeHtml(f.placeholder || '') + '" maxlength="' + (f.maxlength || 200) + '">' +
        '</div>'
      ).join('');
      fieldsEl.classList.remove('hidden');
    } else {
      fieldsEl.classList.add('hidden');
      fieldsEl.innerHTML = '';
    }

    if (opts.cancelText) {
      cancelBtn.textContent = opts.cancelText;
      cancelBtn.classList.remove('hidden');
    } else {
      cancelBtn.classList.add('hidden');
    }

    confirmBtn.textContent = opts.confirmText || 'OK';
    modal.classList.remove('hidden');
    modal.dataset.action = opts.type;
    modal.dataset.confirmed = 'false';

    confirmBtn.disabled = false;
    cancelBtn.disabled = false;

    document.getElementById('pin-screen').classList.add('pin-modal-open');
    document.getElementById('app').classList.add('app-modal-open');

    if (opts.type === 'prompt') {
      setTimeout(() => {
        const firstInput = fieldsEl.querySelector('.modal-field-input');
        if (firstInput) firstInput.focus();
      }, 200);
    }

    this._type = opts.type;
  },

  _confirm() {
    const type = this._type;
    let result = true;

    if (type === 'prompt') {
      const fields = document.querySelectorAll('.modal-field-input');
      result = {};
      let valid = true;
      fields.forEach(f => {
        const val = f.value.trim();
        if (f.hasAttribute('data-required') && !val) {
          valid = false;
          f.style.borderColor = 'var(--danger)';
        } else {
          result[f.id.replace('modal-field-', '')] = val;
        }
      });
      if (!valid) {
        Utils.showToast('Preencha todos os campos obrigatórios');
        return;
      }
    }

    this._dismiss(result);
  },

  _dismiss(result) {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');

    document.getElementById('pin-screen').classList.remove('pin-modal-open');
    document.getElementById('app').classList.remove('app-modal-open');

    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  }
};
