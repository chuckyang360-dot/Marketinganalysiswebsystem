import { Link, useLocation, useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/seo', label: t('nav.seo') },
    { path: '/reddit', label: t('nav.reddit') },
    { path: '/twitter', label: t('nav.twitter') },
    { path: '/content', label: t('nav.content') },
    { path: '/summary', label: t('nav.summary') },
    { path: '/history', label: t('nav.history') },
    { path: '/about', label: t('nav.about') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="text-xl font-semibold">GlobalPulseAI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">{language === 'zh' ? '中文' : 'EN'}</span>
          </button>

          {/* Login/Register - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              {t('nav.login')}
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => navigate('/register')}>
              {t('nav.register')}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => navigate('/register')}>
                {t('nav.register')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}