import { Play, RotateCcw } from 'lucide-react';

interface HeaderProps {
    triggering: boolean;
    onTrigger: () => void;
}

export default function Header({ triggering, onTrigger }: HeaderProps) {
    return (
        <div className="flex justify-between items-center mb-8 mt-6">
            <h1 className="text-3xl font-bold text-gray-900">Import History Tracking</h1>
            <button
                onClick={onTrigger}
                disabled={triggering}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {triggering ? <RotateCcw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
                Trigger Import
            </button>
        </div>
    );
}
