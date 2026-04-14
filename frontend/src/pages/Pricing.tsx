import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BillingCycleToggle } from '../components/billing/BillingCycleToggle';
import { PlanCard } from '../components/billing/PlanCard';
import { PLANS, YEARLY_SAVE_PERCENT } from '../config/plans';
import { buildCheckoutHref } from '../lib/checkoutSearchParams';
import { useLanguage } from '../contexts/LanguageContext';
import type { BillingCycle } from '../types/billing';

export function Pricing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* 第一层：首屏决策区 */}
        <div className="border-b border-gray-200 bg-white px-6 pb-10 pt-8">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{t('pricing.page.title')}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 md:text-base">{t('pricing.page.subtitleShort')}</p>
            <div className="mt-6 flex justify-center">
              <BillingCycleToggle
                value={cycle}
                onChange={setCycle}
                monthlyLabel={t('pricing.toggle.monthly')}
                yearlyLabel={t('pricing.toggle.yearly')}
                saveLabel={t('pricing.toggle.save').replace('{n}', String(YEARLY_SAVE_PERCENT))}
              />
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-xs text-gray-500">{t('pricing.page.proOneLiner')}</p>

            <div className="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-3 lg:items-stretch">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  cycle={cycle}
                  t={t}
                  recommendedLabel={t('pricing.plan.pro.badge')}
                  ctaLabel={t('pricing.cta.checkout')}
                  contactLabel={t('pricing.cta.contact')}
                  onCheckout={() => navigate(buildCheckoutHref(plan.id, cycle))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 第二层：极简补充 */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs leading-relaxed text-gray-500">{t('pricing.page.footerNote')}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
