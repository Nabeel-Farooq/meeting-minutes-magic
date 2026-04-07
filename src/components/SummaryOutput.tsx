import { useState } from "react";
import { Check, ClipboardCopy, CircleDot, CalendarCheck, Lightbulb } from "lucide-react";
import type { MeetingSummary } from "@/pages/Index";

interface Props {
  summary: MeetingSummary;
}

const SummaryOutput = ({ summary }: Props) => {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = [
      "## Summary",
      summary.summary,
      "",
      "## Action Items",
      ...summary.actionItems.map(
        (a) => `- ${a.task} → ${a.assignee} (${a.deadline})`
      ),
      "",
      "## Key Decisions",
      ...summary.keyDecisions.map((d) => `- ${d}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      {/* Copy button */}
      <div className="flex justify-end">
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy all"}
        </button>
      </div>

      {/* Summary */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-accent">
          <Lightbulb className="h-4 w-4" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider">Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">{summary.summary}</p>
      </section>

      {/* Action Items */}
      {summary.actionItems.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <CalendarCheck className="h-4 w-4" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider">Action Items</h3>
          </div>
          <ul className="space-y-2">
            {summary.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="text-foreground">{item.task}</span>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-secondary px-1.5 py-0.5">{item.assignee}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5">{item.deadline}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Key Decisions */}
      {summary.keyDecisions.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Lightbulb className="h-4 w-4" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider">Key Decisions</h3>
          </div>
          <ul className="space-y-1.5">
            {summary.keyDecisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SummaryOutput;
