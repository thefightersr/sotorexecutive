// SotoR Executive — interactions
(() => {
  const WHATSAPP = '41772270476'; // digits only, no "+" or spaces
  const EMAIL = 'antonysoto_04@hotmail.com';

  const lang = document.documentElement.lang || 'de';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header turns solid and mobile action bar appears after the hero
  const top = document.querySelector('.top');
  const bar = document.querySelector('.bar');
  const hero = document.querySelector('.hero');
  let formInView = false;
  const onScroll = () => {
    const y = scrollY;
    top.classList.toggle('solid', y > 40);
    if (bar) bar.classList.toggle('show', y > hero.offsetHeight * 0.6 && !formInView);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hide the action bar while the booking form is on screen
  const booking = document.getElementById('booking');
  if (booking) new IntersectionObserver(([e]) => { formInView = e.isIntersecting; onScroll(); }).observe(booking);

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Fleet slider: native scroll-snap + dots, arrows and autoplay
  const slider = document.querySelector('.slider');
  if (slider) {
    const track = slider.querySelector('.track');
    const slides = [...track.children];
    const dots = slider.querySelector('.dots');
    const DURATION = 6000;
    let index = 0, timer = null, visible = false;

    slider.style.setProperty('--dur', DURATION + 'ms');
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
      b.addEventListener('click', () => { go(i); stop(); });
      dots.append(b);
    });

    const mark = i => {
      index = i;
      slides.forEach((s, n) => s.classList.toggle('active', n === i));
      [...dots.children].forEach((d, n) => {
        d.removeAttribute('aria-current');
        if (n === i) { void d.offsetWidth; d.setAttribute('aria-current', 'true'); } // restart progress
      });
    };
    const go = i => {
      i = (i + slides.length) % slides.length;
      const s = slides[i];
      track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      mark(i);
    };
    const play = () => {
      if (reduced || timer || slider.classList.contains('paused') || !visible) return;
      timer = setInterval(() => go(index + 1), DURATION);
    };
    const halt = () => { clearInterval(timer); timer = null; };
    const stop = () => { halt(); slider.classList.add('paused'); }; // user took control

    slider.querySelector('.prev').addEventListener('click', () => { go(index - 1); stop(); });
    slider.querySelector('.next').addEventListener('click', () => { go(index + 1); stop(); });
    track.addEventListener('pointerdown', stop, { passive: true });
    track.addEventListener('touchstart', stop, { passive: true });

    // Keep dots in sync when the user swipes
    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0, dist = Infinity;
        slides.forEach((s, n) => {
          const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - center);
          if (d < dist) { dist = d; best = n; }
        });
        if (best !== index) mark(best);
      });
    }, { passive: true });

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? play() : halt();
    }, { threshold: 0.4 }).observe(slider);

    if (reduced) slider.classList.add('paused');
    mark(0);
  }

  // Count-up for the key figures (final values stay in the HTML for no-JS / SEO)
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduced) {
    const run = el => {
      const target = +el.dataset.count, t0 = performance.now(), dur = 1600;
      const step = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const co = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { run(e.target); co.unobserve(e.target); }
    });
    counters.forEach(el => { el.textContent = '0'; co.observe(el); });
  }

  // Exterior / interior crossfade inside a slide
  document.querySelectorAll('.gallery').forEach(g => {
    const buttons = [...g.querySelectorAll('.views button')];
    const show = alt => {
      g.classList.toggle('alt', alt);
      buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === +alt)));
    };
    let auto = reduced ? null : setInterval(() => show(!g.classList.contains('alt')), 3500);
    buttons.forEach((b, n) => b.addEventListener('click', () => {
      clearInterval(auto); auto = null;
      show(n === 1);
    }));
  });

  // Booking form → prefilled WhatsApp message (or e-mail)
  const form = document.getElementById('booking');
  if (form) {
    const when = form.elements.when;
    const pad = n => String(n).padStart(2, '0');
    const d = new Date();
    when.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const message = () => {
      const lines = [form.dataset.intro, ''];
      for (const el of form.querySelectorAll('[data-label]')) {
        if ((el.type === 'radio' && !el.checked) || !el.value.trim()) continue;
        let value = el.value.trim();
        if (el.type === 'datetime-local') {
          value = new Date(value).toLocaleString(lang, { dateStyle: 'full', timeStyle: 'short' });
        }
        lines.push(`${el.dataset.label}: ${value}`);
      }
      return lines.join('\n');
    };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message())}`;
      if (!window.open(url, '_blank')) location.href = url;
    });

    document.getElementById('by-mail')?.addEventListener('click', () => {
      if (!form.reportValidity()) return;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(message())}`;
    });
  }
})();
