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
                    Showing <span className="grad-num">{startIndex + 1}–{endIndex}</span> of <span className="grad-num">{totalItems}</span>
                </span>
            )}

            <div className="pg-buttons">
                <button className={`pg-ctrl ${canPrev ? 'can' : ''}`} onClick={prev} disabled={!canPrev}>
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

                <button className={`pg-ctrl ${canNext ? 'can' : ''}`} onClick={next} disabled={!canNext}>
                    {mini ? '' : 'Next'} <FaChevronRight />
                </button>
            </div>

            <style>{`
                .pagination-controls {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 20px 0; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);
                }
                .pagination-controls.mini { justify-content: center; border: none; padding: 10px 0; }

                .pg-info { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
                .grad-num { color: #50c8ff; }

                .pg-buttons { display: flex; gap: 8px; align-items: center; }

                .pg-ctrl, .pg-num {
                    height: 38px; min-width: 38px; display: grid; place-items: center;
                    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px; color: rgba(255, 255, 255, 0.6);
                    font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.3s;
                    padding: 0 14px;
                }
                .pg-num { padding: 0; }
                .pg-num.dots { background: transparent; border: none; cursor: default; }

                .pg-ctrl:hover.can, .pg-num:hover:not(.active):not(.dots) {
                    background: rgba(255, 255, 255, 0.1); color: #fff; transform: translateY(-1px);
                    border-color: rgba(80, 200, 255, 0.3);
                }

                .pg-num.active {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white; border: none; box-shadow: 0 8px 15px rgba(59, 130, 246, 0.3);
                }

                .pg-ctrl:disabled { opacity: 0.3; cursor: not-allowed; }

                @media (max-width: 600px) {
                    .pagination-controls { flex-direction: column; gap: 14px; align-items: center; }
                }
            `}</style>
        </div>
    );
};

export default Pagination;
