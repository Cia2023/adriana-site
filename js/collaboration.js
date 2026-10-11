(function () {
  const config = window.APP_CONFIG;
  const SESSION_KEY = 'adriana-collaboration-session';
  const state = {
    user: null,
    token: '',
    approved: false,
    chatPollingTimer: 0,
    chatLoading: false,
    chatRefreshPending: false
  };

  function escapeHtml(value) {
    return window.Renderer.escapeHtml(value);
  }

  function showNotice(target, message, isError = false) {
    if (!target) return;
    target.replaceChildren();
    if (message) target.appendChild(document.createTextNode(message));
    target.classList.toggle('is-error', isError);
    target.classList.remove('is-loading');
    target.removeAttribute('aria-label');
    target.hidden = !message;
  }

  function showLoadingHeart(target) {
    if (!target) return;
    const heart = document.createElement('span');
    heart.className = 'login-heart';
    heart.setAttribute('aria-hidden', 'true');
    target.replaceChildren(heart);
    target.classList.remove('is-error');
    target.classList.add('is-loading');
    target.setAttribute('aria-label', 'A carregar');
    target.hidden = false;
  }

  function userFacingError(error, fallback) {
    const message = String(error?.message || '');
    return /Apps Script|Cloudinary|planilha|aba |API|servidor|backend|HTTP \d|publicação|respondeu a tempo|configuração|operação desconhecida|não está preparada|sessão terminou|já não está autorizada|Firebase|token|UrlFetchApp|Identity Toolkit|FIREBASE_/i.test(message)
      ? fallback
      : message || fallback;
  }

  function loginErrorMessage(error) {
    const code = String(error?.code || '');
    const messages = {
      'auth/invalid-email': 'O formato do email não é válido.',
      'auth/invalid-credential': 'Email ou palavra-passe incorretos.',
      'auth/invalid-login-credentials': 'Email ou palavra-passe incorretos.',
      'auth/user-not-found': 'Email ou palavra-passe incorretos.',
      'auth/wrong-password': 'Email ou palavra-passe incorretos.',
      'auth/operation-not-allowed': 'Não foi possível iniciar sessão agora. Tenta novamente mais tarde.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarda um pouco e tenta novamente.',
      'auth/network-request-failed': 'Sem ligação à internet. Verifica a ligação e tenta novamente.'
    };
    if (messages[code]) return messages[code];
    if (window.FirebaseError && error === window.FirebaseError) {
      return 'O login não está disponível neste momento. Tenta novamente mais tarde.';
    }
    return 'Não foi possível iniciar sessão agora. Confirma os dados e tenta novamente.';
  }

  function collaborationLoginErrorMessage() {
    return 'Não foi possível iniciar sessão agora. Tenta novamente mais tarde.';
  }

  function apiUrl() {
    const value = String(config.collaborationApiUrl || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(value)) {
      throw new Error('O administrador ainda não configurou o URL da API Apps Script em js/config.js.');
    }
    return value;
  }

  function requestId() {
    return window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function apiRequest(payload) {
    const endpoint = apiUrl();
    const id = requestId();
    return new Promise((resolve, reject) => {
      const frame = document.createElement('iframe');
      const form = document.createElement('form');
      const frameName = `collaboration-${id.replace(/[^a-z0-9]/gi, '')}`;
      let timeout;

      frame.name = frameName;
      frame.title = 'Pedido seguro à API da colaboração';
      frame.hidden = true;
      form.action = endpoint;
      form.method = 'post';
      form.target = frameName;
      form.hidden = true;

      [
        ['requestId', id],
        ['payload', JSON.stringify(payload)]
      ].forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        window.clearTimeout(timeout);
        form.remove();
        frame.remove();
      };
      const onMessage = (event) => {
        const trustedOrigin = event.origin === 'https://script.google.com' ||
          /^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/i.test(event.origin);
        if (!trustedOrigin ||
            event.data?.type !== 'adriana-sheet-api' ||
            event.data.requestId !== id) return;
        cleanup();
        const response = event.data.response;
        if (response?.ok) resolve(response.data);
        else reject(new Error(response?.error || 'O servidor não conseguiu concluir o pedido.'));
      };

      window.addEventListener('message', onMessage);
      document.body.append(frame, form);
      timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('A API não respondeu a tempo. Confere a publicação do Apps Script e tenta novamente.'));
      }, 60000);
      form.submit();
    });
  }

  function cloudinaryUrl(value, width = 900) {
    return window.Renderer.cloudinaryUrl(value, width);
  }

  function isAllowedCloudinaryUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        url.pathname.startsWith(`/${config.cloudinary.cloudName}/image/upload/`);
    } catch (error) {
      return false;
    }
  }

  function isAllowedCloudinaryMediaUrl(value, resourceType) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        url.pathname.startsWith(`/${config.cloudinary.cloudName}/${resourceType}/upload/`);
    } catch (error) {
      return false;
    }
  }

  function loginMarkup() {
    return `
      <section class="page-content">
        <form class="collab-login glass-panel reveal" data-login-form>
          <h2>Entrar para continuar</h2>
          <label>Email<input name="email" type="email" autocomplete="username" required maxlength="254" /></label>
          <label>Palavra-passe<input name="password" type="password" autocomplete="current-password" required maxlength="256" /></label>
          <p class="collab-notice" data-login-notice role="status" hidden></p>
          <div class="login-processing" data-login-processing role="status" aria-label="A processar entrada" hidden>
            <span class="login-heart" aria-hidden="true"></span>
          </div>
          <button class="primary-btn" type="submit">Entrar</button>
          <button class="text-link" type="button" data-password-reset>Esqueci-me da palavra-passe</button>
          <button class="text-link" type="button" data-login-sign-out hidden>Terminar sessão</button>
        </form>
      </section>
    `;
  }

  function configureLogin(form, notice) {
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.querySelector('[data-password-reset]').addEventListener('click', async () => {
      const emailInput = form.elements.email;
      const email = emailInput.value.trim();
      if (!email || !emailInput.checkValidity()) {
        showNotice(notice, 'Introduz primeiro um endereço de email válido para receber a reposição.', true);
        emailInput.focus();
        return;
      }

      try {
        const auth = await window.FirebaseReady;
        if (!auth) throw window.FirebaseError || new Error('O Firebase não foi inicializado.');
        await auth.sendPasswordResetEmail(email);
        showNotice(notice, 'Se existir uma conta com esse email, receberás uma mensagem para repor a palavra-passe. Verifica também o spam.');
      } catch (error) {
        console.error('Password reset request failed:', error);
        const messages = {
          'auth/invalid-email': 'O formato do email não é válido.',
          'auth/too-many-requests': 'Muitas tentativas. Aguarda um pouco e tenta novamente.',
          'auth/network-request-failed': 'Sem ligação à internet. Verifica a ligação e tenta novamente.',
          'auth/operation-not-allowed': 'Não foi possível pedir a reposição agora. Tenta novamente mais tarde.'
        };
        showNotice(notice, messages[error?.code] || userFacingError(error, 'Não foi possível pedir a reposição. Tenta novamente.'), true);
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const processing = form.querySelector('[data-login-processing]');
      const previousButtonText = button.textContent;
      button.disabled = true;
      form.setAttribute('aria-busy', 'true');
      processing.hidden = false;
      showNotice(notice, '');
      try {
        const auth = await window.FirebaseReady;
        if (!auth) throw window.FirebaseError || new Error('O Firebase não foi inicializado.');
        const email = form.elements.email.value.trim();
        const password = form.elements.password.value;
        let credential;
        try {
          credential = await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
          console.error('Firebase rejected the sign-in credentials:', error);
          showNotice(notice, loginErrorMessage(error), true);
          return;
        }
        const idToken = await credential.user.getIdToken();
        try {
          const verify = await apiRequest({ action: 'verifyFirebase', idToken: idToken });
          state.token = idToken;
          state.user = verify.user;
          state.approved = true;
          sessionStorage.setItem(SESSION_KEY, state.token);
          form.reset();
          showNotice(notice, '');
          applyAccessState();
        } catch (error) {
          console.error('Firebase sign-in succeeded, but Apps Script session verification failed:', error);
          showNotice(notice, collaborationLoginErrorMessage(), true);
        }
      } catch (error) {
        console.error('Sign-in failed:', error);
        showNotice(notice, loginErrorMessage(error), true);
      } finally {
        processing.hidden = true;
        form.removeAttribute('aria-busy');
        button.disabled = false;
        button.textContent = previousButtonText;
      }
    });
  }

  function renderChat() {
    const app = document.querySelector('#app');
    app.innerHTML = `
      ${loginMarkup()}
      <section class="page-content chat-area" data-chat-area hidden>
        <div class="container chat-shell glass-panel">
          <p class="collab-notice" data-chat-notice role="status" hidden></p>
          <ol class="chat-messages" data-chat-messages aria-live="polite"></ol>
          <form class="chat-compose" data-chat-form>
            <label class="file-pick" for="chat-image" aria-label="Anexar fotografia" title="Anexar fotografia"><span aria-hidden="true">＋</span><span class="visually-hidden">Anexar fotografia</span></label>
            <input id="chat-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
            <label class="visually-hidden" for="chat-text">Escreve uma mensagem</label>
            <textarea id="chat-text" name="text" rows="1" maxlength="2000" placeholder="Escreve uma mensagem…" aria-label="Escreve uma mensagem"></textarea>
            <button class="primary-btn chat-send-button" type="submit" aria-label="Enviar mensagem" title="Enviar mensagem"><span aria-hidden="true">↑</span></button>
          </form>
        </div>
      </section>
    `;

    window.Interactions.refreshReveals();
    configureLogin(app.querySelector('[data-login-form]'), app.querySelector('[data-login-notice]'));
    app.querySelector('[data-login-sign-out]').addEventListener('click', signOut);
    document.querySelector('.site-header [data-sign-out]').addEventListener('click', signOut);
    app.querySelector('[data-chat-form]').addEventListener('submit', sendChatMessage);
    app.querySelector('[data-chat-messages]').addEventListener('click', handleLightboxClick);
    if (!document.querySelector('[data-image-lightbox]')) {
      createLightbox('chat-image-lightbox', 'Fotografia da conversa');
    }
  }

  function renderGalleryTools() {
    const app = document.querySelector('#app');
    if (!app || app.querySelector('[data-gallery-tools]')) return;

    const section = document.createElement('section');
    section.className = 'page-content gallery-collab';
    section.dataset.galleryTools = '';
    section.id = 'gallery-contributions';
    section.innerHTML = `
      <div class="container glass-panel gallery-collab-panel">
        <div class="gallery-collab-heading">
          <div><span class="section-kicker">Galeria</span><h2>Partilha uma fotografia</h2><p>Podes escolher um ficheiro ou colar um link para a imagem.</p></div>
          <div class="gallery-actions">
            <button class="primary-btn" type="button" data-open-gallery-form>Adicionar foto à galeria</button>
            <button class="text-link" type="button" data-gallery-sign-out hidden>Terminar sessão</button>
          </div>
        </div>
        <div data-gallery-login hidden>${loginMarkup()}</div>
        <div class="collab-notice" data-gallery-notice role="status" hidden></div>
        <form class="gallery-upload-form" data-gallery-form hidden>
          <h3>Nova fotografia</h3>
          <label>Título<input name="title" maxlength="120" required /></label>
          <label>Legenda<textarea name="caption" rows="2" maxlength="500"></textarea></label>
          <label>Categoria<input name="category" maxlength="60" required /></label>
          <label>Etiqueta (opcional)<input name="label" maxlength="60" /></label>
          <label>Texto alternativo da imagem (opcional)<input name="altText" maxlength="200" /></label>
          <label>Mensagem escondida (opcional)<textarea name="hiddenMessage" rows="2" maxlength="500"></textarea></label>
          <label>Link da fotografia (opcional)<input name="imageUrl" type="url" inputmode="url" placeholder="https://…" /></label>
          <label>Ou escolhe uma imagem<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
          <p class="collab-notice" data-upload-notice role="status" hidden></p>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Publicar na galeria</button>
            <button class="text-link" type="button" data-close-gallery-form>Cancelar</button>
          </div>
        </form>
      </div>
    `;
    app.appendChild(section);

    const loginForm = section.querySelector('[data-login-form]');
    configureLogin(loginForm, section.querySelector('[data-login-notice]'));
    loginForm.querySelector('[data-login-sign-out]').addEventListener('click', signOut);
    section.querySelector('[data-open-gallery-form]').addEventListener('click', () => {
      if (!state.approved) {
        section.querySelector('[data-gallery-login]').hidden = false;
        loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        loginForm.querySelector('[name="email"]').focus();
        return;
      }
      section.querySelector('[data-gallery-form]').hidden = false;
      section.querySelector('[data-gallery-form] [name="title"]').focus();
    });
    section.querySelector('[data-close-gallery-form]').addEventListener('click', () => {
      section.querySelector('[data-gallery-form]').hidden = true;
    });
    section.querySelector('[data-gallery-form]').addEventListener('submit', submitGalleryPhoto);
    if (app.dataset.galleryLightboxBound !== 'true') {
      app.dataset.galleryLightboxBound = 'true';
      app.addEventListener('click', (event) => {
        if (event.target.closest('.gallery-grid:not(.gallery-submissions)')) handleLightboxClick(event);
      });
    }
    section.querySelector('[data-gallery-sign-out]').addEventListener('click', signOut);
    if (!document.querySelector('[data-gallery-lightbox]')) createLightbox();
  }

  function renderMediaTools() {
    const app = document.querySelector('#app');
    if (!app || app.querySelector('[data-media-tools]')) return;

    const section = document.createElement('section');
    section.className = 'page-content gallery-collab';
    section.dataset.mediaTools = '';
    section.id = 'library-contributions';
    section.innerHTML = `
      <div class="container glass-panel gallery-collab-panel">
        <div class="gallery-collab-heading">
          <div><span class="section-kicker">Biblioteca</span><h2>Partilha um vídeo ou áudio</h2><p>Cola o link do vídeo ou áudio, ou escolhe um ficheiro para carregar.</p></div>
          <div class="gallery-actions">
            <button class="primary-btn" type="button" data-open-media-form>Adicionar conteúdo</button>
            <button class="text-link" type="button" data-media-sign-out hidden>Terminar sessão</button>
          </div>
        </div>
        <div data-media-login hidden>${loginMarkup()}</div>
        <p class="collab-notice" data-media-notice role="status" hidden></p>
        <form class="gallery-upload-form" data-media-form hidden>
          <h3>Novo conteúdo</h3>
          <label>Tipo
            <select name="mediaType" required>
              <option value="video">Vídeo</option>
              <option value="audio">Áudio</option>
              <option value="ebook">E-book (PDF)</option>
            </select>
          </label>
          <label>Título<input name="title" maxlength="120" required /></label>
          <label>Descrição<textarea name="caption" rows="2" maxlength="500"></textarea></label>
          <label>Categoria<input name="category" maxlength="60" required /></label>
          <label data-media-url-label><span data-media-url-copy>Link do vídeo</span><input name="mediaUrl" type="url" inputmode="url" placeholder="https://…" /></label>
          <label data-media-file-label><span data-media-file-copy>Ou carrega um ficheiro de vídeo</span><input name="mediaFile" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" /></label>
          <p class="collab-notice" data-media-upload-notice role="status" hidden></p>
          <div class="form-actions">
            <button class="primary-btn" type="submit">Publicar na biblioteca</button>
            <button class="text-link" type="button" data-close-media-form>Cancelar</button>
          </div>
        </form>
      </div>
    `;
    app.appendChild(section);

    const loginForm = section.querySelector('[data-login-form]');
    configureLogin(loginForm, section.querySelector('[data-login-notice]'));
    loginForm.querySelector('[data-login-sign-out]').addEventListener('click', signOut);
    section.querySelector('[data-open-media-form]').addEventListener('click', () => {
      if (!state.approved) {
        section.querySelector('[data-media-login]').hidden = false;
        loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        loginForm.querySelector('[name="email"]').focus();
        return;
      }
      section.querySelector('[data-media-form]').hidden = false;
      section.querySelector('[data-media-form] [name="title"]').focus();
    });
    section.querySelector('[data-close-media-form]').addEventListener('click', () => {
      section.querySelector('[data-media-form]').hidden = true;
    });
    section.querySelector('[data-media-form]').addEventListener('submit', submitLibraryMedia);
    section.querySelector('[name="mediaType"]').addEventListener('change', (event) => {
      const mediaType = event.target.value;
      const isEbook = mediaType === 'ebook';
      const isAudio = mediaType === 'audio';
      const urlInput = section.querySelector('[data-media-url-label] input');
      section.querySelector('[data-media-file-label]').hidden = isEbook;
      urlInput.required = isEbook;
      section.querySelector('[data-media-url-copy]').textContent = isEbook
        ? 'Link direto para o PDF'
        : isAudio
          ? 'Link direto para o áudio'
          : 'Link do vídeo';
      urlInput.placeholder = isEbook
        ? 'https://…/livro.pdf'
        : isAudio
          ? 'https://…/audio.mp3'
          : 'https://…';
      section.querySelector('[data-media-file-copy]').textContent = isAudio
        ? 'Ou carrega um ficheiro de áudio'
        : 'Ou carrega um ficheiro de vídeo';
      if (isEbook) section.querySelector('[name="mediaFile"]').value = '';
      section.querySelector('[name="mediaFile"]').accept = mediaType === 'audio'
        ? 'audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm'
        : 'video/mp4,video/webm,video/ogg,video/quicktime';
    });
    section.querySelector('[data-media-sign-out]').addEventListener('click', signOut);
  }

  function handleLightboxClick(event) {
    const image = event.target.closest('[data-lightbox-src]');
    if (image) openLightbox(image.dataset.lightboxSrc, image.dataset.lightboxAlt);
  }

  function renderMessage(message) {
    const mine = message.authorName === state.user?.name;
    const date = message.createdAt ? new Date(message.createdAt) : null;
    const time = date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(date)
      : '';
    const image = message.imageUrl ? cloudinaryUrl(message.imageUrl, 320) : '';
    const fullImage = message.imageUrl ? cloudinaryUrl(message.imageUrl, 1600) : '';
    const imageAlt = `Imagem partilhada por ${message.authorName || 'utilizador'}`;
    return `
      <li class="chat-message${mine ? ' mine' : ''}">
        <div class="chat-bubble">
          <div class="chat-message-meta"><strong>${escapeHtml(message.authorName || 'Utilizador')}</strong><time>${escapeHtml(time)}</time></div>
          ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ''}
          ${image ? `<button class="chat-image-open" type="button" data-lightbox-src="${escapeHtml(fullImage)}" data-lightbox-alt="${escapeHtml(imageAlt)}" aria-label="Ampliar fotografia"><img class="chat-image" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" loading="lazy" /></button>` : ''}
        </div>
      </li>
    `;
  }

  async function loadChat(quiet = false) {
    const messages = document.querySelector('[data-chat-messages]');
    const notice = document.querySelector('[data-chat-notice]');
    if (!messages || !state.token) return;
    if (state.chatLoading) {
      state.chatRefreshPending = true;
      return;
    }
    state.chatLoading = true;
    if (!quiet) showLoadingHeart(notice);
    try {
      const records = await apiRequest({ action: 'chatList', token: state.token });
      const wasAtBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
      messages.innerHTML = records.map(renderMessage).join('');
      messages.querySelectorAll('img').forEach((image) => {
        image.addEventListener('error', () => { image.hidden = true; }, { once: true });
      });
      if (wasAtBottom) messages.scrollTop = messages.scrollHeight;
      showNotice(notice, records.length ? '' : 'Ainda não há mensagens. Podes iniciar a conversa.');
    } catch (error) {
      console.error('Could not read the chat history:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível carregar a conversa agora.'), true);
      if (/sessão terminou|já não está autorizada/i.test(error.message)) await clearSession();
    } finally {
      state.chatLoading = false;
      if (state.chatRefreshPending) {
        state.chatRefreshPending = false;
        window.setTimeout(() => loadChat(true), 0);
      }
    }
  }

  function startChatPolling() {
    if (state.chatPollingTimer) return;
    state.chatPollingTimer = window.setInterval(() => {
      if (state.approved && document.visibilityState === 'visible') loadChat(true);
    }, 30000);
  }

  function stopChatPolling() {
    if (!state.chatPollingTimer) return;
    window.clearInterval(state.chatPollingTimer);
    state.chatPollingTimer = 0;
  }

  async function uploadCloudinaryFile(file, purpose, mediaType) {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v'];
    const audioTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm'];
    const isImage = purpose !== 'library';
    const resourceType = isImage ? 'image' : 'video';
    const allowedTypes = isImage ? imageTypes : mediaType === 'audio' ? audioTypes : videoTypes;
    const maximumSize = isImage
      ? config.cloudinary.maxImageBytes
      : mediaType === 'audio' ? config.cloudinary.maxAudioBytes : config.cloudinary.maxVideoBytes;
    if (!(file instanceof File) || !allowedTypes.includes(file.type)) {
      throw new Error(isImage
        ? 'Escolhe uma imagem JPEG, PNG, WebP ou GIF.'
        : mediaType === 'audio'
          ? 'Escolhe um áudio MP3, M4A, AAC, OGG, WAV ou WebM.'
          : 'Escolhe um vídeo MP4, WebM, OGG ou MOV.');
    }
    if (file.size > maximumSize) {
      throw new Error(`O ficheiro excede o limite de ${Math.floor(maximumSize / (1024 * 1024))} MB.`);
    }
    if (!state.approved || !state.token) throw new Error('Inicia sessão para enviar ficheiros.');

    const { cloudName, apiKey } = config.cloudinary;
    if (!cloudName || !apiKey) throw new Error('Não foi possível preparar o envio. Tenta novamente mais tarde.');
    const signedUpload = await apiRequest({
      action: 'uploadSignature',
      token: state.token,
      purpose,
      resourceType
    });
    if (signedUpload.cloudName !== cloudName || signedUpload.resourceType !== resourceType) {
      throw new Error('Não foi possível preparar o envio. Tenta novamente mais tarde.');
    }
    const form = new FormData();
    form.append('file', file);
    form.append('timestamp', String(signedUpload.timestamp));
    form.append('folder', signedUpload.folder);
    form.append('public_id', signedUpload.publicId);
    form.append('api_key', apiKey);
    form.append('signature', signedUpload.signature);
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const result = await response.json();
    const isAllowedUrl = isImage
      ? isAllowedCloudinaryUrl(result.secure_url)
      : isAllowedCloudinaryMediaUrl(result.secure_url, 'video');
    if (!response.ok || !result.secure_url || !isAllowedUrl) {
      throw new Error('Não foi possível enviar o ficheiro. Confere o ficheiro e tenta novamente.');
    }
    return result.secure_url;
  }

  function uploadCloudinaryImage(file, purpose) {
    return uploadCloudinaryFile(file, purpose, 'image');
  }

  async function sendChatMessage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const notice = document.querySelector('[data-chat-notice]');
    const text = form.elements.text.value.trim();
    const file = form.elements.image.files[0];
    if (!state.approved) {
      showNotice(notice, 'Inicia sessão para enviar uma mensagem.', true);
      return;
    }
    if (!text && !file) {
      showNotice(notice, 'Escreve uma mensagem ou anexa uma imagem.', true);
      return;
    }

    button.disabled = true;
    try {
      showNotice(notice, file ? 'A carregar a imagem e a enviar…' : 'A enviar mensagem…');
      const imageUrl = file ? await uploadCloudinaryImage(file, 'chat') : '';
      await apiRequest({ action: 'chatSend', token: state.token, text, imageUrl });
      form.reset();
      await loadChat();
      showNotice(notice, 'Mensagem enviada.');
    } catch (error) {
      console.error('Could not send chat message:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível enviar a mensagem agora.'), true);
    } finally {
      button.disabled = false;
    }
  }

  async function submitGalleryPhoto(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const notice = form.querySelector('[data-upload-notice]');
    const title = form.elements.title.value.trim();
    const caption = form.elements.caption.value.trim();
    const category = form.elements.category.value.trim();
    const label = form.elements.label.value.trim();
    const altText = form.elements.altText.value.trim();
    const hiddenMessage = form.elements.hiddenMessage.value.trim();
    const file = form.elements.imageFile.files[0];
    let imageUrl = form.elements.imageUrl.value.trim();

    if (!state.approved) {
      showNotice(notice, 'Inicia sessão antes de publicar.', true);
      return;
    }
    if (file && imageUrl) {
      showNotice(notice, 'Escolhe um ficheiro ou fornece um link, não ambos.', true);
      return;
    }
    if (!file && !imageUrl) {
      showNotice(notice, 'Escolhe uma fotografia ou cola um link válido.', true);
      return;
    }
    if (file) {
      button.disabled = true;
      showNotice(notice, 'A carregar a fotografia…');
      try {
        imageUrl = await uploadCloudinaryImage(file, 'gallery');
      } catch (error) {
        console.error('Gallery image upload failed:', error);
        showNotice(notice, userFacingError(error, 'Não foi possível publicar esta fotografia.'), true);
        button.disabled = false;
        return;
      }
    }
    if (!isAllowedCloudinaryUrl(imageUrl)) {
      showNotice(notice, 'O link da imagem não é válido. Confere o endereço e tenta novamente.', true);
      button.disabled = false;
      return;
    }

    button.disabled = true;
    showNotice(notice, 'A publicar fotografia…');
    try {
      await apiRequest({
        action: 'gallerySubmit',
        token: state.token,
        title,
        caption,
        category,
        label,
        altText,
        hiddenMessage,
        imageUrl
      });
      form.reset();
      form.hidden = true;
      await loadGallery();
      showNotice(document.querySelector('[data-gallery-notice]'), 'Fotografia adicionada à galeria.');
    } catch (error) {
      console.error('Could not save gallery contribution:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível publicar esta fotografia.'), true);
    } finally {
      button.disabled = false;
    }
  }

  async function submitLibraryMedia(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const notice = form.querySelector('[data-media-upload-notice]');
    const mediaType = form.elements.mediaType.value;
    const title = form.elements.title.value.trim();
    const caption = form.elements.caption.value.trim();
    const category = form.elements.category.value.trim();
    const file = form.elements.mediaFile.files[0];
    const hostedUrl = form.elements.mediaUrl.value.trim();

    if (!state.approved) {
      showNotice(notice, 'Inicia sessão antes de publicar.', true);
      return;
    }
    if (file && hostedUrl) {
      showNotice(notice, 'Escolhe um ficheiro ou fornece um link, não ambos.', true);
      return;
    }
    if (mediaType === 'ebook' && file) {
      showNotice(notice, 'Para e-books, fornece o link hospedado do PDF.', true);
      return;
    }
    if (!file && !hostedUrl) {
      showNotice(notice, 'Escolhe um ficheiro ou cola um link hospedado.', true);
      return;
    }

    button.disabled = true;
    try {
      showNotice(notice, file ? 'A carregar o ficheiro…' : 'A publicar conteúdo…');
      const mediaUrl = file
        ? await uploadCloudinaryFile(file, 'library', mediaType)
        : hostedUrl;
      await apiRequest({
        action: 'mediaSubmit',
        token: state.token,
        mediaType,
        title,
        caption,
        category,
        mediaUrl
      });
      form.reset();
      form.hidden = true;
      await loadMedia();
      showNotice(document.querySelector('[data-media-notice]'), 'Conteúdo adicionado à biblioteca.');
    } catch (error) {
      console.error('Could not publish library media:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível publicar este conteúdo.'), true);
    } finally {
      button.disabled = false;
    }
  }

  function submittedGalleryMarkup(item) {
    const imageUrl = item.url_imagem || item.imageUrl;
    const title = item.titulo || item.title;
    const caption = item.texto || item.caption;
    const category = item.categoria || item.category;
    const image = cloudinaryUrl(imageUrl, 900);
    if (!image) return '';
    return `
      <figure class="gallery-item">
        <button class="gallery-image-button" type="button" data-lightbox-src="${escapeHtml(cloudinaryUrl(imageUrl, 1800))}" data-lightbox-alt="${escapeHtml(item.texto_alternativo || title)}">
          <img class="cloudinary-image" src="${escapeHtml(image)}" alt="${escapeHtml(item.texto_alternativo || title)}" loading="lazy" />
        </button>
        <figcaption>
          <span class="tag">${escapeHtml(category)}</span>
          <h3>${escapeHtml(title)}</h3>
          ${caption ? `<p>${escapeHtml(caption)}</p>` : ''}
        </figcaption>
      </figure>
    `;
  }

  function paintGallery(submissions) {
    const grid = document.querySelector('.gallery-grid:not(.gallery-submissions)');
    if (!grid) return;
    grid.innerHTML = submissions.map(submittedGalleryMarkup).join('');
    grid.querySelectorAll('img').forEach((image) => {
      if (image.complete && image.naturalWidth) image.classList.add('image-loaded');
      image.addEventListener('error', () => { image.hidden = true; }, { once: true });
      image.addEventListener('load', () => image.classList.add('image-loaded'), { once: true });
    });
  }

  async function loadGallery() {
    const notice = document.querySelector('[data-gallery-notice]');
    try {
      const submissions = await apiRequest({ action: 'galleryList' });
      paintGallery(submissions);
      showNotice(notice, '');
    } catch (error) {
      console.error('Could not load the public gallery:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível atualizar a galeria agora.'), true);
    }
  }

  async function loadMedia() {
    const grid = document.querySelector('#library-items');
    const empty = document.querySelector('[data-library-empty]');
    const notice = document.querySelector('[data-library-notice]');
    if (!grid) return;
    try {
      const media = await apiRequest({ action: 'mediaList' });
      grid.innerHTML = window.Renderer.renderMediaItems(media);
      grid.hidden = grid.children.length === 0;
      if (empty) empty.hidden = !grid.hidden;
      showNotice(notice, '');
    } catch (error) {
      console.error('Could not load public library media:', error);
      showNotice(notice, userFacingError(error, 'Não foi possível carregar a biblioteca agora.'), true);
    }
  }

  function createLightbox(className = 'gallery-lightbox', label = 'Fotografia ampliada') {
    const dialog = document.createElement('dialog');
    dialog.className = className;
    dialog.dataset.imageLightbox = '';
    dialog.dataset.galleryLightbox = '';
    dialog.setAttribute('aria-label', label);
    dialog.innerHTML = `
      <button class="lightbox-close" type="button" data-close-lightbox aria-label="Fechar fotografia">×</button>
      <img alt="" data-lightbox-image />
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-close-lightbox]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dialog.open) dialog.close();
    });
  }

  function openLightbox(src, alt) {
    if (!src) return;
    const dialog = document.querySelector('[data-image-lightbox]');
    if (!dialog) return;
    const image = dialog.querySelector('[data-lightbox-image]');
    image.src = src;
    image.alt = alt || 'Fotografia ampliada';
    dialog.showModal();
    dialog.querySelector('[data-close-lightbox]').focus();
  }

  function setChatAccess(allowed) {
    const login = document.querySelector('#app [data-login-form]');
    const loginSignOut = document.querySelector('#app [data-login-sign-out]');
    const area = document.querySelector('[data-chat-area]');
    const signOutButton = document.querySelector('.site-header [data-sign-out]');
    const loginSection = login && login.closest('.page-content');
    if (login) login.hidden = allowed;
    if (loginSection) loginSection.hidden = allowed;
    if (loginSignOut) loginSignOut.hidden = !state.user;
    if (signOutButton) signOutButton.hidden = !allowed;
    if (area) area.hidden = !allowed;
    document.body.classList.toggle('chat-active', allowed);
    if (allowed) {
      loadChat();
      startChatPolling();
    }
    else {
      stopChatPolling();
      const messages = document.querySelector('[data-chat-messages]');
      if (messages) messages.replaceChildren();
    }
  }

  function setGalleryAccess(allowed) {
    const section = document.querySelector('[data-gallery-tools]');
    if (!section) return;
    const login = section.querySelector('[data-gallery-login]');
    const form = section.querySelector('[data-gallery-form]');
    const signOutButton = section.querySelector('[data-gallery-sign-out]');
    if (login && allowed) login.hidden = true;
    const loginSignOut = section.querySelector('[data-login-sign-out]');
    if (loginSignOut) loginSignOut.hidden = !state.user;
    if (!allowed && form) form.hidden = true;
    if (signOutButton) signOutButton.hidden = !allowed;
    if (!allowed) {
      if (form) form.hidden = true;
    }
  }

  function setMediaAccess(allowed) {
    const section = document.querySelector('[data-media-tools]');
    if (!section) return;
    const login = section.querySelector('[data-media-login]');
    const form = section.querySelector('[data-media-form]');
    const signOutButton = section.querySelector('[data-media-sign-out]');
    if (login && allowed) login.hidden = true;
    const loginSignOut = section.querySelector('[data-login-sign-out]');
    if (loginSignOut) loginSignOut.hidden = !state.user;
    if (!allowed && form) form.hidden = true;
    if (signOutButton) signOutButton.hidden = !allowed;
  }

  function applyAccessState() {
    const allowed = Boolean(state.user && state.token && state.approved);
    if (document.body.dataset.page === 'chat') setChatAccess(allowed);
    if (document.body.dataset.page === 'galeria') setGalleryAccess(allowed);
    if (document.body.dataset.page === 'biblioteca') setMediaAccess(allowed);
  }

  async function clearSession() {
    state.token = '';
    state.user = null;
    state.approved = false;
    sessionStorage.removeItem(SESSION_KEY);
    applyAccessState();
  }

  async function signOut() {
    try {
      const auth = await window.FirebaseReady;
      if (auth && auth.currentUser) await auth.signOut();
    } catch (error) {
      console.warn('Firebase sign-out failed; the browser collaboration session was removed:', error);
    } finally {
      await clearSession();
    }
  }

  async function restoreSession() {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    try {
      const auth = await window.FirebaseReady;
      if (!auth) throw window.FirebaseError || new Error('O Firebase não foi inicializado.');
      const firebaseUser = auth.currentUser;
      const idToken = firebaseUser ? await firebaseUser.getIdToken() : token;
      if (idToken.indexOf('.') < 1) throw new Error('A sessão guardada não é uma sessão Firebase. Inicia sessão novamente.');
      const verify = await apiRequest({ action: 'verifyFirebase', idToken: idToken });
      state.token = idToken;
      state.user = verify.user;
      state.approved = true;
      sessionStorage.setItem(SESSION_KEY, idToken);
      applyAccessState();
    } catch (error) {
      console.warn('Saved collaboration session is no longer valid:', error);
      await clearSession();
      showNotice(
        document.querySelector('[data-login-notice]'),
        userFacingError(error, 'Não foi possível retomar a sessão. Inicia sessão novamente.'),
        true
      );
    }
  }

  async function init({ page }) {
    if (page === 'chat') renderChat();
    if (page === 'galeria') renderGalleryTools();
    if (page === 'biblioteca') renderMediaTools();
    if (!['chat', 'galeria', 'biblioteca'].includes(page)) return;
    if (page === 'chat') window.addEventListener('pagehide', stopChatPolling, { once: true });

    if (page === 'galeria') loadGallery();
    if (page === 'biblioteca') loadMedia();
    const loginNotice = document.querySelector('[data-login-notice]');
    try {
      apiUrl();
      await restoreSession();
    } catch (error) {
      console.error('Collaboration API is unavailable:', error);
      showNotice(
        loginNotice || document.querySelector('[data-gallery-notice]'),
        userFacingError(error, 'Esta ação não está disponível neste momento. Tenta novamente mais tarde.'),
        true
      );
    }
  }

  window.Collaboration = { init };
})();
