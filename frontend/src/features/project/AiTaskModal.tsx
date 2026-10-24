import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Modal from "../../components/Modal";
import { GhostButton, GradientButton, Mono, PriorityChip } from "../../components/primitives";
import { useCreateTask, useGenerateTasks } from "../../lib/queries";
import type { AiSuggestedTask, Project } from "../../types/api";

/**
 * Suggestions only — the endpoint saves nothing. Selected items are written
 * back one at a time through the normal task-creation endpoint.
 */
export default function AiTaskModal({
  open,
  onClose,
  project,
  teamSize,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  teamSize: number;
}) {
  const generate = useGenerateTasks();
  const createTask = useCreateTask(project.id);

  const [suggestions, setSuggestions] = useState<AiSuggestedTask[]>([]);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setSelected(new Set());
    generate.mutate(
      {
        project_title: project.title,
        project_description: project.description ?? "",
        team_size: teamSize,
      },
      {
        onSuccess: (data) => {
          setSuggestions(data.tasks);
          setSource(data.source);
          // everything selected by default — deselecting is the faster gesture
          setSelected(new Set(data.tasks.map((_, i) => i)));
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function addSelected() {
    setSaving(true);
    try {
      for (const index of [...selected].sort((a, b) => a - b)) {
        const task = suggestions[index];
        await createTask.mutateAsync({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: "To Do",
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="AI task suggestions"
      subtitle="Nothing is saved until you add it"
    >
      {generate.isPending && (
        <div className="flex flex-col items-center gap-4 py-14">
          <motion.div
            className="h-10 w-10 rounded-full"
            style={{ background: "var(--grad)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <Mono className="text-[var(--muted)]">Drafting a plan…</Mono>
        </div>
      )}

      {generate.isError && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Mono className="text-[#f6b8ff]">{generate.error.friendly}</Mono>
          <GhostButton
            onClick={() =>
              generate.mutate({
                project_title: project.title,
                project_description: project.description ?? "",
                team_size: teamSize,
              })
            }
          >
            Try again
          </GhostButton>
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            {/* Report the real provenance — never dress fallback up as AI. */}
            <span
              className={`mono-micro rounded-full border px-3 py-1 ${
                source === "gemini"
                  ? "border-[rgba(45,212,212,0.5)] text-[var(--cyan)]"
                  : "border-[rgba(234,242,248,0.25)] text-[var(--muted)]"
              }`}
            >
              {source === "gemini" ? "✦ Gemini" : "◇ Template fallback"}
            </span>
            <Mono className="text-[var(--faint)]">{selected.size} selected</Mono>
          </div>

          <motion.ul
            className="flex flex-col gap-3"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
          >
            {suggestions.map((task, index) => {
              const on = selected.has(index);
              return (
                <motion.li
                  key={`${task.title}-${index}`}
                  variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => toggle(index)}
                    className={`notched-sm w-full border p-4 text-left transition-colors ${
                      on
                        ? "border-[var(--cyan)] bg-[rgba(45,212,212,0.08)]"
                        : "border-[rgba(124,58,237,0.25)] bg-[rgba(5,7,13,0.4)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] ${
                          on
                            ? "border-[var(--cyan)] bg-[var(--cyan)] text-[#06121a]"
                            : "border-[var(--faint)]"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[var(--text)]">{task.title}</div>
                        <p className="mt-1 text-sm text-[var(--muted)]">{task.description}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <PriorityChip priority={task.priority} />
                          <Mono className="text-[var(--faint)]">
                            ~{task.estimated_days}{" "}
                            {task.estimated_days === 1 ? "day" : "days"}
                          </Mono>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>

          <div className="mt-6 flex justify-end gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <GradientButton onClick={addSelected} disabled={selected.size === 0 || saving}>
              {saving ? "Adding…" : `Add ${selected.size} task${selected.size === 1 ? "" : "s"}`}
            </GradientButton>
          </div>
        </>
      )}
    </Modal>
  );
}
