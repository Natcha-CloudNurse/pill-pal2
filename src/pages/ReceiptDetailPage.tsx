import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { mockReceipts } from '@/data/mockMedications';
import { Button } from '@/components/ui/button';
import { Share2, Download, Calendar } from 'lucide-react';
import { Medication, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TimeOfDay } from '@/types/medication';
import BottomSheet from '@/components/BottomSheet';

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
  items: ReceiptItemData[];
}

const ReceiptDetailPage: React.FC = () => {
  const { receiptId } = useParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

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

  // Sort actions: เพิ่มจำนวนยา always last
  const sortAction = (actions: string[]) => {
    const sorted = actions.filter(a => a !== 'เพิ่มจำนวนยา');
    if (actions.includes('เพิ่มจำนวนยา')) sorted.push('เพิ่มจำนวนยา');
    return sorted;
  };

  const actionBorderColor = (firstAction: string) => {
    switch (firstAction) {
      case 'รายการใหม่': return 'border-l-primary';
      case 'เพิ่มจำนวนยา': return 'border-l-med-success';
      case 'แก้ไขข้อมูล/วิธีการให้ยา': return 'border-l-med-warning';
      case 'หยุดยา': return 'border-l-destructive';
      default: return 'border-l-primary';
    }
  };

  const actionGroupColor = (firstAction: string) => {
    switch (firstAction) {
      case 'รายการใหม่': return 'text-primary';
      case 'เพิ่มจำนวนยา': return 'text-med-success';
      case 'แก้ไขข้อมูล/วิธีการให้ยา': return 'text-med-warning';
      case 'หยุดยา': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  const actionLabelMap: Record<string, string> = {
    'รายการใหม่': 'รายการใหม่',
    'เพิ่มจำนวนยา': 'เพิ่มจำนวนยา',
    'แก้ไขข้อมูล/วิธีการให้ยา': 'แก้ไขข้อมูล/วิธีการให้ยา',
    'หยุดยา': 'หยุดยา',
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
      const actions = sortAction(item.action).join(', ');
      lines.push(`• ${item.medication.name} ${item.medication.strength}${item.medication.strengthUnit}`);
      lines.push(`  ${actions}`);
      if (item.addedQty > 0) {
        lines.push(`  +${item.addedQty} ${item.medication.doseUnit} → คงเหลือ ${item.medication.currentAmount + item.addedQty} ${item.medication.doseUnit}`);
      }
    });
    if (receiptData.note) {
      lines.push('', `📝 หมายเหตุ: ${receiptData.note}`);
    }
    return lines.filter(Boolean).join('\n');
  };

  // New receipt from session
  if (receiptId === 'new' && receiptData) {
    // Group items by action
    const groups: Record<string, ReceiptItemData[]> = {};
    receiptData.items.forEach(item => {
      const key = sortAction(item.action).join(',');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const groupOrder = ['รายการใหม่', 'เพิ่มจำนวนยา', 'แก้ไขข้อมูล/วิธีการให้ยา', 'หยุดยา'];
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
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm space-y-2">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">วันที่รับยา</span>
              <span className="text-foreground font-medium text-right">{new Date(receiptData.dateReceived).toLocaleString('th-TH')}</span>

              <span className="text-muted-foreground">ทำรายการโดย</span>
              <span className="text-foreground font-medium text-right">Taylor swift</span>

              <span className="text-muted-foreground">ชื่อผู้สูงอายุ</span>
              <span className="text-foreground font-medium text-right">อาม่ามะลิ แซ่ลี้</span>

              {receiptData.receivedFrom && (
                <>
                  <span className="text-muted-foreground">รับยาจาก</span>
                  <span className="text-foreground font-medium text-right">{receiptData.receivedFrom}</span>
                </>
              )}

              {receiptData.prescriptionNumber && (
                <>
                  <span className="text-muted-foreground">เลขที่ใบรับยา</span>
                  <span className="text-foreground font-medium text-right">{receiptData.prescriptionNumber}</span>
                </>
              )}
            </div>

            {receiptData.note && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">คำอธิบายเพิ่มเติม</span>
                <p className="text-sm text-foreground">{receiptData.note}</p>
              </div>
            )}

            {/* Placeholder images */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">รูปใบรายการยา/ถุงยา</p>
              <div className="flex gap-2">
                <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-xl">📷</div>
                <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-xl">📷</div>
              </div>
            </div>
          </div>

          {/* Medication summary grouped by action */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">จำนวน</h3>
            <span className="text-foreground font-bold">{receiptData.items.length} รายการ</span>
          </div>

          {sortedGroupKeys.map(groupKey => {
            const groupItems = groups[groupKey];
            const actions = sortAction(groupKey.split(','));
            const firstAction = actions[0];
            const groupLabel = actions.map(a => actionLabelMap[a] || a).join(', ');

            return (
              <div key={groupKey} className="space-y-3">
                <div className={`text-sm font-semibold ${actionGroupColor(firstAction)}`}>
                  {groupLabel} ({groupItems.length})
                </div>

                {groupItems.map(item => (
                  <div key={item.medication.id} className={`bg-card rounded-xl p-4 border border-border shadow-sm border-l-4 ${actionBorderColor(firstAction)}`}>
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center text-xl flex-shrink-0">💊</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm">
                          {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.medication.amountPerDose} {item.medication.doseUnit}/ครั้ง
                        </p>

                        <div className="mt-1">
                          <span className={`inline-block h-2 w-2 rounded-full ${item.action.includes('หยุดยา') ? 'bg-destructive' : 'bg-med-success'}`} />
                        </div>

                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{item.medication.frequency === 'daily' ? 'ทุกวัน' : item.medication.frequency === 'prn' ? 'PRN' : 'ตามกำหนด'}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.medication.timings.map(t => (
                            <span key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${chipColorMap[t.timeOfDay]} text-foreground`}>
                              {t.time && `${t.time} `}({TIME_OF_DAY_LABELS[t.timeOfDay]}, {FOOD_TIMING_LABELS[t.foodTiming]})
                            </span>
                          ))}
                        </div>

                        {item.addedQty > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                            <span className="text-muted-foreground">รับมาเพิ่ม</span>
                            <span className="text-foreground font-semibold text-right">+ {item.addedQty} {item.medication.doseUnit}</span>
                            <span className="text-muted-foreground">คงเหลือหลังรับมา</span>
                            <span className="text-foreground font-semibold text-right">{item.medication.currentAmount + item.addedQty} {item.medication.doseUnit}</span>
                          </div>
                        )}

                        {item.action.includes('หยุดยา') && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>วันที่หยุดยา: {new Date().toLocaleDateString('th-TH')}</p>
                            <p>คงเหลือเก่า : {item.medication.currentAmount} {item.medication.doseUnit}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {sortAction(item.action).map(a => (
                            <span key={a} className={`text-xs px-2 py-0.5 rounded-full font-medium ${a === 'หยุดยา' ? 'bg-destructive/10 text-destructive' :
                                a === 'เพิ่มจำนวนยา' ? 'bg-med-success/10 text-med-success' :
                                  a === 'รายการใหม่' ? 'bg-primary/10 text-primary' :
                                    'bg-med-warning/10 text-med-warning'
                              }`}>{a}</span>
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
          <div className="space-y-2 pt-2">
            <Button className="w-full gap-2" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> รายงานการรับยา
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" /> ดาวน์โหลด pdf
            </Button>
          </div>
        </div>

        {/* Share Bottom Sheet */}
        <BottomSheet open={shareOpen} onOpenChange={setShareOpen} title="แชร์รายงานการรับยา">
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3 text-xs text-foreground whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
              {generateShareText()}
            </div>
            <Button className="w-full" onClick={() => {
              navigator.clipboard.writeText(generateShareText());
              setShareOpen(false);
            }}>
              คัดลอกข้อความ
            </Button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  // Existing receipt from mock data
  if (!receipt) {
    return (
      <div className="min-h-screen bg-background w-full mx-auto">
        <PageHeader title="ข้อมูลใบรับยา" />
        <p className="p-4 text-muted-foreground">ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full mx-auto">
      <PageHeader title="ข้อมูลใบรับยา" />

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm space-y-2">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">วันที่รับยา</span>
            <span className="text-foreground font-medium text-right">{new Date(receipt.dateReceived).toLocaleString('th-TH')}</span>

            <span className="text-muted-foreground">ทำรายการโดย</span>
            <span className="text-foreground font-medium text-right">{receipt.createdBy}</span>

            <span className="text-muted-foreground">ชื่อผู้สูงอายุ</span>
            <span className="text-foreground font-medium text-right">{receipt.elderName}</span>

            {receipt.receivedFrom && (
              <>
                <span className="text-muted-foreground">รับยาจาก</span>
                <span className="text-foreground font-medium text-right">{receipt.receivedFrom}</span>
              </>
            )}

            {receipt.prescriptionNumber && (
              <>
                <span className="text-muted-foreground">เลขที่ใบรับยา</span>
                <span className="text-foreground font-medium text-right">{receipt.prescriptionNumber}</span>
              </>
            )}
          </div>

          {receipt.note && (
            <div className="pt-2">
              <span className="text-sm text-muted-foreground">คำอธิบายเพิ่มเติม</span>
              <p className="text-sm text-foreground">{receipt.note}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">รูปใบรายการยา/ถุงยา</p>
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-xl">📷</div>
              <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-xl">📷</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">จำนวน</h3>
            <span className="text-foreground font-bold">5 รายการ</span>
          </div>
          <p className="text-sm text-muted-foreground">รายการยาจะแสดงที่นี่เมื่อมีข้อมูล</p>
        </div>

        <div className="space-y-2 pt-2">
          <Button className="w-full gap-2">
            <Share2 className="h-4 w-4" /> รายงานการรับยา
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" /> ดาวน์โหลด pdf
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
