import { Check } from "lucide-react";

const STEPS = [
  { key: "Placed", label: "Placed" },
  { key: "Pending", label: "Pending" },
  { key: "Processing", label: "Processing" },
  { key: "Shipped", label: "Shipped" },
  { key: "Delivered", label: "Delivered" },
];


const STATUS_TO_STEP = {
  Placed: 1,  
  Pending: 2,
  Processing: 3,
  Shipped: 4,
  Delivered: 5,
  Cancelled: -1,
  Refunded: -1,
  "Partially Refunded": -1,
  Rejected: -1,
};

const TERMINAL = {
  Cancelled: { label: "Cancelled", tone: "text-neutral-500" },
  Refunded: { label: "Refunded", tone: "text-purple-600" },
  "Partially Refunded": {
    label: "Partially Refunded",
    tone: "text-purple-600",
  },
  Failed: { label: "Failed", tone: "text-red-600" },
  Rejected: { label: "Rejected", tone: "text-red-600" },
};

export default function StatusStepper({ status }) {
  const activeIndex = STATUS_TO_STEP[status] ?? 0;

  // Terminal states — no stepper, just a chip.
  if (activeIndex === -1) {
    const meta = TERMINAL[status] || {
      label: status,
      tone: "text-neutral-500",
    };
    return (
      <div className="flex items-center gap-2 py-3">
        <span className={`w-2 h-2 rounded-full bg-current ${meta.tone}`} />
        <span className={`text-sm font-medium ${meta.tone}`}>
          Order {meta.label.toLowerCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 py-3">
      {STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <div
            key={step.key}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
                  isDone
                    ? "bg-neutral-900 border-neutral-900 text-white"
                    : isActive
                      ? "bg-white border-neutral-900 text-neutral-900"
                      : "bg-white border-neutral-200 text-neutral-300"
                }`}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "text-neutral-900"
                    : isDone
                      ? "text-neutral-600"
                      : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 ${
                  isDone ? "bg-neutral-900" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
