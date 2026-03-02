import { useState, useEffect, useRef } from 'react';

function CircularSpinner() {
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-10 h-10 animate-spin" viewBox="0 0 40 40" fill="none" style={{ animationDuration: '1.2s' }}>
        <circle cx="20" cy="20" r="17" stroke="#e5e7eb" strokeWidth="3" fill="none" />
        <circle
          cx="20" cy="20" r="17"
          stroke="#fe6781" strokeWidth="3" fill="none"
          strokeLinecap="round"
          strokeDasharray="26.7 80"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  );
}

export default function FloatingProgressBar({ progress = 0, statusText = '' }) {
  return (
    <div className="bg-white/70 border-t border-[#e5e5e5] backdrop-blur-sm flex flex-col gap-2 px-5 py-3.5 w-full">
      {/* Top row: spinner + progress bar + label */}
      <div className="flex gap-4 items-end w-full">
        <CircularSpinner />
        <div className="flex-1 flex flex-col gap-1 h-9 justify-center">
          <p className="text-body font-body text-surface-muted opacity-70">
            {Math.round(progress)}% complete
          </p>
          <div className="w-full h-1.5 bg-[#e5e7eb] rounded-[15px] overflow-hidden">
            <div
              className="h-full rounded-[15px] transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #FE6781, #E5507A)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5] w-full" />

      {/* Status text */}
      {statusText && (
        <p className="text-body font-body text-surface-muted opacity-70 text-center">
          {statusText}
        </p>
      )}
    </div>
  );
}
