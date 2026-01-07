"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Header from '../components/Header';
import HistoryTable from '../components/HistoryTable';
import Pagination from '../components/Pagination';
import { jobService } from '../services/api';
import { ImportLog } from '../types';

export default function Home() {
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async (pageToFetch = page) => {
        try {
            setLoading(true);
            const data = await jobService.getHistory(pageToFetch);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(page);

        // Socket.IO Connection
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        socket.on('import-update', (data) => {
            console.log('Real-time update received:', data);
            fetchHistory(page);
        });

        return () => {
            socket.disconnect();
        };
    }, [page]);

    const handleTrigger = async () => {
        try {
            setTriggering(true);
            await jobService.triggerImport();
            // No need to fetch immediately, socket will trigger update
        } catch (err) {
            alert('Failed to trigger import');
        } finally {
            setTriggering(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <Header triggering={triggering} onTrigger={handleTrigger} />
                <HistoryTable logs={logs} loading={loading} />
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </main>
    );
}
