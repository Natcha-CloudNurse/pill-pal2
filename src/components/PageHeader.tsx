import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, rightContent }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="sticky top-0 z-10 bg-secondary px-4 py-3 flex items-center gap-3">
      <button onClick={handleBack} className="text-primary">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="text-lg font-bold text-foreground flex-1">{title}</h1>
      {rightContent}
    </div>
  );
};

export default PageHeader;
