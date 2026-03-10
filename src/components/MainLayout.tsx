import React from 'react';
import { Home, Users, Box, Calendar, RefreshCw, FileText, Settings, LogOut, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-cyan-100 text-cyan-800' : 'text-slate-600 hover:bg-slate-100'
    }`}>
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </button>
);

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-50 border-r border-slate-200 shrink-0 h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-6 flex items-center gap-2 text-cyan-900 font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
          <Cloud className="h-6 w-6 text-cyan-600" />
          CloudNurse
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={Home} label="แดชบอร์ด" />
          <SidebarItem icon={Users} label="ผู้สูงอายุ" active onClick={() => navigate('/')} />
          <SidebarItem icon={Box} label="คลังสต๊อค" />
          <SidebarItem icon={Calendar} label="ปฏิทินของฉัน" />
          <SidebarItem icon={RefreshCw} label="ตารางเวร" />
          <SidebarItem icon={FileText} label="เอกสาร สบส" />
          <SidebarItem icon={Settings} label="ตั้งค่า" />
        </nav>
        <div className="p-4 mt-auto">
          <SidebarItem icon={LogOut} label="ออกจากระบบ" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col min-h-screen max-w-full overflow-x-hidden bg-slate-50">
        <div className="w-full h-full flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
