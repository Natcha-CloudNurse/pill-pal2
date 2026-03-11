import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { mockReceipts } from '@/data/mockMedications';
import { Button } from '@/components/ui/button';
import { Share2, Download, Calendar } from 'lucide-react';
import { Medication, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TimeOfDay, ReceiptAction } from '@/types/medication';
import BottomSheet from '@/components/BottomSheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const chipColorMap: Record<TimeOfDay, string> = {
  morning: 'bg-chip-morning', noon: 'bg-chip-noon', evening: 'bg-chip-evening',
  bedtime: 'bg-chip-bedtime', other: 'bg-chip-other', unspecified: 'bg-chip-other',
};

interface ReceiptItemData {
  medication: Medication;
  addedQty: number;
  action: string[];
}

interface ReceiptData {
  dateReceived: string;
  receivedFrom: string;
  prescriptionNumber: string;
  note: string;
  images?: string[];
  items: ReceiptItemData[];
}

const ReceiptDetailPage: React.FC = () => {
  const { receiptId } = useParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Check if this is a newly created receipt
  useEffect(() => {
    if (receiptId === 'new') {
      const stored = sessionStorage.getItem('lastReceipt');
      if (stored) {
        setReceiptData(JSON.parse(stored));
      }
    }
  }, [receiptId]);

  // For existing receipts from mock data
  const receipt = receiptId !== 'new' ? mockReceipts.find(r => r.id === receiptId) : null;

  // Sort actions: added_quantity always last
  const sortAction = (actions: string[] | ReceiptAction[]) => {
    const casted = actions as string[];
    const sorted = casted.filter(a => a !== 'added_quantity');
    if (casted.includes('added_quantity')) sorted.push('added_quantity');
    return sorted;
  };

  const actionBorderColor = (firstAction: string) => {
    switch (firstAction) {
      case 'new': return 'border-l-primary';
      case 'added_quantity': return 'border-l-med-success';
      case 'edited': return 'border-l-med-warning';
      case 'stopped': return 'border-l-destructive';
      default: return 'border-l-primary';
    }
  };

  const actionGroupColor = (firstAction: string) => {
    switch (firstAction) {
      case 'new': return 'text-primary';
      case 'added_quantity': return 'text-med-success';
      case 'edited': return 'text-[#0ea5e9]';
      case 'stopped': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  const actionLabelMap: Record<string, string> = {
    'new': 'รายการใหม่',
    'added_quantity': 'เพิ่มจำนวนยา',
    'edited': 'แก้ไขข้อมูล/วิธีการให้ยา',
    'stopped': 'หยุดยา',
  };

  // Generate LINE share text
  const generateShareText = () => {
    if (!receiptData) return '';
    const lines = [
      '📋 รายงานการรับยา',
      `📅 วันที่: ${new Date(receiptData.dateReceived).toLocaleString('th-TH')}`,
      `👤 ชื่อผู้สูงอายุ: อาม่ามะลิ แซ่ลี้`,
      receiptData.receivedFrom ? `📦 รับยาจาก: ${receiptData.receivedFrom}` : '',
      receiptData.prescriptionNumber ? `📄 เลขที่: ${receiptData.prescriptionNumber}` : '',
      '',
      `💊 จำนวน ${receiptData.items.length} รายการ`,
      '',
    ];
    receiptData.items.forEach(item => {
      const actions = sortAction(item.action).map(a => actionLabelMap[a] || a).join(', ');
      lines.push(`• ${item.medication.name} ${item.medication.strength}${item.medication.strengthUnit}`);
      lines.push(`  (${actions})`);
      if (item.addedQty > 0) {
        lines.push(`  รับยามาเพิ่ม +${item.addedQty} ${item.medication.doseUnit} (คงเหลือหลังรับ : ${item.medication.currentAmount + item.addedQty} ${item.medication.doseUnit})`);
      }
    });
    if (receiptData.note) {
      lines.push('', `📝 หมายเหตุ: ${receiptData.note}`);
    }
    return lines.filter(Boolean).join('\n');
  };

  // Consolidate data into a single source of truth
  useEffect(() => {
    if (receiptId === 'new') {
      const stored = sessionStorage.getItem('lastReceipt');
      if (stored) {
        setReceiptData(JSON.parse(stored));
      }
    } else if (receiptId) {
      const found = mockReceipts.find(r => r.id === receiptId);
      if (found) {
        // Map MedicationReceipt to ReceiptData structure
        setReceiptData({
          dateReceived: found.dateReceived,
          receivedFrom: found.receivedFrom || '',
          prescriptionNumber: found.prescriptionNumber || '',
          note: found.note || '',
          images: found.attachments || [],
          items: found.medications.map(m => ({
            medication: m.medication,
            addedQty: m.addedQuantity || 0,
            action: m.action as string[]
          }))
        });
      }
    }
  }, [receiptId]);

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-background w-full mx-auto">
        <PageHeader title="ข้อมูลใบรับยา" />
        <div className="flex flex-col items-center justify-center p-10 h-[60vh] text-slate-400 gap-4">
           <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 17.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           <p className="font-bold text-lg">ไม่พบข้อมูลใบรับยา</p>
           <p className="text-sm">ไม่พบข้อมูลที่ต้องการ หรือข้อมูลถูกลบไปแล้ว</p>
        </div>
      </div>
    );
  }

  // Group items by action for the unified view
  const groups: Record<string, ReceiptItemData[]> = {};
  receiptData.items.forEach(item => {
    const key = sortAction(item.action).join(',');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const groupOrder = ['new', 'edited', 'added_quantity', 'stopped'];
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    const aFirst = sortAction(a.split(','))[0];
    const bFirst = sortAction(b.split(','))[0];
    return groupOrder.indexOf(aFirst) - groupOrder.indexOf(bFirst);
  });

  return (
    <div className="min-h-screen bg-background w-full mx-auto">
      <PageHeader title="ข้อมูลใบรับยา" />

      <div className="px-4 py-4 space-y-4">
        {/* General info */}
        <div className="bg-card rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="grid grid-cols-[1fr,1.5fr] gap-y-3 text-sm">
            <span className="text-slate-400 font-medium">วันที่รับยา</span>
            <span className="text-slate-700 font-bold text-right">{new Date(receiptData.dateReceived).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</span>

            <span className="text-slate-400 font-medium">ทำรายการโดย</span>
            <span className="text-slate-700 font-bold text-right">Taylor swift</span>

            <span className="text-slate-400 font-medium">ชื่อผู้สูงอายุ</span>
            <span className="text-slate-700 font-bold text-right">อาม่ามะลิ แซ่ลี้</span>

            {receiptData.receivedFrom && (
              <>
                <span className="text-slate-400 font-medium">รับยาจาก</span>
                <span className="text-slate-700 font-bold text-right">{receiptData.receivedFrom}</span>
              </>
            )}

            {receiptData.prescriptionNumber && (
              <>
                <span className="text-slate-400 font-medium">เลขที่ใบรับยา</span>
                <span className="text-slate-700 font-bold text-right">{receiptData.prescriptionNumber}</span>
              </>
            )}
          </div>

          {receiptData.note && (
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">คำอธิบายเพิ่มเติม</span>
              <p className="text-sm text-slate-600 mt-1 font-medium">{receiptData.note}</p>
            </div>
          )}

          {/* Receipt images */}
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">รูปใบรายการยา/ถุงยา</p>
            <div className="flex gap-3 mt-3">
              {receiptData.images && receiptData.images.length > 0 ? (
                receiptData.images.map((img, idx) => (
                  <div key={idx} className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                    <img src={img} alt="receipt" className="h-full w-full object-cover" />
                  </div>
                ))
              ) : (
                <>
                  <div className="h-20 w-20 rounded-2xl bg-[#6a8a7c]/10 border border-[#6a8a7c]/20 flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                        <div className="w-10 h-12 border-2 border-teal-800 rounded-sm mb-1 translate-y-1"></div>
                     </div>
                  </div>
                  <div className="h-20 w-20 rounded-2xl bg-[#6a8a7c]/10 border border-[#6a8a7c]/20 flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                        <div className="w-12 h-10 border-2 border-teal-800 rounded-sm mb-1 rotate-6"></div>
                     </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Medication summary grouped by action */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-slate-400">จำนวน</h3>
          <span className="text-slate-700 font-bold">{receiptData.items.length} รายการ</span>
        </div>

        {sortedGroupKeys.map(groupKey => {
          const groupItems = groups[groupKey];
          const actions = sortAction(groupKey.split(','));
          const firstAction = actions[0];
          const groupLabel = actions.map(a => actionLabelMap[a] || a).join(', ');

          return (
            <div key={groupKey} className="space-y-4">
              <div className={`text-sm font-bold ${actionGroupColor(firstAction)} flex items-center gap-1.5 px-1`}>
                <span>{groupLabel}</span>
                <span className="bg-current/10 px-1.5 py-0.5 rounded text-[10px]">({groupItems.length})</span>
              </div>

              {groupItems.map(item => (
                <div key={item.medication.id} className={`bg-card rounded-2xl p-5 border border-slate-100 shadow-sm border-l-8 ${actionBorderColor(firstAction)}`}>
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-24 rounded-2xl bg-[#6a8a7c]/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                         <div className="w-10 h-12 border-2 border-teal-900 rounded-sm mb-1 translate-y-1"></div>
                         <div className="w-12 h-12 border border-teal-900/30 rounded-sm rotate-12 absolute scale-110"></div>
                      </div>
                      <span className="relative z-10 text-[9px] font-bold text-teal-900/40 text-center px-1 leading-tight">
                        MEDICATION<br/>BOTTLE<br/>IMAGE
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-[17px] truncate pr-2">
                        {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                      </h4>
                      <p className="text-sm text-slate-500 mt-0.5 font-medium">
                        {item.medication.amountPerDose} {item.medication.doseUnit}/ครั้ง
                      </p>

                      <div className="mt-1.5">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.action.includes('stopped') ? 'bg-destructive' : 'bg-[#22c55e]'}`} />
                      </div>

                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-600 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.medication.frequency === 'daily' ? 'ทุกวัน' : item.medication.frequency === 'prn' ? 'PRN' : 'ตามกำหนด'}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.medication.timings.map(t => (
                          <span key={t.id} className={`text-[11px] px-2 py-1 rounded-full ${chipColorMap[t.timeOfDay]} text-foreground font-bold border border-current/10 shadow-sm`}>
                            {t.time && `${t.time} `}({TIME_OF_DAY_LABELS[t.timeOfDay]})
                          </span>
                        ))}
                      </div>

                      {item.addedQty > 0 && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-y-2 text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wide">รับมาเพิ่ม</span>
                          <span className="text-teal-600 font-bold text-right text-sm">+ {item.addedQty} {item.medication.doseUnit}</span>
                          <span className="text-slate-400 font-bold uppercase tracking-wide">คงเหลือทั้งหมด</span>
                          <span className="text-slate-700 font-bold text-right text-sm">{item.medication.currentAmount + item.addedQty} {item.medication.doseUnit}</span>
                        </div>
                      )}

                      {item.action.includes('stopped') && (
                        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-[11px] text-slate-600 space-y-1 font-medium">
                          <div className="flex justify-between">
                            <span className="text-red-400 font-bold uppercase">วันที่หยุดยา</span>
                            <span>{new Date().toLocaleDateString('th-TH')}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-red-100 pt-1 mt-1">
                            <span className="text-red-400 uppercase">คงเหลือเก่า</span>
                            <span>{item.medication.currentAmount} {item.medication.doseUnit}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {sortAction(item.action).map(a => (
                          <span key={a} className={`text-[11px] px-2.5 py-1 rounded-full font-bold shadow-sm ${
                            a === 'stopped' ? 'bg-[#fff1f2] text-[#f43f5e] border border-[#ffe4e6]' :
                            a === 'added_quantity' ? 'bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]' :
                            a === 'new' ? 'bg-[#f0f9ff] text-[#0ea5e9] border border-[#bae6fd]' :
                            'bg-[#fdf4ff] text-[#a855f7] border border-[#fae8ff]'
                          }`}>{actionLabelMap[a] || a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* CTAs */}
        <div className="space-y-3 pt-6 pb-10">
          <Button 
            className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold gap-3 shadow-lg shadow-teal-100" 
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-5 w-5" /> รายงานการรับยา
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl bg-[#eff3f8] border-0 text-slate-500 font-bold gap-3 hover:bg-slate-200"
            onClick={() => setIsPdfPreviewOpen(true)}
          >
            <Download className="h-5 w-5" /> ดาวน์โหลด pdf
          </Button>
        </div>
      </div>

      {/* Share Bottom Sheet */}
      <BottomSheet open={shareOpen} onOpenChange={setShareOpen} title="แชร์รายงานการรับยา">
        <div className="space-y-6 pb-4">
          <div className="bg-[#f8fafc] rounded-2xl p-4 text-[13px] text-slate-600 whitespace-pre-wrap font-medium leading-relaxed border border-slate-100 max-h-[60vh] overflow-y-auto shadow-inner">
            {generateShareText()}
          </div>
          <Button className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 font-bold shadow-lg shadow-teal-100" onClick={() => {
            navigator.clipboard.writeText(generateShareText());
            setShareOpen(false);
          }}>
            คัดลอกข้อความ
          </Button>
        </div>
      </BottomSheet>

      {/* PDF Preview Modal */}
      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl rounded-3xl p-6 gap-0">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">Preview PDF</DialogTitle>
          </DialogHeader>
          <div className="aspect-[1/1.4] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Download className="h-12 w-12 opacity-20" />
            <p className="font-bold">PDF Rendering Preview...</p>
            <div className="w-3/4 space-y-2 opacity-10">
              <div className="h-4 bg-slate-400 rounded w-1/2"></div>
              <div className="h-4 bg-slate-400 rounded w-full"></div>
              <div className="h-4 bg-slate-400 rounded w-full"></div>
              <div className="h-20 bg-slate-400 rounded w-full border-4 border-white"></div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsPdfPreviewOpen(false)}
              className="flex-1 h-12 rounded-2xl bg-slate-100 border-0 text-slate-500 font-bold hover:bg-slate-200"
            >
              ปิด
            </Button>
            <Button 
              onClick={() => setIsPdfPreviewOpen(false)}
              className="flex-1 h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              ดาวน์โหลด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptDetailPage;
