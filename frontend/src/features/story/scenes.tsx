import { useState } from "react";
import { motion } from "framer-motion";

import { ChoiceRow, MultiRow, SceneHeading, SelectTile } from "./StoryControls";
import { Mono } from "../../components/primitives";
import {
  AMBITIONS,
  COLLABORATION_FREQUENCY,
  DOMAINS,
  INTERESTS,
  MENTORSHIP_AREAS,
  ROLES,
  STARTER_SKILLS,
  WEEKLY_HOURS,
  ambitionCopy,
  ambitionLabel,
  collaborationCopy,
  interestLabel,
  revealSummary,
} from "./sceneData";
import {
  SKILL_CATEGORIES,
  skillsByCategory,
  type SkillCategory,
  type StudentProfile,
} from "../../lib/profile";

export interface SceneProps {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
}

/* ------------------------------------------------- 1 — The Invitation */

export function SceneInvitation({ onBegin, onSkip }: { onBegin: () => void; onSkip: () => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-end pt-[26vh] text-center">
      <motion.p
        className="font-display text-2xl font-light text-white md:text-4xl"
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setRevealed(true)}
      >
        But first, let&rsquo;s get acquainted.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 max-w-md"
      >
        <p className="font-display text-lg text-[var(--text)] md:text-xl">
          Every great project begins with a person.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Let&rsquo;s discover what interests you, what you can contribute, and what you
          want to build.
        </p>
      </motion.div>

      {/* Available immediately — the animation never gates the controls. */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onBegin}
          className="notched-sm px-7 py-3 text-[#06121a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
          style={{ background: "var(--grad)" }}
        >
          <Mono className="font-medium">Begin your story</Mono>
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-3 py-3 text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
        >
          <Mono>Skip for now</Mono>
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------- 2 — Your Instincts */

export function SceneInstincts({ profile, update }: SceneProps) {
  function toggle(id: string) {
    update({
      interests: profile.interests.includes(id)
        ? profile.interests.filter((i) => i !== id)
        : [...profile.interests, id],
    });
  }

  return (
    <div>
      <SceneHeading
        title="What pulls you in?"
        support="Pick as many as feel true. There's no scoring here."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTERESTS.map((interest, i) => (
          <SelectTile
            key={interest.id}
            index={i}
            label={interest.label}
            selected={profile.interests.includes(interest.id)}
            onToggle={() => toggle(interest.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------- 3 — Your Workshop */

export function SceneWorkshop({ profile, update }: SceneProps) {
  const [custom, setCustom] = useState("");

  function setCategory(skill: string, category: SkillCategory | null) {
    const next = { ...profile.skills };
    if (category === null) delete next[skill];
    else next[skill] = category;
    update({ skills: next });
  }

  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    if (!profile.skills[name]) setCategory(name, "explore");
    setCustom("");
  }

  const allSkills = [
    ...STARTER_SKILLS,
    ...Object.keys(profile.skills).filter(
      (s) => !STARTER_SKILLS.includes(s as (typeof STARTER_SKILLS)[number]),
    ),
  ];

  return (
    <div>
      <SceneHeading
        title="What can you bring to the table?"
        support="Place anything that applies. You choose the category — nothing is inferred from your interests."
      />

      <div className="flex flex-col gap-2">
        {allSkills.map((skill) => {
          const current = profile.skills[skill];
          return (
            <div
              key={skill}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(234,242,248,0.07)] py-3"
            >
              <span className="font-display text-[15px] text-[var(--text)]">{skill}</span>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES.map((cat) => {
                  const on = current === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${skill}: ${cat.label}`}
                      title={cat.hint}
                      onClick={() => setCategory(skill, on ? null : cat.id)}
                      className={`rounded-full border px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] ${
                        on
                          ? "border-[var(--cyan)] bg-[rgba(45,212,212,0.12)] text-[var(--text)]"
                          : "border-[rgba(124,58,237,0.25)] text-[var(--faint)] hover:border-[rgba(124,58,237,0.6)] hover:text-[var(--muted)]"
                      }`}
                    >
                      <Mono>{cat.label}</Mono>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="custom-skill" className="sr-only">
          Add a skill of your own
        </label>
        <input
          id="custom-skill"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add a skill of your own"
          maxLength={60}
          className="min-w-0 flex-1 border border-[rgba(124,58,237,0.35)] bg-[rgba(8,9,16,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none focus:border-[var(--cyan)]"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="notched-sm border border-[rgba(124,58,237,0.45)] px-5 py-3 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)] disabled:opacity-40"
        >
          <Mono>Add</Mono>
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------- 4 — Your Ambition */

export function SceneAmbition({ profile, update }: SceneProps) {
  function toggle(id: string) {
    update({
      ambitions: profile.ambitions.includes(id)
        ? profile.ambitions.filter((a) => a !== id)
        : [...profile.ambitions, id],
    });
  }

  return (
    <div>
      {/* Supporting line is derived from scene 2 selections. */}
      <SceneHeading title="What would you love to create?" support={ambitionCopy(profile)} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AMBITIONS.map((ambition, i) => (
          <SelectTile
            key={ambition.id}
            index={i}
            label={ambition.label}
            selected={profile.ambitions.includes(ambition.id)}
            onToggle={() => toggle(ambition.id)}
          />
        ))}
      </div>

      <div className="mt-7">
        <label htmlFor="project-idea">
          <Mono className="text-[var(--faint)]">Already have an idea? (optional)</Mono>
        </label>
        <textarea
          id="project-idea"
          value={profile.projectIdea}
          onChange={(e) => update({ projectIdea: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="A sentence or two is plenty."
          className="mt-2 w-full resize-none border border-[rgba(124,58,237,0.35)] bg-[rgba(8,9,16,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none focus:border-[var(--cyan)]"
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------- 5 — Collaboration Style */

export function SceneCollaboration({ profile, update }: SceneProps) {
  return (
    <div>
      <SceneHeading
        title="What kind of team helps you do your best work?"
        support={collaborationCopy(profile)}
      />

      <div className="flex flex-col gap-7">
        <section>
          <Mono className="mb-3 block text-[var(--faint)]">Roles you&rsquo;d take</Mono>
          <MultiRow
            options={ROLES}
            values={profile.roles}
            onChange={(roles) => update({ roles })}
          />
        </section>

        <section>
          <Mono className="mb-3 block text-[var(--faint)]">How often you&rsquo;d sync</Mono>
          <ChoiceRow
            options={COLLABORATION_FREQUENCY}
            value={profile.collaborationFrequency}
            onChange={(collaborationFrequency) => update({ collaborationFrequency })}
          />
        </section>

        <section>
          <Mono className="mb-3 block text-[var(--faint)]">
            Where you&rsquo;d want mentorship (optional)
          </Mono>
          <MultiRow
            options={MENTORSHIP_AREAS}
            values={profile.mentorshipAreas}
            onChange={(mentorshipAreas) => update({ mentorshipAreas })}
          />
        </section>

        <section>
          <Mono className="mb-3 block text-[var(--faint)]">Roughly, hours per week</Mono>
          <ChoiceRow
            options={WEEKLY_HOURS}
            value={profile.weeklyHours}
            onChange={(weeklyHours) => update({ weeklyHours })}
          />
        </section>

        <section>
          <Mono className="mb-3 block text-[var(--faint)]">Domains you&rsquo;re drawn to (optional)</Mono>
          <MultiRow
            options={DOMAINS}
            values={profile.domains}
            onChange={(domains) => update({ domains })}
          />
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- 6 — The Reveal */

function RevealBlock({
  label,
  items,
  onEdit,
  empty,
}: {
  label: string;
  items: string[];
  onEdit: () => void;
  empty: string;
}) {
  return (
    <div className="border-b border-[rgba(234,242,248,0.08)] py-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Mono className="text-[var(--faint)]">{label}</Mono>
        <button
          type="button"
          onClick={onEdit}
          className="text-[var(--faint)] transition-colors hover:text-[var(--cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
        >
          <Mono>Edit</Mono>
        </button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[rgba(124,58,237,0.4)] px-3 py-1.5 text-[13px] text-[var(--text)]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[13px] text-[var(--faint)]">{empty}</span>
      )}
    </div>
  );
}

export function SceneReveal({
  profile,
  goToScene,
}: {
  profile: StudentProfile;
  goToScene: (scene: number) => void;
}) {
  return (
    <div>
      <SceneHeading title="This is your starting point." support={revealSummary(profile)} />

      <div className="mb-6 rounded-md border border-[rgba(234,242,248,0.1)] bg-[rgba(8,9,16,0.5)] px-4 py-3">
        <Mono className="text-[var(--faint)]">
          Your own answers, not an assessment. Stored in this browser only — there is no
          profile endpoint on the server yet.
        </Mono>
      </div>

      <RevealBlock
        label="What pulls you in"
        items={profile.interests.map(interestLabel)}
        onEdit={() => goToScene(2)}
        empty="Nothing selected"
      />

      {SKILL_CATEGORIES.map((cat) => (
        <RevealBlock
          key={cat.id}
          label={cat.label}
          items={skillsByCategory(profile, cat.id)}
          onEdit={() => goToScene(3)}
          empty="Nothing placed here"
        />
      ))}

      <RevealBlock
        label="What you'd love to create"
        items={profile.ambitions.map(ambitionLabel)}
        onEdit={() => goToScene(4)}
        empty="Nothing selected"
      />

      {profile.projectIdea.trim() && (
        <div className="border-b border-[rgba(234,242,248,0.08)] py-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <Mono className="text-[var(--faint)]">Your idea</Mono>
            <button
              type="button"
              onClick={() => goToScene(4)}
              className="text-[var(--faint)] transition-colors hover:text-[var(--cyan)]"
            >
              <Mono>Edit</Mono>
            </button>
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--text)]">
            {profile.projectIdea}
          </p>
        </div>
      )}

      <RevealBlock
        label="Roles you'd take"
        items={profile.roles}
        onEdit={() => goToScene(5)}
        empty="Nothing selected"
      />
      <RevealBlock
        label="Collaboration"
        items={[profile.collaborationFrequency, profile.weeklyHours].filter(Boolean)}
        onEdit={() => goToScene(5)}
        empty="Nothing selected"
      />
      <RevealBlock
        label="Mentorship interests"
        items={profile.mentorshipAreas}
        onEdit={() => goToScene(5)}
        empty="Nothing selected"
      />
      <RevealBlock
        label="Domains"
        items={profile.domains}
        onEdit={() => goToScene(5)}
        empty="Nothing selected"
      />
    </div>
  );
}
