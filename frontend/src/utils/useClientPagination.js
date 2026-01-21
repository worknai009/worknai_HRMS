import { useState, useEffect, useMemo } from 'react';

export const useClientPagination = (items = [], pageSize = 10) => {
    const [page, setPage] = useState(1);

    // Reset page to 1 when items array reference changes (e.g. new search/filter results)
    useEffect(() => {
        setPage(1);
    }, [items]);

    const totalItems = items.length;
    // Calculate total pages, ensuring at least 1 page
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Ensure current page is valid
    const safePage = Math.min(Math.max(1, page), totalPages);

    // If safePage differs from page state (due to items changing length but not ref, or out of bounds), sync it
    // Actually, the derivation handles rendering. We only strictly need to sync if we want 'page' state to be accurate.
    // But let's just trust safePage for logic.

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const paginatedItems = useMemo(() => {
        return items.slice(startIndex, startIndex + pageSize);
    }, [items, startIndex, pageSize]);

    const canNext = safePage < totalPages;
    const canPrev = safePage > 1;

    const next = () => {
        if (canNext) setPage(p => p + 1);
    };

    const prev = () => {
        if (canPrev) setPage(p => p - 1);
    };

    const goToPage = (p) => {
        const target = Math.max(1, Math.min(p, totalPages));
        setPage(target);
    };

    return {
        page: safePage,
        setPage,
        goToPage,
        totalPages,
        paginatedItems,
        totalItems,
        startIndex,
        endIndex,
        next,
        prev,
        canNext,
        canPrev
    };
};

export default useClientPagination;
