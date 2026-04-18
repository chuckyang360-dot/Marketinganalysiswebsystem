import { useEffect, useRef, useState } from 'react';
import { sdFontHeading } from '../utils/shortDramaHelpers';

export type LightboxItem = {
  img: string;
  name: string;
  subtitle: string;
  desc: string;
  tags?: string[];
  meta?: Array<{ icon: string; label: string; value: string }>;
  orientation?: 'portrait' | 'landscape';
};

type Props = {
  item: LightboxItem | null;
  onClose: () => void;
};

/** Framer `AssetLightbox.tsx` 映射 */
export function AssetLightbox({ item, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (item) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  if (!item) return null;

  const isPortrait = item.orientation === 'portrait';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      style={{
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden md:flex-row"
        style={{
          maxWidth: isPortrait ? '860px' : '1000px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #EAEAEA',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(16px)',
          transition: 'opacity 0.28s ease, transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all duration-200"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#444444' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)';
          }}
        >
          <i className="ri-close-line text-[15px]" aria-hidden />
        </button>

        <div
          className="flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            background: '#F5F5F7',
            width: isPortrait ? 'min(380px, 45%)' : '100%',
            minHeight: isPortrait ? '480px' : '360px',
            maxHeight: isPortrait ? '90vh' : '60vh',
            borderRadius: isPortrait ? '20px 0 0 20px' : '20px 20px 0 0',
          }}
        >
          <img
            src={item.img}
            alt={item.name}
            className="h-full w-full"
            style={{ objectFit: 'contain', maxHeight: isPortrait ? '90vh' : '60vh' }}
          />
        </div>

        <div
          className="flex min-w-0 flex-col overflow-y-auto"
          style={{
            flex: 1,
            padding: '32px 28px',
          }}
        >
          <span
            className="mb-4 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: '#F5F5F7', color: '#6E6E73', border: '1px solid #EAEAEA' }}
          >
            {item.subtitle}
          </span>

          <h2
            className="mb-3 text-[26px] font-black leading-tight"
            style={{ ...sdFontHeading, color: '#1D1D1F' }}
          >
            {item.name}
          </h2>

          <p className="mb-5 text-[13.5px] leading-relaxed" style={{ color: '#6E6E73' }}>
            {item.desc}
          </p>

          {item.tags && item.tags.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                  style={{ background: '#F0F0F5', color: '#444444' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {item.meta && item.meta.length > 0 ? (
            <div className="mb-6 overflow-hidden rounded-xl" style={{ border: '1px solid #EAEAEA' }}>
              {item.meta.map((m, idx) => (
                <div
                  key={m.label}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: idx < item.meta!.length - 1 ? '1px solid #F5F5F7' : 'none',
                    background: '#ffffff',
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: '#F5F5F7' }}
                  >
                    <i className={`${m.icon} text-[12px] text-[#8E8E93]`} aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: '#AEAEB2' }}>
                      {m.label}
                    </p>
                    <p className="text-[12.5px] font-medium" style={{ color: '#1D1D1F' }}>
                      {m.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex-1" />

          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer whitespace-nowrap rounded-xl border border-[#EAEAEA] bg-[#F5F5F7] py-2.5 text-[13px] font-medium text-[#444444] transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#EAEAEA';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F5F5F7';
              }}
            >
              关闭
            </button>
            <button
              type="button"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1D1D1F] py-2.5 text-[13px] font-medium text-white transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#374151';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#1D1D1F';
              }}
            >
              <i className="ri-edit-line text-[12px]" aria-hidden />
              编辑角色
            </button>
          </div>

          <p className="mt-3 text-center text-[11px]" style={{ color: '#C7C7CC' }}>
            按 ESC 或点击背景关闭
          </p>
        </div>
      </div>
    </div>
  );
}
