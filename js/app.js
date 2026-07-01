import { initTheme, toggleTheme } from './theme.js';
import { loadStore, resetStore, setUserName, setCurrency } from './storage.js';
import { addTransaction, updateTransaction, deleteTransaction, getTransaction, validateTransaction } from './transaction.js';
import { renderDashboard, renderTransactionsPage, renderAnalyticsPage, renderBudgetPage, renderReportsPage, renderSettingsPage, showToast, renderNavUser, updateTxFilter, setTxPage } from './ui.js';
import { renderTrendChart, renderCategoryChart, renderExpenseOnlyChart, renderBudgetUtilizationChart, refreshChartTheme } from './charts.js';
import { exportCSV } from './export.js';
import { updateMonthlyBudget } from './budget.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories.js';
import { escapeHtml, todayISO } from './utils.js';

// ── Seed data ──────────────────────────────────────────────────────────
function seedIfEmpty() {
  const store = loadStore();
  if (store.transactions.length > 0) return;
  const now = new Date();
  const day = (n) => {
    const d = new Date(now); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  const seeds = [
    { title:'Monthly Salary',       type:'income',  category:'salary',       amount:75000,  date:day(2),  note:'June paycheck' },
    { title:'Freelance Project',     type:'income',  category:'freelance',    amount:15000,  date:day(5),  note:'UI design work' },
    { title:'Apartment Rent',        type:'expense', category:'housing',      amount:18000,  date:day(1),  note:'June rent' },
    { title:'Starbucks Coffee',      type:'expense', category:'food',         amount:250,    date:day(3),  note:'Morning coffee' },
    { title:'Netflix Subscription',  type:'expense', category:'subscriptions',amount:649,    date:day(4),  note:'Monthly plan' },
    { title:'Grocery Shopping',      type:'expense', category:'food',         amount:3500,   date:day(6),  note:'Weekly groceries' },
    { title:'Uber Ride',             type:'expense', category:'transport',    amount:450,    date:day(7),  note:'To airport' },
    { title:'Gym Membership',        type:'expense', category:'healthcare',   amount:1999,   date:day(9),  note:'Monthly gym' },
    { title:'Amazon Purchase',       type:'expense', category:'shopping',     amount:2499,   date:day(10), note:'New headphones' },
    { title:'Client Payment',        type:'income',  category:'freelance',    amount:12000,  date:day(32), note:'Website redesign' },
    { title:'Investment Dividend',   type:'income',  category:'investment',   amount:2500,   date:day(35), note:'Q2 dividend' },
    { title:'Electricity Bill',      type:'expense', category:'housing',      amount:3200,   date:day(33), note:'May electricity' },
    { title:'Restaurant Dinner',     type:'expense', category:'food',         amount:1800,   date:day(36), note:'Team dinner' },
    { title:'Spotify Premium',       type:'expense', category:'subscriptions',amount:119,    date:day(38), note:'Music subscription' },
    { title:'Flight Ticket',         type:'expense', category:'travel',       amount:6500,   date:day(40), note:'Business trip' },
    { title:'Monthly Salary',        type:'income',  category:'salary',       amount:75000,  date:day(32), note:'May paycheck' },
    { title:'Online Course',         type:'expense', category:'education',    amount:499,    date:day(42), note:'React course' },
    { title:'Pharmacy',              type:'expense', category:'healthcare',   amount:850,    date:day(45), note:'Medication' },
    { title:'Movie Tickets',         type:'expense', category:'entertainment',amount:600,    date:day(50), note:'Weekend movie' },
    { title:'Freelance Website',     type:'income',  category:'freelance',    amount:35000,  date:day(62), note:'Ecommerce project' },
    { title:'Monthly Salary',        type:'income',  category:'salary',       amount:75000,  date:day(62), note:'April paycheck' },
    { title:'Car Insurance',         type:'expense', category:'transport',    amount:2500,   date:day(63), note:'Monthly premium' },
    { title:'Groceries',             type:'expense', category:'food',         amount:3200,   date:day(65), note:'Weekly shop' },
    { title:'New Laptop',            type:'expense', category:'shopping',     amount:65000,  date:day(68), note:'Work laptop' },
  ];
  const { uuid } = { uuid: () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) };
  store.transactions = seeds.map(s => ({ id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), ...s }));
  import('./storage.js').then(({ saveStore }) => saveStore(store));
}

// ── Routing ────────────────────────────────────────────────────────────
let currentPage = 'dashboard';
const chartPages = new Set();

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) { pageEl.classList.add('active'); pageEl.classList.add('page-enter'); setTimeout(() => pageEl.classList.remove('page-enter'), 300); }
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  currentPage = page;
  closeSidebar();
  renderPage(page);
}

