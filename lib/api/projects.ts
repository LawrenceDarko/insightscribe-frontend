import { api } from "./client";
import type { Project, Interview } from "@/types";
import {
  DEV_MODE,
  devGetProjects,
  devGetProject,
  devCreateProject,
  devUpdateProject,
  devDeleteProject,
  devGetInterviews,
  devDeleteInterview,
} from "./_dev-data";

/** Shape of the interview list response after envelope unwrap. */
interface InterviewListData {
  count: number;
  interviews: Interview[];
}

export const projectsApi = {
  list: (): Promise<Project[]> =>
    DEV_MODE ? Promise.resolve(devGetProjects()) : api.get<Project[]>("/projects/"),

  get: (id: string): Promise<Project> =>
    DEV_MODE
      ? Promise.resolve(devGetProject(id)).then((p) => {
          if (!p) throw new Error("Project not found");
          return p;
        })
      : api.get<Project>(`/projects/${id}/`),

  create: (name: string, description?: string): Promise<Project> =>
    DEV_MODE
      ? Promise.resolve(devCreateProject(name, description))
      : api.post<Project>("/projects/", { name, description }),

  update: (id: string, data: { name?: string; description?: string }): Promise<Project> =>
    DEV_MODE
      ? Promise.resolve(devUpdateProject(id, data)).then((p) => {
          if (!p) throw new Error("Project not found");
          return p;
        })
      : api.patch<Project>(`/projects/${id}/`, data),

  delete: (id: string): Promise<void> =>
    DEV_MODE
      ? Promise.resolve(devDeleteProject(id))
      : api.delete(`/projects/${id}/`),

  /**
   * List interviews for a project.
   * Backend returns: { count, interviews: [...] } (after envelope unwrap).
   * We extract the interviews array for the caller.
   */
  listInterviews: async (projectId: string): Promise<Interview[]> => {
    if (DEV_MODE) return devGetInterviews(projectId);
    const data = await api.get<InterviewListData>(
      `/projects/${projectId}/interviews/`
    );
    // Normalize: add 'status' alias from 'processing_status' for each interview
    const interviews = data?.interviews ?? (data as unknown as Interview[]) ?? [];
    return interviews.map((i) => ({
      ...i,
      status: i.status ?? i.processing_status,
    }));
  },

  /** Get a single interview. */
  getInterview: (projectId: string, interviewId: string): Promise<Interview> =>
    DEV_MODE
      ? Promise.resolve(devGetInterviews(projectId).find((i) => i.id === interviewId)).then(
          (i) => {
            if (!i) throw new Error("Interview not found");
            return i;
          }
        )
      : api.get<Interview>(`/projects/${projectId}/interviews/${interviewId}/`).then((i) => ({
          ...i,
          status: i.status ?? i.processing_status,
        })),

  deleteInterview: (projectId: string, interviewId: string): Promise<void> =>
    DEV_MODE
      ? Promise.resolve(devDeleteInterview(projectId, interviewId))
      : api.delete(`/projects/${projectId}/interviews/${interviewId}/`),

  /** Reprocess a failed interview. */
  reprocessInterview: (projectId: string, interviewId: string): Promise<Interview> =>
    api.post<Interview>(
      `/projects/${projectId}/interviews/${interviewId}/reprocess/`
    ).then((i) => ({ ...i, status: i.status ?? i.processing_status })),
};
