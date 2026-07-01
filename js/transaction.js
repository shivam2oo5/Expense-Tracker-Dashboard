import { getTransactions, saveTransactions } from './storage.js';
import { uuid, todayISO } from './utils.js';

export function getAllTransactions() {
  return getTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getTransaction(id) {
  return getTransactions().find(t => t.id === id) || null;
}

export function addTransaction(data) {
  const txs = getTransactions();
  const tx = {
    id: uuid(),
    title: data.title.trim(),
    type: data.type,
    category: data.category,
    amount: parseFloat(data.amount),
    date: data.date || todayISO(),
    note: (data.note || '').trim()
  };
  txs.push(tx);
  saveTransactions(txs);
  return tx;
}

export function updateTransaction(id, data) {
  const txs = getTransactions();
  const idx = txs.findIndex(t => t.id === id);
  if (idx === -1) return null;
  txs[idx] = {
    ...txs[idx],
    title: data.title.trim(),
    type: data.type,
    category: data.category,
    amount: parseFloat(data.amount),
    date: data.date || txs[idx].date,
    note: (data.note || '').trim()
  };
  saveTransactions(txs);
  return txs[idx];
}

export function deleteTransaction(id) {
  const txs = getTransactions().filter(t => t.id !== id);
  saveTransactions(txs);
}

export function filterTransactions({ type, category, search, dateFrom, dateTo } = {}) {
  let txs = getAllTransactions();
  if (type && type !== 'all')       txs = txs.filter(t => t.type === type);
  if (category && category !== 'all') txs = txs.filter(t => t.category === category);
  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t => t.title.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  }
  if (dateFrom) txs = txs.filter(t => t.date >= dateFrom);
  if (dateTo)   txs = txs.filter(t => t.date <= dateTo);
  return txs;
}

export function validateTransaction(data) {
  const errors = {};
  if (!data.title || !data.title.trim()) errors.title = 'Title is required';
  if (!data.amount || isNaN(+data.amount) || +data.amount <= 0) errors.amount = 'Enter a valid amount greater than 0';
  if (!data.category) errors.category = 'Category is required';
  if (!data.date) errors.date = 'Date is required';
  if (!['income','expense'].includes(data.type)) errors.type = 'Type is required';
  return errors;
}
