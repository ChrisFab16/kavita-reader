import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useServerStore } from './serverStore';
import { useReaderSettingsStore } from './readerSettingsStore';
import { downloadChapterPages, removeOfflineChapter } from '../services/offlineChapterStorage';
import { detectReaderKind } from '../utils/readerKind';

export type DownloadJobStatus =
  | 'queued'
  | 'waitingForWifi'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type DownloadJob = {
  id: string;
  serverId: string;
  seriesId: number;
  chapterId: number;
  title: string;
  status: DownloadJobStatus;
  progress: number;
  totalPages: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

interface DownloadState {
  jobs: DownloadJob[];
  activeJobId: string | null;
  enqueueChapter: (input: {
    serverId: string;
    seriesId: number;
    chapterId: number;
    title: string;
    chapterFormat?: number;
    fileName?: string;
  }) => void;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  processQueue: () => Promise<void>;
}

let processing = false;
let activeAbort: AbortController | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function newJobId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      jobs: [],
      activeJobId: null,

      enqueueChapter: (input) => {
        const job: DownloadJob = {
          id: newJobId(),
          serverId: input.serverId,
          seriesId: input.seriesId,
          chapterId: input.chapterId,
          title: input.title,
          status: 'queued',
          progress: 0,
          totalPages: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((state) => ({ jobs: [job, ...state.jobs] }));
        void get().processQueue();
      },

      cancelJob: (jobId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        if (get().activeJobId === jobId) {
          activeAbort?.abort();
        }
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? { ...j, status: 'cancelled' as const, updatedAt: nowIso() }
              : j
          ),
        }));
      },

      retryJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'queued' as const,
                  errorMessage: undefined,
                  progress: 0,
                  updatedAt: nowIso(),
                }
              : j
          ),
        }));
        void get().processQueue();
      },

      removeJob: async (jobId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;
        if (job.status === 'completed') {
          await removeOfflineChapter(job.serverId, job.chapterId);
        }
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== jobId),
        }));
      },

      processQueue: async () => {
        if (processing) return;
        processing = true;

        try {
          while (true) {
            const { jobs, activeJobId } = get();
            if (activeJobId) break;

            const next = jobs.find((j) => j.status === 'queued');
            if (!next) break;

            const allowMobile = useReaderSettingsStore.getState().downloadOnMobileData;
            if (!allowMobile) {
              // Wi‑Fi detection deferred — proceed on any connection for now.
            }

            const client = useServerStore.getState().getClientForServer(next.serverId);
            if (!client) {
              set((state) => ({
                jobs: state.jobs.map((j) =>
                  j.id === next.id
                    ? {
                        ...j,
                        status: 'failed' as const,
                        errorMessage: 'Server not connected',
                        updatedAt: nowIso(),
                      }
                    : j
                ),
              }));
              continue;
            }

            set({ activeJobId: next.id });
            activeAbort = new AbortController();

            set((state) => ({
              jobs: state.jobs.map((j) =>
                j.id === next.id
                  ? { ...j, status: 'downloading' as const, updatedAt: nowIso() }
                  : j
              ),
            }));

            try {
              const kind = await detectReaderKind(client, next.chapterId);
              if (kind === 'epub') {
                throw new Error('EPUB offline download not yet supported — use comic/PDF chapters');
              }

              const chapterInfo = await client.getChapterInfoForReader(next.chapterId);
              const totalPages = chapterInfo.pages ?? 0;

              set((state) => ({
                jobs: state.jobs.map((j) =>
                  j.id === next.id ? { ...j, totalPages, updatedAt: nowIso() } : j
                ),
              }));

              await downloadChapterPages(
                client,
                next.serverId,
                next.seriesId,
                next.chapterId,
                chapterInfo,
                ({ completedPages, totalPages: total }) => {
                  set((state) => ({
                    jobs: state.jobs.map((j) =>
                      j.id === next.id
                        ? {
                            ...j,
                            progress: total > 0 ? completedPages / total : 0,
                            totalPages: total,
                            updatedAt: nowIso(),
                          }
                        : j
                    ),
                  }));
                },
                activeAbort.signal
              );

              set((state) => ({
                jobs: state.jobs.map((j) =>
                  j.id === next.id
                    ? {
                        ...j,
                        status: 'completed' as const,
                        progress: 1,
                        updatedAt: nowIso(),
                      }
                    : j
                ),
              }));
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Download failed';
              const cancelled = message === 'Download cancelled';
              set((state) => ({
                jobs: state.jobs.map((j) =>
                  j.id === next.id
                    ? {
                        ...j,
                        status: cancelled ? ('cancelled' as const) : ('failed' as const),
                        errorMessage: cancelled ? undefined : message,
                        updatedAt: nowIso(),
                      }
                    : j
                ),
              }));
            } finally {
              activeAbort = null;
              set({ activeJobId: null });
            }
          }
        } finally {
          processing = false;
        }
      },
    }),
    {
      name: 'download-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ jobs: state.jobs }),
    }
  )
);
