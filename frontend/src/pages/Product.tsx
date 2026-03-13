import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';

export function Product() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900">
              {t('product.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-500">
              {t('product.subtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-20 grid gap-8 md:grid-cols-2">
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title={t('product.feature1.title')}
              description={t('product.feature1.desc')}
              features={[t('product.feature1.f1'), t('product.feature1.f2'), t('product.feature1.f3')]}
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title={t('product.feature2.title')}
              description={t('product.feature2.desc')}
              features={[t('product.feature2.f1'), t('product.feature2.f2'), t('product.feature2.f3')]}
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title={t('product.feature3.title')}
              description={t('product.feature3.desc')}
              features={[t('product.feature3.f1'), t('product.feature3.f2'), t('product.feature3.f3')]}
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title={t('product.feature4.title')}
              description={t('product.feature4.desc')}
              features={[t('product.feature4.f1'), t('product.feature4.f2'), t('product.feature4.f3')]}
            />
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 text-2xl font-bold">{t('product.cta.title')}</h2>
            <p className="mb-8 max-w-xl text-blue-100">
              {t('product.cta.desc')}
            </p>
            <button
              onClick={() => (window.location.href = '/workspace')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('product.cta.button')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function FeatureCard({ icon, title, description, features }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        {icon}
      </div>
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 text-gray-500">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
