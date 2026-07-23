/**
 * components/AboutSection.tsx
 * ----------------------------
 * About TrustPatch, Author, and Advisor.
 */

import React from "react";
const Linkedin = (props: any) => null;
const Mail = (props: any) => null;

import authorImg from "../Images/author.png";
import advisorImg from "../Images/advisor.jpg";
import tpLogo from "../Images/TP1.png";

export default function AboutSection() {
  return (
    <section id="about" className="space-y-6 pt-4 animate-fade-in">
      <div className="flex items-center gap-3 pb-1 border-b border-slate-200">
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">About TrustPatch</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="max-w-full space-y-4 text-slate-600 text-sm leading-relaxed mb-10 text-justify relative">
          <img
            src={tpLogo}
            alt="TrustPatch Logo"
            className="float-right w-28 sm:w-40 md:w-48 ml-6 mb-4 object-contain"
          />

          <p>
            <strong className="text-blue-700">TrustPatch</strong> is a
            Trust-Aware and Explainable Self-Healing Framework developed to
            enhance reliability, transparency, and sustainability in AI-assisted
            software development. With the increasing adoption of AI coding
            assistants and automated program repair systems, developers often
            receive multiple candidate solutions for the same problem. Although
            these systems significantly accelerate software development,
            selecting the most reliable repair remains a major challenge.
            Frequently, developers must repeatedly modify prompts and regenerate
            outputs to obtain a satisfactory solution, leading to increased
            computational overhead, resource consumption, and reduced confidence
            in AI-generated software fixes. TrustPatch addresses this challenge
            by{" "}
            <strong className="text-blue-700">
              Introducing an Intelligent Trust Layer
            </strong>{" "}
            that evaluates and ranks generated patches before they reach the
            developer, ensuring that repair suggestions are not only
            functionally correct but also trustworthy and explainable.
          </p>
          <p>
            TrustPatch evaluates candidate patches through a comprehensive
            multi-factor trust computation framework that incorporates ten
            important dimensions:
            <strong className="text-blue-700">
              {" "}
              Test Pass Rate, Semantic Similarity, Code Complexity, Historical
              Success, Static Analysis Safety, Behavioral Consistency,
              Regression Risk, Contextual Importance, Model Confidence, and
              Multi-Patch Agreement
            </strong>
            . By combining these parameters using weighted trust computation,
            the framework generates a trust score and provides explainable
            recommendations for selecting the most suitable repair. Beyond
            improving patch quality and reducing repetitive interactions with AI
            systems, TrustPatch aims to support sustainable software engineering
            by minimizing unnecessary computation and encouraging better
            first-time solution acceptance. Designed with extensibility in mind,
            TrustPatch can evolve into a universal trust layer capable of
            integrating with coding assistants, enterprise software ecosystems,
            autonomous agents, and future AI-driven development platforms.
          </p>

          <div className="mt-8 border border-blue-400 p-4 md:p-5 bg-blue-50/30 rounded-lg">
            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
              "Trust is not an add-on to AI-driven software engineering , It is the foundation. TrustPatch aims to make that foundation universal.
             </p>  
            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
              Our vision is to make TrustPatch the universal trust layer for AI-driven software engineering, enabling reliable, explainable, and intelligent self-healing systems."
            </p>
            <div className="text-right mt-3">
              <p className="text-sm font-bold text-blue-800"> - Sanjay Jayakumar</p>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mt-0.5 mr-0.5"></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Author */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-5 bg-slate-50 border border-slate-200 p-5 rounded-xl">
            <img
              src={authorImg}
              alt="Author"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/150?text=Author";
              }}
            />
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                Research Developer
              </p>
              <h3 className="text-lg font-black text-slate-900">
                Sanjay Jayakumar
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Department of Computer Science and Engineering
              </p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                PSG College of Technology , Coimbatore
              </p>
              <div className="flex justify-center md:justify-start gap-2 mt-4">
                <a
                  href="https://www.linkedin.com/in/sanjayj06/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
                <a
                  href="mailto:sanjayjayakumar91@gmail.com"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ea4335] hover:bg-[#d33626] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              </div>
            </div>
          </div>

          {/* Advisor */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-5 bg-slate-50 border border-slate-200 p-5 rounded-xl">
            <img
              src={advisorImg}
              alt="Advisor"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/150?text=Advisor";
              }}
            />
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                Supervisor
              </p>
              <h3 className="text-lg font-black text-slate-900">
                Dr G R Karpagam
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Professor & Head - Computer Science and Engineering
              </p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Director - PSG AI Consortium
              </p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                PSG College of Technology , Coimbatore
              </p>
              <div className="flex justify-center md:justify-start gap-2 mt-4">
                <a
                  href="https://www.linkedin.com/in/g-r-karpagam-68ab8353/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
                <a
                  href="mailto:grk.cse@psgtech.ac.in"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ea4335] hover:bg-[#d33626] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
