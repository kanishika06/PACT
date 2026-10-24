/**
 * The student's onboarding answers.
 *
 * These live in the browser only. The backend has no profile table and no
 * endpoint to store them, so nothing here is saved server-side — the UI says
 * so rather than implying otherwise. `users.skills` is the only field the
 * backend can hold today, and even that is not wired to this.
 *
 * Nothing sensitive goes in here: answers only, never credentials.
 */

const PROFILE_KEY = "teamsync.studentProfile";

export type SkillCategory = "comfortable" | "learning" | "explore";

export const SKILL_CATEGORIES: { id: SkillCategory; label: string; hint: string }[] = [
  { id: "comfortable", label: "Comfortable with", hint: "You could do this today" },
  { id: "learning", label: "Currently learning", hint: "You're actively picking it up" },
  { id: "explore", label: "Want to explore", hint: "On your list, not started" },
];

export interface StudentProfile {
  interests: string[];
  /** skill name -> which category the student put it in */
  skills: Record<string, SkillCategory>;
  ambitions: string[];
  projectIdea: string;
  roles: string[];
  collaborationFrequency: string;
  mentorshipAreas: string[];
  weeklyHours: string;
  domains: string[];
  /** true once the reveal has been reached — not a backend-saved flag */
  completed: boolean;
  updatedAt: string | null;
}

export const EMPTY_PROFILE: StudentProfile = {
  interests: [],
  skills: {},
  ambitions: [],
  projectIdea: "",
  roles: [],
  collaborationFrequency: "",
  mentorshipAreas: [],
  weeklyHours: "",
  domains: [],
  completed: false,
  updatedAt: null,
};

export function loadProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function saveProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* storage blocked — answers stay in memory for this session only */
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

/** Has the student answered anything at all? Drives the /story redirect. */
export function hasAnswers(profile: StudentProfile): boolean {
  return (
    profile.interests.length > 0 ||
    Object.keys(profile.skills).length > 0 ||
    profile.ambitions.length > 0 ||
    profile.roles.length > 0
  );
}

export function skillsByCategory(
  profile: StudentProfile,
  category: SkillCategory,
): string[] {
  return Object.entries(profile.skills)
    .filter(([, c]) => c === category)
    .map(([skill]) => skill)
    .sort();
}
