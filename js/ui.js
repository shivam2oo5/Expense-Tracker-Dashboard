import { getCurrency, getUserName } from './storage.js';
import { formatCurrency, formatDate, pct, escapeHtml, animateCounter } from './utils.js';
import { calcSummary, calcMonthly, getRecentTransactions, calcCategoryBreakdown, calcLast6Months } from './analytics.js';
import { getBudgetSummary, getCategoryBudgetStatus, getAlerts } from './budget.js';
import { getCategoryMeta, BUDGET_CATEGORIES } from '../data/categories.js';
import { getAllTransactions, filterTransactions } from './transaction.js';
import { monthLabel } from './utils.js';

// ── Toast ──────────────────────────────────────────────────────────────
export function showToast(type, title, msg) {
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-icon"><i class="fa-solid ${icons[type]||icons.info}"></i></div><div><div class="toast-title">${escapeHtml(title)}</div>${msg?`<div class="toast-msg">${escapeHtml(msg)}</div>`:''}</div>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 220); }, 3200);
}

// ── Navbar user ────────────────────────────────────────────────────────
export function renderNavUser() {
  const name = getUserName();
  document.querySelectorAll('.u-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.u-avatar').forEach(el => el.textContent = name.charAt(0).toUpperCase());
}

// ── Dashboard ──────────────────────────────────────────────────────────
export function renderDashboard() {
  const { totalIncome, totalExpense, balance, savings } = calcSummary();
  const monthly = calcMonthly();
  const currency = getCurrency();

  const animEl = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.currency = currency;
    el.dataset.prefix = '';
    animateCounter(el, val);
  };
  animEl('dash-balance', balance);
  animEl('dash-income',  monthly.income);
  animEl('dash-expense', monthly.expense);
  animEl('dash-savings', savings);

  // Budget ring
  const bs = getBudgetSummary();
  const ringEl = document.getElementById('dash-budget-pct');
  if (ringEl) ringEl.textContent = bs.pct + '%';
  const ringSubEl = document.getElementById('dash-budget-sub');
  if (ringSubEl) ringSubEl.textContent = 'of budget used';
  renderBudgetRing('dash-budget-ring', bs.pct);

  const budgetInfoEl = document.getElementById('dash-budget-info');
  if (budgetInfoEl) {
    budgetInfoEl.innerHTML = `
      <div class="d-flex justify-content-between mb-1"><span style="font-size:12px;color:var(--text-muted)">Total Budget</span><span style="font-size:12px;font-weight:700">${formatCurrency(bs.monthly, currency)}</span></div>
      <div class="d-flex justify-content-between"><span style="font-size:12px;color:var(--text-muted)">Remaining</span><span style="font-size:12px;font-weight:700;color:${bs.remaining > 0 ? 'var(--success)':'var(--danger)'}">${formatCurrency(bs.remaining, currency)}</span></div>
    `;
  }

  // Recent transactions
  renderRecentTransactions();

  // Category breakdown bars
  renderCategoryBars();
}

function renderBudgetRing(canvasId, pctVal) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  if (canvas._chart) canvas._chart.destroy();
  const clamped = Math.min(pctVal, 100);
  const color = pctVal >= 100 ? '#EF4444' : pctVal >= 80 ? '#F59E0B' : '#4F46E5';
  canvas._chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{ data: [clamped, 100 - clamped], backgroundColor: [color, 'rgba(226,232,240,.4)'], borderWidth: 0, hoverOffset: 0 }]
    },
    options: {
      responsive: false, cutout: '78%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 700 }
    }
  });
}

