import React from 'react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        ขั้นที่ {currentStep + 1} จาก {totalSteps}
      </span>
    </div>
  );
};

export default Stepper;
