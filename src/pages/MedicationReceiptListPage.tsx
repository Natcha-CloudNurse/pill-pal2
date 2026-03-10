import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { mockReceipts } from '@/data/mockMedications';
import { Download, Share2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/MainLayout';

const MedicationReceiptListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="w-full mx-auto py-6 md:py-8 lg:px-8">
        <div className="bg-background min-h-[calc(100vh-4rem)] md:min-h-0 md:rounded-2xl md:border md:border-border md:shadow-sm overflow-hidden pb-8">
          <PageHeader title="เอกสารใบรับยา" />

      <div className="px-4 py-4">
        {/* Actions */}
        <div className="space-y-2 mb-6">
          <Button className="w-full" onClick={() => navigate('/medication/receipt/create')}>
            สร้างใบรับยา
          </Button>
        </div>

        {/* History */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-primary">ประวัติการรับยา</h2>
          <button className="text-muted-foreground"><ArrowUpDown className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          {mockReceipts.map(receipt => (
            <div key={receipt.id}
              onClick={() => navigate(`/medication/receipt/${receipt.id}`)}
              className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-16 w-20 rounded-lg bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">รายการรับยา {receipt.receiptNumber}</p>
                <p className="text-sm text-muted-foreground">{receipt.medications.length || 12} รายการ</p>
                <p className="text-xs text-muted-foreground">รับโดย {receipt.createdBy} {new Date(receipt.dateReceived).toLocaleDateString('th-TH')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); }} className="text-muted-foreground hover:text-foreground">
                  <Download className="h-5 w-5" />
                </button>
                <button onClick={e => { e.stopPropagation(); }} className="text-muted-foreground hover:text-foreground">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicationReceiptListPage;
