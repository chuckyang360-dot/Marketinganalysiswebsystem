import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Building2, Users, Target, Lightbulb, Mail, Globe, TrendingUp } from 'lucide-react';

export function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
            {t('about.tag')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {t('about.hero.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 rounded-full">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{t('about.company.tag')}</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">{t('about.company.title')}</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>{t('about.company.intro1')}</p>
                <p>{t('about.company.intro2')}</p>
                <p>{t('about.company.intro3')}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Globe className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{t('about.company.name')}</h3>
                <p className="text-gray-600">{t('about.company.name.full')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 rounded-full">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">{t('about.product.tag')}</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">{t('about.product.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('about.product.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('about.product.feature1.title')}</h3>
              <p className="text-gray-600">{t('about.product.feature1.description')}</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('about.product.feature2.title')}</h3>
              <p className="text-gray-600">{t('about.product.feature2.description')}</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('about.product.feature3.title')}</h3>
              <p className="text-gray-600">{t('about.product.feature3.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 rounded-full">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">{t('about.team.tag')}</span>
          </div>
          <h2 className="text-4xl font-bold mb-6">{t('about.team.title')}</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('about.team.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <div className="text-5xl font-bold text-blue-600 mb-2">{t('about.team.stat1.number')}</div>
              <div className="text-gray-600">{t('about.team.stat1.label')}</div>
            </div>
            <div className="p-8">
              <div className="text-5xl font-bold text-purple-600 mb-2">{t('about.team.stat2.number')}</div>
              <div className="text-gray-600">{t('about.team.stat2.label')}</div>
            </div>
            <div className="p-8">
              <div className="text-5xl font-bold text-indigo-600 mb-2">{t('about.team.stat3.number')}</div>
              <div className="text-gray-600">{t('about.team.stat3.label')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Cooperation Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 rounded-full">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{t('about.business.tag')}</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">{t('about.business.title')}</h2>
              <p className="text-xl text-gray-600">
                {t('about.business.subtitle')}
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('about.business.contact.title')}</h3>
                    <p className="text-gray-600 mb-4">{t('about.business.contact.name')}</p>
                    <a
                      href="mailto:chuckyang360@gmail.com"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">chuckyang360@gmail.com</span>
                    </a>
                  </div>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 whitespace-nowrap"
                    onClick={() => window.location.href = 'mailto:chuckyang360@gmail.com'}
                  >
                    {t('about.business.contact.button')}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold mb-3">{t('about.business.partner.title')}</h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>• {t('about.business.partner.item1')}</li>
                    <li>• {t('about.business.partner.item2')}</li>
                    <li>• {t('about.business.partner.item3')}</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold mb-3">{t('about.business.service.title')}</h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>• {t('about.business.service.item1')}</li>
                    <li>• {t('about.business.service.item2')}</li>
                    <li>• {t('about.business.service.item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
