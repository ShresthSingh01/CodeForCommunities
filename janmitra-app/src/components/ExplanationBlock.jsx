import React from 'react';

export default function ExplanationBlock({ text, loading, isMock }) {
  return (
    <div className="bg-synergy-violet/5 border-l-[3px] border-synergy-violet p-4 rounded-r-lg shadow-sm relative">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[9px] uppercase tracking-[1.5px] text-synergy-violet font-bold">
          AI EXPLANATION — GENERATED FROM COMPUTED FACTS
        </div>
        {isMock && (
          <span className="font-mono text-[9px] text-neutral-gray bg-slate-100 px-1.5 py-0.5 rounded">
            // MOCK (No API Key)
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="py-2 flex items-center space-x-2 text-neutral-gray font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-synergy-violet animate-ping" />
          <span>Generating grounded reasoning via Gemini AI...</span>
        </div>
      ) : (
        <div className="font-body text-[12px] leading-relaxed text-slate-800 space-y-2">
          {Array.isArray(text) ? (
            <ul className="space-y-1">
              {text.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-synergy-violet mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text}</p>
          )}
        </div>
      )}
    </div>
  );
}
