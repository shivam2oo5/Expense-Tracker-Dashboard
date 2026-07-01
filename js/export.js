import { getTransactions, getCurrency } from './storage.js';
import { formatDate, formatCurrency } from './utils.js';
import { getCategoryMeta } from '../data/categories.js';

export function exportCSV() {
  const txs = getTransactions();
  const currency = getCurrency();
  const rows = [
    ['ID', 'Title', 'Type', 'Category', 'Amount', 'Date', 'Note']
  ];
  txs.forEach(t => {
    const cat = getCategoryMeta(t.category, t.type);
    rows.push([
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      cat.label,
      (t.type === 'income' ? '+' : '-') + t.amount.toFixed(2),
      t.date,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeflow-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
