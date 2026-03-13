import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.product'), to: '/product' },
    { label: t('nav.cases'), to: '/cases' },
    { label: t('nav.workspace'), to: '/workspace' },
    { label: t('nav.about'), to: '/about' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-gray-200 bg-white">
      <div className="mx-auto h-full max-w-[1400px] flex items-center justify-between px-6">
        {/* 左侧 Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
              GP
            </div>
            <span className="text-2xl font-bold text-gray-900">GlobalPulse AI</span>
          </Link>
        </div>

        {/* 中间导航 */}
        <nav className="flex items-center justify-center gap-8">
          {(navItems ?? []).map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative px-4 py-2 text-base font-medium transition-colors"
              >
                <span className={active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 右侧用户区 */}
        <div className="flex shrink-0 items-center gap-4">
          {/* 语言切换 */}
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="text-base text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Toggle language"
          >
            {language === 'zh' ? '中文' : 'EN'}
          </button>

          {isAuthenticated ? (
            <>
              <span className="max-w-[180px] truncate text-base font-medium text-gray-900">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-base text-gray-700 hover:text-red-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="text-base text-gray-700 hover:text-blue-600 transition-colors">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
