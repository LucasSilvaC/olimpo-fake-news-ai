"use client";

import { ArrowLeft, ArrowRight, Check, ChevronRight, Maximize2, Monitor, UserRound, Workflow, ScanText, BrainCircuit, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { documentationIcons } from "@/entities/documentation/model/icon-map";
import type { DocumentationJourney } from "@/entities/documentation/model/types";
import { cn } from "@/lib/utils";

export function JourneyFlow({ journey }: { journey: DocumentationJourney }): React.ReactElement {
  const [current, setCurrent] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = journey.stages[current]!;
  const labels = journey.labels;
  const StageIcon = documentationIcons[stage.icon];
  const last = journey.stages.length - 1;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (presenting && !element.open) element.showModal();
    else if (!presenting && element.open) element.close();
    if (presenting) {
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = overflow; };
    }
  }, [presenting]);

  function onKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") { event.preventDefault(); setCurrent((value) => Math.min(last, value + 1)); }
    if (event.key === "ArrowLeft") { event.preventDefault(); setCurrent((value) => Math.max(0, value - 1)); }
  }

  function content(expanded: boolean): React.ReactElement {
    const lanes = [
      { label: labels.user, text: stage.user, icon: UserRound, classes: "border-blue-200 bg-blue-50 text-blue-950", active: undefined },
      { label: labels.system, text: stage.system, icon: Workflow, classes: "border-amber-200 bg-amber-50 text-amber-950", active: undefined },
      { label: labels.fp, text: stage.fp, icon: ScanText, classes: "border-teal-200 bg-teal-50 text-teal-950", active: stage.fpActive },
      { label: labels.svm, text: stage.svm, icon: BrainCircuit, classes: "border-violet-200 bg-violet-50 text-violet-950", active: stage.svmActive },
    ];
    return (
      <div className={cn("journey-surface rounded-3xl bg-white text-slate-900", expanded ? "mx-auto min-h-full max-w-[1600px] p-4 sm:p-6" : "border border-slate-200 p-4 sm:p-6")} onKeyDown={onKeyDown}>
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-blue-700 uppercase">Olimpo · {labels.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{labels.subtitle}</p>
          </div>
          <button type="button" onClick={() => setPresenting(!expanded)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            {expanded ? <X className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{expanded ? labels.close : labels.present}</span>
            <span className="sr-only sm:hidden">{expanded ? labels.close : labels.present}</span>
          </button>
        </header>

        <nav aria-label={labels.navigation} className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", expanded ? "my-4 lg:grid-cols-8" : "my-5")}>
          {journey.stages.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={index === current} onClick={() => setCurrent(index)} className={cn("flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600", index === current ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50")}>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[10px]", index === current ? "bg-white/20" : "bg-white text-blue-700")}>{String(index + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </nav>

        <div className={cn("flex items-center gap-3", expanded ? "mb-4" : "mb-5")} role="status" aria-live="polite" aria-atomic="true">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><StageIcon className="size-6" aria-hidden="true" /></span>
          <div>
            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{labels.step} {current + 1} {labels.of} {journey.stages.length}</p>
            <h3 className="text-lg font-black tracking-tight sm:text-2xl">{stage.subtitle}</h3>
          </div>
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <section aria-label={labels.screen} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true"><i className="size-2 rounded-full bg-rose-300" /><i className="size-2 rounded-full bg-amber-300" /><i className="size-2 rounded-full bg-emerald-300" /></span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><Monitor className="size-3" aria-hidden="true" />{labels.screen}</span>
            </div>
            <div className="p-5 sm:p-6">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-[10px] font-extrabold text-blue-800">{stage.screen.badge}</span>
              <p className="mt-4 text-lg leading-snug font-black">{stage.screen.title}</p>
              <ul className="mt-5 space-y-3">
                {stage.screen.lines.map((line) => <li key={line} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 font-semibold text-slate-700"><Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />{line}</li>)}
              </ul>
              {stage.screen.choices && <ul className="mt-4 grid grid-cols-3 gap-1.5">{stage.screen.choices.map((choice) => <li key={choice} className="rounded-lg border border-blue-200 bg-blue-50 px-1 py-2 text-center text-[10px] font-bold text-blue-800">{choice}</li>)}</ul>}
              <p className="mt-4 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">{stage.screen.note}</p>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {lanes.map((lane) => <section key={lane.label} aria-label={lane.label} className={cn("min-w-0 rounded-2xl border p-4", !expanded && "sm:p-5", lane.classes)}>
              <div className="flex flex-wrap items-center gap-2">
                <lane.icon className="size-4 shrink-0" aria-hidden="true" />
                <h4 className="text-xs font-extrabold">{lane.label}</h4>
              </div>
              {lane.active !== undefined && <span className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-extrabold", lane.active ? "bg-white" : "bg-white/60 text-slate-500")}><span className={cn("size-1.5 rounded-full", lane.active ? "bg-emerald-600" : "bg-slate-400")} aria-hidden="true" />{lane.active ? labels.active : labels.inactive}</span>}
              <p className="mt-3 text-sm leading-6">{lane.text}</p>
            </section>)}
          </div>
        </div>

        <aside className="mt-4 flex gap-3 rounded-2xl bg-slate-900 p-4 text-white">
          <ChevronRight className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div><p className="text-[9px] font-bold tracking-wider text-amber-300 uppercase">{labels.takeaway}</p><p className="mt-1 text-sm leading-6 font-semibold">{stage.takeaway}</p></div>
        </aside>
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] text-slate-500">{labels.keyboard}</p>
          <div className="flex gap-2">
            <button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-35"><ArrowLeft className="size-3.5" aria-hidden="true" />{labels.previous}</button>
            <button type="button" disabled={current === last} onClick={() => setCurrent(current + 1)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-35">{labels.next}<ArrowRight className="size-3.5" aria-hidden="true" /></button>
          </div>
        </footer>
      </div>
    );
  }

  return <div data-journey="platform">
    {content(false)}
    <dialog ref={dialog} aria-label={labels.title} onClose={() => setPresenting(false)} className="fixed inset-0 m-auto h-[100dvh] max-h-none w-screen max-w-none overflow-y-auto bg-white p-0 text-slate-900 backdrop:bg-slate-950/75">
      {presenting && content(true)}
    </dialog>
  </div>;
}
