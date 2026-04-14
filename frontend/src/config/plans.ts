import type { PlanId, BillingCycle, PlanEntitlements, PlanDisplayConfig } from '../types/billing';

export const YEARLY_SAVE_PERCENT = 20;
export const PRO_MONTHLY_USD = 19;

export function getProYearlyTotalUsd(): number {
  return Math.round(PRO_MONTHLY_USD * 12 * (1 - YEARLY_SAVE_PERCENT / 100));
}

export function getEntitlementRowKeys(planId: PlanId): string[] {
  const p = `pricing.entitlementRow.${planId}`;
  return [
    `${p}.productAnalyses`,
    `${p}.marketReports`,
    `${p}.history`,
    `${p}.teamSeats`,
    `${p}.support`,
    `${p}.contentStrategy`,
    `${p}.advancedProduct`,
  ];
}

export interface PlanDefinition extends PlanDisplayConfig {
  recommended?: boolean;
  priceKind: 'free' | 'fixed' | 'contact';
  usd?: { monthly: number; yearlyTotal: number };
}

const E_FREE: PlanEntitlements = {
  productAnalysesPerMonth: 'preview',
  marketReportsPerMonth: 'preview',
  historyLimit: 'basic',
  teamSeats: 1,
  prioritySupport: 'community',
  includesContentStrategy: true,
  includesAdvancedProductAnalysis: false,
};

const E_PRO: PlanEntitlements = {
  productAnalysesPerMonth: 'high',
  marketReportsPerMonth: 'high',
  historyLimit: 'extended',
  teamSeats: 1,
  prioritySupport: 'priority',
  includesContentStrategy: true,
  includesAdvancedProductAnalysis: true,
};

const E_TEAM: PlanEntitlements = {
  productAnalysesPerMonth: 'custom',
  marketReportsPerMonth: 'custom',
  historyLimit: 'team_pool',
  teamSeats: 'custom',
  prioritySupport: 'dedicated_success',
  includesContentStrategy: true,
  includesAdvancedProductAnalysis: true,
};

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    nameKey: 'pricing.plan.free.name',
    taglineKey: 'pricing.plan.free.tagline',
    audienceKey: 'pricing.plan.free.audience',
    featureKeys: [
      'pricing.plan.free.f1',
      'pricing.plan.free.f2',
      'pricing.plan.free.f3',
      'pricing.plan.free.f4',
    ],
    entitlements: E_FREE,
    priceKind: 'free',
  },
  {
    id: 'pro',
    recommended: true,
    nameKey: 'pricing.plan.pro.name',
    taglineKey: 'pricing.plan.pro.tagline',
    audienceKey: 'pricing.plan.pro.audience',
    recommendReasonKey: 'pricing.plan.pro.whyRecommended',
    featureKeys: [
      'pricing.plan.pro.f1',
      'pricing.plan.pro.f2',
      'pricing.plan.pro.f3',
      'pricing.plan.pro.f4',
      'pricing.plan.pro.f5',
    ],
    entitlements: E_PRO,
    priceKind: 'fixed',
    usd: { monthly: PRO_MONTHLY_USD, yearlyTotal: getProYearlyTotalUsd() },
  },
  {
    id: 'team',
    nameKey: 'pricing.plan.team.name',
    taglineKey: 'pricing.plan.team.tagline',
    audienceKey: 'pricing.plan.team.audience',
    featureKeys: [
      'pricing.plan.team.f1',
      'pricing.plan.team.f2',
      'pricing.plan.team.f3',
      'pricing.plan.team.f4',
      'pricing.plan.team.f5',
    ],
    entitlements: E_TEAM,
    priceKind: 'contact',
  },
];

export const PLAN_BY_ID: Record<PlanId, PlanDefinition> = PLANS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<PlanId, PlanDefinition>,
);

export function formatMoneyUsd(amount: number): string {
  return amount === 0 ? '$0' : `$${amount}`;
}

export function getCheckoutPriceDisplay(
  plan: PlanDefinition,
  cycle: BillingCycle,
  t: (key: string) => string,
): { subtotal: number; savings: number; label: string; listAnnual?: number } {
  if (plan.priceKind === 'free') return { subtotal: 0, savings: 0, label: t('checkout.price.zero') };
  if (plan.priceKind === 'contact') return { subtotal: 0, savings: 0, label: t('checkout.summary.contact') };
  if (!plan.usd) return { subtotal: 0, savings: 0, label: '' };
  if (cycle === 'monthly') {
    return {
      subtotal: plan.usd.monthly,
      savings: 0,
      label: `${formatMoneyUsd(plan.usd.monthly)}${t('checkout.price.perMonthSuffix')}`,
    };
  }
  const listAnnual = plan.usd.monthly * 12;
  const savings = listAnnual - plan.usd.yearlyTotal;
  return {
    subtotal: plan.usd.yearlyTotal,
    savings: Math.max(0, savings),
    label: `${formatMoneyUsd(plan.usd.yearlyTotal)}${t('checkout.price.perYearSuffix')}`,
    listAnnual,
  };
}
