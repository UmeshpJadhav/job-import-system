import { AlertCircle, CheckCircle, Clock, RotateCcw } from 'lucide-react';

export default function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'processing': return <RotateCcw className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
        default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
}
