(function () {
  const config = window.APP_CONFIG && window.APP_CONFIG.firebase;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Não foi possível carregar o SDK Firebase.'));
      document.head.appendChild(script);
    });
  }

  window.FirebaseReady = (async function () {
    if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      throw new Error('A configuração Firebase está incompleta em js/config.js.');
    }

    await loadScript('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js');

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(config);
    }

    const auth = window.firebase.auth();
    window.FirebaseAuth = auth;
    await new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(
        (user) => {
          unsubscribe();
          resolve(user);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
    return auth;
  })().catch((error) => {
    window.FirebaseError = error;
    console.error('Falha ao inicializar Firebase:', error);
    return null;
  });
})();
