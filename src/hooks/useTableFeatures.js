import { useState, useMemo } from 'react';

/**
 * Custom hook to handle sorting and pagination for table data.
 * 
 * @param {Array} data - The raw data array to be sorted and paginated.
 * @param {Object} options - Configuration options.
 * @param {number} options.itemsPerPage - Number of items per page.
 * @param {Object} options.initialSort - Initial sorting configuration { key, direction }.
 * @returns {Object} Sorting and pagination state and helper functions.
 */
export const useTableFeatures = (data = [], { itemsPerPage = 10, initialSort = null, remote = false, totalItems: remoteTotal = 0 } = {}) => {
    const [sortConfig, setSortConfig] = useState(initialSort);
    const [currentPage, setCurrentPage] = useState(1);

    // Sorting Logic
    const sortedData = useMemo(() => {
        if (remote) return data; // Bypass client-side sorting if remote
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // Handle nested properties (e.g., 'customer.name')
                const getNestedValue = (obj, path) => {
                    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
                };

                let aValue = getNestedValue(a, sortConfig.key);
                let bValue = getNestedValue(b, sortConfig.key);

                // Handle null/undefined
                if (aValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
                if (bValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;

                // Numeric comparison
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }

                // Date comparison
                const aDate = new Date(aValue);
                const bDate = new Date(bValue);
                if (!isNaN(aDate) && !isNaN(bDate) && typeof aValue === 'string' && aValue.includes('-')) {
                    return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
                }

                // String comparison
                aValue = aValue.toString().toLowerCase();
                bValue = bValue.toString().toLowerCase();

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig, remote]);

    // Pagination Logic
    const totalPages = remote ? Math.ceil(remoteTotal / itemsPerPage) : Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        if (remote) return data; // Bypass client-side slicing if remote
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage, remote, data]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            // Reset sort
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    return {
        data: paginatedData,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems: remote ? remoteTotal : data.length
    };
};
