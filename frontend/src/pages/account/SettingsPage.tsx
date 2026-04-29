import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('gp_user');
      return raw ? (JSON.parse(raw) as { id?: number | string; email?: string; name?: string }) : null;
    } catch {
      return null;
    }
  })();

  const profile = {
    username: user?.name || storedUser?.name || 'chuck',
    email: user?.email || storedUser?.email || 'example@email.com',
    id: String(user?.id ?? storedUser?.id ?? 'user_123'),
    plan: 'Free Plan',
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="pt-20">
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">账户设置</h1>

          <div className="space-y-6">
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm text-gray-500">基础信息</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">用户名</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{profile.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">邮箱</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">当前套餐</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{profile.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">用户ID</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{profile.id}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm text-gray-500">账户操作</h2>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                退出登录
              </button>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
