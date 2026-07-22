const Store = {
  _prefix: 'pedido_',

  _namespaced(key) {
    return this._prefix + key;
  },

  get(key, fallback) {
    try {
      const raw = localStorage.getItem(this._namespaced(key));
      if (raw === null) return fallback !== undefined ? fallback : null;
      return JSON.parse(raw);
    } catch {
      return fallback !== undefined ? fallback : null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this._namespaced(key), JSON.stringify(value));
      this._emit(key, value);
      return true;
    } catch {
      Utils.showToast('Erro ao salvar dados. Verifique o espaço disponível.');
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(this._namespaced(key));
    this._emit(key, null);
  },

  getAll() {
    const result = {};
    const prefix = this._namespaced('');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const storeKey = k.slice(prefix.length);
        try {
          result[storeKey] = JSON.parse(localStorage.getItem(k));
        } catch {
          result[storeKey] = localStorage.getItem(k);
        }
      }
    }
    return result;
  },

  importAll(data) {
    for (const key in data) {
      this.set(key, data[key]);
    }
  },

  clearAll() {
    const prefix = this._namespaced('');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    this._emit('*', null);
  },

  _listeners: {},

  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  },

  _emit(key, value) {
    (this._listeners[key] || []).forEach(cb => cb(value));
    (this._listeners['*'] || []).forEach(cb => cb(key, value));
  }
};

const DEFAULT_CHECKLIST = [
  { id: 'default_1', text: 'Comprar alianças', checked: false },
  { id: 'default_2', text: 'Buscar alianças', checked: false },
  { id: 'default_3', text: 'Escolher roupa', checked: false },
  { id: 'default_4', text: 'Fazer cabelo/barba', checked: false },
  { id: 'default_5', text: 'Confirmar local', checked: false },
  { id: 'default_6', text: 'Reservar restaurante', checked: false },
  { id: 'default_7', text: 'Confirmar fotógrafo', checked: false },
  { id: 'default_8', text: 'Carregar celular', checked: false },
  { id: 'default_9', text: 'Separar documentos', checked: false },
  { id: 'default_10', text: 'Separar carteira', checked: false },
  { id: 'default_11', text: 'Separar chaves', checked: false },
  { id: 'default_12', text: 'Conferir clima', checked: false },
  { id: 'default_13', text: 'Plano B', checked: false }
];

const DEFAULT_SETTINGS = {
  proposalDate: '2027-02-20',
  proposalTime: '',
  herName: '',
  location: '',
  theme: 'dark',
  pin: null,
  createdAt: (function() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  })()
};

function initializeStore() {
  if (Store.get('checklist') === null) {
    Store.set('checklist', DEFAULT_CHECKLIST);
  }
  if (Store.get('schedule') === null) {
    Store.set('schedule', []);
  }
  if (Store.get('notes') === null) {
    Store.set('notes', '');
  }
  if (Store.get('settings') === null) {
    Store.set('settings', DEFAULT_SETTINGS);
  }
  if (Store.get('pinAttempts') === null) {
    Store.set('pinAttempts', 0);
  }
  if (Store.get('pinBlockedUntil') === null) {
    Store.set('pinBlockedUntil', null);
  }
}
