// ── Header: light sobre hero oscuro → dark al salir del hero ──
const header = document.getElementById('header');
const hero   = document.querySelector('.hero');

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    header.classList.toggle('header--light', entry.isIntersecting);
    header.classList.toggle('header--dark',  !entry.isIntersecting);
  },
  { threshold: 0.1 }
);
if (hero) headerObserver.observe(hero);

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
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Acordeón ──
document.querySelectorAll('.accordion__head').forEach(head => {
  head.addEventListener('click', () => toggleAccordion(head));
  head.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAccordion(head); }
  });
});

function toggleAccordion(head) {
  const item    = head.closest('.accordion__item');
  const isOpen  = item.classList.contains('open');

  document.querySelectorAll('.accordion__item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.accordion__head').setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    item.classList.add('open');
    head.setAttribute('aria-expanded', 'true');
  }
}

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
  setTimeout(() => searchInput.focus(), 60);
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

// ── Newsletter ──
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn   = document.getElementById('subscribe-btn');
    const input = newsletterForm.querySelector('input');
    btn.textContent = '¡Suscrito! ✓';
    btn.style.background = 'var(--ink)';
    btn.style.color = 'var(--paper)';
    input.value = '';
    setTimeout(() => {
      btn.textContent = 'Suscribirme';
      btn.style.background = '';
      btn.style.color = '';
    }, 4000);
  });
}
