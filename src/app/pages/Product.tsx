import { useLanguage } from '../contexts/LanguageContext';
import { Search, TrendingUp, Twitter, FileText, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

export function Product() {
  const { t } = useLanguage();

  const products = [
    {
      icon: Search,
      color: 'blue',
      title: t('product.seo.title'),
      description: t('product.seo.description'),
    },
    {
      icon: TrendingUp,
      color: 'orange',
      title: t('product.reddit.title'),
      description: t('product.reddit.description'),
    },
    {
      icon: Twitter,
      color: 'sky',
      title: t('product.twitter.title'),
      description: t('product.twitter.description'),
    },
    {
      icon: FileText,
      color: 'purple',
      title: t('product.content.title'),
      description: t('product.content.description'),
    },
    {
      icon: BarChart3,
      color: 'green',
      title: t('product.summary.title'),
      description: t('product.summary.description'),
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('product.title')}</h1>
          <p className="text-xl text-gray-600">{t('product.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow border"
              >
                <div className={`w-12 h-12 bg-${product.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${product.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{product.title}</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              {t('hero.cta.start')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
