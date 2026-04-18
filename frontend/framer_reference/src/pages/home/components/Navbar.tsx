import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "首页", path: "/" },
  { label: "产品", path: "/product" },
  { label: "短剧", path: "/short-drama", badge: "NEW" },
  { label: "案例", path: "/case" },
  { label: "定价", path: "/pricing" },
  { label: "关于我们", path: "/about" },
];

const LANGUAGES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("zh");

  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #EAEAEA",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1280px" }}>
        <div className="flex items-center justify-between h-16 lg:h-[68px]">

          {/* ── Left: Logo ── */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7B61FF, #5B8CFF)",
              }}
            >
              <i className="ri-global-line text-white text-[15px]" />
            </div>
            <span
              className="font-bold text-[16px] tracking-tight whitespace-nowrap"
              style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}
            >
              GlobalPulse
              <span
                style={{
                  background: "linear-gradient(135deg, #7B61FF, #5B8CFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AI
              </span>
            </span>
          </button>

          {/* ── Center: Nav links ── */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className="relative flex items-center gap-1.5 px-3.5 py-1.5 text-[13.5px] font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap"
                  style={{
                    color: active ? "#7B61FF" : "#444444",
                    background: active ? "rgba(123,97,255,0.07)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#111111";
                      (e.currentTarget as HTMLElement).style.background = "#F7F8FA";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#444444";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                  {(link as { badge?: string }).badge && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "#fff" }}
                    >
                      {(link as { badge?: string }).badge}
                    </span>
                  )}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#7B61FF" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Right: Lang + Account ── */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => { setLangOpen(!langOpen); setAccountOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  color: "#888888",
                  background: langOpen ? "#F7F8FA" : "transparent",
                  border: "1px solid #EAEAEA",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#444444"; }}
                onMouseLeave={(e) => { if (!langOpen) (e.currentTarget as HTMLElement).style.color = "#888888"; }}
              >
                <i className="ri-translate-2 text-[13px]" />
                <span className="text-[13px] font-medium">
                  {LANGUAGES.find((l) => l.code === currentLang)?.label}
                </span>
                <i
                  className="ri-arrow-down-s-line text-[13px] transition-transform duration-200"
                  style={{ transform: langOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-32 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #EAEAEA",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setCurrentLang(lang.code); setLangOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] cursor-pointer transition-colors duration-150"
                      style={{
                        color: currentLang === lang.code ? "#7B61FF" : "#444444",
                        background: currentLang === lang.code ? "rgba(123,97,255,0.06)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (currentLang !== lang.code)
                          (e.currentTarget as HTMLElement).style.background = "#F7F8FA";
                      }}
                      onMouseLeave={(e) => {
                        if (currentLang !== lang.code)
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <span className="font-medium">{lang.label}</span>
                      {currentLang === lang.code && (
                        <i className="ri-check-line text-[12px]" style={{ color: "#7B61FF" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account area */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => { setAccountOpen(!accountOpen); setLangOpen(false); }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: accountOpen ? "#F7F8FA" : "#F7F8FA",
                  border: "1px solid #EAEAEA",
                }}
              >
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
                >
                  C
                </div>
                <span className="text-[13px] font-medium" style={{ color: "#444444" }}>
                  chuck
                </span>
                <i
                  className="ri-arrow-down-s-line text-[13px] transition-transform duration-200"
                  style={{
                    color: "#888888",
                    transform: accountOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {accountOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #EAEAEA",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    className="px-4 py-3 flex items-center gap-2.5"
                    style={{ borderBottom: "1px solid #F0F0F0" }}
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
                    >
                      C
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight" style={{ color: "#111111" }}>chuck</p>
                      <p className="text-[11px]" style={{ color: "#888888" }}>Free Plan</p>
                    </div>
                  </div>

                  {[
                    { icon: "ri-dashboard-line", label: "进入工作台", path: "/workspace" },
                    { icon: "ri-settings-3-line", label: "账户设置", path: "/about" },
                    { icon: "ri-vip-crown-line", label: "升级计划", path: "/pricing" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.path); setAccountOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] cursor-pointer transition-colors duration-150"
                      style={{ color: "#444444" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#F7F8FA";
                        (e.currentTarget as HTMLElement).style.color = "#111111";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#444444";
                      }}
                    >
                      <i className={`${item.icon} text-[13px]`} />
                      {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: "1px solid #F0F0F0" }}>
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] cursor-pointer transition-colors duration-150"
                      style={{ color: "#ef4444" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <i className="ri-logout-box-r-line text-[13px]" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              color: "#444444",
              background: menuOpen ? "#F7F8FA" : "transparent",
            }}
          >
            <i className={`${menuOpen ? "ri-close-line" : "ri-menu-line"} text-[20px]`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden px-6 py-5 flex flex-col gap-1"
          style={{
            background: "#ffffff",
            borderTop: "1px solid #EAEAEA",
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-[15px] font-medium rounded-lg cursor-pointer transition-colors duration-200 whitespace-nowrap"
              style={{
                color: isActive(link.path) ? "#7B61FF" : "#444444",
                background: isActive(link.path) ? "rgba(123,97,255,0.06)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.path)) {
                  (e.currentTarget as HTMLElement).style.background = "#F7F8FA";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.path)) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {link.label}
            </button>
          ))}
          <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid #EAEAEA" }}>
            <button
              onClick={() => { navigate("/workspace"); setMenuOpen(false); }}
              className="flex-1 px-5 py-3 rounded-xl text-[14px] font-semibold text-white text-center cursor-pointer whitespace-nowrap transition-opacity duration-200 hover:opacity-85"
              style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
            >
              进入工作台
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
