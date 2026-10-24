/**
 * Mirrors backend/schemas.py. The literal unions are deliberate: sending
 * "todo" or "high" returns 422 from the backend, and these types make that a
 * compile error instead of a runtime surprise.
 */

export type TaskStatus = "To Do" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Completed"];
export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[] | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  project_id: string;
  title: string;
  url: string;
}

export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_percentage: number;
}

export interface AiSuggestedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  estimated_days: number;
}

export interface AiTaskResponse {
  tasks: AiSuggestedTask[];
  /** "gemini" when the model produced them, "fallback" for the template. */
  source: string;
}

export interface CreateProjectBody {
  title: string;
  description?: string | null;
  owner_id: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
}

export type UpdateTaskBody = Partial<CreateTaskBody>;
