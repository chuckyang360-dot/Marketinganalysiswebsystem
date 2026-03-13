import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { Target, Zap, Shield, TrendingUp, Mail, Globe, MapPin, ArrowRight } from 'lucide-react';

export function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              {t('about.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-500">
              {t('about.subtitle')}
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-20">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('about.mission.title')}</h2>
              <p className="text-lg leading-relaxed text-gray-700">
                {t('about.mission.desc')}
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-20">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
              {t('about.values.title')}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <ValueCard
                icon={<Target className="h-8 w-8" />}
                title={t('about.values.precise.title')}
                description={t('about.values.precise.desc')}
              />
              <ValueCard
                icon={<Zap className="h-8 w-8" />}
                title={t('about.values.efficient.title')}
                description={t('about.values.efficient.desc')}
              />
              <ValueCard
                icon={<Shield className="h-8 w-8" />}
                title={t('about.values.reliable.title')}
                description={t('about.values.reliable.desc')}
              />
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="mb-20">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
              {t('about.why.title')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <WhyCard
                icon={<TrendingUp className="h-8 w-8" />}
                title={t('about.why.1.title')}
                description={t('about.why.1.desc')}
              />
              <WhyCard
                icon={<Globe className="h-8 w-8" />}
                title={t('about.why.2.title')}
                description={t('about.why.2.desc')}
              />
              <WhyCard
                icon={<Target className="h-8 w-8" />}
                title={t('about.why.3.title')}
                description={t('about.why.3.desc')}
              />
              <WhyCard
                icon={<Zap className="h-8 w-8" />}
                title={t('about.why.4.title')}
                description={t('about.why.4.desc')}
              />
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-20">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
              {t('about.contact.title')}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <ContactCard
                icon={<Mail className="h-6 w-6" />}
                title={t('about.contact.email')}
                value={t('about.contact.email.value')}
              />
              <ContactCard
                icon={<Globe className="h-6 w-6" />}
                title={t('about.contact.follow')}
                value={t('about.contact.follow.value')}
              />
              <ContactCard
                icon={<MapPin className="h-6 w-6" />}
                title={t('about.contact.address')}
                value={t('about.contact.address.value')}
              />
            </div>
          </section>

          {/* CTA Section */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 text-2xl font-bold">{t('about.cta.title')}</h2>
            <p className="mb-8 max-w-xl text-blue-100">
              {t('about.cta.desc')}
            </p>
            <button
              onClick={() => (window.location.href = '/workspace')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('about.cta.button')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        {icon}
      </div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}

interface WhyCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function WhyCard({ icon, title, description }: WhyCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        {icon}
      </div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function ContactCard({ icon, title, value }: ContactCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{value}</p>
    </div>
  );
}
