(function () {
  initializeStore();

  const settings = Store.get('settings', {});

  if (settings.theme) {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = settings.theme === 'dark' ? '#121212' : '#F5F0EB';
    }
  }

  Dashboard.init();
  Checklist.init();
  Cronograma.init();
  Anotacoes.init();
  Contagem.init();
  Config.init();
  Modal.init();
  Router.init();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      Utils.vibrate(8);
      Router.navigate(tab.dataset.page);
    });
  });

  document.getElementById('btn-config').addEventListener('click', () => {
    Utils.vibrate(8);
    Router.navigate('config');
  });

  document.getElementById('btn-contagem').addEventListener('click', () => {
    Utils.vibrate(8);
  });

  Pin.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service Worker registration failed:', err);
    });
  }
})();
