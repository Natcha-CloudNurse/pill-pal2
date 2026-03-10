export type FrequencyType = 'daily' | 'specific_days' | 'prn' | 'every_n_days';
export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'bedtime' | 'other' | 'unspecified';
export type FoodTiming = 'before_meal' | 'with_meal' | 'after_meal' | 'unspecified';
export type MedicationStatus = 'active' | 'stopped';
export type StockStatus = 'normal' | 'low' | 'out_of_stock' | 'expired';

export interface TimingEntry {
  id: string;
  timeOfDay: TimeOfDay;
  foodTiming: FoodTiming;
  time: string | null; // HH:MM format
}

export interface Medication {
  id: string;
  image?: string;
  name: string;
  strength: string;
  strengthUnit: string;
  administrationMethod: string;
  prescribedBy?: string;
  amountPerDose: number;
  doseUnit: string;
  frequency: FrequencyType;
  specificDays?: number[]; // 0=Sun, 1=Mon...
  everyNDays?: number;
  everyNDaysStartDate?: string;
  timings: TimingEntry[];
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  currentAmount: number;
  alertDays: number;
  stoppedDate?: string;
  stoppedBy?: string;
  expirationDate?: string;
}

export interface EmergencyContact {
  id: string;
  relationship: string;
  firstName: string;
  lastName: string;
  phone: string;
  lineId?: string;
  address?: string;
  isLegalGuardian: boolean;
}

export interface MedicationReceipt {
  id: string;
  receiptNumber: string;
  dateReceived: string;
  elderName: string;
  receivedFrom?: string;
  prescriptionNumber?: string;
  attachments?: string[];
  note?: string;
  medications: ReceiptMedicationItem[];
  createdBy: string;
}

export interface ReceiptMedicationItem {
  medicationId: string;
  medication: Medication;
  action: ReceiptAction[];
  addedQuantity?: number;
  previousBalance?: number;
  newBalance?: number;
}

export type ReceiptAction = 'new' | 'added_quantity' | 'stopped' | 'edited';

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'เช้า',
  noon: 'กลางวัน',
  evening: 'เย็น',
  bedtime: 'ก่อนนอน',
  other: 'อื่นๆ',
  unspecified: 'ไม่ระบุ',
};

export const FOOD_TIMING_LABELS: Record<FoodTiming, string> = {
  before_meal: 'ก่อนอาหาร',
  with_meal: 'พร้อมอาหาร',
  after_meal: 'หลังอาหาร',
  unspecified: 'ไม่ระบุ',
};

export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  daily: 'ทุกวัน',
  specific_days: 'เฉพาะบางวัน',
  prn: 'PRN',
  every_n_days: 'ทุก…วัน',
};

export const TIME_OF_DAY_RANGES: Record<TimeOfDay, { min: string; max: string } | null> = {
  morning: { min: '05:00', max: '10:59' },
  noon: { min: '11:00', max: '14:59' },
  evening: { min: '15:00', max: '18:59' },
  bedtime: { min: '19:00', max: '23:59' },
  other: { min: '00:00', max: '23:59' },
  unspecified: null,
};

export const TIME_OF_DAY_DEFAULTS: Record<TimeOfDay, Record<FoodTiming, string>> = {
  morning: { before_meal: '06:30', with_meal: '07:00', after_meal: '08:00', unspecified: '07:00' },
  noon: { before_meal: '11:30', with_meal: '12:00', after_meal: '13:00', unspecified: '12:00' },
  evening: { before_meal: '16:30', with_meal: '17:00', after_meal: '18:00', unspecified: '17:00' },
  bedtime: { before_meal: '20:00', with_meal: '20:00', after_meal: '20:00', unspecified: '20:00' },
  other: { before_meal: '12:00', with_meal: '12:00', after_meal: '12:00', unspecified: '12:00' },
  unspecified: { before_meal: '', with_meal: '', after_meal: '', unspecified: '' },
};
