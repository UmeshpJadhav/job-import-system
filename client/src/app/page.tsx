"use client";

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import Header from '../components/Header';
import HistoryTable from '../components/HistoryTable';
import Pagination from '../components/Pagination';
import { jobService } from '../services/api';
import { ImportLog } from '../types';

const INITIAL_METRICS = { totalFetched: 0, totalImported: 0, newJobs: 0, updatedJobs: 0, failedJobs: 0 };

export default function Home() {
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const isProcessing = logs.some(log => log.status === 'processing' || log.status === 'pending');

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
                            importName: data.importName || 'External Feed', // Use dynamic name
                            status: 'processing',
                            startTime: new Date().toISOString(),
                            metrics: INITIAL_METRICS,
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

    // Polling Fallback: If any job is processing, poll every 3 seconds to handle missed socket events
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isProcessing) {
            interval = setInterval(() => {
                fetchHistory(pageRef.current);
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isProcessing]);

    const handleTrigger = async () => {
        try {
            setTriggering(true);
            const data = await jobService.triggerImport();
            const { jobs } = data; // Expecting array of jobs

            setLogs(prevLogs => {
                const newLogs: ImportLog[] = [];

                // Create optimistic log for each job in the batch
                if (Array.isArray(jobs)) {
                    jobs.forEach((job: { runId: string, importName: string }) => {
                        if (!prevLogs.some(l => l.runId === job.runId)) {
                            newLogs.push({
                                _id: 'temp-' + Math.random().toString(36).substr(2, 9),
                                runId: job.runId,
                                importName: job.importName,
                                status: 'pending',
                                startTime: new Date().toISOString(),
                                metrics: INITIAL_METRICS,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            } as ImportLog);
                        }
                    });
                }

                if (page === 1 && newLogs.length > 0) {
                    return [...newLogs, ...prevLogs].slice(0, 10);
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
