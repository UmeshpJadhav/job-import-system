export interface Metrics {
    totalFetched: number;
    totalImported: number;
    newJobs: number;
    updatedJobs: number;
    failedJobs: number;
}

export interface FailureLog {
    message: string;
    timestamp: string;
}

export interface ImportLog {
    _id: string;
    runId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startTime: string;
    endTime?: string;
    metrics: Metrics;
    failureLogs?: FailureLog[];
}

export interface HistoryResponse {
    logs: ImportLog[];
    totalPages: number;
    currentPage: number;
}
