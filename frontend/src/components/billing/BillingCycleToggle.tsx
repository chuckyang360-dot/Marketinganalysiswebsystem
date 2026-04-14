import type { BillingCycle } from '../../types/billing';

type Props = {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
  monthlyLabel: string;
  yearlyLabel: string;
  saveLabel: string;
};

export function BillingCycleToggle({ value, onChange, monthlyLabel, yearlyLabel, saveLabel }: Props) {
  return (
    <div
      className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Billing cycle"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          value === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {monthlyLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          value === 'yearly' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {yearlyLabel}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            value === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {saveLabel}
        </span>
      </button>
    </div>
  );
}
