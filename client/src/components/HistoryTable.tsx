import { ImportLog } from '../types';
import StatusIcon from './StatusIcon';

interface HistoryTableProps {
    logs: ImportLog[];
    loading: boolean;
}

export default function HistoryTable({ logs, loading }: HistoryTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">File Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Fetched</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Imported</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">New</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Updated</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Failed</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <StatusIcon status={log.status} />
                                    <span className="font-medium text-gray-900 truncate max-w-[300px] block" title={log.importName}>{log.importName || 'Unknown Import'}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">{log.status}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                <div>Start: {new Date(log.startTime).toLocaleTimeString()}</div>
                                {log.endTime && <div className="text-xs text-gray-400">End: {new Date(log.endTime).toLocaleTimeString()}</div>}
                            </td>
                            <td className="px-6 py-4 text-center font-medium text-gray-700 bg-gray-50">{log.metrics.totalFetched}</td>
                            <td className="px-6 py-4 text-center font-medium text-blue-600">{log.metrics.totalImported}</td>
                            <td className="px-6 py-4 text-center text-green-600">{log.metrics.newJobs}</td>
                            <td className="px-6 py-4 text-center text-amber-600">{log.metrics.updatedJobs}</td>
                            <td className="px-6 py-4 text-center text-red-600">{log.metrics.failedJobs}</td>
                        </tr>
                    ))}
                    {logs.length === 0 && !loading && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-500">No import history found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
