const PAGE_SIZE = 100;

function paginate(videos, requestedPage) {
    const total = videos.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const text = String(requestedPage ?? '1');
    const parsed = /^\d{1,10}$/.test(text) ? Number(text) : 1;
    const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, totalPages) : 1;
    const start = (page - 1) * PAGE_SIZE;
    const pages = [];
    for (let number = 1; number <= totalPages; number++) {
        if (number === 1 || number === totalPages || Math.abs(number - page) <= 2) {
            if (pages.length && number > pages.at(-1) + 1) pages.push(null);
            pages.push(number);
        }
    }
    return {
        videos: videos.slice(start, start + PAGE_SIZE),
        pagination: { page, totalPages, total, from: total ? start + 1 : 0, to: Math.min(start + PAGE_SIZE, total), pages }
    };
}

module.exports = { PAGE_SIZE, paginate };
