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
  Router.init();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      Router.navigate(tab.dataset.page);
    });
  });

  document.getElementById('btn-config').addEventListener('click', () => {
    Router.navigate('config');
  });

  Pin.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Service Worker registration failed:', err);
    });
  }
})();
