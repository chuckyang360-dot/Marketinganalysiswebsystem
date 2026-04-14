import type { PlanId, BillingCycle } from '../types/billing';

const VALID_PLANS = new Set<PlanId>(['free', 'pro', 'team']);
const VALID_CYCLES = new Set<BillingCycle>(['monthly', 'yearly']);

export function parseCheckoutParams(search: string): { planId: PlanId; billingCycle: BillingCycle } | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const plan = params.get('plan') as PlanId | null;
  const cycle = params.get('cycle') as BillingCycle | null;
  if (!plan || !VALID_PLANS.has(plan)) return null;
  const billingCycle = cycle && VALID_CYCLES.has(cycle) ? cycle : 'monthly';
  return { planId: plan, billingCycle };
}

export function buildCheckoutHref(planId: PlanId, billingCycle: BillingCycle): string {
  return `/checkout?${new URLSearchParams({ plan: planId, cycle: billingCycle }).toString()}`;
}
