import { CreditCard, Smartphone } from 'lucide-react';
import type { PaymentMethodConfig } from '../../config/paymentMethods';
import type { PaymentMethodAvailability } from '../../types/billing';

type Props = {
  config: PaymentMethodConfig;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  t: (key: string) => string;
};

function badgeKeyForAvailability(status: PaymentMethodAvailability): string {
  switch (status) {
    case 'pending_integration':
      return 'payment.badge.pendingIntegration';
    case 'unavailable':
      return 'payment.badge.providerDisconnected';
    case 'ready':
      return 'payment.badge.ready';
    default:
      return 'payment.badge.pendingIntegration';
  }
}

function MethodVisual({ id }: { id: PaymentMethodConfig['id'] }) {
  if (id === 'card') return <CreditCard className="h-6 w-6 text-violet-600" aria-hidden />;
  return <Smartphone className="h-6 w-6 text-gray-600" aria-hidden />;
}

export function PaymentMethodCard({ config, selected, disabled, onSelect, t }: Props) {
  const cardDisabled = disabled || !config.isEnabled;
  const showInlineNote = !disabled && config.isEnabled && selected;
  const badgeKey = badgeKeyForAvailability(config.availabilityStatus);

  return (
    <button
      type="button"
      disabled={cardDisabled}
      onClick={onSelect}
      className={`flex w-full flex-col rounded-xl border p-4 text-left transition-all ${config.accentClass} ${
        selected && !cardDisabled ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${cardDisabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-300'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
            <MethodVisual id={config.id} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900">{t(config.labelKey)}</div>
            <div className="text-xs text-gray-500">{t(config.descriptionKey)}</div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            cardDisabled ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {t(badgeKey)}
        </span>
      </div>
      {showInlineNote && (
        <p className="mt-3 border-t border-gray-200/80 pt-3 text-left text-[11px] leading-snug text-gray-600">
          {t(config.availabilityNoteKey)}
        </p>
      )}
    </button>
  );
}
