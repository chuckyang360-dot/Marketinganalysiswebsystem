import type { PaymentMethodId, PaymentMethodAvailability } from '../types/billing';

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  labelKey: string;
  descriptionKey: string;
  accentClass: string;
  isEnabled: boolean;
  availabilityStatus: PaymentMethodAvailability;
  availabilityNoteKey: string;
  /** Internal routing id for future PSP — not shown in UI */
  providerKey: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'wechat_pay',
    labelKey: 'payment.method.wechat',
    descriptionKey: 'payment.method.wechat.desc',
    accentClass: 'border-emerald-200 bg-emerald-50/50',
    isEnabled: true,
    availabilityStatus: 'pending_integration',
    availabilityNoteKey: 'payment.availability.wechat',
    providerKey: 'wechat_pay_native',
  },
  {
    id: 'alipay',
    labelKey: 'payment.method.alipay',
    descriptionKey: 'payment.method.alipay.desc',
    accentClass: 'border-sky-200 bg-sky-50/50',
    isEnabled: true,
    availabilityStatus: 'pending_integration',
    availabilityNoteKey: 'payment.availability.alipay',
    providerKey: 'alipay_native',
  },
  {
    id: 'apple_pay',
    labelKey: 'payment.method.apple',
    descriptionKey: 'payment.method.apple.desc',
    accentClass: 'border-gray-200 bg-gray-50',
    isEnabled: true,
    availabilityStatus: 'unavailable',
    availabilityNoteKey: 'payment.availability.apple',
    providerKey: 'apple_pay_merchant',
  },
  {
    id: 'card',
    labelKey: 'payment.method.card',
    descriptionKey: 'payment.method.card.desc',
    accentClass: 'border-violet-200 bg-violet-50/50',
    isEnabled: true,
    availabilityStatus: 'unavailable',
    availabilityNoteKey: 'payment.availability.card',
    providerKey: 'card_gateway_tbd',
  },
];
