export const getTaskJobId = (task) => (
    task?.jobId ||
    task?.job?.id ||
    task?.contractService?.jobId ||
    task?.contractService?.job?.id ||
    ''
);

export const getEligibleVendorsForJobs = (vendorLists) => {
    if (!Array.isArray(vendorLists) || vendorLists.length === 0) return [];

    return (vendorLists[0] || []).filter(vendor => (
        vendorLists.slice(1).every(list => (
            Array.isArray(list) && list.some(candidate => candidate.id === vendor.id)
        ))
    ));
};
