import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import AppShell from "../components/AppShell";
import NotchedCard from "../components/NotchedCard";
import AiTaskModal from "../features/project/AiTaskModal";
import NewTaskModal from "../features/project/NewTaskModal";
import TaskCard from "../features/project/TaskCard";
import {
  Display,
  EmptyState,
  GhostButton,
  GradientButton,
  Mono,
  Skeleton,
} from "../components/primitives";
import {
  useAddMember,
  useAddResource,
  useMembers,
  useProject,
  useResources,
  useTasks,
  useUpdateTask,
  useUsers,
} from "../lib/queries";
import { TASK_STATUSES, type TaskStatus } from "../types/api";

export default function ProjectRoute() {
  const { projectId = "" } = useParams();

  const project = useProject(projectId);
  const tasks = useTasks(projectId);
  const members = useMembers(projectId);
  const resources = useResources(projectId);
  const users = useUsers();
  const updateTask = useUpdateTask(projectId);
  const addMember = useAddMember(projectId);
  const addResource = useAddResource(projectId);

  const [aiOpen, setAiOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const memberUsers = useMemo(
    () =>
      (members.data ?? []).map((m) => ({
        id: m.user_id,
        name: m.name ?? "Unknown",
        email: m.email ?? "",
        skills: null,
      })),
    [members.data],
  );

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, typeof tasks.data> = {
      "To Do": [],
      "In Progress": [],
      Completed: [],
    };
    for (const task of tasks.data ?? []) grouped[task.status]?.push(task);
    return grouped;
  }, [tasks.data]);

  if (project.isError) {
    return (
      <AppShell>
        <EmptyState
          title="Project not found"
          hint={project.error.friendly}
          action={
            <Link to="/dashboard">
              <GhostButton>Back to dashboard</GhostButton>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell badge="Project workspace">
      <div className="mx-auto max-w-7xl">
        <Link to="/dashboard">
          <Mono className="text-[var(--faint)] transition-colors hover:text-[var(--cyan)]">
            ← All projects
          </Mono>
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            {project.isLoading ? (
              <Skeleton className="h-12 w-80" />
            ) : (
              <>
                <Display className="text-4xl md:text-5xl">{project.data?.title}</Display>
                <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                  {project.data?.description || "No description yet."}
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <GhostButton onClick={() => setTaskOpen(true)}>+ Task</GhostButton>
            {project.data && (
              <GradientButton onClick={() => setAiOpen(true)}>
                ✦ Generate with AI
              </GradientButton>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* board */}
          <div className="grid gap-5 md:grid-cols-3">
            {TASK_STATUSES.map((status) => (
              <div key={status}>
                <div className="mb-4 flex items-center justify-between">
                  <Mono className="text-[var(--muted)]">{status}</Mono>
                  <Mono className="text-[var(--faint)]">
                    {columns[status]?.length ?? 0}
                  </Mono>
                </div>

                <div className="flex min-h-[120px] flex-col gap-3 rounded-lg border border-dashed border-[rgba(124,58,237,0.18)] p-3">
                  {tasks.isLoading && <Skeleton className="h-24" />}

                  <AnimatePresence mode="popLayout">
                    {columns[status]?.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        members={memberUsers}
                        onStatusChange={(next) =>
                          updateTask.mutate({ taskId: task.id, body: { status: next } })
                        }
                      />
                    ))}
                  </AnimatePresence>

                  {tasks.data && columns[status]?.length === 0 && (
                    <div className="flex flex-1 items-center justify-center py-6">
                      <Mono className="text-[var(--faint)]">Empty</Mono>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* side rail */}
          <div className="flex flex-col gap-6">
            <NotchedCard small innerClassName="p-5">
              <Mono className="text-[var(--faint)]">Team</Mono>
              <ul className="mt-4 flex flex-col gap-2">
                {members.data?.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 shrink-0 rounded-full"
                      style={{ background: "var(--grad)", opacity: 0.8 }}
                    />
                    <span className="truncate text-sm text-[var(--text)]">{m.name}</span>
                  </li>
                ))}
                {members.data?.length === 0 && (
                  <Mono className="text-[var(--faint)]">No members yet</Mono>
                )}
              </ul>

              <select
                value=""
                onChange={(e) => e.target.value && addMember.mutate({ user_id: e.target.value })}
                className="mono-micro mt-4 w-full cursor-pointer rounded-sm border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-3 py-2 text-[var(--muted)] outline-none hover:border-[var(--cyan)]"
              >
                <option value="">+ Add member</option>
                {users.data
                  ?.filter((u) => !members.data?.some((m) => m.user_id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id} className="bg-[var(--panel)]">
                      {u.name}
                    </option>
                  ))}
              </select>
              {addMember.isError && (
                <Mono className="mt-2 block text-[#f6b8ff]">{addMember.error.friendly}</Mono>
              )}
            </NotchedCard>

            <NotchedCard small innerClassName="p-5">
              <Mono className="text-[var(--faint)]">Resources</Mono>
              <ul className="mt-4 flex flex-col gap-2">
                {resources.data?.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block truncate text-sm text-[var(--cyan)] hover:underline"
                    >
                      {r.title}
                    </a>
                  </li>
                ))}
                {resources.data?.length === 0 && (
                  <Mono className="text-[var(--faint)]">No links yet</Mono>
                )}
              </ul>

              <form
                className="mt-4 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!resourceTitle.trim() || !resourceUrl.trim()) return;
                  addResource.mutate(
                    { title: resourceTitle.trim(), url: resourceUrl.trim() },
                    {
                      onSuccess: () => {
                        setResourceTitle("");
                        setResourceUrl("");
                      },
                    },
                  );
                }}
              >
                <input
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Label"
                  className="mono-micro rounded-sm border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                />
                <input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://…"
                  className="mono-micro rounded-sm border border-[rgba(124,58,237,0.35)] bg-[rgba(5,7,13,0.6)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                />
                <button
                  type="submit"
                  className="notched-sm py-2 text-[#06121a]"
                  style={{ background: "var(--grad)" }}
                >
                  <Mono className="font-medium">Add link</Mono>
                </button>
                {addResource.isError && (
                  <Mono className="text-[#f6b8ff]">{addResource.error.friendly}</Mono>
                )}
              </form>
            </NotchedCard>
          </div>
        </div>
      </div>

      {project.data && (
        <AiTaskModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          project={project.data}
          teamSize={Math.max(1, members.data?.length ?? 3)}
        />
      )}
      <NewTaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectId={projectId}
        members={memberUsers}
      />
      <motion.div />
    </AppShell>
  );
}
