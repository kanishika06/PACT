/**
 * Options and adaptive copy for the identity story.
 *
 * All adaptation here is deterministic and derived purely from what the
 * student selected. No model is called to decide what to show, and none of
 * this is presented as an assessment of ability.
 */

import type { StudentProfile } from "../../lib/profile";

export const INTERESTS = [
  { id: "build", label: "Building something from scratch" },
  { id: "solve", label: "Solving difficult problems" },
  { id: "explore", label: "Exploring how things work" },
  { id: "design", label: "Designing experiences for people" },
  { id: "research", label: "Researching unanswered questions" },
  { id: "organise", label: "Organising people and ideas" },
] as const;

export const STARTER_SKILLS = [
  "Python",
  "JavaScript",
  "React",
  "C/C++",
  "SQL and databases",
  "Machine learning",
  "Data analysis",
  "UI/UX design",
  "Backend development",
  "Cloud and deployment",
  "Research",
  "Communication",
  "Leadership",
  "Project coordination",
] as const;

export const AMBITIONS = [
  { id: "ai", label: "An AI-powered product" },
  { id: "research", label: "A research project" },
  { id: "game", label: "A game or interactive experience" },
  { id: "startup", label: "A startup idea" },
  { id: "impact", label: "A social-impact solution" },
  { id: "experimental", label: "Something experimental" },
] as const;

export const ROLES = [
  "Frontend",
  "Backend",
  "Data / ML",
  "Design",
  "Research",
  "Coordination",
  "Testing",
  "Presenting",
] as const;

export const COLLABORATION_FREQUENCY = [
  "Daily stand-ups",
  "A few times a week",
  "Weekly check-ins",
  "Async, mostly independent",
] as const;

export const MENTORSHIP_AREAS = [
  "Technical depth",
  "System design",
  "Research methods",
  "Design craft",
  "Communication",
  "Career direction",
] as const;

export const WEEKLY_HOURS = [
  "Under 5 hours",
  "5–10 hours",
  "10–20 hours",
  "20+ hours",
] as const;

export const DOMAINS = [
  "Healthcare",
  "Education",
  "Climate",
  "Fintech",
  "Accessibility",
  "Developer tools",
  "Games",
  "Civic tech",
] as const;

/* --------------------------------------------------------------- adaptive */

/**
 * Scene 4 supporting copy, chosen from the interests actually selected in
 * scene 2. First matching rule wins; order encodes priority.
 */
export function ambitionCopy(profile: StudentProfile): string {
  const has = (id: string) => profile.interests.includes(id);

  if (has("research")) {
    return "You leaned toward open questions — think about what you'd want to test, and how you'd know whether it worked.";
  }
  if (has("design")) {
    return "You leaned toward designing for people — think about who uses this, and what the experience should feel like.";
  }
  if (has("build")) {
    return "You leaned toward building — think about what you want standing at the end, however small.";
  }
  if (has("organise")) {
    return "You leaned toward organising — think about what a team around you could ship together.";
  }
  if (has("solve")) {
    return "You leaned toward hard problems — think about the one that would genuinely stretch you.";
  }
  if (has("explore")) {
    return "You leaned toward taking things apart — think about what you'd want to understand properly.";
  }
  return "Pick whatever you'd actually be glad to have built by the end.";
}

/**
 * Scene 5 supporting copy, chosen from skills the student placed in
 * "comfortable with". Falls back to a neutral line.
 */
export function collaborationCopy(profile: StudentProfile): string {
  const comfortable = Object.entries(profile.skills)
    .filter(([, c]) => c === "comfortable")
    .map(([s]) => s);

  const any = (...names: string[]) =>
    names.some((n) => comfortable.includes(n));

  if (any("Leadership", "Project coordination", "Communication")) {
    return "You're comfortable coordinating — say where you want to lead, and where you'd rather hand off.";
  }
  if (any("Backend development", "Cloud and deployment", "SQL and databases")) {
    return "You're comfortable with the plumbing — say who you want designing and testing around you.";
  }
  if (any("UI/UX design")) {
    return "You're comfortable with design — say who you want building and validating alongside you.";
  }
  if (any("Machine learning", "Data analysis", "Research")) {
    return "You're comfortable with data and research — say who you want shipping the product around your work.";
  }
  return "There's no right answer — describe the team you'd actually enjoy.";
}

/** One line for the reveal, assembled from real selections. */
export function revealSummary(profile: StudentProfile): string {
  const interestCount = profile.interests.length;
  const skillCount = Object.keys(profile.skills).length;
  const ambitionCount = profile.ambitions.length;

  const parts: string[] = [];
  if (interestCount) parts.push(`${interestCount} interest${interestCount === 1 ? "" : "s"}`);
  if (skillCount) parts.push(`${skillCount} skill${skillCount === 1 ? "" : "s"}`);
  if (ambitionCount) parts.push(`${ambitionCount} ambition${ambitionCount === 1 ? "" : "s"}`);

  if (parts.length === 0) return "You skipped most of this — you can come back and fill it in any time.";
  return `Built from ${parts.join(", ")} you chose yourself.`;
}

export function interestLabel(id: string): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}

export function ambitionLabel(id: string): string {
  return AMBITIONS.find((a) => a.id === id)?.label ?? id;
}
