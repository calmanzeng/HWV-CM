import { createContext, createElement, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  createEvent,
  createProfile,
  getActiveEvent,
  type EventRecord,
  type Profile,
  type Workspace,
} from './domain';
import { clearWorkspace, loadWorkspace, saveWorkspace } from './storage';

export type WorkspaceController = {
  workspace: Workspace;
  activeEvent: EventRecord | undefined;
  storageError: string | null;
  safeMode: boolean;
  updateWorkspace: (recipe: (current: Workspace) => Workspace) => void;
  updateProfile: (recipe: (profile: Profile) => Profile) => void;
  updateEvent: (id: string, recipe: (event: EventRecord) => EventRecord) => void;
  startNewEvent: () => EventRecord;
  replaceWorkspace: (workspace: Workspace) => void;
  deleteAllData: () => void;
};

export const WorkspaceContext = createContext<WorkspaceController | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadWorkspace);
  const [workspace, setWorkspace] = useState(initial.workspace);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const [storageError, setStorageError] = useState<string | null>(initial.error);
  const [safeMode, setSafeMode] = useState(initial.safeMode);
  const safeModeRef = useRef(initial.safeMode);

  const commit = useCallback((next: Workspace) => {
    workspaceRef.current = next;
    setWorkspace(next);
    if (safeModeRef.current) return;
    try {
      saveWorkspace(next);
      setStorageError(null);
    } catch {
      setStorageError('无法写入浏览器本地存储。请先导出备份或清理浏览器空间；当前页面内容仍保留在内存中。');
    }
  }, []);

  const updateWorkspace = useCallback((recipe: (current: Workspace) => Workspace) => {
    commit(recipe(workspaceRef.current));
  }, [commit]);

  const updateProfile = useCallback((recipe: (profile: Profile) => Profile) => {
    updateWorkspace((current) => ({
      ...current,
      profile: { ...recipe(current.profile), updatedAt: new Date().toISOString() },
    }));
  }, [updateWorkspace]);

  const updateEvent = useCallback((id: string, recipe: (event: EventRecord) => EventRecord) => {
    updateWorkspace((current) => ({
      ...current,
      events: current.events.map((event) => event.id === id
        ? { ...recipe(event), updatedAt: new Date().toISOString() }
        : event),
    }));
  }, [updateWorkspace]);

  const startNewEvent = useCallback(() => {
    const event = createEvent();
    updateWorkspace((current) => ({
      ...current,
      events: [...current.events, event],
      activeEventId: event.id,
    }));
    return event;
  }, [updateWorkspace]);

  const replaceWorkspace = useCallback((replacement: Workspace) => {
    safeModeRef.current = false;
    setSafeMode(false);
    setStorageError(null);
    commit(replacement);
  }, [commit]);

  const deleteAllData = useCallback(() => {
    try {
      clearWorkspace();
      const empty = { profile: createProfile(), events: [], activeEventId: null } satisfies Workspace;
      workspaceRef.current = empty;
      setWorkspace(empty);
      safeModeRef.current = false;
      setSafeMode(false);
      setStorageError(null);
    } catch {
      setStorageError('浏览器未能清除本应用数据；请在当前浏览器设置中清理此站点的存储。');
    }
  }, []);

  const value: WorkspaceController = {
    workspace,
    activeEvent: getActiveEvent(workspace),
    storageError,
    safeMode,
    updateWorkspace,
    updateProfile,
    updateEvent,
    startNewEvent,
    replaceWorkspace,
    deleteAllData,
  };

  return createElement(WorkspaceContext.Provider, { value }, children);
}

export function useAppState(): WorkspaceController {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('应用状态只能在 WorkspaceProvider 中使用');
  return value;
}
