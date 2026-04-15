import { useEffect, useState } from "react";

interface GeneratingOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

const STEPS = [
  { icon: "ri-scan-line", label: "正在解析爆款结构…", duration: 800 },
  { icon: "ri-brain-line", label: "提取情绪 & 视觉模式…", duration: 900 },
  { icon: "ri-quill-pen-line", label: "生成视频脚本 & 标题…", duration: 1000 },
  { icon: "ri-image-line", label: "生成图文方案 & Prompt…", duration: 800 },
  { icon: "ri-magic-line", label: "输出内容资产包…", duration: 600 },
];

export default function GeneratingOverlay({ visible, onComplete }: GeneratingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setProgress(0);
      setDone(false);
      return;
    }

    let stepIndex = 0;
    let totalElapsed = 0;
    const totalDuration = STEPS.reduce((s, step) => s + step.duration, 0);

    const runStep = () => {
      if (stepIndex >= STEPS.length) {
        setProgress(100);
        setDone(true);
        setTimeout(() => onComplete(), 600);
        return;
      }
      setCurrentStep(stepIndex);
      const stepDuration = STEPS[stepIndex].duration;
      const startElapsed = totalElapsed;

      const startTime = performance.now();
      const startPct = Math.round((startElapsed / totalDuration) * 100);
      const endPct = Math.round(((startElapsed + stepDuration) / totalDuration) * 100);

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const frac = Math.min(elapsed / stepDuration, 1);
        const pct = Math.round(startPct + frac * (endPct - startPct));
        setProgress(pct);
        if (frac < 1) {
          requestAnimationFrame(tick);
        } else {
          totalElapsed += stepDuration;
          stepIndex++;
          setTimeout(runStep, 80);
        }
      };
      requestAnimationFrame(tick);
    };

    runStep();
  }, [visible, onComplete]);
  if (!visible) return null;
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
      style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(123,97,255,0.15)", animationDuration: "1.4s" }}
        />
        <div
          className="w-16 h-16 flex items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
        >
          {done ? (
            <i className="ri-check-line text-white text-[26px]" />
          ) : (
            <i className="ri-magic-line text-white text-[24px]" style={{ animation: "spin 1.5s linear infinite" }} />
          )}
        </div>
      </div>

      <p className="text-[16px] font-bold mb-1" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
        {done ? "内容资产生成完毕 ✓" : "AI 正在生成内容…"}
      </p>
      <p className="text-[12px] mb-6" style={{ color: "#888888" }}>
        {done ? "即将展示所有内容输出" : STEPS[currentStep]?.label}
      </p>

      <div className="w-64 mb-4">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#EAEAEA" }}>
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7B61FF, #5B8CFF)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: "#AAAAAA" }}>生成进度</span>
          <span className="text-[10px] font-semibold" style={{ color: "#7B61FF" }}>{progress}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-64">
        {STEPS.map((step, idx) => {
          const state = idx < currentStep ? "done" : idx === currentStep && !done ? "active" : "pending";
          return (
            <div key={idx} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 transition-all duration-300"
                style={{
                  background:
                    state === "done"
                      ? "rgba(16,185,129,0.12)"
                      : state === "active"
                      ? "rgba(123,97,255,0.12)"
                      : "#F7F8FA",
                }}
              >
                {state === "done" ? (
                  <i className="ri-check-line text-[10px]" style={{ color: "#10b981" }} />
                ) : state === "active" ? (
                  <i className={`${step.icon} text-[10px]`} style={{ color: "#7B61FF", animation: "pulse 1s ease-in-out infinite" }} />
                ) : (
                  <i className={`${step.icon} text-[10px]`} style={{ color: "#CCCCCC" }} />
                )}
              </div>
              <span
                className="text-[12px] transition-all duration-200"
                style={{
                  color: state === "done" ? "#10b981" : state === "active" ? "#111111" : "#CCCCCC",
                  fontWeight: state === "active" ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
