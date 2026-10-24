import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ParticleHead from "../features/story/ParticleHead";
import {
  SceneAmbition,
  SceneCollaboration,
  SceneInstincts,
  SceneInvitation,
  SceneReveal,
  SceneWorkshop,
} from "../features/story/scenes";
import { StoryProgress } from "../features/story/StoryControls";
import { Mono } from "../components/primitives";
import { getAccess } from "../lib/session";
import { loadProfile, saveProfile, type StudentProfile } from "../lib/profile";

const TOTAL_SCENES = 6;

/**
 * The identity story. All six scenes share one profile object, so moving
 * backward never loses an answer — and every change is written to storage
 * immediately, so a refresh mid-story resumes rather than restarting.
 */
export default function Story() {
  const navigate = useNavigate();
  const [scene, setScene] = useState(1);
  const [profile, setProfile] = useState<StudentProfile>(() => loadProfile());

  // Direct navigation without demo access goes back to /auth.
  useEffect(() => {
    if (!getAccess()) navigate("/auth", { replace: true });
  }, [navigate]);

  // Each scene starts at the top rather than inheriting the previous
  // scene's scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [scene]);

  const update = useCallback((patch: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }, []);

  function finish() {
    update({ completed: true });
    navigate("/dashboard");
  }

  function skip() {
    // Skipping must never block the workspace.
    navigate("/dashboard");
  }

  const sceneProps = { profile, update };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080910]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 760px at 50% 42%, rgba(109,40,217,0.34), transparent 66%), radial-gradient(620px 520px at 28% 74%, rgba(192,38,211,0.18), transparent 70%)",
        }}
        aria-hidden
      />
      {/* The scene itself carries the atmosphere; later scenes dim it so the
          content stays readable. */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ opacity: scene === 1 ? 1 : 0.16 }}
      >
        <ParticleHead />
      </div>
      {/* Scene 1 is pure atmosphere; from scene 2 on, content has to be
          readable, so the scene sits behind a scrim. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#080910] transition-opacity duration-700"
        style={{ opacity: scene === 1 ? 0 : 0.72 }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="font-display text-base font-medium tracking-tight text-white">
            TEAMSYNC<span className="text-[var(--cyan)]">.</span>
          </div>
          {scene > 1 && <StoryProgress step={scene} total={TOTAL_SCENES} />}
          <button
            type="button"
            onClick={skip}
            className="text-[var(--faint)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
          >
            <Mono>Skip</Mono>
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {scene === 1 && (
                <SceneInvitation onBegin={() => setScene(2)} onSkip={skip} />
              )}
              {scene === 2 && <SceneInstincts {...sceneProps} />}
              {scene === 3 && <SceneWorkshop {...sceneProps} />}
              {scene === 4 && <SceneAmbition {...sceneProps} />}
              {scene === 5 && <SceneCollaboration {...sceneProps} />}
              {scene === 6 && <SceneReveal profile={profile} goToScene={setScene} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {scene > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <button
              type="button"
              onClick={() => setScene((s) => Math.max(1, s - 1))}
              className="px-2 py-3 text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
            >
              <Mono>← Back</Mono>
            </button>

            {scene < TOTAL_SCENES ? (
              <button
                type="button"
                onClick={() => setScene((s) => s + 1)}
                className="notched-sm px-7 py-3 text-[#06121a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
                style={{ background: "var(--grad)" }}
              >
                <Mono className="font-medium">Continue</Mono>
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setScene(2)}
                  className="notched-sm border border-[rgba(124,58,237,0.45)] px-5 py-3 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)]"
                >
                  <Mono>Edit my story</Mono>
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="notched-sm px-7 py-3 text-[#06121a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
                  style={{ background: "var(--grad)" }}
                >
                  <Mono className="font-medium">Enter my workspace</Mono>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
