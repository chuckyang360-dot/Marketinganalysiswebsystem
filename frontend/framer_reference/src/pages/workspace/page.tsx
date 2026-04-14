import { useState } from "react";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import WorkspaceInputArea from "./components/WorkspaceInputArea";
import WorkspaceExamples from "./components/WorkspaceExamples";
import WorkspaceMockResult from "./components/WorkspaceMockResult";
import WorkspaceRecentAnalysis from "./components/WorkspaceRecentAnalysis";

export default function WorkspacePage() {
  const [activeHistoryId, setActiveHistoryId] = useState("h1");
  const [inputValue, setInputValue] = useState("");

  const handleNew = () => { setActiveHistoryId(""); setInputValue(""); };
  const handleSelectHistory = (id: string) => setActiveHistoryId(id);
  const handleAnalyze = (text: string) => setInputValue(text);
  const handleExampleSelect = (title: string) => {
    setInputValue(title);
    const main = document.getElementById("workspace-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA", fontFamily: "'Inter', sans-serif" }}>
      <WorkspaceSidebar activeId={activeHistoryId} onSelect={handleSelectHistory} onNew={handleNew} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <WorkspaceTopBar />
        <div id="workspace-main" className="flex-1 overflow-y-auto" style={{ background: "#F7F8FA" }}>
          <div className="relative z-10">
            <WorkspaceInputArea onAnalyze={handleAnalyze} inputValue={inputValue} />
            <WorkspaceExamples onSelect={handleExampleSelect} />
            <WorkspaceMockResult />
            <WorkspaceRecentAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceTopBar() {
  return (
    <header className="flex items-center justify-between px-5 py-3 shrink-0"
      style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
            <i className="ri-global-line text-white text-[11px]" />
          </div>
          <span className="font-bold text-[13px]" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>增长操作台</span>
        </div>
        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[12px]" style={{ color: "#888888" }}>工作台</span>
          <i className="ri-arrow-right-s-line text-[12px]" style={{ color: "#CCCCCC" }} />
          <span className="text-[12px] font-medium" style={{ color: "#444444" }}>新建分析</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Usage bar */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <span key={i} className="w-1 h-3 rounded-full" style={{ background: i <= 6 ? "#7B61FF" : "#EAEAEA" }} />
            ))}
          </div>
          <span className="text-[11px]" style={{ color: "#888888" }}>8/10 次</span>
        </div>
        {/* Upgrade */}
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
          style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", color: "#7B61FF" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.08)"; }}>
          <i className="ri-vip-crown-line text-[11px]" />升级 Pro
        </button>
        {/* Notification */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-150"
          style={{ color: "#888888", border: "1px solid #EAEAEA", background: "#ffffff" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
          <i className="ri-notification-3-line text-[13px]" />
        </button>
      </div>
    </header>
  );
}
