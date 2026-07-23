import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import arch1 from "../Images/arch1.png";
import arch2 from "../Images/arch2.png";
import apiDiagram from "../Images/api.png";

export default function ArchitectureSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll(".arch-card");
    gsap.fromTo(
      elements,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.1,
      }
    );
  }, []);

  return (
    <section id="architecture" className="space-y-10" ref={containerRef}>
      {/* System Architecture */}
      <div className="arch-card bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-semibold text-slate-800 tracking-wide">
            TrustPatch Workflow
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-5 opacity-80"></div>
          <p className="text-sm text-slate-500 mt-5 font-medium uppercase tracking-widest">
            Multi-dimensional evaluation pipeline
          </p>
        </div>

        <div className="space-y-12 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <img
              src={arch1}
              alt="Architecture Phase 1"
              className="w-full max-w-5xl rounded-xl border border-slate-100 shadow-sm object-contain"
              style={{ clipPath: "inset(8px 0 0 0)" }}
            />
          </div>
          <div className="w-full flex justify-center">
            <img
              src={arch2}
              alt="Architecture Phase 2"
              className="w-full max-w-5xl rounded-xl border border-slate-100 shadow-sm object-contain"
            />
          </div>
        </div>
      </div>

      {/* Real-time Integration */}
      <div className="arch-card bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-semibold text-slate-800 tracking-wide">
            Real-Time System Integration
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-5 opacity-80"></div>
          <p className="text-sm text-slate-500 mt-5 font-medium uppercase tracking-widest">
            Universal trust layer API architecture
          </p>
        </div>

        <div className="w-full flex justify-center">
          <img
            src={apiDiagram}
            alt="API Integration Architecture"
            className="w-full max-w-5xl rounded-xl border border-slate-100 shadow-sm object-contain"
          />
        </div>
      </div>
    </section>
  );
}
