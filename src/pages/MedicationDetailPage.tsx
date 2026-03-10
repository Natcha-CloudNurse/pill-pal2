import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { mockMedications } from '@/data/mockMedications';
import { TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, FREQUENCY_LABELS, TimeOfDay } from '@/types/medication';
import { calculateStockStatus, calculateDaysRemaining } from '@/lib/medicationUtils';
import MainLayout from '@/components/MainLayout';

const chipColorMap: Record<TimeOfDay, string> = {
  morning: 'bg-chip-morning',
  noon: 'bg-chip-noon',
  evening: 'bg-chip-evening',
  bedtime: 'bg-chip-bedtime',
  other: 'bg-chip-other',
  unspecified: 'bg-chip-other',
};

const MedicationDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const med = mockMedications.find(m => m.id === id);

  if (!med) {
    return (
      <MainLayout>
        <div className="w-full mx-auto py-6 flex flex-col min-h-screen bg-background md:rounded-2xl md:border md:shadow-sm overflow-hidden">
          <PageHeader title="รายละเอียดยา" />
          <p className="p-4 text-muted-foreground">ไม่พบรายการยา</p>
        </div>
      </MainLayout>
    );
  }

  const stockStatus = calculateStockStatus(med);
  const daysRemaining = calculateDaysRemaining(med);

  return (
    <MainLayout>
      <div className="w-full mx-auto py-6 md:py-8 lg:px-8">
        <div className="bg-background min-h-[calc(100vh-4rem)] md:min-h-0 md:rounded-2xl md:border md:border-border md:shadow-sm overflow-hidden pb-8">
          <PageHeader title="รายละเอียดยา" />

      <div className="px-4 py-4 space-y-4">
        {/* Image + basic info */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
              💊
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{med.name}</h2>
              <p className="text-sm text-muted-foreground">{med.strength} {med.strengthUnit}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${med.status === 'active' ? 'bg-med-success' : 'bg-med-danger'}`} />
                <span className="text-sm text-foreground">{med.status === 'active' ? 'ยังใช้อยู่' : 'หยุดยา'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dosage info */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
          <h3 className="font-semibold text-foreground">ข้อมูลการให้ยา</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">ปริมาณต่อครั้ง</p>
              <p className="font-medium text-foreground">{med.amountPerDose} {med.doseUnit}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ความถี่</p>
              <p className="font-medium text-foreground">{FREQUENCY_LABELS[med.frequency]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">วิธีการให้ยา</p>
              <p className="font-medium text-foreground">{med.administrationMethod}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">เวลาให้ยา</p>
            <div className="flex flex-wrap gap-1.5">
              {med.timings.map(t => (
                <span key={t.id} className={`text-xs px-2 py-0.5 rounded-full ${chipColorMap[t.timeOfDay]} text-foreground`}>
                  {t.time && `${t.time} `}({TIME_OF_DAY_LABELS[t.timeOfDay]}, {FOOD_TIMING_LABELS[t.foodTiming]})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stock info */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
          <h3 className="font-semibold text-foreground">ข้อมูลจำนวนยา</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">คงเหลือ</p>
              <p className={`font-bold text-lg ${
                stockStatus === 'out_of_stock' ? 'text-stock-out' : 
                stockStatus === 'low' ? 'text-stock-low' : 'text-foreground'
              }`}>
                {med.currentAmount} {med.doseUnit}
              </p>
            </div>
            {daysRemaining !== null && (
              <div>
                <p className="text-muted-foreground">ใช้ได้อีก</p>
                <p className="font-medium text-foreground">{daysRemaining} วัน</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">แจ้งเตือนเมื่อเหลือ</p>
              <p className="font-medium text-foreground">{med.alertDays} วัน</p>
            </div>
          </div>
        </div>

        {/* Period */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
          <h3 className="font-semibold text-foreground">ระยะเวลาให้ยา</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">วันที่เริ่ม</p>
              <p className="font-medium text-foreground">{med.startDate}</p>
            </div>
            {med.endDate && (
              <div>
                <p className="text-muted-foreground">วันที่สิ้นสุด</p>
                <p className="font-medium text-foreground">{med.endDate}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {med.status === 'active' && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/medication/${med.id}/edit`)}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              แก้ไข
            </button>
          </div>
        )}
        {med.status === 'stopped' && (
          <button className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium text-sm">
            สร้างยาใหม่จากข้อมูลเดิม
          </button>
        )}
      </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicationDetailPage;
