import { getBudget, setBudget } from './storage.js';
import { calcMonthlyExpenseForCategory } from './analytics.js';
import { BUDGET_CATEGORIES } from '../data/categories.js';
import { currentMonthRange } from './utils.js';
import { getAllTransactions } from './transaction.js';

export function getBudgetSummary() {
  const budget = getBudget();
  const { start, end } = currentMonthRange();
  const txs = getAllTransactions().filter(t => t.type === 'expense' && t.date >= start && t.date <= end);
  const totalSpent = txs.reduce((s, t) => s + t.amount, 0);
  const remaining  = Math.max(0, budget.monthly - totalSpent);
  const pct        = budget.monthly > 0 ? Math.round((totalSpent / budget.monthly) * 100) : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed  = now.getDate();
  const daysLeft    = daysInMonth - daysPassed;
  const dailyAvg    = daysPassed > 0 ? totalSpent / daysPassed : 0;
  return { monthly: budget.monthly, totalSpent, remaining, pct, daysLeft, dailyAvg };
}

export function getCategoryBudgetStatus() {
  const budget = getBudget();
  return BUDGET_CATEGORIES.map(cat => {
    const limit = budget.categories[cat.id] || cat.default;
    const spent = calcMonthlyExpenseForCategory(cat.id);
    const pct   = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
    return { ...cat, limit, spent, pct, status };
  });
}

export function getAlerts() {
  return getCategoryBudgetStatus().filter(c => c.pct >= 80);
}

export function updateMonthlyBudget(amount) {
  const budget = getBudget();
  budget.monthly = parseFloat(amount);
  setBudget(budget);
}

export function updateCategoryBudget(catId, amount) {
  const budget = getBudget();
  budget.categories[catId] = parseFloat(amount);
  setBudget(budget);
}
