const Utils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  pad(n) {
    return String(n).padStart(2, '0');
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  formatDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    const formatted = Utils.formatDate(dateStr);
    return timeStr ? `${formatted} às ${timeStr}` : formatted;
  },

  daysBetween(from, to) {
    const f = new Date(from + 'T00:00:00');
    const t = new Date(to + 'T00:00:00');
    return Math.ceil((t - f) / (1000 * 60 * 60 * 24));
  },

  daysUntil(dateStr) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      Utils.pad(today.getMonth() + 1) + '-' +
      Utils.pad(today.getDate());
    return Utils.daysBetween(todayStr, dateStr);
  },

  daysSince(dateStr) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      Utils.pad(today.getMonth() + 1) + '-' +
      Utils.pad(today.getDate());
    return Utils.daysBetween(dateStr, todayStr);
  },

  getTargetDate(dateStr, timeStr) {
    if (!timeStr) {
      return new Date(dateStr + 'T23:59:59');
    }
    return new Date(dateStr + 'T' + timeStr + ':00');
  },

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  showToast(message, duration) {
    duration = duration || 2400;
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, duration);
  },

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      Utils.pad(d.getMonth() + 1) + '-' +
      Utils.pad(d.getDate());
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern || 10);
    }
  }
};
