import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

export function BillingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="pt-20">
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">账单</h1>

          <div className="space-y-6">
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm text-gray-500">当前订阅</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  当前套餐：<span className="font-medium text-gray-900">Free Plan</span>
                </p>
                <p className="text-sm text-gray-700">
                  状态：<span className="font-medium text-gray-900">未订阅</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/account/plan')}
                className="rounded-lg bg-[rgba(123,97,255,0.12)] px-4 py-2 text-sm font-medium text-[#7B61FF] transition-colors hover:bg-[rgba(123,97,255,0.18)]"
              >
                升级计划
              </button>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm text-gray-500">使用额度</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  AI 分析：<span className="font-medium text-gray-900">0 / 免费额度</span>
                </p>
                <p>
                  商品分析：<span className="font-medium text-gray-900">0 / 免费额度</span>
                </p>
                <p>
                  短剧生成：<span className="font-medium text-gray-900">0 / 免费额度</span>
                </p>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm text-gray-500">账单记录</h2>
              <p className="text-sm text-gray-400">暂无账单记录</p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
