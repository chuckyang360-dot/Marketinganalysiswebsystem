import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ExampleCards } from '../components/ExampleCards';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSelect = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/full-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });
      const data = await response.json();
      navigate('/result', { state: { data } });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(t('home.analysisFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          {/* Hero Section */}
          <div className="mb-20">
            <h1 className="mb-6 text-center text-4xl font-bold text-gray-900 md:text-6xl">
              {t('home.hero.title')}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('home.hero.highlight')}
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-gray-500">
              {t('home.hero.subtitle')}
            </p>

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-gray-500">{t('home.analyzing')}</p>
              </div>
            ) : (
              <ExampleCards onSelect={handleSelect} />
            )}
          </div>

          {/* Features Section */}
          <div className="mb-20">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              核心功能
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8" />}
                title={t('home.feature1.title')}
                description={t('home.feature1.desc')}
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title={t('home.feature2.title')}
                description={t('home.feature2.desc')}
              />
              <FeatureCard
                icon={<Lightbulb className="h-8 w-8" />}
                title={t('home.feature3.title')}
                description={t('home.feature3.desc')}
              />
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 text-2xl font-bold">{t('common.start')}</h2>
            <p className="mb-8 max-w-xl text-blue-100">
              {t('about.cta.desc')}
            </p>
            <button
              onClick={() => (window.location.href = '/workspace')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('common.tryFreeNow')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
