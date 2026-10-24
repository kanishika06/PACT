import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import AppShell from "../components/AppShell";
import NotchedCard from "../components/NotchedCard";
import StatTile from "../components/StatTile";
import NewProjectModal from "../features/dashboard/NewProjectModal";
import { Display, EmptyState, Mono, Skeleton } from "../components/primitives";
import { useDashboard, useProjects } from "../lib/queries";
import { getIdentity, getVisitorName } from "../lib/identity";

export default function Dashboard() {
  const navigate = useNavigate();
  const identity = getIdentity();
  const stats = useDashboard();
  const projects = useProjects();
  const [creating, setCreating] = useState(false);

  // No identity means the user deep-linked here; send them to pick one.
  useEffect(() => {
    if (!identity) navigate("/login", { replace: true });
  }, [identity, navigate]);

  if (!identity) return null;

  return (
    <AppShell badge="Workspace overview">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 mt-4">
          <Display className="text-4xl md:text-6xl">
            {(getVisitorName() || identity.name).split(" ")[0]}&rsquo;s workspace
          </Display>
          <p className="mt-3 max-w-lg text-sm text-[var(--muted)]">
            Figures below cover every project in the database — this build has no
            accounts, so the dashboard is shared.
          </p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.isLoading &&
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}

          {stats.isError && (
            <div className="col-span-full">
              <NotchedCard small active={false} innerClassName="p-5">
                <Mono className="text-[#f6b8ff]">{stats.error.friendly}</Mono>
              </NotchedCard>
            </div>
          )}

          {stats.data && (
            <>
              <StatTile label="Projects" value={stats.data.total_projects} delay={0} />
              <StatTile label="Total tasks" value={stats.data.total_tasks} delay={0.06} />
              <StatTile label="In flight" value={stats.data.pending_tasks} delay={0.12} />
              <StatTile
                label="Completion"
                value={stats.data.completion_percentage}
                decimals={1}
                suffix="%"
                progress={stats.data.completion_percentage}
                delay={0.18}
              />
            </>
          )}
        </div>

        {/* projects */}
        <div className="mb-6 mt-16 flex items-end justify-between">
          <Mono className="text-[var(--faint)]">Projects</Mono>
          <Mono className="text-[var(--faint)]">
            {projects.data ? `${projects.data.length} total` : ""}
          </Mono>
        </div>

        {projects.isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}

        {projects.isError && (
          <EmptyState title="Couldn't load projects" hint={projects.error.friendly} />
        )}

        {projects.data && (
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
          >
            {projects.data.map((project) => (
              <motion.div
                key={project.id}
                variants={{ hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={`/projects/${project.id}`}>
                  <NotchedCard
                    interactive
                    className="h-44"
                    innerClassName="flex h-full flex-col justify-between p-6"
                  >
                    <div>
                      <h3 className="font-display text-xl leading-snug text-[var(--text)]">
                        {project.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                        {project.description || "No description yet."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Mono className="text-[var(--faint)]">
                        {new Date(
                          project.created_at.endsWith("Z") ||
                          /[+-]\d{2}:\d{2}$/.test(project.created_at)
                            ? project.created_at
                            : `${project.created_at}Z`,
                        ).toLocaleDateString()}
                      </Mono>
                      <span className="text-[var(--cyan)]">→</span>
                    </div>
                  </NotchedCard>
                </Link>
              </motion.div>
            ))}

            {/* new project */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <NotchedCard
                interactive
                onClick={() => setCreating(true)}
                className="h-44"
                innerClassName="flex h-full flex-col items-center justify-center gap-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[#06121a]"
                  style={{ background: "var(--grad)" }}
                >
                  +
                </div>
                <Mono className="text-[var(--muted)]">New project</Mono>
              </NotchedCard>
            </motion.div>
          </motion.div>
        )}

        {projects.data?.length === 0 && (
          <EmptyState
            title="No projects yet"
            hint="Create the first one to start assigning work."
          />
        )}
      </div>

      <NewProjectModal
        open={creating}
        onClose={() => setCreating(false)}
        ownerId={identity.id}
        onCreated={(id) => {
          setCreating(false);
          navigate(`/projects/${id}`);
        }}
      />
    </AppShell>
  );
}
