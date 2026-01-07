import { Play, RotateCcw } from 'lucide-react';

interface HeaderProps {
    triggering: boolean;
    onTrigger: () => void;
}

export default function Header({ triggering, onTrigger }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Import History Tracking</h1>
            <button
                onClick={onTrigger}
                disabled={triggering}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
                {triggering ? <RotateCcw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
                Trigger Import
            </button>
        </div>
    );
}
