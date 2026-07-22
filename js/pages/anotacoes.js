const Anotacoes = {
  _autoSave: null,

  init() {
    this._load();
    this._setupAutoSave();
  },

  _load() {
    const notes = Store.get('notes', '');
    const textarea = document.getElementById('notes-textarea');
    if (textarea.value !== notes) {
      textarea.value = notes;
    }
  },

  _setupAutoSave() {
    const textarea = document.getElementById('notes-textarea');
    const status = document.getElementById('notes-status');

    this._autoSave = Utils.debounce(() => {
      const value = textarea.value;
      Store.set('notes', value);
      status.textContent = 'Salvo';
      status.className = 'notes-status saved';
      setTimeout(() => { status.textContent = 'Pronto'; status.className = 'notes-status'; }, 1500);
    }, 500);

    textarea.addEventListener('input', () => {
      status.textContent = 'Salvando...';
      status.className = 'notes-status saving';
      this._autoSave();
    });

    Router.on('anotacoes', () => {
      this._load();
    });
  }
};
