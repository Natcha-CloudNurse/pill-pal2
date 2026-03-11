import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Stepper from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { Medication, TimingEntry, FrequencyType, TimeOfDay, FoodTiming, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TIME_OF_DAY_RANGES, TIME_OF_DAY_DEFAULTS, MedicationStatus } from '@/types/medication';
import { generateId } from '@/lib/medicationUtils';
import { mockMedications } from '@/data/mockMedications';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const ALERT_DAY_OPTIONS = [1, 3, 7, 14, 30];

const AddMedicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [step, setStep] = useState(isEditMode ? 1 : 0); // Start at step 2 if editing (as per design pictures)

  // Step 1
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [strengthUnit, setStrengthUnit] = useState('mg');
  const [administrationMethod, setAdministrationMethod] = useState('รับประทาน');
  const [prescribedBy, setPrescribedBy] = useState('');

  // Step 2
  const [amountPerDose, setAmountPerDose] = useState<string>('1');
  const [doseUnit, setDoseUnit] = useState('เม็ด');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([]);
  const [everyNDays, setEveryNDays] = useState<string>('3');
  const [timings, setTimings] = useState<TimingEntry[]>([]);

  // Timing dialog
  const [showTimingDialog, setShowTimingDialog] = useState(false);
  const [timingFoodTiming, setTimingFoodTiming] = useState<FoodTiming>('after_meal');
  const [timingTimeOfDay, setTimingTimeOfDay] = useState<TimeOfDay>('morning');
  const [timingTime, setTimingTime] = useState('08:00');
  const [timingError, setTimingError] = useState('');

  // Step 3
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState<string>('0');
  const [alertDays, setAlertDays] = useState(7);
  const [status, setStatus] = useState<MedicationStatus>('active');
  const [expirationDate, setExpirationDate] = useState('');
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      const med = mockMedications.find(m => m.id === id);
      if (med) {
        setName(med.name);
        setStrength(med.strength);
        setStrengthUnit(med.strengthUnit);
        setAdministrationMethod(med.administrationMethod);
        setPrescribedBy(med.prescribedBy || '');
        setAmountPerDose(med.amountPerDose.toString());
        setDoseUnit(med.doseUnit);
        setFrequency(med.frequency);
        setSpecificDays(med.specificDays || []);
        setEveryNDays(med.everyNDays?.toString() || '3');
        setTimings(med.timings);
        setStartDate(med.startDate);
        setEndDate(med.endDate || '');
        setCurrentAmount(med.currentAmount.toString());
        setAlertDays(med.alertDays);
        setStatus(med.status);
        setExpirationDate(med.expirationDate || '');
      }
    }
  }, [isEditMode, id]);

  const step1Valid = name.trim() && strength.trim() && strengthUnit.trim() && administrationMethod.trim();
  const step2Valid = amountPerDose && doseUnit && (frequency === 'prn' || timings.length > 0);
  const step3Valid = startDate && currentAmount !== '' && Number(currentAmount) >= 0;

  const handleAddTiming = () => {
    setTimingError('');
    
    if (frequency === 'prn') {
      const entry: TimingEntry = {
        id: generateId(),
        timeOfDay: 'unspecified',
        foodTiming: timingFoodTiming,
        time: null,
      };
      setTimings(prev => [...prev, entry]);
      setShowTimingDialog(false);
      return;
    }

    // Check duplicate
    const duplicate = timings.find(
      t => t.time === timingTime && t.timeOfDay === timingTimeOfDay && t.foodTiming === timingFoodTiming
    );
    if (duplicate) {
      setTimingError('เวลาที่เลือกซ้ำกับเวลาที่เพิ่มไปแล้ว โปรดตรวจสอบอีกครั้ง');
      return;
    }

    // Validate range
    const range = TIME_OF_DAY_RANGES[timingTimeOfDay];
    if (range && timingTimeOfDay !== 'other') {
      if (timingTime < range.min || timingTime > range.max) {
        setTimingError(`เวลา${TIME_OF_DAY_LABELS[timingTimeOfDay]}เลือกได้ตั้งแต่ ${range.min} - ${range.max}`);
        return;
      }
    }

    const entry: TimingEntry = {
      id: generateId(),
      timeOfDay: timingTimeOfDay,
      foodTiming: timingFoodTiming,
      time: timingTimeOfDay === 'unspecified' ? null : timingTime,
    };
    setTimings(prev => [...prev, entry]);
    setShowTimingDialog(false);
  };

  const removeTiming = (id: string) => {
    setTimings(prev => prev.filter(t => t.id !== id));
  };

  const handleTimeOfDayChange = (tod: TimeOfDay) => {
    setTimingTimeOfDay(tod);
    const defaultTime = TIME_OF_DAY_DEFAULTS[tod]?.[timingFoodTiming];
    if (defaultTime) setTimingTime(defaultTime);
  };

  const handleSave = () => {
    const med: Medication = {
      id: isEditMode && id ? id : generateId(),
      name,
      strength,
      strengthUnit,
      administrationMethod,
      prescribedBy: prescribedBy || undefined,
      amountPerDose: Number(amountPerDose),
      doseUnit,
      frequency,
      specificDays: frequency === 'specific_days' ? specificDays : undefined,
      everyNDays: frequency === 'every_n_days' ? Number(everyNDays) : undefined,
      timings,
      startDate,
      endDate: endDate || undefined,
      status: status,
      currentAmount: Number(currentAmount),
      alertDays,
      expirationDate: expirationDate || undefined,
    };
    console.log('Saved medication:', med);
    toast.success(isEditMode ? 'ปรับปรุงข้อมูลยาเรียบร้อยแล้ว' : 'บันทึกรายการยาสำเร็จ');
    navigate('/');
  };

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const chipColorMap: Record<TimeOfDay, string> = {
    morning: 'bg-chip-morning',
    noon: 'bg-chip-noon',
    evening: 'bg-chip-evening',
    bedtime: 'bg-chip-bedtime',
    other: 'bg-chip-other',
    unspecified: 'bg-chip-other',
  };

  return (
    <div className="min-h-screen bg-white w-full mx-auto pb-10">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">
          {isEditMode ? 'แก้ไขรายการยา' : 'เพิ่มรายการยา'}
        </h1>
        <Stepper currentStep={step} totalSteps={3} />
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6 ml-1 mt-4">
          <button onClick={() => step > 0 && setStep(prev => prev - 1)} className="p-1">
            <ChevronLeft className="h-5 w-5 text-[#1a8e89]" />
          </button>
          <h3 className="text-[#1a8e89] font-bold text-lg">
            {step === 0 ? 'ข้อมูลยาทั่วไป' : step === 1 ? 'ข้อมูลการให้ยา' : 'ข้อมูลจำนวนและวันให้ยา'}
          </h3>
        </div>

        <div className="border border-[#c7d2fe] rounded-[2.5rem] p-6 border-l-[10px] border-l-[#a5b4fc] relative overflow-hidden shadow-sm">
          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-6">
              <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ข้อมูลยาทั่วไป</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-[#334155] mb-2 block">ชื่อยา <span className="text-destructive">*</span></label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" 
                    placeholder="ระบุชื่อยา" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">ความแรง <span className="text-destructive">*</span></label>
                    <input 
                      value={strength} 
                      onChange={e => setStrength(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" 
                      placeholder="เช่น 500" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">หน่วย <span className="text-destructive">*</span></label>
                    <select 
                      value={strengthUnit} 
                      onChange={e => setStrengthUnit(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium bg-white"
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-[#334155] mb-2 block">วิธีการให้ยา <span className="text-destructive">*</span></label>
                  <select 
                    value={administrationMethod} 
                    onChange={e => setAdministrationMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium bg-white"
                  >
                    <option value="รับประทาน">รับประทาน</option>
                    <option value="ฉีด">ฉีด</option>
                    <option value="ทา">ทา</option>
                    <option value="หยอด">หยอด</option>
                    <option value="สูดดม">สูดดม</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-[#334155] mb-2 block">ผู้สั่งยา</label>
                  <input 
                    value={prescribedBy} 
                    onChange={e => setPrescribedBy(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium" 
                    placeholder="ชื่อผู้สั่งยา (ถ้ามี)" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ขนาดและปริมาณยา</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">ปริมาณต่อครั้ง <span className="text-destructive">*</span></label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={amountPerDose} 
                      onChange={e => setAmountPerDose(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-medium" 
                      placeholder="1.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-3 block">หน่วย <span className="text-destructive">*</span></label>
                    <div className="grid grid-cols-4 gap-2">
                      {['แคปซูล', 'เม็ด', 'หยด', 'mL', 'ซอง', 'หน่วย', 'U/mL', 'แผ่น'].map(unit => (
                        <button
                          key={unit}
                          onClick={() => setDoseUnit(unit)}
                          className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all ${doseUnit === unit ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ความถี่</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-3 block">ความถี่ <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {(['daily', 'specific_days', 'prn', 'every_n_days'] as FrequencyType[]).map(f => (
                        <button 
                          key={f} 
                          onClick={() => { setFrequency(f); if (f === 'prn') setTimings([]); }}
                          className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all ${
                            frequency === f ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          {f === 'daily' ? 'ทุกวัน' : f === 'specific_days' ? 'เฉพาะบางวัน' : f === 'prn' ? 'เมื่อมีอาการ (PRN)' : 'ทุก…วัน'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {frequency === 'specific_days' && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-sm font-bold text-[#334155] mb-3 block">เฉพาะบางวัน</label>
                      <div className="flex justify-between gap-1">
                        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSpecificDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                            className={`h-10 w-10 rounded-full text-xs font-bold transition-all ${
                              specificDays.includes(i) ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {frequency === 'every_n_days' && (
                    <div className="pt-2">
                      <label className="text-sm font-bold text-[#334155] mb-2 block">ทุกกี่วัน</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="1" 
                          value={everyNDays} 
                          onChange={e => setEveryNDays(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">วัน</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">เวลา <span className="text-destructive">*</span></label>
                    <div className="space-y-2 mb-3">
                      {timings.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-white border-2 border-slate-50 rounded-[1.25rem] px-4 py-3 shadow-sm">
                          <span className="font-bold text-slate-700">
                            {t.time && `${t.time} `} 
                            <span className="text-slate-400 font-medium text-sm">
                              ({TIME_OF_DAY_LABELS[t.timeOfDay]}/{FOOD_TIMING_LABELS[t.foodTiming]})
                            </span>
                          </span>
                          <button onClick={() => removeTiming(t.id)} className="text-destructive p-1 hover:bg-rose-50 rounded-full transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowTimingDialog(true);
                        setTimingError('');
                        if (frequency === 'prn') {
                          setTimingTimeOfDay('unspecified');
                        } else {
                          setTimingTimeOfDay('morning');
                          setTimingTime(TIME_OF_DAY_DEFAULTS.morning[timingFoodTiming] || '08:00');
                        }
                      }}
                      className="w-full py-4 bg-[#f3f0ff] border-2 border-dashed border-[#d8b4fe] rounded-[1.5rem] text-[#a855f7] font-bold flex items-center justify-center gap-2 hover:bg-[#ede9fe] transition-colors"
                    >
                      <Plus className="h-5 w-5" /> เพิ่มเวลา
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">คำอธิบายหรือคำแนะนำ</h4>
                <Textarea
                  placeholder="ระบุรายละเอียด"
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 focus:ring-0 focus:border-slate-300 min-h-[120px] text-sm font-medium p-4"
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ระยะเวลาให้ยา</h4>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">สถานะการให้ยา:</label>
                    <div className="relative">
                      <select 
                        value={status} 
                        onChange={e => setStatus(e.target.value as MedicationStatus)}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none font-bold text-[14px] text-[#009292] bg-white appearance-none pr-10"
                      >
                        <option value="active">● ให้ยาปกติ</option>
                        <option value="stopped">● หยุดยา</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">ผู้สั่งยา</label>
                    <input 
                      value={prescribedBy} 
                      onChange={e => setPrescribedBy(e.target.value)}
                      placeholder="หมอวิชัย"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium placeholder:text-slate-300" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">วันที่เริ่มให้ยา <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12" 
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
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12" 
                      />
                      <div className="absolute right-0 top-0 h-full w-12 bg-[#1a8e89] rounded-r-2xl flex items-center justify-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#6366f1] font-bold text-sm mb-4 border-b border-[#e2e8f0] pb-2 uppercase tracking-wide italic">ข้อมูลจำนวนยา</h4>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">จำนวนยาปัจจุบัน</label>
                    <div className="flex gap-0 border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-teal-100 transition-colors">
                      <input 
                        type="number" 
                        value={currentAmount} 
                        onChange={e => setCurrentAmount(e.target.value)}
                        className="flex-1 px-4 py-4 focus:outline-none font-bold text-2xl text-slate-700 bg-transparent" 
                      />
                      <div className="flex flex-col border-l-2 border-slate-100 w-14">
                        <button onClick={() => setCurrentAmount(prev => (Number(prev) + 1).toString())} className="flex-1 bg-[#1a8e89] text-white flex items-center justify-center hover:bg-[#167d79] transition-colors">
                          <Plus className="h-5 w-5" />
                        </button>
                        <button onClick={() => setCurrentAmount(prev => Math.max(0, Number(prev) - 1).toString())} className="flex-1 bg-[#1a8e89] text-white border-t border-white/20 flex items-center justify-center hover:bg-[#167d79] transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-slate-400 font-bold">หน่วย : {doseUnit}</p>
                      <p className="text-xs text-slate-300 font-medium italic text-right">ให้ยาได้ถึง : 0 วัน</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">แจ้งเตือนเมื่อเหลือพอใช้ (วัน)</label>
                    <div className="relative">
                      <select 
                        value={alertDays} 
                        onChange={e => setAlertDays(Number(e.target.value))}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm bg-white appearance-none pr-10"
                      >
                        {ALERT_DAY_OPTIONS.map(d => (
                          <option key={d} value={d}>{d} วัน</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 text-center font-medium leading-relaxed">
                      เมื่อยาคงเหลือพอใช้ได้ตามจำนวนวันที่ตั้งค่า<br />
                      สถานะจะเป็น <span className="text-[#a855f7] font-bold">"ใกล้หมด"</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#334155] mb-2 block">วันหมดอายุ (ถ้ามี)</label>
                    <div className="relative">
                      <input 
                        type="datetime-local" 
                        value={expirationDate} 
                        onChange={e => setExpirationDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:outline-none font-medium text-sm pr-12 placeholder:text-slate-300" 
                        placeholder="ระบุเวลา"
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

        {/* Action Buttons */}
        <div className="flex gap-4 mt-10">
          <Button 
            variant="secondary" 
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} 
            className="flex-1 h-14 rounded-2xl bg-[#eff3f8] border-0 text-slate-400 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" /> ก่อนหน้า
          </Button>
          <Button 
            onClick={() => step < 2 ? setStep(step + 1) : handleSave()} 
            disabled={step === 0 ? !step1Valid : step === 1 ? !step2Valid : !step3Valid}
            className="flex-1 h-14 rounded-2xl bg-[#1a8e89] hover:bg-[#167d79] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-100"
          >
            {step < 2 ? 'ถัดไป' : 'บันทึก'} <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Timing Dialog */}
      {showTimingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowTimingDialog(false)}>
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">เพิ่มเวลาให้ยา</h3>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-500 mb-3 block">เวลาให้ยาสัมพันธ์กับมื้ออาหาร <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['before_meal', 'with_meal', 'after_meal', 'unspecified'] as FoodTiming[]).map(ft => (
                      <button 
                        key={ft} 
                        onClick={() => setTimingFoodTiming(ft)}
                        className={`py-3 rounded-2xl text-[13px] font-bold transition-all ${timingFoodTiming === ft ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        {FOOD_TIMING_LABELS[ft]}
                      </button>
                    ))}
                  </div>
                </div>

                {frequency !== 'prn' && (
                  <>
                    <div>
                      <label className="text-sm font-bold text-slate-500 mb-3 block">เลือกช่วงเวลา <span className="text-destructive">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['morning', 'noon', 'evening', 'bedtime', 'other', 'unspecified'] as TimeOfDay[]).map(tod => (
                          <button 
                            key={tod} 
                            onClick={() => handleTimeOfDayChange(tod)}
                            className={`py-2 rounded-xl text-[11px] font-bold transition-all ${timingTimeOfDay === tod ? 'bg-[#1a8e89] text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            {TIME_OF_DAY_LABELS[tod]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {timingTimeOfDay !== 'unspecified' && (
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">ระบุเวลา <span className="text-destructive">*</span></label>
                        <input 
                          type="time" 
                          value={timingTime} 
                          onChange={e => setTimingTime(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a8e89]/20 font-bold text-lg text-center" 
                        />
                        {TIME_OF_DAY_RANGES[timingTimeOfDay] && timingTimeOfDay !== 'other' && (
                          <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                            เวลา{TIME_OF_DAY_LABELS[timingTimeOfDay]}เลือกได้ตั้งแต่ {TIME_OF_DAY_RANGES[timingTimeOfDay]!.min} - {TIME_OF_DAY_RANGES[timingTimeOfDay]!.max}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {timingError && <p className="text-xs text-destructive font-bold text-center mt-3">{timingError}</p>}

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" onClick={() => setShowTimingDialog(false)}>ยกเลิก</Button>
                <Button className="flex-1 h-14 rounded-2xl bg-[#1a8e89] hover:bg-[#167d79] text-white font-bold shadow-lg shadow-teal-100" onClick={handleAddTiming} disabled={!!timingError}>ตกลง</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMedicationPage;
