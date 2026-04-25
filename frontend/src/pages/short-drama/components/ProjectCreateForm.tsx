import type { AspectRatioOption, DurationOption, PlotStyle, ProjectFormat, VisualStyle } from '../types/shortDrama';
import { ri, sdColors } from '../utils/shortDramaHelpers';

const DURATIONS: DurationOption[] = ['30s', '45s', '60s'];

const FORMATS: { value: ProjectFormat; label: string; desc: string }[] = [
  { value: 'single_ad', label: '单条广告', desc: '独立完整的广告短片' },
  { value: 'series', label: '系列短视频', desc: '多集连载营销内容' },
];

const PLOT: { value: PlotStyle; label: string; icon: string }[] = [
  { value: 'twist', label: '反转', icon: 'ri-exchange-line' },
  { value: 'conflict', label: '冲突', icon: 'ri-sword-line' },
  { value: 'suspense', label: '悬疑', icon: 'ri-eye-2-line' },
  { value: 'comedy', label: '搞笑', icon: 'ri-emotion-laugh-line' },
  { value: 'emotion', label: '情绪', icon: 'ri-heart-pulse-line' },
];

const VISUAL: { value: VisualStyle; label: string; icon: string }[] = [
  { value: 'cinematic', label: '写实电影感', icon: 'ri-camera-lens-line' },
  { value: 'animation', label: '动画风格', icon: 'ri-brush-line' },
  { value: '3d', label: '3D 渲染', icon: 'ri-shape-2-line' },
  { value: 'premium_ad', label: '高级广告感', icon: 'ri-sparkling-2-line' },
];

const RATIOS: AspectRatioOption[] = ['9:16', '16:9'];

type Props = {
  projectName: string;
  setProjectName: (v: string) => void;
  duration: DurationOption;
  setDuration: (v: DurationOption) => void;
  format: ProjectFormat;
  setFormat: (v: ProjectFormat) => void;
  plotStyles: PlotStyle[];
  togglePlotStyle: (v: PlotStyle) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (v: VisualStyle) => void;
  aspectRatio: AspectRatioOption;
  setAspectRatio: (v: AspectRatioOption) => void;
};

export function ProjectCreateForm({
  projectName,
  setProjectName,
  duration,
  setDuration,
  format,
  setFormat,
  plotStyles,
  togglePlotStyle,
  visualStyle,
  setVisualStyle,
  aspectRatio,
  setAspectRatio,
}: Props) {
  const inputCls =
    'w-full rounded-xl border border-[#EAEAEA] bg-[#F7F8FA] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1D1D1F] focus:bg-white';

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[#444444]">
          项目名称 <span className="text-red-600">*</span>
        </label>
        <input
          className={inputCls}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="例如：夏季新品推广竖屏短视频"
        />
      </div>

      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[#444444]">视频时长</label>
        <div className="flex gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className="flex-1 rounded-xl py-3 text-[14px] font-semibold transition-colors"
              style={{
                background: duration === d ? sdColors.ink : sdColors.surface,
                border: `1px solid ${duration === d ? sdColors.ink : sdColors.border}`,
                color: duration === d ? '#fff' : '#8E8E93',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[#444444]">内容形式</label>
        <div className="grid grid-cols-2 gap-3">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className="cursor-pointer rounded-xl p-4 text-left transition-colors"
              style={{
                background: format === f.value ? sdColors.ink : sdColors.surface,
                border: `1px solid ${format === f.value ? sdColors.ink : sdColors.border}`,
              }}
            >
              <p
                className="mb-1 text-[13.5px] font-semibold"
                style={{ color: format === f.value ? '#fff' : sdColors.ink }}
              >
                {f.label}
              </p>
              <p
                className="text-[11.5px]"
                style={{ color: format === f.value ? 'rgba(255,255,255,0.65)' : '#8E8E93' }}
              >
                {f.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[#444444]">剧情风格（可多选）</label>
        <div className="flex flex-wrap gap-2">
          {PLOT.map((s) => {
            const active = plotStyles.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => togglePlotStyle(s.value)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors"
                style={{
                  background: active ? sdColors.ink : sdColors.surface,
                  border: `1px solid ${active ? sdColors.ink : sdColors.border}`,
                  color: active ? '#fff' : '#6E6E73',
                }}
              >
                <i
                  className={ri(s.icon, 'text-[13px]')}
                  style={{ color: active ? '#fff' : '#6E6E73' }}
                  aria-hidden
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[#444444]">视觉风格</label>
        <div className="grid grid-cols-2 gap-3">
          {VISUAL.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setVisualStyle(s.value)}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors"
              style={{
                background: visualStyle === s.value ? sdColors.ink : sdColors.surface,
                border: `1px solid ${visualStyle === s.value ? sdColors.ink : sdColors.border}`,
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: visualStyle === s.value ? 'rgba(255,255,255,0.15)' : '#EAEAEA',
                }}
              >
                <i
                  className={ri(s.icon, 'text-[14px]')}
                  style={{ color: visualStyle === s.value ? '#fff' : '#6E6E73' }}
                  aria-hidden
                />
              </div>
              <span
                className="text-[13px] font-medium"
                style={{ color: visualStyle === s.value ? '#fff' : '#444444' }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[#444444]">画面比例</label>
        <div className="flex gap-3">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAspectRatio(r)}
              className="flex-1 rounded-xl py-3 text-[14px] font-semibold transition-colors"
              style={{
                background: aspectRatio === r ? sdColors.ink : sdColors.surface,
                border: `1px solid ${aspectRatio === r ? sdColors.ink : sdColors.border}`,
                color: aspectRatio === r ? '#fff' : '#8E8E93',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
