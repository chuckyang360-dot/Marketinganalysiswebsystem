import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { Target, BarChart2, TrendingUp, Users, ArrowRight } from 'lucide-react';

export function Cases() {
  const { t } = useLanguage();

  const caseData = [
    {
      tag: t('cases.tag1'),
      title: t('cases.case1.title'),
      client: t('cases.case1.client'),
      icon: <Target className="h-6 w-6" />,
      results: [
        { label: t('cases.r1.label'), value: '15+' },
        { label: t('cases.r2.label'), value: '280%' },
        { label: t('cases.r3.label'), value: '45%' }
      ],
      description: t('cases.case1.desc')
    },
    {
      tag: t('cases.tag2'),
      title: t('cases.case2.title'),
      client: t('cases.case2.client'),
      icon: <BarChart2 className="h-6 w-6" />,
      results: [
        { label: t('cases.r4.label'), value: '23+' },
        { label: t('cases.r5.label'), value: 'Top 3' },
        { label: t('cases.r6.label'), value: '320%' }
      ],
      description: t('cases.case2.desc')
    },
    {
      tag: t('cases.tag3'),
      title: t('cases.case3.title'),
      client: t('cases.case3.client'),
      icon: <TrendingUp className="h-6 w-6" />,
      results: [
        { label: t('cases.r7.label'), value: '50+' },
        { label: t('cases.r8.label'), value: '400%' },
        { label: t('cases.r9.label'), value: '+150%' }
      ],
      description: t('cases.case3.desc')
    },
    {
      tag: t('cases.tag4'),
      title: t('cases.case4.title'),
      client: t('cases.case4.client'),
      icon: <Users className="h-6 w-6" />,
      results: [
        { label: t('cases.r10.label'), value: '深度' },
        { label: t('cases.r11.label'), value: '+85%' },
        { label: t('cases.r12.label'), value: '300%' }
      ],
      description: t('cases.case4.desc')
    },
    {
      tag: t('cases.tag5'),
      title: t('cases.case5.title'),
      client: t('cases.case5.client'),
      icon: <Target className="h-6 w-6" />,
      results: [
        { label: t('cases.r13.label'), value: '+200%' },
        { label: t('cases.r14.label'), value: '+180%' },
        { label: t('cases.r15.label'), value: '显著提升' }
      ],
      description: t('cases.case5.desc')
    },
    {
      tag: t('cases.tag6'),
      title: t('cases.case6.title'),
      client: t('cases.case6.client'),
      icon: <BarChart2 className="h-6 w-6" />,
      results: [
        { label: t('cases.r16.label'), value: '+65%' },
        { label: t('cases.r17.label'), value: '-30%' },
        { label: t('cases.r18.label'), value: '全渠道' }
      ],
      description: t('cases.case6.desc')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900">
              {t('cases.title')}
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-500">
              {t('cases.subtitle')}
            </p>
          </div>

          {/* Cases Grid */}
          <div className="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {caseData.map((item, idx) => (
              <CaseCard
                key={idx}
                tag={item.tag}
                title={item.title}
                client={item.client}
                icon={item.icon}
                results={item.results}
                description={item.description}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 text-2xl font-bold">{t('cases.cta.title')}</h2>
            <p className="mb-8 max-w-xl text-blue-100">
              {t('cases.cta.desc')}
            </p>
            <button
              onClick={() => (window.location.href = '/workspace')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('cases.cta.button')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface CaseCardProps {
  tag: string;
  title: string;
  client: string;
  icon: React.ReactNode;
  results: { label: string; value: string }[];
  description: string;
}

function CaseCard({ tag, title, client, icon, results, description }: CaseCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex items-start justify-between">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {tag}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          {icon}
        </div>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{client}</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {results.map((result, idx) => (
          <div key={idx} className="rounded-lg bg-gray-50 p-2 text-center">
            <div className="text-lg font-bold text-gray-900">{result.value}</div>
            <div className="text-xs text-gray-500">{result.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-auto text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
