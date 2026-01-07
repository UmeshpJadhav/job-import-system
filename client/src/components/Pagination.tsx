interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    return (
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700">Page {page} of {totalPages}</span>
            <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    );
}
