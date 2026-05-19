const {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    DEFAULT_SORT_FIELD,
    DEFAULT_SORT_ORDER,
} = require('../constants/constants');

/**
 * @param {object} query
 * @returns {{ page: number, limit: number, sort: string, sortOrder: string }}
 */
function parsePaginationQuery(query) {
    let page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) {
        page = DEFAULT_PAGE;
    }

    let limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    const sort = query.sort || DEFAULT_SORT_FIELD;
    const sortOrder = query.sortOrder || DEFAULT_SORT_ORDER;

    return { page, limit, sort, sortOrder };
}

/**
 *
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @param {string} sort
 * @param {string} sortOrder
 * @param {object} filters
 * @returns {object}
 */
function buildPaginationMeta(page, limit, total, sort, sortOrder, filters) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        sort: `${sort}:${sortOrder}`,
        filters: filters || {},
    };
}

/**
 *
 * @param {number} page
 * @param {number} limit 
 * @returns {number}
 */
function calculateSkip(page, limit) {
    return (page - 1) * limit;
}

module.exports = {
    parsePaginationQuery,
    buildPaginationMeta,
    calculateSkip,
};
