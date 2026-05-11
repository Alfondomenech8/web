// ── Header: light sobre hero oscuro → dark al salir ──
const header   = document.getElementById('header');
const heroEl   = document.getElementById('hero');

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    header.classList.toggle('header--light', entry.isIntersecting);
    header.classList.toggle('header--dark',  !entry.isIntersecting);
  },
  { threshold: 0.1 }
);
if (heroEl) headerObserver.observe(heroEl);

// ── Parallax hero background ──
const heroBg = document.getElementById('hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      heroBg.style.transform = `translateY(${y * 0.28}px)`;
    }
  }, { passive: true });
}

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Menú móvil ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
window.closeMobileMenu = closeMobileMenu;

// ── Búsqueda overlay ──
const searchOverlay = document.getElementById('search-overlay');
const searchInput   = document.getElementById('search-input');

document.getElementById('search-open').addEventListener('click', openSearch);
document.getElementById('search-close').addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

function openSearch() {
  searchOverlay.classList.add('open');
  setTimeout(() => searchInput.focus(), 80);
  document.body.style.overflow = 'hidden';
}
function closeSearch() {
  searchOverlay.classList.remove('open');
  searchInput.value = '';
  document.body.style.overflow = '';
}

// ── Carrito drawer ──
const cartDrawer  = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');

document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Escape cierra todo ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeSearch();
  closeCart();
  closeMobileMenu();
});

// ── Newsletter / Membership form ──
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn   = document.getElementById('subscribe-btn');
    const input = newsletterForm.querySelector('input');
    const orig  = btn.textContent;
    btn.textContent = '¡Bienvenida al Select! ✓';
    btn.style.background = 'var(--ink)';
    input.value = '';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 4000);
  });
}

// ── Ticker pausa en hover (ya en CSS, refuerzo para móvil) ──
const ticker = document.querySelector('.ticker__track');
if (ticker) {
  ticker.addEventListener('touchstart', () => ticker.style.animationPlayState = 'paused', { passive: true });
  ticker.addEventListener('touchend',   () => ticker.style.animationPlayState = 'running', { passive: true });
}
