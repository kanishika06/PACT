import { memo } from "react";
import { motion } from "framer-motion";

import { Mono, PriorityChip } from "../../components/primitives";
import { TASK_STATUSES, type Task, type TaskStatus, type User } from "../../types/api";

/**
 * `layout` gives the card a real flight between columns when the status
 * changes — the single highest-value animation in the app, and it's free.
 */
function TaskCardBase({
  task,
  members,
  onStatusChange,
}: {
  task: Task;
  members: User[];
  onStatusChange: (status: TaskStatus) => void;
}) {
  const assignee = members.find((m) => m.id === task.assignee_id);
  const overdue =
    task.due_date && task.status !== "Completed" && new Date(task.due_date) < new Date();

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="notched-sm border border-[rgba(124,58,237,0.28)] bg-[var(--panel)] p-4 transition-colors hover:border-[rgba(45,212,212,0.5)]"
    >
      <div className="font-display text-[15px] leading-snug text-[var(--text)]">
        {task.title}
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-[var(--muted)]">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityChip priority={task.priority} />
        {task.due_date && (
          <Mono className={overdue ? "text-[#f6b8ff]" : "text-[var(--faint)]"}>
            {overdue ? "Overdue " : ""}
            {task.due_date}
          </Mono>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Mono className="truncate text-[var(--faint)]">
          {assignee ? assignee.name : "Unassigned"}
        </Mono>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          aria-label="Task status"
          className="mono-micro cursor-pointer rounded-sm border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-2 py-1 text-[var(--muted)] outline-none transition-colors hover:border-[var(--cyan)]"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status} className="bg-[var(--panel)]">
              {status}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

export default memo(TaskCardBase);
