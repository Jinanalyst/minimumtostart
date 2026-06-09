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
  const currentUserId = window.localStorage.getItem(ACCOUNT_KEY);

  if (currentUserId && currentUserId !== userId) {
    WORKSPACE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  }

  window.localStorage.setItem(ACCOUNT_KEY, userId);
}
