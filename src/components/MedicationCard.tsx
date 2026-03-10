import React from 'react';
import { Medication, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, FREQUENCY_LABELS, StockStatus, TimeOfDay } from '@/types/medication';
import { MoreVertical } from 'lucide-react';
import { calculateStockStatus, calculateDaysRemaining } from '@/lib/medicationUtils';

interface MedicationCardProps {
  medication: Medication;
  onClick?: () => void;
  onMenuClick?: (e: React.MouseEvent) => void;
}

const chipColorMap: Record<TimeOfDay, string> = {
  morning: 'bg-chip-morning',
  noon: 'bg-chip-noon',
  evening: 'bg-chip-evening',
  bedtime: 'bg-chip-bedtime',
  other: 'bg-chip-other',
  unspecified: 'bg-chip-other',
};

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onClick, onMenuClick }) => {
  const stockStatus = calculateStockStatus(medication);
  const daysRemaining = calculateDaysRemaining(medication);

  const statusColor = medication.status === 'active' ? 'bg-med-success' : 'bg-med-danger';

  const borderColor = medication.status === 'stopped'
    ? 'border-border'
    : stockStatus === 'out_of_stock'
      ? 'border-med-danger'
      : stockStatus === 'low'
        ? 'border-stock-low'
        : 'border-primary';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border bg-card p-4 shadow-sm cursor-pointer border-l-8 ${borderColor} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        {/* Med image placeholder */}
        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {medication.image ? (
            <img src={medication.image} alt={medication.name} className="h-full w-full object-cover" />
          ) : (
            <div className="text-2xl md:text-3xl">💊</div>
          )}
          {/* Status Dot */}
          <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ${statusColor} border-2 border-white`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-base md:text-lg">
                  {medication.name}
                </h3>
              </div>
              <div className="mt-1">
                <span className="text-sm text-muted-foreground mr-2">
                  {medication.strength} {medication.strengthUnit}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick?.(e);
                }}
                className="p-1 text-muted-foreground hover:text-foreground -mr-1"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <div className="mt-2 text-sm text-slate-600 font-medium whitespace-nowrap">
                {medication.amountPerDose} {medication.doseUnit}/{FREQUENCY_LABELS[medication.frequency].replace('วันละ', 'ครั้ง')}
              </div>
            </div>
          </div>
          {/* Frequency chip */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
              {medication.frequency === 'every_n_days'
                ? `ทุก ${medication.everyNDays} วัน`
                : medication.frequency === 'specific_days'
                  ? 'เฉพาะบางวัน'
                  : FREQUENCY_LABELS[medication.frequency]}
            </span>

            {/* Timing chips */}
            {medication.timings.map((timing) => (
              <span
                key={timing.id}
                className={`text-xs px-2 py-0.5 rounded-full ${chipColorMap[timing.timeOfDay]} text-foreground`}
              >
                {timing.time && `${timing.time} `}
                ({TIME_OF_DAY_LABELS[timing.timeOfDay]}, {FOOD_TIMING_LABELS[timing.foodTiming]})
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border/50 w-full">
            <div>
              {medication.status === 'active' && stockStatus === 'low' && daysRemaining !== null && (
                <span className="text-xs text-slate-500 font-medium">เหลือพอใช้ {daysRemaining} วัน</span>
              )}
            </div>
            {medication.status === 'active' ? (
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold text-slate-800">
                  คงเหลือ {medication.currentAmount} {medication.doseUnit === 'piece' ? 'เม็ด' : medication.doseUnit}
                </span>
              </div>
            ) : (
              <div className="text-right text-sm text-muted-foreground">
                {medication.stoppedDate && (
                  <>
                    <p>วันที่หยุดยา: {formatThaiDate(medication.stoppedDate)}</p>
                    {medication.stoppedBy && <p>หยุดยาโดย: {medication.stoppedBy}</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thaiYear = d.getFullYear() + 543 - 2500;
  return `${d.getDate()} ${months[d.getMonth()]} ${thaiYear}`;
}

export default MedicationCard;
