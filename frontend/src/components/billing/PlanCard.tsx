import { Check } from 'lucide-react';
import type { PlanDefinition } from '../../config/plans';
import { formatMoneyUsd } from '../../config/plans';
import type { BillingCycle } from '../../types/billing';

const MAX_FEATURES = 4;

type Props = {
  plan: PlanDefinition;
  cycle: BillingCycle;
  t: (key: string) => string;
  onCheckout: () => void;
  ctaLabel: string;
  contactLabel: string;
  recommendedLabel: string;
};

export function PlanCard({
  plan,
  cycle,
  t,
  onCheckout,
  ctaLabel,
  contactLabel,
  recommendedLabel,
}: Props) {
  const isContact = plan.priceKind === 'contact';
  const isFree = plan.priceKind === 'free';
  let priceMain = '';
  let priceSub: string | null = null;

  if (isFree) {
    priceMain = formatMoneyUsd(0);
    priceSub = t('pricing.plan.free.priceHint');
  } else if (isContact) {
    priceMain = t('pricing.team.priceLine');
    priceSub = t('pricing.team.priceHint');
  } else if (plan.usd) {
    if (cycle === 'monthly') {
      priceMain = `${formatMoneyUsd(plan.usd.monthly)}${t('pricing.billing.perMonthShort')}`;
    } else {
      priceMain = `${formatMoneyUsd(plan.usd.yearlyTotal)}${t('pricing.billing.perYearShort')}`;
      const eq = Math.round(plan.usd.yearlyTotal / 12);
      priceSub = t('pricing.billing.equivalentMonthly').replace('{n}', String(eq));
    }
  }

  const featureKeys = plan.featureKeys.slice(0, MAX_FEATURES);

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-shadow ${
        plan.recommended
          ? 'border-blue-300 bg-gradient-to-b from-white to-blue-50/50 ring-2 ring-blue-100'
          : 'border-gray-200 bg-white hover:shadow-md'
      }`}
    >
      {plan.recommended && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-0.5 text-[11px] font-semibold text-white shadow">
          {recommendedLabel}
        </div>
      )}

      <div className={plan.recommended ? 'pt-2' : ''}>
        <h3 className="text-lg font-semibold text-gray-900">{t(plan.nameKey)}</h3>
        <p className="mt-1 text-xs text-gray-500">{t(plan.audienceKey)}</p>
        <div className="mt-4 border-b border-gray-100 pb-4">
          <span className="text-2xl font-bold tracking-tight text-gray-900">{priceMain}</span>
          {priceSub && <p className="mt-1 text-xs text-gray-500">{priceSub}</p>}
        </div>
        <p className="mt-3 text-sm leading-snug text-gray-600">{t(plan.taglineKey)}</p>
        {plan.recommended && (
          <p className="mt-2 text-xs leading-snug text-blue-700">{t('pricing.plan.pro.cardHint')}</p>
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {featureKeys.map((key) => (
          <li key={key} className="flex gap-2 text-sm text-gray-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden />
            <span className="leading-snug">{t(key)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCheckout}
        className={`mt-6 h-10 w-full rounded-lg text-sm font-semibold transition-colors ${
          plan.recommended
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95'
            : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        {isContact ? contactLabel : ctaLabel}
      </button>
    </div>
  );
}
