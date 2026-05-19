// ================================================
// Talk2People — Shared Constants
// ================================================

// Pagination varsayılan değerleri
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// API versiyonu
const API_PREFIX = 'api/v1';

// Sıralama yönleri
const SORT_ORDER = {
    ASC: 'asc',
    DESC: 'desc',
};

// Varsayılan sıralama alanı
const DEFAULT_SORT_FIELD = 'createdAt';
const DEFAULT_SORT_ORDER = SORT_ORDER.DESC;

module.exports = {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    API_PREFIX,
    SORT_ORDER,
    DEFAULT_SORT_FIELD,
    DEFAULT_SORT_ORDER,
};
