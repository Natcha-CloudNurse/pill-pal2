import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onOpenChange, title, children }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          {title && <SheetTitle className="text-lg font-bold text-foreground">{title}</SheetTitle>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default BottomSheet;
