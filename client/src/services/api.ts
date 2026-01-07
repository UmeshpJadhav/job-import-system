import axios from 'axios';
import { HistoryResponse } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const jobService = {
    getHistory: async (page: number = 1) => {
        const res = await axios.get<HistoryResponse>(`${API_BASE}/history?page=${page}`);
        return res.data;
    },

    triggerImport: async () => {
        const res = await axios.post<{ message: string, runId: string, importName: string }>(`${API_BASE}/import/trigger`, {});
        return res.data;
    }
};
