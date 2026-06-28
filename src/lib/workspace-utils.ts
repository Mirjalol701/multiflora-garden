import type { WorkspaceState } from "@/lib/workspace-types";

export function mergeWorkspace(
  local: WorkspaceState,
  remote: Partial<WorkspaceState>
): WorkspaceState {
  const mergeById = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of b) map.set(item.id, item);
    for (const item of a) map.set(item.id, item);
    return Array.from(map.values());
  };

  return {
    ...local,
    onboardingCompleted:
      local.onboardingCompleted ||
      remote.onboardingCompleted ||
      local.projects.length > 0 ||
      (remote.projects?.length ?? 0) > 0,
    userRole: local.userRole ?? remote.userRole ?? null,
    aiPreferences: local.aiPreferences ?? remote.aiPreferences ?? local.aiPreferences,
    projects: mergeById(local.projects, remote.projects ?? []),
    chats: mergeById(local.chats, remote.chats ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    artifacts: mergeById(local.artifacts, remote.artifacts ?? []),
    memories: mergeById(local.memories, remote.memories ?? []),
    activeProjectId: local.activeProjectId ?? remote.activeProjectId ?? null,
  };
}

export function extractNextStep(content: string): string | null {
  const patterns = [
    /\*\*Следующий шаг:?\*\*\s*([\s\S]+?)$/i,
    /(?:^|\n)Следующий шаг:\s*([\s\S]+?)$/i,
    /\*\*Next step:?\*\*\s*([\s\S]+?)$/i,
    /(?:^|\n)Next step:\s*([\s\S]+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const step = match[1]
        .replace(/^\s*[-•]\s*/, "")
        .replace(/\*\*/g, "")
        .trim()
        .split("\n")[0]
        ?.trim();
      if (step && step.length > 3) return step;
    }
  }
  return null;
}
