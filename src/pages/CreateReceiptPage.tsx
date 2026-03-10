import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Stepper from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { mockMedications } from '@/data/mockMedications';
import { Medication, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TimeOfDay } from '@/types/medication';
import { ChevronLeft, ChevronRight, Minus, Plus, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import BottomSheet from '@/components/BottomSheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const chipColorMap: Record<TimeOfDay, string> = {
  morning: 'bg-chip-morning', noon: 'bg-chip-noon', evening: 'bg-chip-evening',
  bedtime: 'bg-chip-bedtime', other: 'bg-chip-other', unspecified: 'bg-chip-other',
};

interface MedReceiptItem {
  medication: Medication;
  selected: boolean;
  addedQty: number;
  action: string[];
  reason?: string;
}

const CreateReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 16));
  const [receivedFrom, setReceivedFrom] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [note, setNote] = useState('');
  const [showEmergencyContactSheet, setShowEmergencyContactSheet] = useState(false);
  const [contacts, setContacts] = useState<string[]>(['วินัย บุนนา']);
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  // Emergency Contact Form State
  const [ecRelationship, setEcRelationship] = useState('');
  const [ecFirstName, setEcFirstName] = useState('');
  const [ecLastName, setEcLastName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecLine, setEcLine] = useState('');
  const [ecAddress, setEcAddress] = useState('');
  const [ecIsGuardian, setEcIsGuardian] = useState(false);

  // Step 2
  const [medTab, setMedTab] = useState<'current' | 'stopped'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<MedReceiptItem[]>(
    mockMedications.filter(m => m.status === 'active').map(m => ({
      medication: m, selected: false, addedQty: 0, action: [],
    }))
  );

  // Stop Medication Modal State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stoppingMedId, setStoppingMedId] = useState<string | null>(null);
  const [stopReason, setStopReason] = useState('');

  const step1Valid = dateReceived;
  const selectedCount = items.filter(i => i.selected && (i.addedQty > 0 || i.action.includes('หยุดยา'))).length;

  const updateItem = (medId: string, update: Partial<MedReceiptItem>) => {
    setItems(prev => prev.map(i => i.medication.id === medId ? { ...i, ...update } : i));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setReceiptImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setReceiptImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    toast.success('สร้างใบรับยาสำเร็จ');
    // Build receipt data and navigate to detail page
    const selectedItems = items.filter(i => i.selected);
    const receiptData = {
      dateReceived,
      receivedFrom,
      prescriptionNumber,
      note,
      images: receiptImages,
      items: selectedItems.map(i => ({
        medication: i.medication,
        addedQty: i.addedQty,
        action: i.action,
      })),
    };
    // Store in sessionStorage for the detail page to read
    sessionStorage.setItem('lastReceipt', JSON.stringify(receiptData));
    navigate('/medication/receipt/new');
  };

  const handleConfirmStop = () => {
    if (!stoppingMedId) return;
    
    setItems(prev => prev.map(item => {
      if (item.medication.id === stoppingMedId) {
        const newAction = [...item.action.filter(a => a !== 'หยุดยา'), 'หยุดยา'];
        return { ...item, action: newAction, selected: true, addedQty: 0, reason: stopReason };
      }
      return item;
    }));
    
    setIsStopModalOpen(false);
    setStoppingMedId(null);
    setStopReason('');
    toast.success('ระงับการให้ยาชั่วคราวแล้ว');
  };

  const handleCancelStop = () => {
    setIsStopModalOpen(false);
    setStoppingMedId(null);
    setStopReason('');
  };

  return (
    <MainLayout>
      <div className="w-full mx-auto py-6 md:py-8 lg:px-8">
        <div className="bg-background min-h-[calc(100vh-4rem)] md:min-h-0 md:rounded-2xl md:border md:border-border md:shadow-sm overflow-hidden pb-8">
          <PageHeader title="สร้างใบรับยา" />
      
      <div className="px-4 py-3">
        <Stepper currentStep={step} totalSteps={3} />
      </div>

      {/* Step titles */}
      <div className="px-4">
        <h2 className="font-semibold text-foreground">
          {step === 0 ? 'ข้อมูลยาทั่วไป' : step === 1 ? 'ใส่จำนวน ปรับการให้ยาหรือเปลี่ยนสถานะยา' : 'รีวิวรายการยา'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {step === 0 
            ? 'โปรดกรอกข้อมูลส่วนที่มีเครื่องหมาย * ให้สมบูรณ์ จากนั้นกด "ถัดไป"'
            : step === 1 
              ? 'ใส่จำนวน ปรับการให้ยา เปลี่ยนสถานะยา หรือเพิ่มยาใหม่ แล้วกด "ถัดไป"'
              : 'ตรวจสอบรายการยาก่อนบันทึก'}
        </p>
      </div>

      {/* Nav */}
      <div className="px-4 flex items-center justify-between my-3">
        {step > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
          </Button>
        ) : <div />}
        {step < 2 ? (
          <Button size="sm" onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !step1Valid : selectedCount === 0}
            className="gap-1">
            ถัดไป <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} className="gap-1">
            ถัดไป <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-8">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-foreground font-medium">วันที่รับยา <span className="text-destructive">*</span></label>
              <div className="relative mt-1">
                <input type="datetime-local" value={dateReceived} onChange={e => setDateReceived(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">ชื่อผู้สูงอายุ <span className="text-destructive">*</span></label>
              <input value="อาม่ามะลิ แซ่ลี้" readOnly
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-muted text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">รับยาจาก</label>
              <select value={receivedFrom} onChange={e => setReceivedFrom(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">เลือกจากรายชื่อติดต่อฉุกเฉิน</option>
                {contacts.map((contact, i) => (
                  <option key={i} value={contact}>{contact}</option>
                ))}
              </select>
              <button onClick={() => setShowEmergencyContactSheet(true)} className="text-sm text-primary mt-1 font-medium">+ เพิ่มรายชื่อติดต่อฉุกเฉินใหม่</button>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">ใบรับยาเลขที่</label>
              <input value={prescriptionNumber} onChange={e => setPrescriptionNumber(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="เพิ่มเลขใบรับยา" />
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">รูปใบรายการยา/รูปถุงยา</label>
              
              {receiptImages.length > 0 && (
                <div className="flex gap-2 mb-2 mt-2 overflow-x-auto pb-2">
                  {receiptImages.map((imgSrc, index) => (
                    <div key={index} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <img src={imgSrc} alt="Receipt" className="h-full w-full object-cover" />
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 w-full py-3 rounded-lg border-2 border-dashed border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                + เพิ่มรูป
              </button>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">คำอธิบายเพิ่มเติม(ถ้ามี)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="คำอธิบายเพิ่มเติม(ถ้ามี)" />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Search + Add */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="ค้นหายาที่นี่..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={() => navigate('/medication/add')} className="text-sm text-primary font-medium whitespace-nowrap">+ เพิ่มยาใหม่</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setMedTab('current')}
                className={`px-4 py-1.5 rounded-full text-sm ${medTab === 'current' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-muted-foreground'}`}>
                ยาปัจจุบัน
              </button>
              <button onClick={() => setMedTab('stopped')}
                className={`px-4 py-1.5 rounded-full text-sm ${medTab === 'stopped' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-muted-foreground'}`}>
                ยาที่หยุดให้
              </button>
            </div>

            {/* Med items */}
            <div className="space-y-3">
              {items.filter(i => {
                const matchTab = medTab === 'current' ? i.medication.status === 'active' : i.medication.status === 'stopped';
                const matchSearch = i.medication.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchTab && matchSearch;
              }).map(item => (
                <div key={item.medication.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-lg bg-[#6a8a7c]/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                         <div className="w-8 h-10 border-2 border-teal-900 rounded-sm mb-1 translate-y-1"></div>
                         <div className="w-10 h-10 border border-teal-900/30 rounded-sm rotate-12 absolute scale-110"></div>
                      </div>
                      <span className="relative z-10 text-xs font-bold text-teal-900/40 text-center px-1 leading-tight">
                        MEDICATION<br/>BOTTLE<br/>IMAGE
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.action.includes('หยุดยา') ? (
                        /* STOPPED CARD LAYOUT */
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 text-[15px] truncate pr-2">
                              {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                            </h4>
                            <span className="bg-[#fff1f2] text-[#f43f5e] text-[10px] px-2 py-1 rounded-full font-bold border border-[#ffe4e6]">
                              หยุดยาแล้ว
                            </span>
                          </div>
                          
                          <div className="space-y-0.5 mt-2">
                            <p className="text-[11px] text-slate-500 font-medium">
                              วันที่หยุดยา: {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              หยุดยาโดย: นางสายธาร นามา
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              คงเหลือเก่า : {item.medication.currentAmount} {item.medication.doseUnit}
                            </p>
                          </div>

                          <div className="pt-3">
                            <button
                              onClick={() => {
                                const newAction = item.action.filter(a => a !== 'หยุดยา');
                                updateItem(item.medication.id, { action: newAction });
                              }}
                              className="text-xs px-5 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
                            >
                              ยกเลิกการหยุดยา
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ACTIVE CARD LAYOUT */
                        <>
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-slate-800 text-[15px] truncate pr-2">
                              {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                            </h4>
                            <div className="flex items-center gap-2">
                              {medTab === 'current' && (
                                <button className="text-xs text-[#a855f7] font-bold whitespace-nowrap hover:underline">ปรับการให้ยา</button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.medication.amountPerDose} {item.medication.doseUnit}/ครั้ง
                          </p>

                          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-600 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.medication.frequency === 'daily' ? 'ทุกวัน' : item.medication.frequency === 'prn' ? 'PRN' : 'ตามกำหนด'}</span>
                          </div>

                          <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-slate-600 font-medium">
                            <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                              {item.medication.timings.map((t, idx) => (
                                <span key={t.id} className="whitespace-nowrap">
                                  {t.time} ({TIME_OF_DAY_LABELS[t.timeOfDay]}, {FOOD_TIMING_LABELS[t.foodTiming]}){idx < item.medication.timings.length - 1 ? ',' : ''}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 text-[11px] font-medium">
                            <span className="text-slate-400 font-normal">เดิมมี: {item.medication.currentAmount} {item.medication.doseUnit}</span>
                            <span className="text-slate-400 font-normal">คงเหลือใหม่: <span className="text-slate-500">{item.medication.currentAmount + item.addedQty} {item.medication.doseUnit}</span></span>
                          </div>

                          {medTab === 'current' && (
                            <div className="flex items-center justify-between mt-3.5">
                              <button
                                onClick={() => {
                                  setStoppingMedId(item.medication.id);
                                  setIsStopModalOpen(true);
                                }}
                                className="text-xs px-5 py-2 rounded-xl font-bold transition-all shadow-sm bg-red-50 text-red-500 hover:bg-red-100 active:scale-95">
                                หยุดให้ยา
                              </button>

                              <div className="flex items-center gap-0 bg-[#f8fafc] rounded-xl border border-slate-200/60 p-0.5 shadow-sm">
                                <button onClick={() => {
                                  const newQty = Math.max(0, item.addedQty - 1);
                                  const newAction = newQty > 0 
                                    ? [...item.action.filter(a => a !== 'เพิ่มจำนวนยา'), 'เพิ่มจำนวนยา']
                                    : item.action.filter(a => a !== 'เพิ่มจำนวนยา');
                                  updateItem(item.medication.id, { addedQty: newQty, action: newAction, selected: newQty > 0 || newAction.length > 0 });
                                }} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="text-[15px] font-black text-slate-800 w-10 text-center">{item.addedQty}</span>
                                <button onClick={() => {
                                  const newQty = item.addedQty + 1;
                                  const newAction = [...item.action.filter(a => a !== 'เพิ่มจำนวนยา'), 'เพิ่มจำนวนยา'];
                                  updateItem(item.medication.id, { addedQty: newQty, action: newAction, selected: true });
                                }} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {medTab === 'stopped' && (
                        <button className="mt-2.5 text-xs text-teal-600 font-bold border-2 border-teal-600/20 px-4 py-1.5 rounded-xl hover:bg-teal-50 transition-colors">
                          สร้างยาใหม่จากข้อมูลเดิม
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 - Review */}
        {step === 2 && (() => {
          const selected = items.filter(i => i.selected);
          // Sort actions so เพิ่มจำนวนยา is always last
          const sortAction = (actions: string[]) => {
            const sorted = actions.filter(a => a !== 'เพิ่มจำนวนยา');
            if (actions.includes('เพิ่มจำนวนยา')) sorted.push('เพิ่มจำนวนยา');
            return sorted;
          };

          // Group by action combination
          type GroupKey = string;
          const groups: Record<GroupKey, typeof selected> = {};
          selected.forEach(item => {
            const key = sortAction(item.action).join(',');
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          });

          // Action label map
          const actionLabelMap: Record<string, string> = {
            'รายการใหม่': 'รายการใหม่',
            'เพิ่มจำนวนยา': 'เพิ่มจำนวนยา',
            'แก้ไขข้อมูล/วิธีการให้ยา': 'แก้ไขข้อมูล/วิธีการให้ยา',
            'หยุดยา': 'หยุดยา',
          };

          // Color for first action (left border)
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

          // Define group order
          const groupOrder = ['รายการใหม่', 'เพิ่มจำนวนยา', 'แก้ไขข้อมูล/วิธีการให้ยา', 'หยุดยา'];
          const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const aFirst = sortAction(a.split(','))[0];
            const bFirst = sortAction(b.split(','))[0];
            return groupOrder.indexOf(aFirst) - groupOrder.indexOf(bFirst);
          });

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">รายการยาที่รับ</span>
                <span className="font-bold text-foreground">{selected.length} รายการ</span>
              </div>

              {sortedGroupKeys.map(groupKey => {
                const groupItems = groups[groupKey];
                const actions = sortAction(groupKey.split(','));
                const firstAction = actions[0];
                const groupLabel = actions.map(a => actionLabelMap[a] || a).join(', ');

                return (
                  <div key={groupKey} className="space-y-3">
                    {/* Group header */}
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

                            {/* Status dot */}
                            <div className="mt-1">
                              <span className={`inline-block h-2 w-2 rounded-full ${item.action.includes('หยุดยา') ? 'bg-destructive' : 'bg-med-success'}`} />
                            </div>

                            {/* Frequency */}
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{item.medication.frequency === 'daily' ? 'ทุกวัน' : item.medication.frequency === 'prn' ? 'PRN' : 'ตามกำหนด'}</span>
                            </div>

                            {/* Timing chips */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.medication.timings.map(t => (
                                <span key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${chipColorMap[t.timeOfDay]} text-foreground`}>
                                  {t.time && `${t.time} `}({TIME_OF_DAY_LABELS[t.timeOfDay]}, {FOOD_TIMING_LABELS[t.foodTiming]})
                                </span>
                              ))}
                            </div>

                            {/* Quantity info */}
                            {item.addedQty > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                                <span className="text-muted-foreground">รับมาเพิ่ม</span>
                                <span className="text-foreground font-semibold text-right">+ {item.addedQty} {item.medication.doseUnit}</span>
                                <span className="text-muted-foreground">คงเหลือหลังรับมา</span>
                                <span className="text-foreground font-semibold text-right">{item.medication.currentAmount + item.addedQty} {item.medication.doseUnit}</span>
                              </div>
                            )}

                            {/* Stopped info */}
                            {item.action.includes('หยุดยา') && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <p>วันที่หยุดยา: {new Date().toLocaleDateString('th-TH')}</p>
                                <p>คงเหลือเก่า : {item.medication.currentAmount} {item.medication.doseUnit}</p>
                                {item.reason && (
                                  <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-500 font-medium">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 not-italic">เหตุผลที่หยุดยา:</span>
                                    {item.reason}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action badges - เพิ่มจำนวนยา always last */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {sortAction(item.action).map(a => (
                                <span key={a} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  a === 'หยุดยา' ? 'bg-destructive/10 text-destructive' :
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

              <div className="space-y-2 pt-4">
                <Button className="w-full" onClick={handleSave}>
                  ยืนยัน
                </Button>
              </div>
            </div>
          );
        })()}
      </div>
        </div>
      </div>
      <BottomSheet open={showEmergencyContactSheet} onOpenChange={setShowEmergencyContactSheet} title="เพิ่มรายชื่อติดต่อฉุกเฉินใหม่">
        <div className="space-y-4 px-1 pb-4">
          <div>
            <label className="text-sm text-foreground font-medium">ความสัมพันธ์กับผู้สูงอายุ <span className="text-destructive">*</span></label>
            <select value={ecRelationship} onChange={e => setEcRelationship(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground">
              <option value="" disabled hidden>ความสัมพันธ์กับผู้สูงอายุ</option>
              <option value="ลูก">ลูก</option>
              <option value="หลาน">หลาน</option>
              <option value="ญาติ">ญาติ</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground font-medium border-0 sr-only">ชื่อ</label>
            <input value={ecFirstName} onChange={e => setEcFirstName(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
              placeholder="ชื่อ" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium border-0 sr-only">นามสกุล</label>
            <input value={ecLastName} onChange={e => setEcLastName(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
              placeholder="นามสกุล" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium border-0 sr-only">เบอร์โทรศัพท์</label>
            <input value={ecPhone} onChange={e => setEcPhone(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
              placeholder="เบอร์โทรศัพท์" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium border-0 sr-only">ไลน์ไอดี</label>
            <input value={ecLine} onChange={e => setEcLine(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
              placeholder="ไลน์ไอดี" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium border-0 sr-only">รายละเอียดที่อยู่</label>
            <textarea value={ecAddress} onChange={e => setEcAddress(e.target.value)} rows={4}
              className="w-full px-3 py-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder-muted-foreground"
              placeholder="รายละเอียดที่อยู่" />
          </div>
          <div className="flex items-center gap-2 pt-2 pb-4">
            <input 
              type="checkbox" 
              id="isGuardian"
              checked={ecIsGuardian}
              onChange={e => setEcIsGuardian(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isGuardian" className="text-sm text-slate-700">เป็นผู้แทนโดยชอบธรรม</label>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-slate-200 border-0 text-slate-500 hover:bg-slate-300" onClick={() => setShowEmergencyContactSheet(false)}>ยกเลิก</Button>
            <Button className="flex-1" onClick={() => {
              if (ecFirstName && ecLastName) {
                const newContact = `${ecFirstName} ${ecLastName}`;
                setContacts(prev => [...prev, newContact]);
                setReceivedFrom(newContact);
                toast.success('เพิ่มผู้ติดต่อฉุกเฉินเรียบร้อยแล้ว');
                setShowEmergencyContactSheet(false);
                // Clear form
                setEcFirstName('');
                setEcLastName('');
                setEcPhone('');
                setEcLine('');
                setEcRelationship('');
                setEcAddress('');
                setEcIsGuardian(false);
              } else {
                toast.error('กรุณากรอกข้อมูลที่จำเป็น');
              }
            }}>บันทึก</Button>
          </div>
        </div>
      </BottomSheet>

      {/* Stop Medication Confirmation Modal */}
      <Dialog open={isStopModalOpen} onOpenChange={setIsStopModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-3xl p-6 gap-0">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-center text-[#1e7874] text-xl font-bold leading-snug">
              ยืนยันการเปลี่ยนสถานะหยุดยา
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 text-sm font-medium leading-relaxed">
              หากคุณเปลี่ยนสถานะหยุดยา<br />
              <span className="text-destructive font-bold">คำสั่งยาจะถูกยกเลิกทันที</span><br />
              และข้อมูลยาจะย้ายไปแสดงใน “ยาที่หยุดให้”
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#eef2f6] rounded-2xl p-4 mt-2">
             <label className="block text-slate-600 text-xs font-bold mb-3 uppercase tracking-wider">
               เหตุผลเพิ่มเติม (ถ้ามี)
             </label>
             <Textarea 
               placeholder="เหตุผลเพิ่มเติม (ถ้ามี)"
               value={stopReason}
               onChange={(e) => setStopReason(e.target.value)}
               className="bg-white border-2 border-slate-100 rounded-xl focus-visible:ring-primary focus-visible:ring-offset-0 text-slate-700 placeholder:text-slate-300 resize-none min-h-[100px]"
             />
          </div>

          <div className="flex gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={handleCancelStop}
              className="flex-1 h-12 rounded-2xl bg-slate-100 border-0 text-slate-500 font-bold hover:bg-slate-200"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConfirmStop}
              className="flex-1 h-12 rounded-2xl bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-bold shadow-lg shadow-red-200"
            >
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CreateReceiptPage;