function renderPage(page) {
  if (window.AOS) AOS.refresh();
  switch (page) {
    case 'dashboard':
      renderDashboard();
      setTimeout(() => {
        renderExpenseOnlyChart('dash-trend-chart');
        if (window.gsap) gsap.from('#dash-cards .summary-card', { y: 16, opacity: 0, duration: 0.35, stagger: 0.07, ease: 'power2.out' });
      }, 50);
      break;
    case 'transactions':
      renderTransactionsPage();
      break;
    case 'analytics':
      renderAnalyticsPage();
      setTimeout(() => {
        renderTrendChart('an-trend-chart');
        renderCategoryChart('an-cat-chart');
      }, 80);
      break;
    case 'budget':
      renderBudgetPage();
      setTimeout(() => renderBudgetUtilizationChart('bud-history-chart'), 80);
      break;
    case 'reports':
      renderReportsPage();
      break;
    case 'settings':
      renderSettingsPage();
      break;
  }
}

// ── Sidebar ────────────────────────────────────────────────────────────
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

// ── Transaction Modal ──────────────────────────────────────────────────
let editingId = null;

function openModal(tx = null) {
  editingId = tx ? tx.id : null;
  const modal = document.getElementById('tx-modal');
  const title = document.getElementById('modal-title');
  if (title) title.textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  clearModalErrors();

  const form = document.getElementById('tx-form');
  if (!form) return;

  const typeIncome  = document.getElementById('type-income');
  const typeExpense = document.getElementById('type-expense');
  const type = tx ? tx.type : 'expense';
  if (typeIncome)  typeIncome.checked  = type === 'income';
  if (typeExpense) typeExpense.checked = type === 'expense';

  form.querySelector('[name=title]').value    = tx?.title    || '';
  form.querySelector('[name=amount]').value   = tx?.amount   || '';
  form.querySelector('[name=date]').value     = tx?.date     || todayISO();
  form.querySelector('[name=note]').value     = tx?.note     || '';

  updateCategoryOptions(type);
  setTimeout(() => { form.querySelector('[name=category]').value = tx?.category || ''; }, 10);

  modal?.classList.add('open');
}

window.openEditTx = (id) => {
  const tx = getTransaction(id);
  if (tx) openModal(tx);
};

