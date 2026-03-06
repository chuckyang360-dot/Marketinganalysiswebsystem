import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GP</span>
              </div>
              <span className="text-lg font-semibold">GlobalPulseAI</span>
            </div>
            <p className="text-sm text-gray-600">
              Growth Intelligence for Global Markets
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/seo" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('nav.seo')}
                </Link>
              </li>
              <li>
                <Link to="/reddit" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('nav.reddit')}
                </Link>
              </li>
              <li>
                <Link to="/twitter" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('nav.twitter')}
                </Link>
              </li>
              <li>
                <Link to="/content" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('nav.content')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.blog')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.careers')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.help')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.docs')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                  {t('footer.api')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}