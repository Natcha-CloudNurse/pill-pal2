import { Medication, StockStatus } from '@/types/medication';

export function calculateStockStatus(med: Medication): StockStatus {
  if (med.status === 'stopped') return 'normal';
  if (med.currentAmount === 0) return 'out_of_stock';
  
  const requiredQty = calculateRequiredQty(med);
  if (med.currentAmount <= requiredQty) return 'low';
  return 'normal';
}

export function calculateRequiredQty(med: Medication): number {
  const dosesPerScheduledDay = med.timings.filter(t => t.time !== null).length || 1;
  const alertDays = med.alertDays;

  let scheduledDaysInWindow: number;

  switch (med.frequency) {
    case 'daily':
      scheduledDaysInWindow = alertDays;
      break;
    case 'specific_days':
      // Count how many of the specific days fall within alertDays window
      scheduledDaysInWindow = Math.floor(alertDays / 7) * (med.specificDays?.length || 0);
      const remainder = alertDays % 7;
      const today = new Date().getDay();
      for (let i = 0; i < remainder; i++) {
        const dayOfWeek = (today + i) % 7;
        if (med.specificDays?.includes(dayOfWeek)) scheduledDaysInWindow++;
      }
      break;
    case 'prn':
      scheduledDaysInWindow = alertDays;
      return scheduledDaysInWindow * 1 * med.amountPerDose;
    case 'every_n_days':
      scheduledDaysInWindow = Math.ceil(alertDays / (med.everyNDays || 1));
      break;
    default:
      scheduledDaysInWindow = alertDays;
  }

  return scheduledDaysInWindow * dosesPerScheduledDay * med.amountPerDose;
}

export function calculateDaysRemaining(med: Medication): number | null {
  if (med.status === 'stopped' || med.currentAmount === 0) return null;
  
  const dosesPerDay = med.timings.filter(t => t.time !== null).length || 1;
  let effectiveDosesPerDay: number;

  switch (med.frequency) {
    case 'daily':
      effectiveDosesPerDay = dosesPerDay;
      break;
    case 'specific_days':
      effectiveDosesPerDay = dosesPerDay * ((med.specificDays?.length || 1) / 7);
      break;
    case 'prn':
      effectiveDosesPerDay = 1;
      break;
    case 'every_n_days':
      effectiveDosesPerDay = dosesPerDay / (med.everyNDays || 1);
      break;
    default:
      effectiveDosesPerDay = dosesPerDay;
  }

  const dailyConsumption = effectiveDosesPerDay * med.amountPerDose;
  if (dailyConsumption === 0) return null;
  return Math.floor(med.currentAmount / dailyConsumption);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
