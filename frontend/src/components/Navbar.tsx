import { useEffect, useRef, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const navItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.product'), to: '/product' },
    { label: t('nav.shortDrama'), to: '/short-drama' },
    { label: t('nav.cases'), to: '/cases' },
    { label: t('nav.pricing'), to: '/pricing' },
    { label: t('nav.workspace'), to: '/workspace' },
    { label: t('nav.about'), to: '/about' },
  ];
  const historyActive = location.pathname !== '/workspace' && location.pathname.startsWith('/workspace');
  const headerShadowClass = homeMode
    ? 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]'
    : 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
            const active =
              location.pathname === item.to ||
              (item.to === '/short-drama' && location.pathname.startsWith('/short-drama'));
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
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 max-w-[220px] items-center gap-2 rounded-lg border border-[#EAEAEA] px-3 text-[13px] font-medium text-[#111111] transition-colors hover:bg-[#F7F8FA]"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(123,97,255,0.12)] text-[11px] font-semibold text-[#7B61FF]">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate">{displayName}</span>
                <span className={`ml-1 text-[10px] text-[#888888] transition-transform ${menuOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[220px] rounded-xl border border-[#EAEAEA] bg-white p-1.5 shadow-md">
                  <button
                    type="button"
                    onClick={() => navigate('/workspace')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#444444] transition-colors hover:bg-[rgba(123,97,255,0.08)] hover:text-[#7B61FF]"
                  >
                    进入工作台
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/short-drama/projects')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#444444] transition-colors hover:bg-[rgba(123,97,255,0.08)] hover:text-[#7B61FF]"
                  >
                    项目管理
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/account/settings')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#444444] transition-colors hover:bg-[rgba(123,97,255,0.08)] hover:text-[#7B61FF]"
                  >
                    账户设置
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/account/plan')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#444444] transition-colors hover:bg-[rgba(123,97,255,0.08)] hover:text-[#7B61FF]"
                  >
                    升级计划
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/account/billing')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#444444] transition-colors hover:bg-[rgba(123,97,255,0.08)] hover:text-[#7B61FF]"
                  >
                    账单
                  </button>
                  <div className="my-1 border-t border-[#EAEAEA]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-red-500 transition-colors hover:bg-red-50"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : null}
            </div>
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
