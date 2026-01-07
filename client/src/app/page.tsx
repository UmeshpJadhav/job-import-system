"use client";

import { useEffect, useState, useRef } from 'react';
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
    const pageRef = useRef(page);

    useEffect(() => {
        pageRef.current = page;
        fetchHistory(page);
    }, [page]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to WebSocket', socket.id);
            fetchHistory(pageRef.current);
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
        });

        socket.on('import-update', (data) => {
            setLogs((prevLogs) => {
                const existingLogIndex = prevLogs.findIndex(log => log.runId === data.runId);

                if (existingLogIndex > -1) {
                    const updatedLogs = [...prevLogs];
                    const log = { ...updatedLogs[existingLogIndex] };

                    if (data.type === 'progress') {
                        log.status = 'processing';
                    } else if (data.type === 'started') {
                        log.status = 'processing';
                    } else if (data.type === 'completed') {
                        log.status = 'completed';
                        log.metrics = data.metrics;
                        log.endTime = new Date().toISOString();
                    } else if (data.type === 'failed') {
                        log.status = 'failed';
                        log.endTime = new Date().toISOString();
                        if (data.error) {
                            log.failureLogs = log.failureLogs || [];
                            log.failureLogs.push({
                                message: data.error,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }

                    updatedLogs[existingLogIndex] = log;
                    return updatedLogs;
                } else if (data.type === 'started') {
                    if (pageRef.current === 1) {
                        const newLog: ImportLog = {
                            _id: 'socket-' + Date.now(),
                            runId: data.runId,
                            importName: 'General Import',
                            status: 'processing',
                            startTime: new Date().toISOString(),
                            metrics: { totalFetched: 0, totalImported: 0, newJobs: 0, updatedJobs: 0, failedJobs: 0 },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        } as ImportLog;
                        return [newLog, ...prevLogs].slice(0, 10);
                    }
                }
                return prevLogs;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleTrigger = async () => {
        try {
            setTriggering(true);
            const data = await jobService.triggerImport();
            const { runId, importName } = data;
            setLogs(prevLogs => {
                if (prevLogs.some(l => l.runId === runId)) return prevLogs;

                const newLog: ImportLog = {
                    _id: 'temp-' + Date.now(),
                    runId: runId,
                    importName: importName, // User enforced URL only
                    status: 'pending',
                    startTime: new Date().toISOString(),
                    metrics: { totalFetched: 0, totalImported: 0, newJobs: 0, updatedJobs: 0, failedJobs: 0 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } as ImportLog;

                if (page === 1) {
                    return [newLog, ...prevLogs].slice(0, 10);
                }
                return prevLogs;
            });

        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || err.message || 'Failed to trigger import';
            alert(message);
        } finally {
            setTriggering(false);
        }
    };

    const isProcessing = logs.some(log => log.status === 'processing' || log.status === 'pending');

    return (
        <main className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <Header triggering={triggering || isProcessing} onTrigger={handleTrigger} />
                <HistoryTable logs={logs} loading={loading} />
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </main>
    );
}
