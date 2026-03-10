import React from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';

const MedicationHistoryPage: React.FC = () => {
  const { id } = useParams();

  const historyEntries = [
    { date: '2025-01-15 10:30', action: 'เพิ่มจำนวนยา', detail: '+30 เม็ด', by: 'Taylor swift' },
    { date: '2025-01-10 08:00', action: 'แก้ไขข้อมูล/วิธีการให้ยา', detail: 'เปลี่ยนเวลาเช้าเป็น 07:00', by: 'Taylor swift' },
    { date: '2025-01-01 09:00', action: 'สร้างรายการยา', detail: 'เริ่มต้นใหม่', by: 'Taylor swift' },
  ];

  return (
    <div className="min-h-screen bg-background w-full mx-auto">
      <PageHeader title="ประวัติรายการยา" />

      <div className="px-4 py-4 space-y-3">
        {historyEntries.map((entry, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{entry.action}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{entry.detail}</p>
                <p className="text-xs text-muted-foreground mt-1">โดย {entry.by}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicationHistoryPage;
