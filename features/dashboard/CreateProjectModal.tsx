"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { projectsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import {
  Button,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import type { Project } from "@/types";

export function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (project: Project) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const project = await projectsApi.create(
        name.trim(),
        description.trim() || undefined
      );
      onCreated?.(project);
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>New project</ModalHeader>
        <ModalBody>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Input
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q1 Customer Interviews"
            required
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Description{" "}
              <span className="font-normal text-surface-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={!name.trim()}>
            Create project
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
