"use client";

const ACCOUNT_KEY = "minimumtostart.accountId";
const WORKSPACE_KEYS = [
  "minimumtostart.answers",
  "minimumtostart.generated",
  "minimumtostart.canvas",
  "minimumtostart.board",
  "minimumtostart.landing",
  "minimumtostart.mindmap",
  "minimumtostart.emails",
  "minimumtostart.projectId",
];

export function bindWorkspaceToAccount(userId: string) {
  let storage: Storage;

  try {
    storage = window.localStorage;
    const probeKey = "minimumtostart.storage-check";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
  } catch {
    return;
  }

  const currentUserId = storage.getItem(ACCOUNT_KEY);

  if (currentUserId && currentUserId !== userId) {
    WORKSPACE_KEYS.forEach((key) => storage.removeItem(key));
  }

  storage.setItem(ACCOUNT_KEY, userId);
}
