/**
 * Billing & checkout — UI contract and future payment integration.
 * No quota enforcement in the frontend.
 */

export type PlanId = 'free' | 'pro' | 'team';

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentMethodId = 'wechat_pay' | 'alipay' | 'apple_pay' | 'card';

export type MonthlyQuota = number | 'preview' | 'high' | 'custom';

export type HistoryRetention = 'basic' | 'extended' | 'team_pool' | 'custom';

export type SupportTier = 'community' | 'priority' | 'dedicated_success';

export interface PlanEntitlements {
  productAnalysesPerMonth: MonthlyQuota;
  marketReportsPerMonth: MonthlyQuota;
  historyLimit: HistoryRetention;
  teamSeats: number | 'custom';
  prioritySupport: SupportTier;
  includesContentStrategy: boolean;
  includesAdvancedProductAnalysis: boolean;
}

export interface PlanDisplayConfig {
  id: PlanId;
  nameKey: string;
  taglineKey: string;
  audienceKey: string;
  recommendReasonKey?: string;
  featureKeys: string[];
  entitlements: PlanEntitlements;
}

export type CheckoutSessionStatus =
  | 'draft'
  | 'pending_provider'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'cancelled';

export type PaymentMethodAvailability = 'unavailable' | 'pending_integration' | 'ready';
