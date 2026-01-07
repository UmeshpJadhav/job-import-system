import axios from 'axios';
import { HistoryResponse } from '../types';

const API_BASE = 'http://localhost:5000/api';

export const jobService = {
    getHistory: async (page: number = 1) => {
        const res = await axios.get<HistoryResponse>(`${API_BASE}/history?page=${page}`);
        return res.data;
    },

    triggerImport: async () => {
        await axios.post(`${API_BASE}/import/trigger`);
    }
};
