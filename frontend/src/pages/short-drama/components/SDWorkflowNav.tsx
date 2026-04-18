import { useNavigate } from 'react-router-dom';
import { ri, sdFontHeading } from '../utils/shortDramaHelpers';
import { withProjectQuery } from '../utils/shortDramaRoutes';

const STEPS = [
  { label: '产品输入', path: '/short-drama/product-input', step: 1 },
  { label: '剧本大纲', path: '/short-drama/story-blueprint', step: 2 },
  { label: '角色场景', path: '/short-drama/assets', step: 3 },
  { label: '片段视频', path: '/short-drama/step4', step: 4 },
] as const;

export type SDWorkflowNavProps = {
  /** Framer：无 currentStep 时不渲染中部步骤条（如创建项目页） */
  currentStep?: number;
  projectName?: string;
  /** 步骤间跳转时附带 ?projectId= */
  projectId?: number | null;
};

/**
 * Framer `SDSharedNav.tsx` 映射：布局 / 步骤展示 / 项目名称 / 右侧按钮位置一致。
 */
export function SDWorkflowNav({ currentStep, projectName, projectId }: SDWorkflowNavProps) {
  const navigate = useNavigate();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #EAEAEA',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      <div className="mx-auto flex h-14 items-center justify-between px-6 lg:px-10" style={{ maxWidth: '1440px' }}>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/short-drama')}
            className="group flex cursor-pointer items-center gap-2"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1D1D1F, #374151)' }}
            >
              <i className={ri('ri-film-line', 'text-[13px] text-white')} aria-hidden />
            </div>
            <span
              className="whitespace-nowrap text-[14px] font-bold"
              style={{ ...sdFontHeading, color: '#1D1D1F' }}
            >
              Short<span style={{ color: '#374151' }}>Drama</span>
            </span>
          </button>

          {projectName ? (
            <>
              <span className="text-[14px] text-[#AEAEB2]">/</span>
              <span className="max-w-[160px] truncate whitespace-nowrap text-[13px] text-[#8E8E93]">
                {projectName}
              </span>
            </>
          ) : null}
        </div>

        {currentStep !== undefined ? (
          <div className="hidden items-center gap-1 md:flex">
            {STEPS.map((s, idx) => {
              const isActive = s.step === currentStep;
              const isDone = s.step < currentStep;
              return (
                <div key={s.step} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isDone && navigate(withProjectQuery(s.path, projectId))}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200"
                    style={{
                      cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
                      background: isActive ? '#1D1D1F' : isDone ? 'rgba(5,150,105,0.08)' : 'transparent',
                      color: isActive ? '#ffffff' : isDone ? '#047857' : '#AEAEB2',
                    }}
                    onMouseEnter={(e) => {
                      if (isDone) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(5,150,105,0.14)';
                    }}
                    onMouseLeave={(e) => {
                      if (isDone) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(5,150,105,0.08)';
                    }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.2)' : isDone ? '#047857' : '#F5F5F7',
                        color: isActive ? '#fff' : isDone ? '#fff' : '#AEAEB2',
                      }}
                    >
                      {isDone ? <i className={ri('ri-check-line', 'text-[10px]')} aria-hidden /> : s.step}
                    </span>
                    {s.label}
                  </button>
                  {idx < STEPS.length - 1 ? (
                    <i className={ri('ri-arrow-right-s-line', 'mx-0.5 text-[14px] text-[#D1D1D6]')} aria-hidden />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] transition-all duration-200"
            style={{ color: '#8E8E93', background: 'transparent' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#1D1D1F';
              (e.currentTarget as HTMLButtonElement).style.background = '#F7F8FA';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#8E8E93';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <i className={ri('ri-home-4-line', 'text-[13px]')} aria-hidden />
            <span className="hidden lg:inline">返回官网</span>
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-4 py-1.5 text-[12.5px] font-medium text-[#444444] transition-all duration-200"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#EAEAEA';
              (e.currentTarget as HTMLButtonElement).style.color = '#1D1D1F';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F7F8FA';
              (e.currentTarget as HTMLButtonElement).style.color = '#444444';
            }}
          >
            <i className={ri('ri-save-line', 'text-[12px]')} aria-hidden />
            保存草稿
          </button>
        </div>
      </div>
    </header>
  );
}
