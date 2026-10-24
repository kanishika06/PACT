/**
 * Every server interaction in one place. TanStack Query supplies the
 * reliability: retries on 5xx only, caching, and optimistic task updates.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { api, ApiError } from "./api";
import type {
  AiTaskResponse,
  CreateProjectBody,
  CreateTaskBody,
  DashboardStats,
  Project,
  ProjectMember,
  Resource,
  Task,
  UpdateTaskBody,
  User,
} from "../types/api";

export const keys = {
  health: ["health"] as const,
  users: ["users"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  tasks: (id: string) => ["projects", id, "tasks"] as const,
  members: (id: string) => ["projects", id, "members"] as const,
  resources: (id: string) => ["projects", id, "resources"] as const,
  dashboard: ["dashboard"] as const,
};

/* ------------------------------------------------------------------ reads */

export function useDbHealth() {
  return useQuery<{ status: string; database: string }, ApiError>({
    queryKey: keys.health,
    queryFn: () => api.get<{ status: string; database: string }>("/health/db"),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useUsers() {
  return useQuery<User[], ApiError>({
    queryKey: keys.users,
    queryFn: () => api.get<User[]>("/api/users"),
  });
}

export function useProjects() {
  return useQuery<Project[], ApiError>({
    queryKey: keys.projects,
    queryFn: () => api.get<Project[]>("/api/projects"),
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project, ApiError>({
    queryKey: keys.project(id ?? ""),
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useTasks(id: string | undefined) {
  return useQuery<Task[], ApiError>({
    queryKey: keys.tasks(id ?? ""),
    queryFn: () => api.get<Task[]>(`/api/projects/${id}/tasks`),
    enabled: Boolean(id),
  });
}

export function useMembers(id: string | undefined) {
  return useQuery<ProjectMember[], ApiError>({
    queryKey: keys.members(id ?? ""),
    queryFn: () => api.get<ProjectMember[]>(`/api/projects/${id}/members`),
    enabled: Boolean(id),
  });
}

export function useResources(id: string | undefined) {
  return useQuery<Resource[], ApiError>({
    queryKey: keys.resources(id ?? ""),
    queryFn: () => api.get<Resource[]>(`/api/projects/${id}/resources`),
    enabled: Boolean(id),
  });
}

export function useDashboard() {
  return useQuery<DashboardStats, ApiError>({
    queryKey: keys.dashboard,
    queryFn: () => api.get<DashboardStats>("/api/dashboard"),
  });
}

/* -------------------------------------------------------------- mutations */

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation<Project, ApiError, CreateProjectBody>({
    mutationFn: (body) => api.post<Project>("/api/projects", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.projects });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation<Task, ApiError, CreateTaskBody>({
    mutationFn: (body) => api.post<Task>(`/api/projects/${projectId}/tasks`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

/**
 * Optimistic: the card moves columns immediately and rolls back if the
 * request fails, so dragging never feels laggy on a slow connection.
 */
export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation<Task, ApiError, { taskId: string; body: UpdateTaskBody }, { prev?: Task[] }>({
    mutationFn: ({ taskId, body }) => api.patch<Task>(`/api/tasks/${taskId}`, body),
    onMutate: async ({ taskId, body }) => {
      await qc.cancelQueries({ queryKey: keys.tasks(projectId) });
      const prev = qc.getQueryData<Task[]>(keys.tasks(projectId));
      if (prev) {
        qc.setQueryData<Task[]>(
          keys.tasks(projectId),
          prev.map((t) => (t.id === taskId ? { ...t, ...body } : t)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.tasks(projectId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation<ProjectMember, ApiError, { user_id: string }>({
    mutationFn: (body) => api.post<ProjectMember>(`/api/projects/${projectId}/members`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(projectId) }),
  });
}

export function useAddResource(projectId: string) {
  const qc = useQueryClient();
  return useMutation<Resource, ApiError, { title: string; url: string }>({
    mutationFn: (body) => api.post<Resource>(`/api/projects/${projectId}/resources`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.resources(projectId) }),
  });
}

export function useGenerateTasks(
  options?: UseMutationOptions<
    AiTaskResponse,
    ApiError,
    { project_title: string; project_description: string; team_size: number }
  >,
) {
  return useMutation<
    AiTaskResponse,
    ApiError,
    { project_title: string; project_description: string; team_size: number }
  >({
    mutationFn: (body) => api.post<AiTaskResponse>("/api/ai/generate-tasks", body),
    ...options,
  });
}