function renderRecentTransactions() {
  const txs = getRecentTransactions(6);
  const currency = getCurrency();
  const tbody = document.getElementById('recent-tx-body');
  if (!tbody) return;
  if (!txs.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">No transactions yet. Add your first one!</td></tr>`;
    return;
  }
  tbody.innerHTML = txs.map(t => {
    const cat = getCategoryMeta(t.category, t.type);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="tx-icon ${cat.css}" style="background:${iconBg(cat.css)};color:${iconColor(cat.css)}"><i class="fa-solid ${cat.icon}"></i></div>
          <div><div class="tx-title">${escapeHtml(t.title)}</div><div class="tx-sub">${escapeHtml(cat.label)}</div></div>
        </div>
      </td>
      <td><span class="badge ${cat.css}">${escapeHtml(cat.label)}</span></td>
      <td style="color:var(--text-muted);font-size:12px">${formatDate(t.date)}</td>
      <td class="${t.type==='income'?'amount-pos':'amount-neg'}" style="font-weight:700;font-variant-numeric:tabular-nums">${t.type==='income'?'+':'-'}${formatCurrency(t.amount, currency)}</td>
    </tr>`;
  }).join('');
}

function renderCategoryBars() {
  const breakdown = calcCategoryBreakdown('expense');
  const container = document.getElementById('dash-cat-bars');
  if (!container) return;
  const currency = getCurrency();
  if (!breakdown.length) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">No expense data yet</div>`;
    return;
  }
  container.innerHTML = breakdown.slice(0, 5).map(b => `
    <div class="insight-row">
      <span class="insight-label">${escapeHtml(b.meta.label)}</span>
      <span class="insight-pct">${b.pct}%</span>
      <div style="width:100px"><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${b.pct}%"></div></div></div>
    </div>
  `).join('');
}

// ── Transactions page ──────────────────────────────────────────────────
let txState = { type: 'all', category: 'all', search: '', page: 1, perPage: 10, sort: 'date', sortDir: 'desc' };

export function renderTransactionsPage() {
  renderTxTable();
}

export function updateTxFilter(key, val) {
  txState[key] = val;
  txState.page = 1;
  renderTxTable();
}

export function setTxPage(p) { txState.page = p; renderTxTable(); }

function renderTxTable() {
  const currency = getCurrency();
  let txs = filterTransactions({ type: txState.type === 'all' ? '' : txState.type, category: txState.category === 'all' ? '' : txState.category, search: txState.search });

  // sort
  txs.sort((a, b) => {
    let va = a[txState.sort], vb = b[txState.sort];
    if (txState.sort === 'amount') { va = +va; vb = +vb; }
    if (va < vb) return txState.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return txState.sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const total = txs.length;
  const pages = Math.max(1, Math.ceil(total / txState.perPage));
  txState.page = Math.min(txState.page, pages);
  const slice = txs.slice((txState.page - 1) * txState.perPage, txState.page * txState.perPage);

  const tbody = document.getElementById('tx-tbody');
  if (!tbody) return;
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-receipt"></i></div><h3>No transactions found</h3><p>Try adjusting your filters or add a new transaction.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = slice.map(t => {
      const cat = getCategoryMeta(t.category, t.type);
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="tx-icon ${cat.css}" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;background:${iconBg(cat.css)};color:${iconColor(cat.css)}"><i class="fa-solid ${cat.icon}"></i></div>
            <div><div class="tx-title">${escapeHtml(t.title)}</div><div class="tx-sub">${escapeHtml(t.note||'')}</div></div>
          </div>
        </td>
        <td><span class="badge ${cat.css}">${escapeHtml(cat.label)}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${formatDate(t.date)}</td>
        <td class="${t.type==='income'?'amount-pos':'amount-neg'}">${t.type==='income'?'+':'-'}${formatCurrency(t.amount, currency)}</td>
        <td><div class="action-btns"><button class="action-btn edit" onclick="window.openEditTx('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="action-btn delete" onclick="window.confirmDeleteTx('${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`;
    }).join('');
  }

  // pagination
  const pagInfo = document.getElementById('tx-page-info');
  const pagBtns = document.getElementById('tx-page-btns');
  if (pagInfo) pagInfo.textContent = total ? `Showing ${(txState.page-1)*txState.perPage+1}–${Math.min(txState.page*txState.perPage, total)} of ${total}` : 'No results';
  if (pagBtns) {
    let html = `<button class="page-btn" onclick="window.txGoPage(${txState.page-1})" ${txState.page<=1?'disabled':''}><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = Math.max(1, txState.page-2); i <= Math.min(pages, txState.page+2); i++) {
      html += `<button class="page-btn ${i===txState.page?'active':''}" onclick="window.txGoPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="window.txGoPage(${txState.page+1})" ${txState.page>=pages?'disabled':''}><i class="fa-solid fa-chevron-right"></i></button>`;
    pagBtns.innerHTML = html;
  }
}

// ── Analytics page ─────────────────────────────────────────────────────
export function renderAnalyticsPage() {
  const { totalIncome, totalExpense, balance } = calcSummary();
  const currency = getCurrency();
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('an-balance', formatCurrency(balance, currency));
  setEl('an-income',  formatCurrency(totalIncome, currency));
  setEl('an-expense', formatCurrency(totalExpense, currency));
  const savings = totalIncome > 0 ? Math.round((Math.max(0, balance) / totalIncome) * 100) : 0;
  setEl('an-savings-pct', savings + '%');

  renderTopCategories();
}

function renderTopCategories() {
  const breakdown = calcCategoryBreakdown('expense');
  const currency = getCurrency();
  const container = document.getElementById('an-top-cats');
  if (!container) return;
  if (!breakdown.length) { container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">No data yet</div>`; return; }
  container.innerHTML = breakdown.slice(0, 6).map(b => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${escapeHtml(b.meta.label)}</span>
        <span style="font-size:12px;font-weight:700;color:var(--text-muted)">${formatCurrency(b.amount,currency)} &bull; ${b.pct}%</span>
      </div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${b.pct}%"></div></div>
    </div>
  `).join('');
}

// ── Budget page ────────────────────────────────────────────────────────
export function renderBudgetPage() {
  const bs = getBudgetSummary();
  const cats = getCategoryBudgetStatus();
  const alerts = getAlerts();
  const currency = getCurrency();

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('bud-spent-pct', bs.pct + '%');
  setEl('bud-spent-of',  `of ${formatCurrency(bs.monthly, currency)}`);
  setEl('bud-spent-val', formatCurrency(bs.totalSpent, currency));
  setEl('bud-daily',     formatCurrency(bs.dailyAvg, currency));
  setEl('bud-days',      bs.daysLeft);
  setEl('bud-available', formatCurrency(bs.remaining, currency));

  renderBudgetRing('bud-ring', bs.pct);

  // Monthly budget input
  const budInput = document.getElementById('bud-monthly-input');
  if (budInput) budInput.value = bs.monthly;

  // Alerts
  const alertsEl = document.getElementById('bud-alerts');
  if (alertsEl) {
    if (!alerts.length) {
      alertsEl.innerHTML = `<div style="padding:14px;color:var(--success);font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-circle-check"></i> All categories are within budget. Great job!</div>`;
    } else {
      alertsEl.innerHTML = alerts.map(a => `
        <div class="alert-banner ${a.status}">
          <i class="fa-solid ${a.status==='danger'?'fa-circle-exclamation':'fa-triangle-exclamation'}"></i>
          <div>
            <div class="alert-banner-title">${escapeHtml(a.label)}: ${a.pct}% used</div>
            <div class="alert-banner-msg">Spent ${formatCurrency(a.spent, currency)} of ${formatCurrency(a.limit, currency)} budget${a.status==='danger'?' — limit exceeded':' — approaching limit'}.</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Category cards
  const catsEl = document.getElementById('bud-cats');
  if (catsEl) {
    catsEl.innerHTML = cats.map(c => `
      <div class="budget-cat-card">
        <div class="budget-cat-header">
          <div class="budget-cat-name"><i class="fa-solid ${c.icon}" style="color:var(--primary)"></i> ${escapeHtml(c.label)}</div>
          <div class="budget-cat-amounts">${formatCurrency(c.spent, currency)} / ${formatCurrency(c.limit, currency)}</div>
        </div>
        <div class="progress-bar-track" style="margin-bottom:6px"><div class="progress-bar-fill ${c.status}" style="width:${Math.min(c.pct,100)}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span style="color:var(--text-muted)">${c.pct}% used</span>
          ${c.status!=='success'?`<span style="color:var(--${c.status})">${c.status==='danger'?'Over budget!':'Near limit'}</span>`:''}
        </div>
      </div>
    `).join('');
  }
}

// ── Reports page ───────────────────────────────────────────────────────
export function renderReportsPage() {
  const { totalIncome, totalExpense, balance, savings } = calcSummary();
  const monthly = calcMonthly();
  const currency = getCurrency();
  const txs = getAllTransactions();
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('rep-total-income',  formatCurrency(totalIncome, currency));
  setEl('rep-total-expense', formatCurrency(totalExpense, currency));
  setEl('rep-net-savings',   formatCurrency(savings, currency));
  setEl('rep-tx-count',      txs.length);
  setEl('rep-m-income',  formatCurrency(monthly.income, currency));
  setEl('rep-m-expense', formatCurrency(monthly.expense, currency));
  setEl('rep-m-savings', formatCurrency(Math.max(0, monthly.savings), currency));
}

// ── Settings page ──────────────────────────────────────────────────────
export function renderSettingsPage() {
  const currency = getCurrency();
  const name = getUserName();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const nameInput = document.getElementById('settings-name');
  if (nameInput) nameInput.value = name;
  const toggle = document.getElementById('settings-dark-toggle');
  if (toggle) toggle.checked = theme === 'dark';
  document.querySelectorAll('.currency-option').forEach(el => {
    el.classList.toggle('active', el.dataset.currency === currency);
  });
}

// ── Category icon helpers ──────────────────────────────────────────────
function iconBg(css) {
  const map = {
    'cat-food':'#fef3c7','cat-housing':'#dbeafe','cat-transport':'#dcfce7','cat-shopping':'#fce7f3',
    'cat-entertainment':'#ede9fe','cat-healthcare':'#fee2e2','cat-education':'#e0f2fe',
    'cat-subscriptions':'#f3e8ff','cat-travel':'#fef9c3','cat-income':'#dcfce7','cat-other':'var(--bg)'
  };
  return map[css] || 'var(--bg)';
}
function iconColor(css) {
  const map = {
    'cat-food':'#92400e','cat-housing':'#1e40af','cat-transport':'#15803d','cat-shopping':'#9d174d',
    'cat-entertainment':'#5b21b6','cat-healthcare':'#b91c1c','cat-education':'#075985',
    'cat-subscriptions':'#6d28d9','cat-travel':'#713f12','cat-income':'#15803d','cat-other':'var(--text-secondary)'
  };
  return map[css] || 'var(--text-secondary)';
}
