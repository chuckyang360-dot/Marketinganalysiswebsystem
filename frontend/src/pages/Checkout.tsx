import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PaymentMethodCard } from '../components/billing/PaymentMethodCard';
import { PAYMENT_METHODS } from '../config/paymentMethods';
import { getCheckoutPriceDisplay, PLAN_BY_ID } from '../config/plans';
import { parseCheckoutParams } from '../lib/checkoutSearchParams';
import { useLanguage } from '../contexts/LanguageContext';
import type { PaymentMethodId } from '../types/billing';
import { ArrowLeft } from 'lucide-react';

export function Checkout() {
  const { t } = useLanguage();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const parsed = useMemo(() => parseCheckoutParams(`?${search.toString()}`), [search]);

  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);

  if (!parsed) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 pt-24 text-center text-gray-600">
          <p className="mb-6">{t('checkout.invalid')}</p>
          <Link to="/pricing" className="text-blue-600 hover:underline">
            {t('checkout.backPricing')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const plan = PLAN_BY_ID[parsed.planId];
  const price = getCheckoutPriceDisplay(plan, parsed.billingCycle, t);
  const requiresPayment = plan.priceKind !== 'free' && plan.priceKind !== 'contact';
  const paymentDisabled = !requiresPayment;
  const selectedPm = selectedMethod ? PAYMENT_METHODS.find((m) => m.id === selectedMethod) : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('checkout.back')}
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{t('checkout.title')}</h1>
          <p className="mt-1.5 text-base text-gray-600">{t('checkout.subtitle')}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('checkout.summary.title')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('checkout.summary.plan')}</dt>
                  <dd className="text-right font-medium text-gray-900">{t(plan.nameKey)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('checkout.summary.cycle')}</dt>
                  <dd className="text-right text-gray-900">
                    {parsed.billingCycle === 'monthly' ? t('pricing.toggle.monthly') : t('pricing.toggle.yearly')}
                  </dd>
                </div>
                {price.listAnnual != null && price.listAnnual > 0 && (
                  <div className="flex justify-between gap-4 border-t border-gray-100 pt-3 text-gray-600">
                    <dt>{t('checkout.summary.listAnnual')}</dt>
                    <dd>${price.listAnnual}</dd>
                  </div>
                )}
                {price.listAnnual == null && (
                  <div className="flex justify-between gap-4 border-t border-gray-100 pt-3">
                    <dt className="text-gray-500">{t('checkout.summary.subtotal')}</dt>
                    <dd className="text-gray-900">{price.label}</dd>
                  </div>
                )}
                {price.savings > 0 && (
                  <div className="flex justify-between gap-4 text-emerald-600">
                    <dt>{t('checkout.summary.savings')}</dt>
                    <dd>-${price.savings}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                  <dt>{t('checkout.summary.total')}</dt>
                  <dd>
                    {plan.priceKind === 'free' && t('checkout.price.zero')}
                    {plan.priceKind === 'contact' && t('checkout.summary.contact')}
                    {plan.priceKind === 'fixed' && price.label}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-gray-500">{t('checkout.summary.taxNote')}</p>
            </div>

            <div className="space-y-6 lg:col-span-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('checkout.payment.title')}</h2>
                {paymentDisabled && (
                  <p className="mt-2 text-sm text-amber-700">{t('checkout.payment.skipNotice')}</p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <PaymentMethodCard
                      key={pm.id}
                      config={pm}
                      selected={selectedMethod === pm.id}
                      disabled={paymentDisabled}
                      onSelect={() => !paymentDisabled && setSelectedMethod(pm.id)}
                      t={t}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('checkout.billing.title')}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="co-email" className="mb-1 block text-sm font-medium text-gray-700">
                      {t('checkout.billing.email')}
                    </label>
                    <input
                      id="co-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('checkout.billing.emailPlaceholder')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="co-company" className="mb-1 block text-sm font-medium text-gray-700">
                      {t('checkout.billing.company')}
                    </label>
                    <input
                      id="co-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('checkout.billing.companyPlaceholder')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="co-country" className="mb-1 block text-sm font-medium text-gray-700">
                      {t('checkout.billing.country')}
                    </label>
                    <input
                      id="co-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={t('checkout.billing.countryPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  disabled
                  className="h-10 w-full cursor-not-allowed rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-semibold text-white opacity-60"
                >
                  {t('checkout.confirm.cta')}
                </button>
                <p className="mt-2 text-center text-xs text-gray-500">{t('checkout.confirm.hint')}</p>

                {requiresPayment && (
                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-gray-800">
                    <p className="font-medium text-amber-900">{t('checkout.confirm.reasonTitle')}</p>
                    <p className="mt-2 leading-relaxed text-gray-700">{t('checkout.confirm.globalBlock')}</p>
                    {!selectedPm && (
                      <p className="mt-3 text-gray-600">{t('checkout.confirm.selectRailHint')}</p>
                    )}
                    {selectedPm && (
                      <div className="mt-3 border-t border-amber-200/80 pt-3">
                        <p className="text-xs text-gray-500">{t('checkout.confirm.selectedRail')}</p>
                        <p className="mt-1 text-gray-700">{t(selectedPm.availabilityNoteKey)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
