import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle } from 'lucide-react';

export function Cases() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('cases.title')}</h1>
          <p className="text-xl text-gray-600">{t('cases.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Tech</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('cases.tech.title')}</h3>
            <p className="text-gray-700 mb-4">{t('cases.tech.description')}</p>
            <div className="text-sm text-gray-600">{t('cases.tech.metrics')}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">E-commerce</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('cases.ecommerce.title')}</h3>
            <p className="text-gray-700 mb-4">{t('cases.ecommerce.description')}</p>
            <div className="text-sm text-gray-600">{t('cases.ecommerce.metrics')}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">SaaS</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('cases.saas.title')}</h3>
            <p className="text-gray-700 mb-4">{t('cases.saas.description')}</p>
            <div className="text-sm text-gray-600">{t('cases.saas.metrics')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
