export const EXPENSE_CATEGORIES = [
  { id: 'food',          label: 'Food & Drink',    icon: 'fa-utensils',     css: 'cat-food' },
  { id: 'housing',       label: 'Housing',          icon: 'fa-house',        css: 'cat-housing' },
  { id: 'transport',     label: 'Transport',        icon: 'fa-car',          css: 'cat-transport' },
  { id: 'shopping',      label: 'Shopping',         icon: 'fa-bag-shopping', css: 'cat-shopping' },
  { id: 'entertainment', label: 'Entertainment',    icon: 'fa-gamepad',      css: 'cat-entertainment' },
  { id: 'healthcare',    label: 'Healthcare',       icon: 'fa-heart-pulse',  css: 'cat-healthcare' },
  { id: 'education',     label: 'Education',        icon: 'fa-graduation-cap', css: 'cat-education' },
  { id: 'subscriptions', label: 'Subscriptions',   icon: 'fa-rotate',       css: 'cat-subscriptions' },
  { id: 'travel',        label: 'Travel',           icon: 'fa-plane',        css: 'cat-travel' },
  { id: 'other',         label: 'Other',            icon: 'fa-circle-dot',   css: 'cat-other' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary',     label: 'Salary',      icon: 'fa-money-bill-wave', css: 'cat-income' },
  { id: 'freelance',  label: 'Freelance',   icon: 'fa-laptop-code',    css: 'cat-income' },
  { id: 'business',   label: 'Business',    icon: 'fa-briefcase',      css: 'cat-income' },
  { id: 'investment', label: 'Investment',  icon: 'fa-chart-line',     css: 'cat-income' },
  { id: 'gift',       label: 'Gift',        icon: 'fa-gift',           css: 'cat-income' },
  { id: 'other',      label: 'Other Income',icon: 'fa-circle-dot',     css: 'cat-income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryMeta(id, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find(c => c.id === id) || { label: id, icon: 'fa-circle-dot', css: 'cat-other' };
}

export const BUDGET_CATEGORIES = [
  { id: 'food',          label: 'Food & Drink',   icon: 'fa-utensils',     default: 600  },
  { id: 'housing',       label: 'Housing',         icon: 'fa-house',        default: 1500 },
  { id: 'transport',     label: 'Transport',       icon: 'fa-car',          default: 300  },
  { id: 'shopping',      label: 'Shopping',        icon: 'fa-bag-shopping', default: 400  },
  { id: 'entertainment', label: 'Entertainment',   icon: 'fa-gamepad',      default: 200  },
  { id: 'healthcare',    label: 'Healthcare',      icon: 'fa-heart-pulse',  default: 200  },
  { id: 'education',     label: 'Education',       icon: 'fa-graduation-cap', default: 200  },
  { id: 'subscriptions', label: 'Subscriptions',   icon: 'fa-rotate',       default: 100  },
  { id: 'travel',        label: 'Travel',          icon: 'fa-plane',        default: 300  },
  { id: 'other',         label: 'Other',           icon: 'fa-circle-dot',   default: 200  },
];
