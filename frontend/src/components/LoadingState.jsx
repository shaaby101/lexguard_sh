import { useState, useEffect } from "react";

const STEPS = [
  { label: "Extracting clauses...", delay: 0 },
  { label: "Analyzing risks from your perspective...", delay: 3000 },
  { label: "Drafting negotiation strategy...", delay: 6000 },
];

function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => {
        setActiveStep(i);
        console.log(`[LoadingState] Step ${i + 1}: ${step.label}`);
      }, step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6">
        <div className="inline-block w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <p
              key={i}
              className={`font-mono text-sm transition-all duration-500 ${
                i <= activeStep ? "text-white opacity-100" : "text-slate-600 opacity-0"
              }`}
            >
              {i < activeStep ? "✓" : i === activeStep ? "→" : " "} {step.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
