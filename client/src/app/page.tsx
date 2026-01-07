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

    // Use Ref to access current page inside socket listener without re-binding
    const pageRef = useRef(page);

    useEffect(() => {
        pageRef.current = page;
        fetchHistory(page);
    }, [page]);

    useEffect(() => {
        // Socket.IO Connection
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to WebSocket', socket.id);
            // Self-heal: Fetch latest history on connect/reconnect to handle missed events
            fetchHistory(pageRef.current);
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
        });

        socket.on('import-update', (data) => {
            setLogs((prevLogs) => {
                const existingLogIndex = prevLogs.findIndex(log => log.runId === data.runId);

                if (existingLogIndex > -1) {
                    // Log found: Update it unconditionally (Server is Truth)
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
                    // Log not found (Socket beat API response, or other user triggered): Add it
                    if (pageRef.current === 1) {
                        const newLog: ImportLog = {
                            _id: 'socket-' + Date.now(),
                            runId: data.runId,
                            importName: 'General Import',
                            status: 'processing', // Started = Processing
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
    }, []); // Run once on mount

    const handleTrigger = async () => {
        try {
            setTriggering(true);
            const data = await jobService.triggerImport();
            const { runId } = data;

            // Optimistic Update
            setLogs(prevLogs => {
                // Duplicate Check: If socket already added it, don't add again
                if (prevLogs.some(l => l.runId === runId)) return prevLogs;

                const newLog: ImportLog = {
                    _id: 'temp-' + Date.now(),
                    runId: runId,
                    importName: 'General Import',
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

        } catch (err) {
            console.error(err);
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
