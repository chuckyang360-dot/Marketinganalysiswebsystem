import { useNavigate } from 'react-router-dom';
import { mockAudience, mockCapabilityCards, mockWorkflowSteps } from './data/mockShortDrama';
import { CapabilityCards } from './components/CapabilityCards';
import { SectionHeader } from './components/SectionHeader';
import { ShortDramaHero } from './components/ShortDramaHero';
import { ShortDramaLayout } from './components/ShortDramaLayout';
import { WorkflowSteps } from './components/WorkflowSteps';
import { ri, sdColors, sdFontHeading } from './utils/shortDramaHelpers';

export default function ShortDramaLandingPage() {
  const navigate = useNavigate();

  return (
    <ShortDramaLayout headerMode="landing">
      <ShortDramaHero />

      <section id="sd-capabilities" className="scroll-mt-24 bg-[#F7F8FA] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Core Capabilities"
            title="四大核心能力"
            subtitle="从产品资料到可用视频，完整的 AI 工作流，每个步骤都有结构化产出"
          />
          <CapabilityCards cards={mockCapabilityCards} />
        </div>
      </section>

      <section id="sd-workflow" className="scroll-mt-24 bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Workflow"
            eyebrowVariant="pillOutline"
            title="5 步完成一部短剧广告"
            subtitle="结构化工作流，每一步都有清晰产出，团队协作无摩擦"
            subtitleMaxWidthClass="max-w-lg"
          />
          <WorkflowSteps steps={mockWorkflowSteps} />
        </div>
      </section>

      <section id="sd-audience" className="scroll-mt-24 bg-[#F7F8FA] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="For Who"
            title="为出海业务而生"
            subtitle="专为 B 端内容决策者设计，不是泛娱乐工具，是商业内容生产系统"
            subtitleMaxWidthClass="max-w-lg"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mockAudience.map((a) => (
              <div
                key={a.id}
                className="flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#ffffff', border: '1px solid #EAEAEA' }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${a.accentColor}10` }}
                  aria-hidden
                >
                  <i className={ri(a.icon, 'text-[18px]')} style={{ color: a.accentColor }} />
                </div>
                <h3
                  className="mb-2 text-[15px] font-bold"
                  style={{ ...sdFontHeading, color: sdColors.ink }}
                >
                  {a.title}
                </h3>
                <p className="mb-4 text-[12.5px] leading-relaxed" style={{ color: '#6E6E73' }}>
                  {a.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {a.examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-full px-2 py-1 text-[10px]"
                      style={{
                        background: '#F5F5F7',
                        color: '#6E6E73',
                        border: '1px solid #EAEAEA',
                      }}
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#EAEAEA] bg-white px-6 py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2
            className="mb-3 text-[clamp(22px,3vw,30px)] font-extrabold"
            style={{ ...sdFontHeading, color: sdColors.ink }}
          >
            开始你的短剧项目
          </h2>
          <p className="mb-8 max-w-xl text-[15px] leading-relaxed" style={{ color: '#8E8E93' }}>
            本轮为前端骨架：创建流程使用本地状态与占位数据，尚未连接后端。
          </p>
          <button
            type="button"
            onClick={() => navigate('/short-drama/create')}
            className="rounded-xl px-8 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#374151]"
            style={{ background: sdColors.ink }}
          >
            创建短剧项目
          </button>
        </div>
      </section>

      <footer className="border-t border-[#EAEAEA] bg-[#F7F8FA] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${sdColors.ink}, ${sdColors.inkMuted})` }}
            >
              <i className={ri('ri-film-line', 'text-[11px] text-white')} aria-hidden />
            </div>
            <span className="text-[13px] font-medium text-[#8E8E93]" style={sdFontHeading}>
              ShortDrama Engine · Powered by GlobalPulseAI
            </span>
          </div>
          <p className="text-[12px] text-[#AEAEB2]">© {new Date().getFullYear()} GlobalPulseAI</p>
        </div>
      </footer>
    </ShortDramaLayout>
  );
}
