import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ pager, mini = false }) => {
    const { page, totalPages, goToPage, next, prev, canNext, canPrev, startIndex, endIndex, totalItems } = pager;

    if (totalItems === 0) return null;

    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = mini ? 3 : 5; // How many pages to show

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first, last, and window around current
            let left = Math.max(1, page - 1);
            let right = Math.min(totalPages, page + 1);

            if (page === 1) right = Math.min(totalPages, 3);
            if (page === totalPages) left = Math.max(1, totalPages - 2);

            if (left > 1) {
                pages.push(1);
                if (left > 2) pages.push('...');
            }

            for (let i = left; i <= right; i++) {
                pages.push(i);
            }

            if (right < totalPages) {
                if (right < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className={`pagination-controls ${mini ? 'mini' : ''}`}>
            {!mini && (
                <span className="pg-info">
                    Showing {startIndex + 1}–{endIndex} of {totalItems}
                </span>
            )}

            <div className="pg-buttons">
                <button className={`pg-btn${mini ? '-xs' : ''}`} onClick={prev} disabled={!canPrev}>
                    <FaChevronLeft /> {mini ? '' : 'Prev'}
                </button>

                {getPageNumbers().map((p, idx) => (
                    <button
                        key={idx}
                        className={`pg-num ${p === page ? 'active' : ''} ${p === '...' ? 'dots' : ''}`}
                        onClick={() => typeof p === 'number' ? goToPage(p) : null}
                        disabled={p === '...'}
                    >
                        {p}
                    </button>
                ))}

                <button className={`pg-btn${mini ? '-xs' : ''}`} onClick={next} disabled={!canNext}>
                    {mini ? '' : 'Next'} <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
