const Contagem = {
  _timer: null,
  _overlayTimer: null,

  init() {
    document.getElementById('btn-contagem').addEventListener('click', () => this.show());
    document.getElementById('countdown-close').addEventListener('click', () => this.hide());
  },

  show() {
    const overlay = document.getElementById('countdown-overlay');
    overlay.classList.remove('hidden');

    this._updateDisplay();
    this._updateLabel();

    this._overlayTimer = setInterval(() => {
      this._updateDisplay();
    }, 1000);

    document.getElementById('countdown-date').textContent = this._getDateText();
  },

  hide() {
    const overlay = document.getElementById('countdown-overlay');
    overlay.classList.add('hidden');

    if (this._overlayTimer) {
      clearInterval(this._overlayTimer);
      this._overlayTimer = null;
    }
  },

  _updateDisplay() {
    const settings = Store.get('settings', {});
    if (!settings.proposalDate) {
      document.getElementById('count-days').textContent = '--';
      document.getElementById('count-hours').textContent = '--';
      document.getElementById('count-minutes').textContent = '--';
      document.getElementById('count-seconds').textContent = '--';
      return;
    }

    const target = Utils.getTargetDate(settings.proposalDate, settings.proposalTime);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      document.getElementById('count-days').textContent = '💍';
      document.getElementById('count-hours').textContent = '🎉';
      document.getElementById('count-minutes').textContent = '🎊';
      document.getElementById('count-seconds').textContent = '✨';
      if (this._overlayTimer) clearInterval(this._overlayTimer);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('count-days').textContent = Utils.pad(days);
    document.getElementById('count-hours').textContent = Utils.pad(hours);
    document.getElementById('count-minutes').textContent = Utils.pad(minutes);
    document.getElementById('count-seconds').textContent = Utils.pad(seconds);
  },

  _updateLabel() {
    const settings = Store.get('settings', {});
    const label = document.getElementById('countdown-label');
    if (settings.herName) {
      label.textContent = 'Faltam para o pedido da ' + settings.herName;
    } else {
      label.textContent = 'Faltam para o grande dia';
    }
  },

  _getDateText() {
    const settings = Store.get('settings', {});
    if (!settings.proposalDate) return 'Data não definida';

    let text = Utils.formatDate(settings.proposalDate);
    if (settings.location) text += ' — ' + settings.location;
    if (settings.proposalTime) text += ' às ' + settings.proposalTime;
    return text;
  }
};
