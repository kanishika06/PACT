import { useState, type FormEvent } from "react";

import Modal from "../../components/Modal";
import { GhostButton, GradientButton, Mono } from "../../components/primitives";
import { useCreateProject } from "../../lib/queries";

export default function NewProjectModal({
  open,
  onClose,
  ownerId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  ownerId: string;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateProject();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      { title: title.trim(), description: description.trim() || null, owner_id: ownerId },
      {
        onSuccess: (project) => {
          setTitle("");
          setDescription("");
          onCreated(project.id);
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <Mono className="text-[var(--faint)]">Title</Mono>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="AI Traffic Management"
            maxLength={200}
            autoFocus
            className="border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none transition-colors focus:border-[var(--cyan)]"
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
            placeholder="What are you building?"
            rows={3}
            maxLength={5000}
            className="resize-none border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none transition-colors focus:border-[var(--cyan)]"
          />
        </label>

        {create.isError && !create.error.fieldErrors.title && (
          <Mono className="text-[#f6b8ff]">{create.error.friendly}</Mono>
        )}

        <div className="flex justify-end gap-3">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <GradientButton type="submit" disabled={!title.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create project"}
          </GradientButton>
        </div>
      </form>
    </Modal>
  );
}
