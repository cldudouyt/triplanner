/**
 * Design tokens — source de vérité pour les couleurs, gradients et tokens de design.
 * Utiliser ces constantes plutôt que les valeurs hex en dur dans les composants.
 */

export const SPORT_COLORS = {
  swim: {
    color: '#0891B2',
    bg: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-900/10',
    border: 'border-cyan-500',
    text: 'text-cyan-600',
    textDark: 'dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  bike: {
    color: '#059669',
    bg: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/10',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    textDark: 'dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  run: {
    color: '#EA580C',
    bg: 'bg-orange-50',
    bgDark: 'dark:bg-orange-900/10',
    border: 'border-orange-500',
    text: 'text-orange-600',
    textDark: 'dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  strength: {
    color: '#64748B',
    bg: 'bg-white',
    bgDark: 'dark:bg-slate-800',
    border: 'border-slate-300',
    borderDark: 'dark:border-slate-600',
    text: 'text-slate-500',
    textDark: 'dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  rest: {
    color: '#94A3B8',
    bg: 'bg-gray-50',
    bgDark: 'dark:bg-slate-800',
    border: 'border-gray-200',
    borderDark: 'dark:border-slate-700',
    text: 'text-gray-400',
    textDark: 'dark:text-gray-500',
    dot: 'bg-gray-300',
  },
} as const

export const PRIORITY_GRADIENTS = {
  A: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  B: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  C: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
} as const

export const PRIORITY_COLORS = {
  A: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
    jBadge: 'bg-red-100 text-red-700',
  },
  B: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    dot: 'bg-amber-400',
    jBadge: 'bg-orange-100 text-orange-700',
  },
  C: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
    dot: 'bg-gray-400',
    jBadge: 'bg-gray-100 text-gray-600',
  },
} as const

export const BRAND = {
  orange300: '#FD8A74',
  orange400: '#FB923C',
  orange500: '#F97316',
  orange600: '#EA580C',
  orange700: '#C2410C',
  gradient: 'linear-gradient(135deg, #FB923C, #EA580C)',
  gradientVertical: 'linear-gradient(180deg, #FB923C, #EA580C)',
  shadow: '0 10px 22px -8px rgba(234,88,12,.6)',
  shadowLg: '0 22px 54px -26px rgba(234,88,12,.6)',
} as const

export const STATUS_COLORS = {
  registered: {
    dot: 'bg-emerald-400',
    label: 'Inscrit',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  planned: {
    dot: 'bg-amber-400',
    label: 'Planifié',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  dns: {
    dot: 'bg-gray-400',
    label: 'Dossard à venir',
    badge: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
  },
  completed: {
    dot: 'bg-slate-400',
    label: 'Terminé',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
  cancelled: {
    dot: 'bg-red-400',
    label: 'Annulé',
    badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
} as const

export const CARD_BASE = 'bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700' as const

export const SPACING = {
  pagePadding: 'px-6 py-6',
  cardPadding: 'p-5',
  cardPaddingLg: 'p-6',
  sectionGap: 'gap-5',
  cardGap: 'gap-4',
} as const

export const TYPOGRAPHY = {
  pageTitle: 'text-2xl font-bold text-gray-900 dark:text-gray-100',
  pageSubtitle: 'text-sm text-gray-500 dark:text-gray-400 mt-1',
  sectionTitle: 'font-semibold text-gray-900 dark:text-gray-100',
  cardLabel: 'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500',
  bodyText: 'text-sm text-gray-600 dark:text-gray-400',
  mutedText: 'text-xs text-gray-400 dark:text-gray-500',
  statValue: 'text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100',
  statUnit: 'text-sm text-gray-400 dark:text-gray-500',
} as const
