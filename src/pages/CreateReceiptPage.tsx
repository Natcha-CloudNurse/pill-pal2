import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Stepper from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { mockMedications } from '@/data/mockMedications';
import { Medication, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TimeOfDay, FrequencyType, TimingEntry, FoodTiming, TIME_OF_DAY_DEFAULTS, MedicationStatus, ReceiptAction } from '@/types/medication';
import { ChevronLeft, ChevronRight, Minus, Plus, Search, Calendar, Trash2 } from 'lucide-react';
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

  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stoppingMedId, setStoppingMedId] = useState<string | null>(null);
  const [stopReason, setStopReason] = useState('');

  // Medication Adjustment & Re-creation Flow State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustStep, setAdjustStep] = useState(1);
  const [adjustingMedId, setAdjustingMedId] = useState<string | null>(null);
  const [isRecreatingMode, setIsRecreatingMode] = useState(false);
  const [isRecreateConfirmOpen, setIsRecreateConfirmOpen] = useState(false);
  const [recreatingMedTemplate, setRecreatingMedTemplate] = useState<Medication | null>(null);

  // Step 1 Form State (Basic Info) - for re-creation
  const [adjName, setAdjName] = useState('');
  const [adjStrength, setAdjStrength] = useState('');
  const [adjStrengthUnit, setAdjStrengthUnit] = useState('');
  const [adjAdminMethod, setAdjAdminMethod] = useState('');

  // Adjustment Form State (Sub-step 1: Administration)
  const [adjAmountPerDose, setAdjAmountPerDose] = useState('1');
  const [adjDoseUnit, setAdjDoseUnit] = useState('เม็ด');
  const [adjFrequency, setAdjFrequency] = useState<FrequencyType>('daily');
  const [adjSpecificDays, setAdjSpecificDays] = useState<number[]>([]);
  const [adjEveryNDays, setAdjEveryNDays] = useState('3');
  const [adjTimings, setAdjTimings] = useState<TimingEntry[]>([]);
  
  // Adjustment Form State (Sub-step 2: Quantity & Dates)
  const [adjPrescribedBy, setAdjPrescribedBy] = useState('');
  const [adjStartDate, setAdjStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [adjEndDate, setAdjEndDate] = useState('');
  const [adjCurrentAmount, setAdjCurrentAmount] = useState('0');
  const [adjAlertDays, setAdjAlertDays] = useState(7);
  const [adjInstruction, setAdjInstruction] = useState('');
  const [adjStatus, setAdjStatus] = useState<MedicationStatus>('active');
  const [adjExpirationDate, setAdjExpirationDate] = useState('');
  const [originalMed, setOriginalMed] = useState<Medication | null>(null);

  // Timing Modal State (inside Adjust Modal)
  const [showAdjTimingDialog, setShowAdjTimingDialog] = useState(false);
  const [adjTimingFoodTiming, setAdjTimingFoodTiming] = useState<FoodTiming>('after_meal');
  const [adjTimingTimeOfDay, setAdjTimingTimeOfDay] = useState<TimeOfDay>('morning');
  const [adjTimingTime, setAdjTimingTime] = useState('08:00');
  const [adjTimingError, setAdjTimingError] = useState('');
  const [adjDayNames] = useState(['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']);

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

  // --- Medication Adjustment & Re-creation Logic ---
  const handleOpenAdjustModal = (item: MedReceiptItem, isRecreate = false) => {
    setIsRecreatingMode(isRecreate);
    setAdjustingMedId(item.medication.id);
    
    // Populate form with medication data
    const med = item.medication;
    
    // Set Step 1 fields
    setAdjName(med.name);
    setAdjStrength(med.strength);
    setAdjStrengthUnit(med.strengthUnit);
    setAdjAdminMethod(med.administrationMethod);

    // For recreations, start at Step 1. For adjustments, start at Step 2 (Administration)
    setAdjustStep(isRecreate ? 1 : 2);
    
    setAdjAmountPerDose(med.amountPerDose.toString());
    setAdjDoseUnit(med.doseUnit);
    setAdjFrequency(med.frequency);
    setAdjSpecificDays(med.specificDays || []);
    setAdjEveryNDays(med.everyNDays?.toString() || '3');
    setAdjTimings([...med.timings]);
    
    setAdjPrescribedBy(med.prescribedBy || '');
    // For recreate, default to now. For adjust, keep original.
    setAdjStartDate(isRecreate ? new Date().toISOString().slice(0, 16) : med.startDate);
    setAdjEndDate(med.endDate || '');
    setAdjCurrentAmount(med.currentAmount.toString());
    setAdjAlertDays(med.alertDays);
    setAdjStatus(med.status);
    setAdjExpirationDate(med.expirationDate || '');
    setAdjInstruction(med.instruction || ''); // Ensure instruction is pre-filled if available
    setOriginalMed({ ...med });
    
    setIsAdjustModalOpen(true);
  };

  const handleOpenRecreateConfirm = (medication: Medication) => {
    setRecreatingMedTemplate(medication);
    setIsRecreateConfirmOpen(true);
  };

  const handleConfirmRecreate = () => {
    if (!recreatingMedTemplate) return;
    setIsRecreateConfirmOpen(false);
    
    // Find the item if it exists, or create a dummy one to pass to handleOpenAdjustModal
    const existingItem = items.find(i => i.medication.id === recreatingMedTemplate.id);
    if (existingItem) {
      handleOpenAdjustModal(existingItem, true);
    } else {
      handleOpenAdjustModal({ 
        medication: recreatingMedTemplate, 
        selected: false, 
        addedQty: 0, 
        action: [] 
      }, true);
    }
    setRecreatingMedTemplate(null);
  };

  const handleAddAdjTiming = () => {
    setAdjTimingError('');
    
    if (adjFrequency === 'prn') {
      const entry: TimingEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timeOfDay: 'unspecified',
        foodTiming: adjTimingFoodTiming,
        time: null,
      };
      setAdjTimings(prev => [...prev, entry]);
      setShowAdjTimingDialog(false);
      return;
    }

    // Check duplicate
    const duplicate = adjTimings.find(
      t => t.time === adjTimingTime && t.timeOfDay === adjTimingTimeOfDay && t.foodTiming === adjTimingFoodTiming
    );
    if (duplicate) {
      setAdjTimingError('เวลาที่เลือกซ้ำกัน');
      return;
    }

    const entry: TimingEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timeOfDay: adjTimingTimeOfDay,
      foodTiming: adjTimingFoodTiming,
      time: adjTimingTimeOfDay === 'unspecified' ? null : adjTimingTime,
    };
    setAdjTimings(prev => [...prev, entry]);
    setShowAdjTimingDialog(false);
  };

  const removeAdjTiming = (id: string) => {
    setAdjTimings(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveAdjustment = () => {
    if (!adjustingMedId || !originalMed) return;

    if (isRecreatingMode) {
      const newMed: Medication = {
        ...originalMed,
        id: Math.random().toString(36).substr(2, 9), // New ID for re-created med
        name: adjName,
        strength: adjStrength,
        strengthUnit: adjStrengthUnit,
        administrationMethod: adjAdminMethod,
        amountPerDose: Number(adjAmountPerDose),
        doseUnit: adjDoseUnit,
        frequency: adjFrequency,
        specificDays: adjFrequency === 'specific_days' ? adjSpecificDays : undefined,
        everyNDays: adjFrequency === 'every_n_days' ? Number(adjEveryNDays) : undefined,
        timings: adjTimings,
        prescribedBy: adjPrescribedBy || undefined,
        startDate: adjStartDate,
        endDate: adjEndDate || undefined,
        currentAmount: Number(adjCurrentAmount),
        alertDays: adjAlertDays,
        status: 'active', // Force active for re-created med
        expirationDate: adjExpirationDate || undefined,
      };

      const newItem: MedReceiptItem = {
        medication: newMed,
        selected: true,
        addedQty: Number(adjCurrentAmount), // Initial amount
        action: ['new'],
      };

      setItems(prev => [newItem, ...prev]);
      toast.success('เพิ่มรายการใหม่จากข้อมูลเดิมเรียบร้อยแล้ว');
    } else {
      setItems(prev => prev.map(item => {
        if (item.medication.id === adjustingMedId) {
          const updatedMed: Medication = {
            ...item.medication,
            amountPerDose: Number(adjAmountPerDose),
            doseUnit: adjDoseUnit,
            frequency: adjFrequency,
            specificDays: adjFrequency === 'specific_days' ? adjSpecificDays : undefined,
            everyNDays: adjFrequency === 'every_n_days' ? Number(adjEveryNDays) : undefined,
            timings: adjTimings,
            prescribedBy: adjPrescribedBy || undefined,
            startDate: adjStartDate,
            endDate: adjEndDate || undefined,
            currentAmount: Number(adjCurrentAmount),
            alertDays: adjAlertDays,
            status: adjStatus,
            expirationDate: adjExpirationDate || undefined,
          };
          
          // Generate change log
          const logEntries: string[] = [];
          if (originalMed.amountPerDose !== updatedMed.amountPerDose) logEntries.push(`ปรับปริมาณ: ${originalMed.amountPerDose} -> ${updatedMed.amountPerDose}`);
          if (originalMed.frequency !== updatedMed.frequency) logEntries.push('ปรับความถี่');
          if (originalMed.currentAmount !== updatedMed.currentAmount) logEntries.push(`ปรับจำนวนยา: ${originalMed.currentAmount} -> ${updatedMed.currentAmount}`);
          if (originalMed.status !== updatedMed.status) logEntries.push(`เปลี่ยนสถานะ: ${originalMed.status === 'active' ? 'ให้ยาปกติ' : 'หยุดยา'} -> ${updatedMed.status === 'active' ? 'ให้ยาปกติ' : 'หยุดยา'}`);

          const newAction = [...item.action.filter(a => a !== 'edited'), 'edited'];
          return { 
            ...item, 
            medication: updatedMed, 
            action: newAction as ReceiptAction[],
            selected: true,
            reason: logEntries.join(', ') || item.reason
          };
        }
        return item;
      }));
      toast.success('ปรับปรุงข้อมูลยาเรียบร้อยแล้ว');
    }

    setIsAdjustModalOpen(false);
    setAdjustingMedId(null);
    setOriginalMed(null);
    setIsRecreatingMode(false);
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
            className="gap-1 px-5 h-9 bg-teal-500 hover:bg-teal-600">
            ถัดไป <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} className="gap-1 px-8 h-9 bg-teal-600 hover:bg-teal-700">
            ยืนยัน
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

                          {/* Removed ยกเลิกการหยุดยา button as per request */}
                        </div>
                      ) : (
                        /* ACTIVE CARD LAYOUT */
                        <>
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-slate-800 text-[15px] truncate pr-2">
                              {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                            </h4>
                            <div className="flex items-center gap-2">
                              {item.action.includes('edited') && (
                                <span className="bg-[#f0f9ff] text-[#0ea5e9] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#bae6fd]">
                                  แก้ไขแล้ว
                                </span>
                              )}
                              {medTab === 'current' && (
                                <button 
                                  onClick={() => handleOpenAdjustModal(item)}
                                  className="text-xs text-[#a855f7] font-bold whitespace-nowrap hover:underline"
                                >
                                  ปรับการให้ยา
                                </button>
                              )}
                            </div>
                            {item.reason && item.action.includes('edited') && (
                              <div className="mt-2 text-[10px] text-slate-400 font-medium italic">
                                ({item.reason})
                              </div>
                            )}
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
                        <button 
                          onClick={() => handleOpenRecreateConfirm(item.medication)}
                          className="mt-2.5 text-xs text-teal-600 font-bold border-2 border-teal-600/20 px-4 py-1.5 rounded-xl hover:bg-teal-50 transition-colors"
                        >
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
          // Sort actions so added_quantity is always last
          const sortAction = (actions: string[] | ReceiptAction[]) => {
            const casted = actions as string[];
            const sorted = casted.filter(a => a !== 'added_quantity');
            if (casted.includes('added_quantity')) sorted.push('added_quantity');
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
            'new': 'รายการใหม่',
            'added_quantity': 'เพิ่มจำนวนยา',
            'edited': 'แก้ไขข้อมูล / วิธีการให้ยา',
            'stopped': 'หยุดยา',
          };

          // Color for first action (left border)
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

          // Define group order
          const groupOrder = ['new', 'edited', 'added_quantity', 'stopped'];
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
                    <div className={`text-sm font-bold ${actionGroupColor(firstAction)} mb-3 flex items-center gap-1.5`}>
                      <span className="capitalize">{groupLabel}</span>
                      <span className="bg-current/10 px-1.5 py-0.5 rounded text-[10px]">({groupItems.length})</span>
                    </div>

                    {groupItems.map(item => (
                      <div className={`bg-card rounded-xl p-4 border border-border shadow-sm border-l-8 ${actionBorderColor(firstAction)}`}>
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-20 rounded-lg bg-[#6a8a7c]/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-inner">
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                              <div className="w-8 h-10 border-2 border-teal-900 rounded-sm mb-1 translate-y-1"></div>
                              <div className="w-10 h-10 border border-teal-900/30 rounded-sm rotate-12 absolute scale-110"></div>
                            </div>
                            <span className="relative z-10 text-[8px] font-bold text-teal-900/40 text-center px-1 leading-tight">
                              MEDICATION<br/>BOTTLE<br/>IMAGE
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm">
                              {item.medication.name} {item.medication.strength}{item.medication.strengthUnit}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {item.medication.amountPerDose} {item.medication.doseUnit}/ครั้ง
                            </p>

                            {/* Status dot */}
                            <div className="mt-1">
                              <span className={`inline-block h-2 w-2 rounded-full ${item.action.includes('stopped') ? 'bg-destructive' : 'bg-[#22c55e]'}`} />
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

                            {/* Action badges - added_quantity always last */}
                            <div className="flex flex-wrap gap-1 mt-2">
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

              <div className="pt-4" />
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

      {/* Recreate Medication Confirmation Modal */}
      <Dialog open={isRecreateConfirmOpen} onOpenChange={setIsRecreateConfirmOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-3xl p-6 gap-0">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-center text-[#1e7874] text-xl font-bold leading-snug">
              ยืนยันการสร้างยาใหม่
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 text-sm font-medium leading-relaxed">
              ต้องการสร้างรายการยาใหม่โดยใช้ข้อมูลเดิมของ<br />
              <span className="font-bold text-slate-700">“{recreatingMedTemplate?.name}”</span> ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setIsRecreateConfirmOpen(false)}
              className="flex-1 h-12 rounded-2xl bg-slate-100 border-0 text-slate-500 font-bold hover:bg-slate-200"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConfirmRecreate}
              className="flex-1 h-12 rounded-2xl bg-[#1a8e89] hover:bg-[#167d79] text-white font-bold shadow-lg shadow-teal-100"
            >
              ตกลง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Medication Bottom Sheet */}
      <BottomSheet 
        open={isAdjustModalOpen} 
        onOpenChange={setIsAdjustModalOpen} 
        title="แก้ไขรายการยา"
      >
        <div className="px-1 pb-6">
          {/* Internal Stepper */}
          <div className="flex items-center justify-center gap-4 py-4 mb-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${adjustStep === 1 ? 'bg-[#1a8e89] text-white shadow-lg ring-4 ring-[#1a8e89]/20' : 'bg-[#eef2fc] text-[#6366f1]'}`}>1</div>
            <div className={`h-[2px] w-12 rounded ${adjustStep >= 2 ? 'bg-[#009292]' : 'bg-slate-100'}`} />
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${adjustStep === 2 ? 'bg-[#1a8e89] text-white shadow-lg ring-4 ring-[#1a8e89]/20' : 'bg-[#eef2fc] text-[#6366f1]'}`}>2</div>
            <div className={`h-[2px] w-12 rounded ${adjustStep >= 3 ? 'bg-[#009292]' : 'bg-slate-100'}`} />
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${adjustStep === 3 ? 'bg-[#1a8e89] text-white shadow-lg ring-4 ring-[#1a8e89]/20' : 'bg-[#eef2fc] text-[#6366f1]'}`}>3</div>
          </div>

          <div className="flex items-center gap-2 mb-6 ml-1">
            <button onClick={() => adjustStep > 2 && setAdjustStep(prev => prev - 1)} className="p-1">
              <ChevronLeft className="h-5 w-5 text-[#1a8e89]" />
            </button>
            <h3 className="text-[#1a8e89] font-bold text-lg">
              {adjustStep === 1 ? 'ข้อมูลพื้นฐาน' : adjustStep === 2 ? 'ข้อมูลการให้ยา' : 'ข้อมูลจำนวนและวันให้ยา'}
            </h3>
          </div>

          <div className="border border-[#c7d2fe] rounded-3xl p-5 border-l-8 border-l-[#a5b4fc] relative overflow-hidden">
            {adjustStep === 1 ? (
              <div className="space-y-6">
                <div className="relative">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ข้อมูลพื้นฐาน</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">ชื่อยา <span className="text-destructive">*</span></label>
                      <input 
                        value={adjName}
                        onChange={e => setAdjName(e.target.value)}
                        placeholder="ชื่อยา"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-[#334155] mb-2 block">ความแรง</label>
                        <input 
                          value={adjStrength}
                          onChange={e => setAdjStrength(e.target.value)}
                          placeholder="เช่น 500"
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-[#334155] mb-2 block">หน่วยความแรง</label>
                        <input 
                          value={adjStrengthUnit}
                          onChange={e => setAdjStrengthUnit(e.target.value)}
                          placeholder="เช่น mg"
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">วิธีใช้ยา <span className="text-destructive">*</span></label>
                      <input 
                        value={adjAdminMethod}
                        onChange={e => setAdjAdminMethod(e.target.value)}
                        placeholder="เช่น รับประทาน"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : adjustStep === 2 ? (
              <div className="space-y-6">
                <div className="relative">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ขนาดและปริมาณยา</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">ปริมาณต่อครั้ง <span className="text-destructive">*</span></label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={adjAmountPerDose}
                        onChange={e => setAdjAmountPerDose(e.target.value)}
                        placeholder="1.00"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-3 block">หน่วย <span className="text-destructive">*</span></label>
                      <div className="grid grid-cols-4 gap-2">
                        {['แคปซูล', 'เม็ด', 'หยด', 'mL', 'ซอง', 'หน่วย', 'U/mL', 'แผ่น'].map(unit => (
                          <button
                            key={unit}
                            onClick={() => setAdjDoseUnit(unit)}
                            className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all ${adjDoseUnit === unit ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pt-2">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ความถี่</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-3 block">ความถี่ <span className="text-destructive">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {(['daily', 'specific_days', 'prn', 'every_n_days'] as FrequencyType[]).map(f => (
                          <button 
                            key={f}
                            onClick={() => { setAdjFrequency(f); if (f === 'prn') setAdjTimings([]); }}
                            className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all ${adjFrequency === f ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {f === 'daily' ? 'ทุกวัน' : f === 'specific_days' ? 'เฉพาะบางวัน' : f === 'prn' ? 'เมื่อมีอาการ (PRN)' : 'ทุก…วัน'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {adjFrequency === 'specific_days' && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-[#334155] mb-3 block">เฉพาะบางวัน</label>
                        <div className="flex justify-between gap-1">
                          {adjDayNames.map((d, i) => (
                            <button 
                              key={i} 
                              onClick={() => setAdjSpecificDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                              className={`h-10 w-10 rounded-full text-xs font-bold transition-all ${
                                adjSpecificDays.includes(i) ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {adjFrequency === 'every_n_days' && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-[#334155] mb-2 block">ทุกกี่วัน</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1" 
                            value={adjEveryNDays} 
                            onChange={e => setAdjEveryNDays(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium" 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">วัน</div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">เวลา <span className="text-destructive">*</span></label>
                      <div className="space-y-2 mb-2">
                        {adjTimings.map(t => (
                          <div key={t.id} className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-2xl p-3 shadow-sm">
                            <span className="font-bold text-slate-700">
                              {t.time && `${t.time} `}
                              <span className="text-slate-400 font-medium text-sm">
                                ({TIME_OF_DAY_LABELS[t.timeOfDay]}/{FOOD_TIMING_LABELS[t.foodTiming]})
                              </span>
                            </span>
                            <button onClick={() => removeAdjTiming(t.id)} className="text-destructive p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setShowAdjTimingDialog(true);
                          if (adjFrequency === 'prn') setAdjTimingTimeOfDay('unspecified');
                          else {
                            setAdjTimingTimeOfDay('morning');
                            setAdjTimingTime(TIME_OF_DAY_DEFAULTS.morning[adjTimingFoodTiming] || '08:00');
                          }
                        }}
                        className="w-full py-3 bg-[#f3f0ff] border-2 border-dashed border-[#d8b4fe] rounded-2xl text-[#a855f7] font-bold flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> เพิ่มเวลา
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative pt-2">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide">คำอธิบายหรือคำแนะนำ</h4>
                  <Textarea 
                    placeholder="ระบุรายละเอียด"
                    value={adjInstruction}
                    onChange={e => setAdjInstruction(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 focus:ring-0 focus:border-slate-200 min-h-[100px] text-sm font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ระยะเวลาให้ยา</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">สถานะการให้ยา:</label>
                      <div className="relative">
                        <select 
                          value={adjStatus}
                          onChange={e => setAdjStatus(e.target.value as MedicationStatus)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-bold text-[13px] text-[#009292] bg-white appearance-none pr-10"
                        >
                          <option value="active">● ให้ยาปกติ</option>
                          <option value="stopped">● หยุดยา</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">ผู้สั่งยา</label>
                      <input 
                        value={adjPrescribedBy}
                        onChange={e => setAdjPrescribedBy(e.target.value)}
                        placeholder="หมอวิชัย"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">วันที่เริ่มให้ยา <span className="text-destructive">*</span></label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          value={adjStartDate}
                          onChange={e => setAdjStartDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12"
                        />
                        <div className="absolute right-0 top-0 h-full w-12 bg-[#1a8e89] rounded-r-2xl flex items-center justify-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">วันที่สิ้นสุดให้ยา (ถ้ามี)</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          value={adjEndDate}
                          onChange={e => setAdjEndDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12"
                        />
                        <div className="absolute right-0 top-0 h-full w-12 bg-[#1a8e89] rounded-r-2xl flex items-center justify-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pt-2">
                  <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ข้อมูลจำนวนยา</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">จำนวนยาปัจจุบัน</label>
                      <div className="flex gap-0 border-2 border-slate-100 rounded-2xl overflow-hidden">
                        <input 
                          type="number" 
                          value={adjCurrentAmount}
                          onChange={e => setAdjCurrentAmount(e.target.value)}
                          className="flex-1 px-4 py-3 focus:outline-none font-bold text-xl text-slate-700"
                        />
                        <div className="flex flex-col border-l-2 border-slate-100">
                          <button onClick={() => setAdjCurrentAmount(prev => (Number(prev) + 1).toString())} className="px-3 bg-[#1a8e89] text-white flex-1 hover:bg-[#167d79]">
                            <ChevronRight className="h-4 w-4 -rotate-90" />
                          </button>
                          <button onClick={() => setAdjCurrentAmount(prev => Math.max(0, Number(prev) - 1).toString())} className="px-3 bg-[#1a8e89] text-white flex-1 border-t border-white/20 hover:bg-[#167d79]">
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">หน่วย : {adjDoseUnit}</p>
                        <p className="text-xs text-slate-300 font-medium">ให้ยาได้ถึง : 0 วัน</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">แจ้งเตือนเมื่อเหลือพอใช้ (วัน)</label>
                      <div className="relative">
                        <select 
                          value={adjAlertDays}
                          onChange={e => setAdjAlertDays(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm bg-white appearance-none pr-10"
                        >
                          <option value={1}>1 วัน</option>
                          <option value={3}>3 วัน</option>
                          <option value={7}>7 วัน</option>
                          <option value={14}>14 วัน</option>
                          <option value={30}>30 วัน</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 text-center font-medium leading-tight">
                        เมื่อยาคงเหลือพอใช้ได้ตามจำนวนวันที่ตั้งค่า<br />
                        สถานะจะเป็น <span className="text-[#a855f7]">"ใกล้หมด"</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#334155] mb-2 block">วันหมดอายุ (ถ้ามี)</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          value={adjExpirationDate}
                          onChange={e => setAdjExpirationDate(e.target.value)}
                          placeholder="ระบุเวลา"
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12 placeholder:text-slate-300"
                        />
                        <div className="absolute right-0 top-0 h-full w-12 bg-[#1a8e89] rounded-r-2xl flex items-center justify-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <Button 
              variant="secondary" 
              onClick={() => {
                if (adjustStep === 1) setIsAdjustModalOpen(false);
                else setAdjustStep(prev => prev - 1);
              }}
              className="flex-1 h-14 rounded-2xl bg-[#eff3f8] border-0 text-[#94a3b8] font-bold hover:bg-slate-200 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" /> ก่อนหน้า
            </Button>
            <Button 
              onClick={() => {
                if (adjustStep < 3) setAdjustStep(prev => prev + 1);
                else handleSaveAdjustment();
              }}
              className="flex-1 h-14 rounded-2xl bg-[#1a8e89] hover:bg-[#167d79] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-100"
            >
              {adjustStep < 3 ? 'ถัดไป' : 'บันทึก'} <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Adjustment Timing Modal */}
      {showAdjTimingDialog && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0" onClick={() => setShowAdjTimingDialog(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold text-slate-800">เพิ่มเวลาให้ยา</h3>
               <button onClick={() => setShowAdjTimingDialog(false)} className="p-2 bg-slate-50 rounded-full">
                 <Trash2 className="h-5 w-5 text-slate-400" />
               </button>
             </div>

             <div className="space-y-4">
               <label className="text-sm font-bold text-[#334155]">เวลาให้ยาสัมพันธ์กับมื้ออาหาร <span className="text-destructive">*</span></label>
               <div className="flex flex-wrap gap-2">
                 {(['before_meal', 'with_meal', 'after_meal', 'unspecified'] as FoodTiming[]).map(ft => (
                   <button 
                     key={ft} 
                     onClick={() => setAdjTimingFoodTiming(ft)}
                     className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${adjTimingFoodTiming === ft ? 'bg-[#1a8e89] text-white' : 'bg-slate-100 text-slate-500'}`}
                   >
                     {FOOD_TIMING_LABELS[ft]}
                   </button>
                 ))}
               </div>
             </div>

             {adjFrequency !== 'prn' && (
               <div className="space-y-4">
                 <label className="text-sm font-bold text-[#334155]">เลือกช่วงเวลา <span className="text-destructive">*</span></label>
                 <div className="flex flex-wrap gap-2">
                   {(['morning', 'noon', 'evening', 'bedtime', 'other', 'unspecified'] as TimeOfDay[]).map(tod => (
                     <button 
                       key={tod} 
                       onClick={() => {
                         setAdjTimingTimeOfDay(tod);
                         const def = TIME_OF_DAY_DEFAULTS[tod]?.[adjTimingFoodTiming];
                         if (def) setAdjTimingTime(def);
                       }}
                       className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${adjTimingTimeOfDay === tod ? 'bg-[#1a8e89] text-white' : 'bg-slate-100 text-slate-500'}`}
                     >
                       {TIME_OF_DAY_LABELS[tod]}
                     </button>
                   ))}
                 </div>
                 
                 {adjTimingTimeOfDay !== 'unspecified' && (
                   <div className="pt-2">
                     <label className="text-sm font-bold text-[#334155] mb-2 block">ระบุเวลา <span className="text-destructive">*</span></label>
                     <input 
                       type="time" 
                       value={adjTimingTime}
                       onChange={e => setAdjTimingTime(e.target.value)}
                       className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 text-xl font-bold text-slate-700" 
                     />
                   </div>
                 )}
               </div>
             )}

             {adjTimingError && <p className="text-sm text-destructive font-medium">{adjTimingError}</p>}

             <div className="flex gap-4 pt-4">
               <Button variant="outline" className="flex-1 h-16 rounded-2xl text-slate-400 font-bold border-0 bg-slate-50" onClick={() => setShowAdjTimingDialog(false)}>ยกเลิก</Button>
               <Button className="flex-1 h-16 rounded-2xl bg-[#1a8e89] font-bold text-white shadow-lg shadow-teal-100" onClick={handleAddAdjTiming}>เพิ่ม</Button>
             </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CreateReceiptPage;
