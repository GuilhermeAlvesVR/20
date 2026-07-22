const Dashboard = {
  _cleanupFns: [],

  init() {
    this.render();
    Router.on('dashboard', () => this.render());

    const unsub1 = Store.on('checklist', () => this.render());
    const unsub2 = Store.on('schedule', () => this.render());
    const unsub3 = Store.on('settings', () => this.render());
    this._cleanupFns = [unsub1, unsub2, unsub3];
  },

  destroy() {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
  },

  render() {
    this._updateDays();
    this._updateProgress();
    this._updateNextCommitment();
    this._updatePendingItems();
  },

  _updateDays() {
    const settings = Store.get('settings', {});
    const dateStr = settings.proposalDate;
    const el = document.getElementById('days-number');
    const label = document.getElementById('days-label');
    const dateEl = document.getElementById('days-date');
    const passedEl = document.getElementById('days-passed');

    if (!dateStr) {
      el.textContent = '--';
      label.textContent = 'Data não definida';
      dateEl.textContent = 'Configure nas Configurações';
      passedEl.textContent = '';
      return;
    }

    const days = Utils.daysUntil(dateStr);
    const formatted = Utils.formatDate(dateStr);

    if (days < 0) {
      el.textContent = '💍';
      label.textContent = 'O dia chegou!';
      dateEl.textContent = formatted;
      passedEl.textContent = 'Há ' + Math.abs(days) + ' dia(s) atrás';
    } else if (days === 0) {
      el.textContent = '💍';
      label.textContent = 'É hoje!';
      dateEl.textContent = formatted;
      passedEl.textContent = '';
    } else {
      el.textContent = days;
      label.textContent = days === 1 ? 'dia restante' : 'dias restantes';
      dateEl.textContent = formatted;
      const startDate = settings.createdAt || Utils.getTodayStr();
      const daysSinceSetup = Utils.daysSince(startDate);
      passedEl.textContent = daysSinceSetup > 0 ? 'Você está se preparando há ' + daysSinceSetup + ' dias' : '';
    }
  },

  _updateProgress() {
    const items = Store.get('checklist', []);
    const fill = document.getElementById('progress-fill');
    const percent = document.getElementById('progress-percent');
    const text = document.getElementById('progress-text');

    if (!items || items.length === 0) {
      fill.style.width = '0%';
      percent.textContent = '0%';
      text.textContent = 'Nenhum item no checklist';
      return;
    }

    const done = items.filter(i => i.checked).length;
    const total = items.length;
    const pct = Math.round((done / total) * 100);

    fill.style.width = pct + '%';
    percent.textContent = pct + '%';
    text.textContent = done + ' de ' + total + ' itens concluídos' +
      (done < total ? ' — Faltam ' + (total - done) : ' — Tudo pronto!');
  },

  _updateNextCommitment() {
    const items = Store.get('schedule', []);
    const timeEl = document.getElementById('next-time');
    const titleEl = document.getElementById('next-title');
    const descEl = document.getElementById('next-desc');
    const emptyEl = document.getElementById('next-empty');

    if (!items || items.length === 0) {
      timeEl.textContent = '';
      titleEl.textContent = '';
      descEl.textContent = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');

    const now = new Date();
    const todayStr = Utils.getTodayStr();
    const settings = Store.get('settings', {});

    let next = null;

    for (const item of items) {
      if (item.time) {
        const eventDate = new Date(todayStr + 'T' + item.time + ':00');
        if (eventDate > now) {
          next = item;
          break;
        }
      } else {
        if (!next) next = item;
      }
    }

    if (!next) next = items[0];

    timeEl.textContent = next.time || '--:--';
    titleEl.textContent = next.title || '';
    descEl.textContent = next.desc || '';
  },

  _updatePendingItems() {
    const items = Store.get('checklist', []);
    const list = document.getElementById('pending-list');
    const count = document.getElementById('pending-count');

    const pending = items.filter(i => !i.checked);

    count.textContent = pending.length;

    if (pending.length === 0) {
      list.innerHTML = '<div class="pending-empty">Nada pendente! 🎉</div>';
      return;
    }

    const maxShow = 8;
    const toShow = pending.slice(0, maxShow);

    list.innerHTML = toShow.map(item =>
      '<div class="pending-item">' + Utils.escapeHtml(item.text) + '</div>'
    ).join('') + (pending.length > maxShow
      ? '<div class="pending-item" style="color:var(--gold);font-style:italic;">E mais ' + (pending.length - maxShow) + ' item(ns)...</div>'
      : '');
  }
};
