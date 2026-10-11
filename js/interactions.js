(function () {
  function revealCards() {
    const elements = document.querySelectorAll('.reveal, .card, .message-card, .photo-card, .feature-card');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('reveal-item', 'visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -6% 0px' });

    elements.forEach((element) => {
      element.classList.add('reveal-item');
      observer.observe(element);
    });
  }

  function bindTouchCardFeedback() {
    if (window.touchCardFeedbackBound) return;
    window.touchCardFeedbackBound = true;
    let releaseTimer = 0;

    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      const card = event.target.closest('.photo-card, .message-card, .feature-card, .gallery-item');
      if (!card) return;
      window.clearTimeout(releaseTimer);
      document.querySelectorAll('.touch-active').forEach((active) => active.classList.remove('touch-active'));
      card.classList.add('touch-active');
      releaseTimer = window.setTimeout(() => card.classList.remove('touch-active'), 850);
    }, { passive: true });

    document.addEventListener('pointercancel', () => {
      window.clearTimeout(releaseTimer);
      document.querySelectorAll('.touch-active').forEach((active) => active.classList.remove('touch-active'));
    }, { passive: true });
  }

  function bindEnvelope() {
    const envelope = document.querySelector('.letter-envelope');
    if (!envelope) return;

    envelope.addEventListener('click', () => {
      const isOpen = envelope.classList.toggle('opened');
      envelope.setAttribute('aria-expanded', String(isOpen));
      const letter = document.querySelector('.letter-content');
      if (letter) {
        letter.classList.toggle('visible', isOpen);
      }
    });
  }

  function bindSurpriseCards() {
    document.querySelectorAll('.flip-card').forEach((card) => {
      const toggleCard = () => {
        const isFlipped = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', String(isFlipped));
      };

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('click', toggleCard);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleCard();
        }
      });
    });
  }

  function bindImageErrors() {
    document.querySelectorAll('img').forEach((image) => {
      const markLoaded = () => image.classList.add('image-loaded');
      if (image.complete && image.naturalWidth > 0) {
        markLoaded();
      } else if (image.complete) {
        image.hidden = true;
      } else {
        image.addEventListener('load', markLoaded, { once: true });
      }
      image.addEventListener('error', () => {
        image.hidden = true;
      }, { once: true });
    });
  }

  function addAmbientCanvas() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.querySelector('#ambient-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-canvas';
    canvas.className = 'ambient-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const context = canvas.getContext('2d');
    if (!context) {
      canvas.remove();
      return;
    }

    const symbols = ['♥', '✦', '·'];
    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 9 + Math.random() * 10,
      speed: 0.00008 + Math.random() * 0.00016,
      drift: (Math.random() - 0.5) * 0.00008,
      opacity: 0.12 + Math.random() * 0.2,
      symbol: symbols[Math.floor(Math.random() * symbols.length)]
    }));
    let animationFrame = 0;
    let lastFrameTime = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (timestamp) => {
      animationFrame = 0;
      if (document.hidden || timestamp - lastFrameTime < 66) {
        if (!document.hidden) animationFrame = window.requestAnimationFrame(draw);
        return;
      }
      const delta = lastFrameTime ? Math.min(timestamp - lastFrameTime, 100) / 16.67 : 1;
      lastFrameTime = timestamp;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.y -= particle.speed * delta;
        particle.x += particle.drift * delta;
        if (particle.y < -0.04) {
          particle.y = 1.04;
          particle.x = Math.random();
        }
        context.globalAlpha = particle.opacity;
        context.fillStyle = particle.symbol === '♥' ? '#c2185b' : '#c6a15b';
        context.font = `${particle.size}px Poppins, sans-serif`;
        context.fillText(particle.symbol, particle.x * window.innerWidth, particle.y * window.innerHeight);
      });
      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !animationFrame) animationFrame = window.requestAnimationFrame(draw);
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastFrameTime = 0;
      }
    });
    animationFrame = window.requestAnimationFrame(draw);
  }

  function addFloatingInviteLink() {
    if (document.querySelector('.floating-invite')) return;

    const root = window.getRelativeRoot ? window.getRelativeRoot() : './';
    const link = document.createElement('a');
    link.className = 'floating-invite';
    link.href = `${root}pages/convite.html#whatsapp-invite`;
    link.setAttribute('aria-label', 'Ir para o convite e contacto');
    link.title = 'Ir para o convite';
    link.innerHTML = '<span aria-hidden="true">♥</span>';
    document.body.appendChild(link);
  }

  function bindHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.heroParallaxBound) return;
    window.heroParallaxBound = true;

    let scheduled = false;
    const update = () => {
      const heroImage = document.querySelector('.hero-visual img');
      if (!heroImage) {
        scheduled = false;
        return;
      }
      const bounds = heroImage.getBoundingClientRect();
      const offset = Math.max(-22, Math.min(22, (bounds.top - window.innerHeight / 2) * -0.035));
      heroImage.style.setProperty('--hero-parallax-y', `${offset}px`);
      scheduled = false;
    };

    window.addEventListener('scroll', () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function bindRandomMessage() {
    const trigger = document.querySelector('[data-random-message]');
    if (!trigger) return;

    const messages = Array.from(document.querySelectorAll('[data-hidden-message]')).map((item) => item.textContent.trim());
    trigger.addEventListener('click', () => {
      if (!messages.length) return;
      const message = messages[Math.floor(Math.random() * messages.length)];
      const target = document.querySelector('[data-random-output]');
      if (target) {
        target.textContent = message;
      }
    });
  }

  function init() {
    revealCards();
    bindTouchCardFeedback();
    bindEnvelope();
    bindSurpriseCards();
    bindRandomMessage();
    bindImageErrors();
    addAmbientCanvas();
    addFloatingInviteLink();
    bindHeroParallax();
  }

  window.Interactions = {
    init,
    refreshReveals: revealCards
  };
})();
