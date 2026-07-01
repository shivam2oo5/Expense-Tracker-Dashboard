import { calcLast6Months, calcCategoryBreakdown } from './analytics.js';
import { getCurrency } from './storage.js';
import { formatCurrency, monthLabel } from './utils.js';

let charts = {};

function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
function textColor() { return isDark() ? '#94A3B8' : '#64748B'; }
function gridColor() { return isDark() ? '#334155' : '#E2E8F0'; }

function destroyChart(name) {
  if (charts[name]) { charts[name].destroy(); delete charts[name]; }
}

const CATEGORY_COLORS = [
  '#4F46E5','#8B5CF6','#06B6D4','#22C55E','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316','#6366F1'
];

export function renderTrendChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!window.Chart) { console.error('Chart.js is not loaded'); return; }
  const { keys, data } = calcLast6Months();
  const currency = getCurrency();
  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: keys.map(monthLabel),
      datasets: [
        {
          label: 'Income',
          data: keys.map(k => data[k].income),
          backgroundColor: 'rgba(34,197,94,.8)',
          borderRadius: 6, borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: keys.map(k => data[k].expense),
          backgroundColor: 'rgba(79,70,229,.8)',
          borderRadius: 6, borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor(), font: { family: 'Poppins', size: 11 }, boxWidth: 10, padding: 16 } },
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}` },
          bodyFont: { family: 'Poppins' }, titleFont: { family: 'Poppins' }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 } } },
        y: { grid: { color: gridColor() }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 }, callback: v => formatCurrency(v, currency) }, beginAtZero: true }
      }
    }
  });
}

export function renderCategoryChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!window.Chart) { console.error('Chart.js is not loaded'); return; }
  const breakdown = calcCategoryBreakdown('expense');
  if (!breakdown.length) return;
  const currency = getCurrency();
  charts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: breakdown.map(b => b.meta.label),
      datasets: [{
        data: breakdown.map(b => b.amount),
        backgroundColor: CATEGORY_COLORS.slice(0, breakdown.length),
        borderWidth: 2,
        borderColor: isDark() ? '#1E293B' : '#FFFFFF',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor(), font: { family: 'Poppins', size: 11 }, boxWidth: 10, padding: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatCurrency(ctx.raw, currency)} (${ctx.dataset.data.reduce((s,v)=>s+v,0) > 0 ? Math.round(ctx.raw / ctx.dataset.data.reduce((s,v)=>s+v,0) * 100) : 0}%)`
          },
          bodyFont: { family: 'Poppins' }, titleFont: { family: 'Poppins' }
        }
      }
    }
  });
}

export function renderExpenseOnlyChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!window.Chart) { console.error('Chart.js is not loaded'); return; }
  const { keys, data } = calcLast6Months();
  const currency = getCurrency();
  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: keys.map(monthLabel),
      datasets: [{
        label: 'Expenses',
        data: keys.map(k => data[k].expense),
        backgroundColor: 'rgba(79,70,229,.85)',
        borderRadius: 8, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => formatCurrency(ctx.raw, currency) },
          bodyFont: { family: 'Poppins' }, titleFont: { family: 'Poppins' }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 } } },
        y: { grid: { color: gridColor() }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 }, callback: v => formatCurrency(v, currency) }, beginAtZero: true }
      }
    }
  });
}

export function renderBudgetUtilizationChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!window.Chart) { console.error('Chart.js is not loaded'); return; }
  const { keys, data } = calcLast6Months();
  const currency = getCurrency();
  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: keys.map(monthLabel),
      datasets: [
        { label: 'Actual Spend', data: keys.map(k => data[k].expense), backgroundColor: 'rgba(79,70,229,.85)', borderRadius: 6, borderSkipped: false },
        { label: 'Income',       data: keys.map(k => data[k].income),  backgroundColor: 'rgba(34,197,94,.5)',  borderRadius: 6, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor(), font: { family: 'Poppins', size: 11 }, boxWidth: 10, padding: 16 } },
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}` },
          bodyFont: { family: 'Poppins' }, titleFont: { family: 'Poppins' }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 } } },
        y: { grid: { color: gridColor() }, ticks: { color: textColor(), font: { family: 'Poppins', size: 11 }, callback: v => formatCurrency(v, currency) }, beginAtZero: true }
      }
    }
  });
}

export function destroyAll() {
  Object.keys(charts).forEach(destroyChart);
}

export function refreshChartTheme() {
  Object.values(charts).forEach(chart => {
    if (chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = textColor();
    if (chart.options.scales?.y) {
      if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor();
      if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor();
    }
    if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = textColor();
    if (chart.data.datasets?.[0]?.borderColor !== undefined) {
      chart.data.datasets.forEach(ds => { if (ds.borderColor) ds.borderColor = isDark() ? '#1E293B' : '#FFFFFF'; });
    }
    chart.update();
  });
}
