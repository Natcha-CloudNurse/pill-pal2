import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicationCard from '@/components/MedicationCard';
import BottomSheet from '@/components/BottomSheet';
import { mockMedications } from '@/data/mockMedications';
import { Medication } from '@/types/medication';
import {
  Search, LayoutGrid, Plus, Pill, FileText,
  ChevronLeft, MoreVertical, Activity, Accessibility,
  MessageCircle, Link2, FileCheck, Droplets, Utensils,
  Trash2, Home, Users, Box, Calendar, RefreshCw,
  Settings, LogOut, Cloud
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';


const MedicationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [medications] = useState<Medication[]>(mockMedications);
  const [activeTab, setActiveTab] = useState<'current' | 'stopped'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [manageSheetOpen, setManageSheetOpen] = useState(false);
  const [cardMenuSheetOpen, setCardMenuSheetOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  const currentMeds = medications.filter(m => m.status === 'active');
  const stoppedMeds = medications.filter(m => m.status === 'stopped');
  const displayMeds = activeTab === 'current' ? currentMeds : stoppedMeds;

  const filteredMeds = displayMeds.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="w-full flex-1 mx-auto flex flex-col">
        {/* Patient Header Section */}
        <div className="bg-[#E0F7FA] rounded-b-[2.5rem] px-4 md:px-8 pt-6 md:pt-8 pb-8">
          <div className="flex items-center gap-6 mb-8">
            <button className="p-2 -ml-2 text-slate-700 hover:text-slate-900 transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-200 overflow-hidden border-4 md:border-[6px] border-rose-200 md:border-rose-200/60 shadow-sm">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=grandma" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <span className="absolute top-0 right-0 h-4 w-4 md:h-5 md:w-5 rounded-full bg-med-success border-2 md:border-[3px] border-white shadow-sm"></span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                  อาม่ามะลิ 👵
                </h1>
                <p className="text-sm text-slate-500 mt-1">อายุ 75 ปี, ห้องกุหลาบ, เตียง A</p>
              </div>
            </div>
            <div className="ml-auto">
              <button className="p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors">
                <MoreVertical className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Quick action icons (Scrollable on mobile) */}
          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 scrollbar-hide justify-between md:justify-start">
            {[
              { icon: <Activity className="h-6 w-6" />, label: 'สัญญาณชีพ', bg: 'bg-white', color: 'text-blue-500', border: 'border-2 border-blue-100' },
              { icon: <Accessibility className="h-6 w-6" />, label: 'พลิกตัว', bg: 'bg-white', color: 'text-blue-500', border: 'border-2 border-blue-100' },
              { icon: <Pill className="h-6 w-6" />, label: 'บันทึกยา', bg: 'bg-white', color: 'text-blue-500', border: 'border-2 border-blue-100' },
              { icon: <MessageCircle className="h-6 w-6" />, label: 'ส่งรายงานให้ญาติ', bg: 'bg-white', color: 'text-blue-500', border: 'border-2 border-blue-100' },
              { icon: <Link2 className="h-6 w-6" />, label: 'แผลกดทับ', bg: 'bg-amber-600', color: 'text-white', border: 'border-none' },
              { icon: <FileCheck className="h-6 w-6" />, label: 'Response', bg: 'bg-teal-600', color: 'text-white', border: 'border-none' },
              { icon: <Droplets className="h-6 w-6" />, label: 'สุขอนามัย', bg: 'bg-indigo-400', color: 'text-white', border: 'border-none' },
              { icon: <Utensils className="h-6 w-6" />, label: 'ทาน/ฟีด อาหาร', bg: 'bg-orange-500', color: 'text-white', border: 'border-none' },
              { icon: <Trash2 className="h-6 w-6" />, label: 'ขับถ่าย', bg: 'bg-yellow-400', color: 'text-white', border: 'border-none' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] md:min-w-[80px]">
                <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full ${item.bg} ${item.color} ${item.border} flex items-center justify-center shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight whitespace-pre-wrap max-w-[72px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub tabs */}
        <div className="bg-white px-4 md:px-8 py-4 border-b border-border/50">
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {['ภาพรวม', 'บันทึกการดูแล', 'เอกสาร', 'รายการยา'].map(tab => (
              <button
                key={tab}
                className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-colors flex items-center ${tab === 'รายการยา'
                  ? 'bg-teal-600 text-white font-medium'
                  : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {tab === 'ภาพรวม' && <Activity className="w-4 h-4 mr-2 opacity-70" />}
                {tab === 'บันทึกการดูแล' && <FileText className="w-4 h-4 mr-2 opacity-70" />}
                {tab === 'เอกสาร' && <FileText className="w-4 h-4 mr-2 opacity-70" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body Area */}
        <div className="flex-1 w-full mx-auto px-4 md:px-8 py-6">
          {/* Search + Manage Desktop */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button onClick={() => setManageSheetOpen(true)} className="w-full md:w-auto h-11 bg-teal-500 hover:bg-teal-600 text-white gap-2 px-6 rounded-xl">
              จัดการ <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Current / Stopped tabs (Pill style matching reference) */}
          <div className="flex items-center gap-3 mb-6 relative z-0">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${activeTab === 'current'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
            >
              ยาปัจจุบัน ({currentMeds.length})
            </button>
            <button
              onClick={() => setActiveTab('stopped')}
              className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${activeTab === 'stopped'
                ? 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
            >
              ยาที่หยุดให้ ({stoppedMeds.length})
            </button>
          </div>

          {/* Medication Cards container */}
          <div className="space-y-4 pb-24 md:pb-8">
            {filteredMeds.map(med => (
              <MedicationCard
                key={med.id}
                medication={med}
                onClick={() => navigate(`/medication/${med.id}`)}
                onMenuClick={() => {
                  setSelectedMed(med);
                  setCardMenuSheetOpen(true);
                }}
              />
            ))}
            {filteredMeds.length === 0 && (
              <p className="text-center text-slate-500 py-12">ไม่พบรายการยา</p>
            )}
          </div>
        </div>
      </div>

      {/* Sheets remain essentially the same */}
      <BottomSheet open={manageSheetOpen} onOpenChange={setManageSheetOpen} title="จัดการยา">
        <div className="space-y-1">
          <button
            onClick={() => { setManageSheetOpen(false); navigate('/medication/receipt/create'); }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
          >
            <Pill className="h-5 w-5 text-teal-600" />
            <span className="text-slate-700">สร้างใบรับยา</span>
          </button>
          <button
            onClick={() => { setManageSheetOpen(false); navigate('/medication/add'); }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
          >
            <Plus className="h-5 w-5 text-teal-600" />
            <span className="text-slate-700">เพิ่มรายการยา</span>
          </button>
          <button
            onClick={() => { setManageSheetOpen(false); navigate('/medication/receipt'); }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
          >
            <FileText className="h-5 w-5 text-teal-600" />
            <span className="text-slate-700">เอกสารใบรับยา</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={cardMenuSheetOpen} onOpenChange={setCardMenuSheetOpen} title="จัดการ">
        {selectedMed && (
          <div className="space-y-1">
            <button
              onClick={() => { setCardMenuSheetOpen(false); navigate(`/medication/${selectedMed.id}`); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
            >
              <span className="text-slate-700">ดูรายละเอียด</span>
            </button>
            <button
              onClick={() => { setCardMenuSheetOpen(false); navigate(`/medication/${selectedMed.id}/edit`); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
            >
              <span className="text-slate-700">แก้ไขรายการยา</span>
            </button>
            <button
              onClick={() => { setCardMenuSheetOpen(false); navigate(`/medication/${selectedMed.id}/history`); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-slate-100 text-left"
            >
              <span className="text-slate-700">ประวัติรายการยา</span>
            </button>
          </div>
        )}
      </BottomSheet>
    </MainLayout>
  );
};

export default MedicationListPage;
