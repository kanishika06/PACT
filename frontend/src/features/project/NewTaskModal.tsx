import { useState, type FormEvent } from "react";

import Modal from "../../components/Modal";
import { GhostButton, GradientButton, Mono } from "../../components/primitives";
import { useCreateTask } from "../../lib/queries";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
  type User,
} from "../../types/api";

const fieldClass =
  "border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none transition-colors focus:border-[var(--cyan)]";

export default function NewTaskModal({
  open,
  onClose,
  projectId,
  members,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: User[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const create = useCreateTask(projectId);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        assignee_id: assignee || null,
        due_date: dueDate || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setDueDate("");
          setAssignee("");
          onClose();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <Mono className="text-[var(--faint)]">Title</Mono>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Collect traffic data"
            maxLength={200}
            autoFocus
            className={fieldClass}
          />
          {create.error?.fieldErrors.title && (
            <Mono className="text-[#f6b8ff]">{create.error.fieldErrors.title}</Mono>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <Mono className="text-[var(--faint)]">Description</Mono>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={5000}
            className={`${fieldClass} resize-none`}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <Mono className="text-[var(--faint)]">Priority</Mono>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={fieldClass}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-[var(--panel)]">
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Mono className="text-[var(--faint)]">Status</Mono>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={fieldClass}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[var(--panel)]">
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Mono className="text-[var(--faint)]">Assignee</Mono>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={fieldClass}
            >
              <option value="" className="bg-[var(--panel)]">
                Unassigned
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-[var(--panel)]">
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <Mono className="text-[var(--faint)]">Due date</Mono>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        {create.isError && !create.error.fieldErrors.title && (
          <Mono className="text-[#f6b8ff]">{create.error.friendly}</Mono>
        )}

        <div className="flex justify-end gap-3">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GradientButton type="submit" disabled={!title.trim() || create.isPending}>
            {create.isPending ? "Adding…" : "Add task"}
          </GradientButton>
        </div>
      </form>
    </Modal>
  );
}
