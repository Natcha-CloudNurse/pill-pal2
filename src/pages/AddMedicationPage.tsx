import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Stepper from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { Medication, TimingEntry, FrequencyType, TimeOfDay, FoodTiming, TIME_OF_DAY_LABELS, FOOD_TIMING_LABELS, TIME_OF_DAY_RANGES, TIME_OF_DAY_DEFAULTS } from '@/types/medication';
import { generateId } from '@/lib/medicationUtils';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const ALERT_DAY_OPTIONS = [1, 3, 7, 14, 30];

const AddMedicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

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
      id: generateId(),
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
      status: 'active',
      currentAmount: Number(currentAmount),
      alertDays,
    };
    console.log('Saved medication:', med);
    toast.success('บันทึกรายการยาสำเร็จ');
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
    <div className="min-h-screen bg-background w-full mx-auto">
      <PageHeader title="เพิ่มรายการยา" />

      <div className="px-4 py-3">
        <Stepper currentStep={step} totalSteps={3} />
      </div>

      {/* Step navigation */}
      <div className="px-4 flex items-center justify-between mb-4">
        {step > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
          </Button>
        ) : <div />}
        {step < 2 ? (
          <Button
            size="sm"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !step1Valid : !step2Valid}
            className="gap-1"
          >
            ถัดไป <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} disabled={!step3Valid} className="gap-1">
            บันทึก <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-8">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">ข้อมูลยาทั่วไป</h2>
            
            <div>
              <label className="text-sm text-foreground font-medium">ชื่อยา <span className="text-destructive">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ชื่อยา" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground font-medium">ความแรง <span className="text-destructive">*</span></label>
                <input value={strength} onChange={e => setStrength(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ความแรง" />
              </div>
              <div>
                <label className="text-sm text-foreground font-medium">หน่วย <span className="text-destructive">*</span></label>
                <select value={strengthUnit} onChange={e => setStrengthUnit(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="mcg">mcg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">วิธีการให้ยา <span className="text-destructive">*</span></label>
              <select value={administrationMethod} onChange={e => setAdministrationMethod(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="รับประทาน">รับประทาน</option>
                <option value="ฉีด">ฉีด</option>
                <option value="ทา">ทา</option>
                <option value="หยอด">หยอด</option>
                <option value="สูดดม">สูดดม</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">ผู้สั่งยา</label>
              <input value={prescribedBy} onChange={e => setPrescribedBy(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ผู้สั่งยา (ถ้ามี)" />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">ข้อมูลการให้ยา</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground font-medium">ปริมาณต่อครั้ง <span className="text-destructive">*</span></label>
                <input type="number" min="0" step="0.5" value={amountPerDose} onChange={e => setAmountPerDose(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm text-foreground font-medium">หน่วย <span className="text-destructive">*</span></label>
                <select value={doseUnit} onChange={e => setDoseUnit(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="เม็ด">เม็ด</option>
                  <option value="แคปซูล">แคปซูล</option>
                  <option value="ซีซี">ซีซี</option>
                  <option value="ยูนิต">ยูนิต</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground font-medium">ความถี่ <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['daily', 'specific_days', 'prn', 'every_n_days'] as FrequencyType[]).map(f => (
                  <button key={f} onClick={() => { setFrequency(f); if (f === 'prn') setTimings([]); }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      frequency === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                    }`}>
                    {f === 'daily' ? 'ทุกวัน' : f === 'specific_days' ? 'เฉพาะบางวัน' : f === 'prn' ? 'เมื่อมีอาการ (PRN)' : 'ทุก…วัน'}
                  </button>
                ))}
              </div>
            </div>

            {frequency === 'specific_days' && (
              <div className="flex gap-2">
                {dayNames.map((d, i) => (
                  <button key={i} onClick={() => setSpecificDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                      specificDays.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            )}

            {frequency === 'every_n_days' && (
              <div>
                <label className="text-sm text-foreground font-medium">ทุกกี่วัน</label>
                <input type="number" min="1" value={everyNDays} onChange={e => setEveryNDays(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}

            {/* Timing section */}
            <div>
              <label className="text-sm text-foreground font-medium">เวลา <span className="text-destructive">*</span></label>
              {frequency === 'prn' && (
                <p className="text-xs text-muted-foreground mt-1">
                  กรณีไม่ระบุช่วงเวลา ไม่จำเป็นต้องระบุเวลาให้ยา เช่น ยา PRN (เมื่อมีอาการ)
                </p>
              )}
              
              {/* Existing timings */}
              <div className="flex flex-wrap gap-2 mt-2">
                {timings.map(t => (
                  <span key={t.id} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${chipColorMap[t.timeOfDay]}`}>
                    {t.time && `${t.time} `}
                    ({TIME_OF_DAY_LABELS[t.timeOfDay]}, {FOOD_TIMING_LABELS[t.foodTiming]})
                    <button onClick={() => removeTiming(t.id)} className="ml-1"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>

              <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => {
                setShowTimingDialog(true);
                setTimingError('');
                if (frequency === 'prn') {
                  setTimingTimeOfDay('unspecified');
                } else {
                  setTimingTimeOfDay('morning');
                  setTimingTime(TIME_OF_DAY_DEFAULTS.morning[timingFoodTiming] || '08:00');
                }
              }}>
                <Plus className="h-4 w-4" /> เพิ่มเวลา
              </Button>
            </div>

            {/* Timing Dialog */}
            {showTimingDialog && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={() => setShowTimingDialog(false)}>
                <div className="w-full max-w-md bg-card rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                  <h3 className="font-semibold text-foreground">เพิ่มเวลาให้ยา</h3>

                  <div>
                    <label className="text-sm font-medium text-foreground">เวลาให้ยาสัมพันธ์กับมื้ออาหาร <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(['before_meal', 'with_meal', 'after_meal', 'unspecified'] as FoodTiming[]).map(ft => (
                        <button key={ft} onClick={() => setTimingFoodTiming(ft)}
                          className={`px-3 py-1 rounded-full text-sm ${timingFoodTiming === ft ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                          {FOOD_TIMING_LABELS[ft]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {frequency !== 'prn' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground">เลือกช่วงเวลา <span className="text-destructive">*</span></label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(['morning', 'noon', 'evening', 'bedtime', 'other', 'unspecified'] as TimeOfDay[]).map(tod => (
                            <button key={tod} onClick={() => handleTimeOfDayChange(tod)}
                              className={`px-3 py-1 rounded-full text-sm ${timingTimeOfDay === tod ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                              {TIME_OF_DAY_LABELS[tod]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {timingTimeOfDay !== 'unspecified' && (
                        <div>
                          <label className="text-sm font-medium text-foreground">ระบุเวลา <span className="text-destructive">*</span></label>
                          {TIME_OF_DAY_RANGES[timingTimeOfDay] && timingTimeOfDay !== 'other' && (
                            <p className="text-xs text-muted-foreground">
                              เวลา{TIME_OF_DAY_LABELS[timingTimeOfDay]}เลือกได้ตั้งแต่ {TIME_OF_DAY_RANGES[timingTimeOfDay]!.min} - {TIME_OF_DAY_RANGES[timingTimeOfDay]!.max}
                            </p>
                          )}
                          <input type="time" value={timingTime} onChange={e => setTimingTime(e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                      )}
                    </>
                  )}

                  {timingError && <p className="text-sm text-destructive">{timingError}</p>}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowTimingDialog(false)}>ยกเลิก</Button>
                    <Button className="flex-1" onClick={handleAddTiming} disabled={!!timingError}>เพิ่ม</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">ข้อมูลจำนวนและวันให้ยา</h2>

            <div>
              <label className="text-sm text-foreground font-medium">วันที่เริ่มให้ยา <span className="text-destructive">*</span></label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">วันที่สิ้นสุดให้ยา (ถ้ามี)</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">จำนวนยาปัจจุบัน <span className="text-destructive">*</span></label>
              <input type="number" min="0" value={currentAmount} onChange={e => {
                const v = e.target.value;
                if (Number(v) < 0) return;
                setCurrentAmount(v);
              }}
                className={`mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                  currentAmount !== '' && isNaN(Number(currentAmount)) ? 'border-destructive' : 'border-input'
                }`} />
              {currentAmount !== '' && isNaN(Number(currentAmount)) && (
                <p className="text-xs text-destructive mt-1">กรุณากรอกตัวเลขเท่านั้น</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">หน่วย: {doseUnit}</p>
            </div>
            <div>
              <label className="text-sm text-foreground font-medium">แจ้งเตือนเมื่อเหลือพอใช้ <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALERT_DAY_OPTIONS.map(d => (
                  <button key={d} onClick={() => setAlertDays(d)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      alertDays === d ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                    }`}>
                    {d} วัน
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">เมื่อยาคงเหลือพอใช้ได้ตามจำนวนวันที่ตั้งค่า สถานะจะเป็น "ใกล้หมด"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMedicationPage;
