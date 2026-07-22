const Config = {
  _cleanupFns: [],

  init() {
    this._loadSettings();
    this._setupEventListeners();

    Router.on('config', () => this._loadSettings());

    const unsub = Store.on('settings', (val) => {
      if (val && val.theme) this._applyTheme(val.theme);
    });
    this._cleanupFns.push(unsub);
  },

  destroy() {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
  },

  _loadSettings() {
    const settings = Store.get('settings', {});

    document.getElementById('config-date').value = settings.proposalDate || '';
    document.getElementById('config-time').value = settings.proposalTime || '';
    document.getElementById('config-name').value = settings.herName || '';
    document.getElementById('config-location').value = settings.location || '';
    document.getElementById('config-theme').value = settings.theme || 'dark';
  },

  _setupEventListeners() {
    const fields = ['config-date', 'config-time', 'config-name', 'config-location', 'config-theme'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => this._saveSettings());
      el.addEventListener('change', () => this._saveSettings());
    });

    document.getElementById('config-change-pin').addEventListener('click', () => {
      Pin.showChangePinDialog();
    });

    document.getElementById('config-export').addEventListener('click', () => this._handleExport());
    document.getElementById('config-import').addEventListener('click', () => {
      document.getElementById('config-file-input').click();
    });
    document.getElementById('config-file-input').addEventListener('change', (e) => this._handleImport(e));
    document.getElementById('config-reset').addEventListener('click', () => this._handleReset());
  },

  _saveSettings() {
    const settings = Store.get('settings', {});
    settings.proposalDate = document.getElementById('config-date').value;
    settings.proposalTime = document.getElementById('config-time').value;
    settings.herName = document.getElementById('config-name').value.trim();
    settings.location = document.getElementById('config-location').value.trim();

    const newTheme = document.getElementById('config-theme').value;
    if (newTheme !== settings.theme) {
      settings.theme = newTheme;
      this._applyTheme(newTheme);
    }

    Store.set('settings', settings);
  },

  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = theme === 'dark' ? '#121212' : '#F5F0EB';
    }
  },

  _handleExport() {
    const data = Store.getAll();
    Utils.downloadJSON(data, 'pedido-casamento-dados.json');
    Utils.showToast('Dados exportados com sucesso!');
  },

  _handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (typeof data !== 'object' || data === null) {
          throw new Error('Formato inválido');
        }

        Store.importAll(data);
        this._loadSettings();
        Utils.showToast('Dados importados com sucesso!');

        Dashboard.render();
        Checklist.render();
        Cronograma.render();
        Anotacoes._load();
      } catch {
        Utils.showToast('Erro ao importar. Arquivo inválido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  async _handleReset() {
    const first = await Modal.confirm('Limpar Dados', 'Tem certeza? Todos os dados serão perdidos permanentemente.');
    if (!first) return;

    const second = await Modal.confirm('Confirmar', 'Esta ação não pode ser desfeita. Continuar?');
    if (!second) return;

    Utils.vibrate();
    Store.clearAll();
    initializeStore();

    this._loadSettings();
    Dashboard.render();
    Checklist.render();
    Cronograma.render();
    Anotacoes._load();

    Utils.showToast('Todos os dados foram limpos.');
  }
};
