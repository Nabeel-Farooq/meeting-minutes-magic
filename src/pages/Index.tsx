import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Loader2, ClipboardCopy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SummaryOutput from "@/components/SummaryOutput";

export interface MeetingSummary {
  summary: string;
  actionItems: { task: string; assignee: string; deadline: string }[];
  keyDecisions: string[];
}

const PLACEHOLDER = `Example:
Team standup – April 7, 2026
Attendees: Sarah, Mike, Priya

Sarah: The new dashboard is almost done. I'll push the final PR by Wednesday.
Mike: I'm blocked on the API integration — waiting on credentials from DevOps. Can someone ping them?
Priya: I'll handle that today. Also, the client demo is Friday so we need the staging env ready by Thursday EOD.
Sarah: I can help with staging after my PR is merged.
Mike: Sounds good. Let's sync again tomorrow at 10am.`;

const Index = () => {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("summarize-notes", {
        body: { notes: notes.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSummary(data as MeetingSummary);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
              MeetingMind
            </h1>
            <p className="text-xs text-muted-foreground">
              Paste notes → get structured summaries
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input */}
          <div className="flex flex-col gap-4">
            <label className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Raw Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-[400px] w-full resize-none rounded-xl border border-border bg-card p-5 font-body text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSummarize}
                disabled={isLoading || !notes.trim()}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-display font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isLoading ? "Summarizing…" : "Summarize"}
              </Button>
              {notes && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setNotes(""); setSummary(null); setError(null); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">
            <label className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Structured Output
            </label>
            <AnimatePresence mode="wait">
              {summary ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <SummaryOutput summary={summary} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50"
                >
                  <p className="text-sm text-muted-foreground/60">
                    {isLoading ? "Analyzing your notes…" : "Your summary will appear here"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
