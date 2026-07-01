import { getAllTransactions } from './transaction.js';
import { getCurrency } from './storage.js';
import { monthYearKey, last6MonthKeys, currentMonthRange } from './utils.js';
import { getCategoryMeta } from '../data/categories.js';

export function calcSummary() {
  const txs = getAllTransactions();
  const currency = getCurrency();
  let totalIncome = 0, totalExpense = 0;
  txs.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  const balance = totalIncome - totalExpense;
  const savings = Math.max(0, balance);
  return { totalIncome, totalExpense, balance, savings, currency };
}

export function calcMonthly() {
  const { start, end } = currentMonthRange();
  const txs = getAllTransactions().filter(t => t.date >= start && t.date <= end);
  let income = 0, expense = 0;
  txs.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });
  return { income, expense, savings: income - expense };
}

export function calcLast6Months() {
  const txs = getAllTransactions();
  const keys = last6MonthKeys();
  const result = {};
  keys.forEach(k => { result[k] = { income: 0, expense: 0 }; });
  txs.forEach(t => {
    const k = monthYearKey(t.date);
    if (result[k]) {
      if (t.type === 'income') result[k].income += t.amount;
      else result[k].expense += t.amount;
    }
  });
  return { keys, data: result };
}

export function calcCategoryBreakdown(type = 'expense') {
  const txs = getAllTransactions().filter(t => t.type === type);
  const map = {};
  txs.forEach(t => {
    if (!map[t.category]) map[t.category] = 0;
    map[t.category] += t.amount;
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([id, amount]) => ({ id, amount, pct: total ? Math.round((amount / total) * 100) : 0, meta: getCategoryMeta(id, type) }))
    .sort((a, b) => b.amount - a.amount);
}

export function getRecentTransactions(n = 5) {
  return getAllTransactions().slice(0, n);
}

export function calcMonthlyExpenseForCategory(categoryId) {
  const { start, end } = currentMonthRange();
  return getAllTransactions()
    .filter(t => t.type === 'expense' && t.category === categoryId && t.date >= start && t.date <= end)
    .reduce((s, t) => s + t.amount, 0);
}