window.confirmDeleteTx = (id) => {
  const tx = getTransaction(id);
  if (!tx) return;
  Swal.fire({
    title: 'Delete Transaction?',
    text: `"${tx.title}" will be permanently removed.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#EF4444',
    cancelButtonText: 'Cancel',
    background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#fff',
    color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A',
    customClass: { popup: 'swal-popup' }
  }).then(r => {
    if (r.isConfirmed) {
      deleteTransaction(id);
      showToast('success', 'Deleted', 'Transaction removed.');
      renderPage(currentPage);
    }
  });
};

window.txGoPage = (p) => { setTxPage(p); };

function updateCategoryOptions(type) {
  const select = document.getElementById('modal-category');
  if (!select) return;
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = `<option value="">Select category</option>` + cats.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

function clearModalErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control, .form-select').forEach(el => el.style.borderColor = '');
}

function showFieldError(field, msg) {
  const el = document.querySelector(`[data-error="${field}"]`);
  if (el) el.textContent = msg;
  const input = document.querySelector(`[name="${field}"]`) || document.getElementById('modal-category');
  if (input) input.style.borderColor = 'var(--danger)';
}

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Migration & Seed first
  let store = loadStore();
  if (store.currency === 'USD') {
    store.currency = 'INR';
    store.budget.monthly = 50000;
    store.budget.categories = {
      food: 8000, housing: 15000, transport: 4000, shopping: 6000,
      entertainment: 3000, healthcare: 3000, education: 2000,
      subscriptions: 1500, travel: 5000, other: 2500
    };
    store.transactions = [];
    const { saveStore } = await import('./storage.js');
    saveStore(store);
  }
  seedIfEmpty();
  store = loadStore();

  // Init theme & render user
  initTheme();
  renderNavUser();

  // Nav links
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.page));
  });

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('open');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    toggleTheme();
    refreshChartTheme();
  });

  // ── Transaction modal ──
  const modal = document.getElementById('tx-modal');
  document.getElementById('modal-close')?.addEventListener('click', () => modal?.classList.remove('open'));
  document.getElementById('modal-cancel')?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  // FAB
  document.getElementById('fab-add')?.addEventListener('click', () => openModal());
  document.getElementById('tx-add-btn')?.addEventListener('click', () => openModal());
  document.getElementById('dash-add-btn')?.addEventListener('click', () => openModal());

  // Type toggle changes category list
  document.querySelectorAll('input[name="type"]').forEach(input => {
    input.addEventListener('change', () => updateCategoryOptions(input.value));
  });

  // Form submit
  document.getElementById('tx-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const type = form.querySelector('input[name="type"]:checked')?.value || 'expense';
    const data = {
      title:    form.querySelector('[name=title]').value,
      amount:   form.querySelector('[name=amount]').value,
      category: document.getElementById('modal-category')?.value,
      date:     form.querySelector('[name=date]').value,
      note:     form.querySelector('[name=note]').value,
      type
    };
    clearModalErrors();
    const errors = validateTransaction(data);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, m]) => showFieldError(f, m));
      return;
    }
    if (editingId) {
      updateTransaction(editingId, data);
      showToast('success', 'Updated', 'Transaction saved.');
    } else {
      addTransaction(data);
      showToast('success', 'Added', 'Transaction recorded.');
    }
    modal?.classList.remove('open');
    renderPage(currentPage);
  });

  // Transactions filters
  document.getElementById('tx-search')?.addEventListener('input', e => updateTxFilter('search', e.target.value));
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateTxFilter('type', btn.dataset.type);
    });
  });
  document.getElementById('tx-cat-filter')?.addEventListener('change', e => updateTxFilter('category', e.target.value));
  document.getElementById('tx-date-from')?.addEventListener('change', e => updateTxFilter('dateFrom', e.target.value));
  document.getElementById('tx-date-to')?.addEventListener('change',   e => updateTxFilter('dateTo',   e.target.value));

  // Category filter options
  const catFilterEl = document.getElementById('tx-cat-filter');
  if (catFilterEl) {
    catFilterEl.innerHTML = `<option value="all">All Categories</option>` +
      [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => `<option value="${c.id}">${escapeHtml(c.label)}</option>`).join('');
  }

  // Budget monthly save
  document.getElementById('bud-save-btn')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('bud-monthly-input')?.value);
    if (!isNaN(val) && val > 0) {
      updateMonthlyBudget(val);
      const symbol = store.currency === 'INR' ? '₹' : (store.currency === 'EUR' ? '€' : (store.currency === 'GBP' ? '£' : '$'));
      showToast('success', 'Budget Updated', `Monthly budget set to ${symbol}${val.toLocaleString(store.currency === 'INR' ? 'en-IN' : 'en-US')}.`);
      renderBudgetPage();
    } else {
      showToast('error', 'Invalid Amount', 'Please enter a valid budget amount.');
    }
  });

  // Export buttons
  document.querySelectorAll('[data-action="export-csv"]').forEach(btn => {
    btn.addEventListener('click', () => { exportCSV(); showToast('success', 'Exported', 'CSV file downloaded.'); });
  });

  // Settings
  document.getElementById('settings-dark-toggle')?.addEventListener('change', e => {
    const { setTheme } = { setTheme: (t) => { const { setTheme: st } = window.__storage || {}; if (st) st(t); } };
    toggleTheme();
    refreshChartTheme();
  });

  document.querySelectorAll('.currency-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setCurrency(opt.dataset.currency);
      document.querySelectorAll('.currency-option').forEach(o => o.classList.toggle('active', o === opt));
      showToast('success', 'Currency Updated', `Currency set to ${opt.dataset.currency}.`);
      renderPage(currentPage);
    });
  });

  document.getElementById('settings-name-save')?.addEventListener('click', () => {
    const name = document.getElementById('settings-name')?.value?.trim();
    if (!name) return showToast('error', 'Name Required', 'Enter your name.');
    setUserName(name);
    renderNavUser();
    showToast('success', 'Saved', 'Display name updated.');
  });

  document.getElementById('settings-reset-btn')?.addEventListener('click', () => {
    Swal.fire({
      title: 'Reset All Data?',
      text: 'This will permanently delete all transactions and settings. This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset Everything',
      confirmButtonColor: '#EF4444',
      cancelButtonText: 'Cancel',
      background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#fff',
      color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A',
    }).then(r => {
      if (r.isConfirmed) { resetStore(); location.reload(); }
    });
  });

  // Navbar search (global)
  document.getElementById('navbar-search')?.addEventListener('input', e => {
    if (currentPage !== 'transactions') navigateTo('transactions');
    setTimeout(() => updateTxFilter('search', e.target.value), 50);
  });

  // Init AOS first, then navigate
  if (window.AOS) AOS.init({ duration: 400, once: true, offset: 0 });

  // Initial render
  navigateTo('dashboard');
});
