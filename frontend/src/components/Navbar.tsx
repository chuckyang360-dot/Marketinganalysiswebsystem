import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

type NavbarProps = {
  homeMode?: boolean;
  onOpenHistory?: () => void;
};

export function Navbar({ homeMode = false, onOpenHistory }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.product'), to: '/product' },
    { label: t('nav.pricing'), to: '/pricing' },
    { label: t('nav.cases'), to: '/cases' },
    { label: t('nav.workspace'), to: '/workspace' },
    { label: t('nav.about'), to: '/about' },
  ];
  const historyActive = location.pathname !== '/workspace' && location.pathname.startsWith('/workspace');
  const headerShadowClass = homeMode
    ? 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]'
    : 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#EAEAEA] bg-white ${headerShadowClass} transition-shadow duration-300 lg:h-[68px]`}>
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6 lg:px-10">
        {/* 左侧 Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
              GP
            </div>
            <span
              className="text-2xl font-bold text-gray-900"
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
              }}
            >
              GlobalPulse AI
            </span>
          </Link>
        </div>

        {/* 中间导航 */}
        <nav className="flex items-center justify-center gap-1">
          {(navItems ?? []).map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium leading-none transition-all duration-200 ${
                  active
                    ? 'text-[#7B61FF] bg-[rgba(123,97,255,0.07)]'
                    : 'text-[#444444] hover:bg-[#F7F8FA] hover:text-[#111111]'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <>
                    <span className="absolute inset-0 rounded-lg bg-[rgba(123,97,255,0.07)] -z-10" />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7B61FF]" />
                  </>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (onOpenHistory) onOpenHistory();
              else navigate('/workspace');
            }}
            className={`relative px-3.5 py-1.5 text-[13.5px] font-medium rounded-lg transition-all duration-200 ${
              historyActive
                ? 'text-[#7B61FF] bg-[rgba(123,97,255,0.07)]'
                : 'text-[#444444] hover:text-[#111111] hover:bg-[#F7F8FA]'
            }`}
          >
            {language === 'zh' ? '历史' : 'History'}
            {historyActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7B61FF]" />
            )}
          </button>
        </nav>

        {/* 右侧用户区 */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* 语言切换 */}
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="h-8 rounded-lg border border-[#EAEAEA] px-3 text-[13px] font-medium leading-none text-[#888888] transition-colors hover:bg-[#F7F8FA] hover:text-[#444444]"
            aria-label="Toggle language"
          >
            {language === 'zh' ? '中文' : 'EN'}
          </button>

          {isAuthenticated ? (
            <>
              <span className="max-w-[180px] truncate px-2 text-[13px] font-medium leading-none text-[#111111]">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="h-8 rounded-lg border border-[#EAEAEA] px-3 text-[13px] leading-none text-[#666666] transition-colors hover:bg-red-50 hover:text-red-600"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="flex h-8 items-center rounded-lg border border-[#EAEAEA] px-3 text-[13px] leading-none text-[#666666] transition-colors hover:bg-[rgba(123,97,255,0.06)] hover:text-[#7B61FF]">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
