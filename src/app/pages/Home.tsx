import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Search, TrendingUp, Twitter, FileText, BarChart3, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Home() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('contact.success'));
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
            {t('hero.title')}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            {t('hero.subtitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8">
              {t('hero.cta.start')}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              {t('hero.cta.demo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('product.title')}</h2>
            <p className="text-xl text-gray-600">{t('product.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* SEO Analysis */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('product.seo.title')}</h3>
              <p className="text-gray-600">{t('product.seo.description')}</p>
            </div>

            {/* Reddit */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('product.reddit.title')}</h3>
              <p className="text-gray-600">{t('product.reddit.description')}</p>
            </div>

            {/* Twitter */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                <Twitter className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('product.twitter.title')}</h3>
              <p className="text-gray-600">{t('product.twitter.description')}</p>
            </div>

            {/* Content Generation */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('product.content.title')}</h3>
              <p className="text-gray-600">{t('product.content.description')}</p>
            </div>

            {/* Data Summary */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('product.summary.title')}</h3>
              <p className="text-gray-600">{t('product.summary.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Section */}
      <section id="cases" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('cases.title')}</h2>
            <p className="text-xl text-gray-600">{t('cases.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Case 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Tech</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('cases.tech.title')}</h3>
              <p className="text-gray-700 mb-4">{t('cases.tech.description')}</p>
              <div className="text-sm text-gray-600">{t('cases.tech.metrics')}</div>
            </div>

            {/* Case 2 */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">E-commerce</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('cases.ecommerce.title')}</h3>
              <p className="text-gray-700 mb-4">{t('cases.ecommerce.description')}</p>
              <div className="text-sm text-gray-600">{t('cases.ecommerce.metrics')}</div>
            </div>

            {/* Case 3 */}
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
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('contact.title')}</h2>
            <p className="text-xl text-gray-600">{t('contact.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t('contact.name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('contact.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('contact.company')}</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('contact.message')}</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              {t('contact.submit')}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}