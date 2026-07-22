const Router = {
  _currentPage: 'dashboard',
  _callbacks: {},

  init() {
    window.addEventListener('hashchange', () => this._handleHash());
    if (window.location.hash) {
      this._handleHash();
    } else {
      this.navigate('dashboard');
    }
  },

  _handleHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const page = hash.split('?')[0];
    this.go(page);
  },

  go(page) {
    const validPages = ['dashboard', 'checklist', 'cronograma', 'anotacoes', 'contagem', 'config'];
    if (!validPages.includes(page)) page = 'dashboard';

    this._currentPage = page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === page);
    });

    const titles = {
      dashboard: 'Início',
      checklist: 'Lista',
      cronograma: 'Agenda',
      anotacoes: 'Notas',
      contagem: 'Contagem',
      config: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[page] || 'Início';

    if (this._callbacks[page]) {
      this._callbacks[page].forEach(cb => cb());
    }

    window.scrollTo(0, 0);
  },

  navigate(page) {
    window.location.hash = page;
  },

  on(page, callback) {
    if (!this._callbacks[page]) this._callbacks[page] = [];
    this._callbacks[page].push(callback);
  },

  getCurrentPage() {
    return this._currentPage;
  }
};
