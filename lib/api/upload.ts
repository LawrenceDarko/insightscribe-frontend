import axios, { type CancelTokenSource } from "axios";
import { api, getApiClient } from "./client";
import type { Interview } from "@/types";
import {
  DEV_MODE,
  devCreateInterview,
  devSimulateProcessing,
  devGetInterview,
} from "./_dev-data";

export interface UploadResponse {
  interview: Interview;
}

export interface UploadCallbacks {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

export const uploadApi = {
  /**
   * Upload an interview file directly to the backend.
   *
   * Backend endpoint: POST /api/v1/projects/<pid>/interviews/
   * Accepts multipart/form-data with fields: file (required), title (optional).
   * Returns: { success: true, data: { id, project_id, file_name, ... } }
   *
   * The envelope is unwrapped by the response interceptor,
   * but we use the raw client here for progress tracking.
   */
  uploadFile: async (
    projectId: string,
    file: File,
    callbacks?: UploadCallbacks,
    title?: string
  ): Promise<Interview> => {
    if (DEV_MODE) {
      // Simulate upload progress
      const interview = devCreateInterview(projectId, file.name, file.size);
      const total = file.size;
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        if (callbacks?.signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
        await new Promise((r) => setTimeout(r, 200));
        callbacks?.onProgress?.(Math.round((total / steps) * i), total);
      }
      devSimulateProcessing(projectId, interview.id);
      return devGetInterview(projectId, interview.id)!;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    const cancelSource: CancelTokenSource = axios.CancelToken.source();

    // Wire AbortSignal → Axios CancelToken
    callbacks?.signal?.addEventListener("abort", () => cancelSource.cancel("Upload cancelled"));

    const res = await getApiClient().post(
      `/projects/${projectId}/interviews/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        cancelToken: cancelSource.token,
        timeout: 0, // no timeout for uploads
        onUploadProgress: (e) => {
          if (e.total) callbacks?.onProgress?.(e.loaded, e.total);
        },
      }
    );

    // Unwrap the Django envelope: { success: true, data: { ... } }
    const body = res.data;
    const interview: Interview =
      body && typeof body === "object" && "success" in body && body.data
        ? body.data
        : body;

    return {
      ...interview,
      status: interview.status ?? interview.processing_status,
    };
  },

  /**
   * Poll the interview status until it reaches a terminal state.
   */
  getInterviewStatus: (projectId: string, interviewId: string) => {
    if (DEV_MODE) {
      const interview = devGetInterview(projectId, interviewId);
      if (interview) return Promise.resolve(interview);
      return Promise.reject(new Error("Interview not found"));
    }
    return api
      .get<Interview>(`/projects/${projectId}/interviews/${interviewId}/`)
      .then((i) => ({ ...i, status: i.status ?? i.processing_status }));
  },

  /**
   * Convenience: upload a file end-to-end (direct multipart upload).
   * This is the primary method called by the UploadInterview component.
   */
  fullUpload: async (
    projectId: string,
    file: File,
    callbacks?: UploadCallbacks
  ): Promise<Interview> => {
    return uploadApi.uploadFile(projectId, file, callbacks);
  },
};
