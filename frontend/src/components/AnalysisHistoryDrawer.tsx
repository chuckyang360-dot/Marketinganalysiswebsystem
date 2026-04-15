import { useMemo, useState } from 'react';
import type { AnalysisHistoryRecord } from '../types/history';

type HistoryTab = 'all' | 'product' | 'marketing' | 'content';

interface Props {
  open: boolean;
  records: AnalysisHistoryRecord[];
  onClose: () => void;
  onOpenRecord: (record: AnalysisHistoryRecord) => void;
}

const PLATFORM_STYLE: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  amazon: { icon: 'ri-amazon-line', color: '#FF9900', bg: 'rgba(255,153,0,0.12)', label: 'Amazon' },
  shopee: { icon: 'ri-shopping-bag-line', color: '#EE4D2D', bg: 'rgba(238,77,45,0.12)', label: 'Shopee' },
  lazada: { icon: 'ri-store-2-line', color: '#0F146D', bg: 'rgba(15,20,109,0.10)', label: 'Lazada' },
  tiktok: { icon: 'ri-tiktok-line', color: '#111111', bg: 'rgba(17,17,17,0.08)', label: 'TikTok' },
  shopify: { icon: 'ri-shopping-cart-2-line', color: '#96BF48', bg: 'rgba(150,191,72,0.14)', label: 'Shopify' },
  multi_source: { icon: 'ri-bar-chart-box-line', color: '#7B61FF', bg: 'rgba(123,97,255,0.12)', label: 'Multi' },
  unknown: { icon: 'ri-question-line', color: '#9CA3AF', bg: 'rgba(156,163,175,0.14)', label: 'Unknown' },
};

function formatTime(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AnalysisHistoryDrawer({ open, records, onClose, onOpenRecord }: Props) {
  const [tab, setTab] = useState<HistoryTab>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return records;
    if (tab === 'product') return records.filter((r) => r.type === 'ecom_product');
    if (tab === 'marketing') return records.filter((r) => r.type === 'marketing_report');
    return records.filter((r) => r.type === 'content_creation');
  }, [records, tab]);

  const tabs: Array<{ id: HistoryTab; label: string }> = [
    { id: 'all', label: '全部' },
    { id: 'product', label: '商品' },
    { id: 'marketing', label: '营销' },
    { id: 'content', label: '内容' },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[352px] max-w-[95vw] border-l border-[#EAEAEA] bg-white shadow-[0_20px_56px_rgba(17,24,39,0.18)] transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(123,97,255,0.15)] bg-[rgba(123,97,255,0.08)]">
                <i className="ri-history-line text-[13px] text-[#7B61FF]" />
              </div>
              <div>
                <div className="text-[14px] font-semibold leading-tight text-[#111111]">分析历史</div>
                <div className="mt-0.5 text-[11px] text-[#AAAAAA]">共 {records.length} 条记录</div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EAEAEA] text-[#888888] transition-colors hover:border-[#CCCCCC] hover:text-[#111111]"
              onClick={onClose}
            >
              <i className="ri-close-line text-[14px]" />
            </button>
          </div>

          <div className="border-b border-[#F2F2F2] px-4 pb-3 pt-3">
            <div className="flex items-center gap-1 rounded-xl border border-[#EAEAEA] bg-[#F7F8FA] p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                    tab === t.id
                      ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      : 'text-[#888888] hover:text-[#444444]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <div className="w-12 h-12 rounded-2xl border border-[#EAEAEA] bg-[#F7F8FA] flex items-center justify-center">
                  <i className="ri-inbox-line text-[20px] text-[#CCCCCC]" />
                </div>
                <div className="text-[13px] text-[#AAAAAA]">暂无记录</div>
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {filtered.map((record) => (
                  <HistoryRecordItem key={record.id} record={record} onOpenRecord={onOpenRecord} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#EAEAEA] px-5 py-3">
            <p className="text-[11px] text-[#CCCCCC]">仅保留最近 100 条</p>
            <span className="text-[11px] text-[#AAAAAA]">历史记录</span>
          </div>
        </div>
      </aside>
    </>
  );
}

interface HistoryRecordItemProps {
  record: AnalysisHistoryRecord;
  onOpenRecord: (record: AnalysisHistoryRecord) => void;
}

function HistoryRecordItem({ record, onOpenRecord }: HistoryRecordItemProps) {
  const [hovered, setHovered] = useState(false);
  const key = String(record.platform || 'unknown').toLowerCase();
  const platform = PLATFORM_STYLE[key] || PLATFORM_STYLE.unknown;

  return (
    <button
      type="button"
      onClick={() => onOpenRecord(record)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
        hovered ? 'border-[#EAEAEA] bg-[#F7F8FA]' : 'border-transparent bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
          style={{ background: platform.bg, borderColor: `${platform.color}33` }}
        >
          <i className={`${platform.icon} text-[14px]`} style={{ color: platform.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-medium leading-snug text-[#111111]">
              {record.title || record.display_value}
            </p>
            <span className="whitespace-nowrap text-[10px] text-[#B8B8B8]">{formatTime(record.updated_at)}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[#888888]">
            {platform.label} · {record.type === 'ecom_product' ? '商品分析' : record.type === 'marketing_report' ? '营销分析' : '内容制作'}
          </p>
          {record.type === 'ecom_product' ? (
            <p className="mt-1 text-[10px] text-[#A3A3A3]">
              评分 {record.score ?? 72} · 问题 {record.issues_count ?? 3}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
