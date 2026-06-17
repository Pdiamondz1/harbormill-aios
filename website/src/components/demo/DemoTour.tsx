import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoFrame } from "@/components/demo/DemoFrame";
import { OverviewStep } from "@/components/demo/steps/OverviewStep";
import { BriefingStep } from "@/components/demo/steps/BriefingStep";
import { AriaStep } from "@/components/demo/steps/AriaStep";

type StepKey = "overview" | "briefing" | "aria";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "briefing", label: "Weekly briefing" },
  { key: "aria", label: "Ask Aria" },
];

/** Click-through, backend-free tour of the AIOS deck. */
export function DemoTour() {
  const [step, setStep] = useState<StepKey>("overview");

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <Tabs value={step} onValueChange={(v) => setStep(v as StepKey)}>
          <TabsList>
            {STEPS.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DemoFrame active={step}>
        {step === "overview" && <OverviewStep />}
        {step === "briefing" && <BriefingStep />}
        {step === "aria" && <AriaStep />}
      </DemoFrame>
    </div>
  );
}
