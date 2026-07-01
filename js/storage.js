const KEY = 'expenseTracker';

const DEFAULTS = {
  transactions: [],
  budget: {
    monthly: 50000,
    categories: {
      food: 8000, housing: 15000, transport: 4000, shopping: 6000,
      entertainment: 3000, healthcare: 3000, education: 2000,
      subscriptions: 1500, travel: 5000, other: 2500
    }
  },
  theme: 'light',
  currency: 'INR',
  userName: 'Alex'
};

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      budget: { ...DEFAULTS.budget, ...(parsed.budget || {}), categories: { ...DEFAULTS.budget.categories, ...(parsed.budget?.categories || {}) } }
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveStore(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); }
  catch (e) { console.error('Storage error', e); }
}

export function getTransactions() { return loadStore().transactions; }
export function getBudget()       { return loadStore().budget; }
export function getTheme()        { return loadStore().theme; }
export function getCurrency()     { return loadStore().currency; }
export function getUserName()     { return loadStore().userName; }

export function setTheme(theme) {
  const s = loadStore(); s.theme = theme; saveStore(s);
}
export function setCurrency(currency) {
  const s = loadStore(); s.currency = currency; saveStore(s);
}
export function setUserName(name) {
  const s = loadStore(); s.userName = name; saveStore(s);
}
export function setBudget(budget) {
  const s = loadStore(); s.budget = budget; saveStore(s);
}
export function saveTransactions(txs) {
  const s = loadStore(); s.transactions = txs; saveStore(s);
}
export function resetStore() {
  localStorage.removeItem(KEY);
}
