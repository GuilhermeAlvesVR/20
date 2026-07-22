const Pin = {
  _pinBuffer: [],
  _mode: 'login',
  _blockedTimer: null,

  init() {
    this._renderKeypad('pin-create-keypad', 'create');
    this._renderKeypad('pin-login-keypad', 'login');

    if (!this._isPinSet()) {
      this._showCreate();
    } else {
      this._showLogin();
    }
  },

  _isPinSet() {
    const settings = Store.get('settings', {});
    return settings && settings.pin && settings.pin.length === 6;
  },

  _showCreate() {
    this._mode = 'create';
    document.getElementById('pin-create').classList.remove('hidden');
    document.getElementById('pin-login').classList.add('hidden');
    document.getElementById('pin-blocked').classList.add('hidden');
    document.getElementById('pin-screen').classList.remove('hidden');
  },

  _showLogin() {
    this._mode = 'login';
    this._pinBuffer = [];

    if (this._isBlocked()) {
      this._showBlocked();
      return;
    }

    document.getElementById('pin-create').classList.add('hidden');
    document.getElementById('pin-login').classList.remove('hidden');
    document.getElementById('pin-blocked').classList.add('hidden');
    document.getElementById('pin-screen').classList.remove('hidden');
    this._clearDots('pin-login-dots');
    document.getElementById('pin-login-error').textContent = '';
  },

  _showBlocked() {
    document.getElementById('pin-create').classList.add('hidden');
    document.getElementById('pin-login').classList.add('hidden');
    document.getElementById('pin-blocked').classList.remove('hidden');
    document.getElementById('pin-screen').classList.remove('hidden');

    this._startBlockedTimer();
  },

  _startBlockedTimer() {
    if (this._blockedTimer) clearInterval(this._blockedTimer);

    const update = () => {
      const remaining = this._getBlockedTimeRemaining();
      if (remaining <= 0) {
        clearInterval(this._blockedTimer);
        this._blockedTimer = null;
        Store.set('pinBlockedUntil', null);
        Store.set('pinAttempts', 0);
        this._showLogin();
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      document.getElementById('pin-blocked-timer').textContent =
        Utils.pad(mins) + ':' + Utils.pad(secs);
    };

    update();
    this._blockedTimer = setInterval(update, 1000);
  },

  _isBlocked() {
    const until = Store.get('pinBlockedUntil', null);
    if (!until) return false;
    if (Date.now() >= until) {
      Store.set('pinBlockedUntil', null);
      Store.set('pinAttempts', 0);
      return false;
    }
    return true;
  },

  _getBlockedTimeRemaining() {
    const until = Store.get('pinBlockedUntil', null);
    if (!until) return 0;
    return Math.max(0, Math.floor((until - Date.now()) / 1000));
  },

  _clearDots(dotsId) {
    document.querySelectorAll('#' + dotsId + ' .pin-dot').forEach(d => {
      d.className = 'pin-dot';
    });
  },

  _updateDots(dotsId, count) {
    const dots = document.querySelectorAll('#' + dotsId + ' .pin-dot');
    dots.forEach((d, i) => {
      d.className = i < count ? 'pin-dot filled' : 'pin-dot';
    });
  },

  _showError(dotsId, errorId, message) {
    const dots = document.querySelectorAll('#' + dotsId + ' .pin-dot');
    dots.forEach(d => d.className = 'pin-dot error');
    document.getElementById(errorId).textContent = message;
    setTimeout(() => {
      this._clearDots(dotsId);
      document.getElementById(errorId).textContent = '';
    }, 500);
  },

  _handleDigit(digit, mode) {
    if (this._pinBuffer.length >= 6) return;

    this._pinBuffer.push(digit);

    if (mode === 'create') {
      this._updateDots('pin-create-dots', this._pinBuffer.length);
    } else {
      this._updateDots('pin-login-dots', this._pinBuffer.length);
    }

    if (this._pinBuffer.length === 6) {
      setTimeout(() => this._onComplete(mode), 100);
    }
  },

  _handleBackspace(mode) {
    if (this._pinBuffer.length === 0) return;
    this._pinBuffer.pop();

    if (mode === 'create') {
      this._updateDots('pin-create-dots', this._pinBuffer.length);
    } else {
      this._updateDots('pin-login-dots', this._pinBuffer.length);
    }
  },

  _onComplete(mode) {
    const pin = this._pinBuffer.join('');
    this._pinBuffer = [];

    if (mode === 'create') {
      this._handleCreateComplete(pin);
    } else {
      this._handleLoginComplete(pin);
    }
  },

  _handleCreateComplete(pin) {
    const settings = Store.get('settings', {});
    settings.pin = pin;
    Store.set('settings', settings);

    Utils.showToast('PIN criado com sucesso!');
    this._unlock();
  },

  _handleLoginComplete(pin) {
    const settings = Store.get('settings', {});
    if (settings.pin === pin) {
      Store.set('pinAttempts', 0);
      Store.set('pinBlockedUntil', null);
      this._unlock();
    } else {
      let attempts = Store.get('pinAttempts', 0);
      attempts++;
      Store.set('pinAttempts', attempts);

      this._showError('pin-login-dots', 'pin-login-error', 'PIN incorreto');

      if (attempts >= 3) {
        Store.set('pinBlockedUntil', Date.now() + 5 * 60 * 1000);
        Utils.showToast('Acesso bloqueado por 5 minutos');
        setTimeout(() => this._showBlocked(), 600);
      }
    }
  },

  _unlock() {
    document.getElementById('pin-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    if (this._blockedTimer) {
      clearInterval(this._blockedTimer);
      this._blockedTimer = null;
    }
  },

  _renderKeypad(containerId, mode) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

    digits.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.className = d ? 'pin-key' : 'pin-key empty';
      btn.textContent = d || '';
      if (d) {
        btn.addEventListener('click', () => this._handleDigit(d, mode));
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this._handleDigit(d, mode);
        });
      }
      container.appendChild(btn);

      if (i === 10) {
        const back = document.createElement('button');
        back.className = 'pin-key backspace';
        back.textContent = '⌫';
        back.addEventListener('click', () => this._handleBackspace(mode));
        back.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this._handleBackspace(mode);
        });
        container.appendChild(back);
      }
    });
  },

  showChangePinDialog() {
    if (this._blockedTimer) clearInterval(this._blockedTimer);

    document.getElementById('pin-create').classList.remove('hidden');
    document.getElementById('pin-login').classList.add('hidden');
    document.getElementById('pin-blocked').classList.add('hidden');
    document.getElementById('pin-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');

    this._pinBuffer = [];
    this._clearDots('pin-create-dots');
    document.getElementById('pin-create-error').textContent = '';

    const settings = Store.get('settings', {});
    const oldPin = settings.pin;

    const originalComplete = this._onComplete.bind(this);
    this._onComplete = (mode) => {
      const pin = this._pinBuffer.join('');
      this._pinBuffer = [];

      if (pin === oldPin) {
        this._showError('pin-create-dots', 'pin-create-error', 'O novo PIN deve ser diferente do atual');
        this._clearDots('pin-create-dots');
        return;
      }

      settings.pin = pin;
      Store.set('settings', settings);
      Utils.showToast('PIN alterado com sucesso!');
      this._unlock();
      this._onComplete = originalComplete;
    };
  }
};
