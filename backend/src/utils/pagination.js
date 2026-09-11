// =============================================================
// FILE: backend/src/utils/pagination.js
// =============================================================
// Purpose:
//   Standard pagination parsing + response shaping. Used by
//   list endpoints across vehicles, inquiries, admin views.
// =============================================================

'use strict';

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

/**
 * Parse `page` and `limit` from query. Always bounded.
 * @param {object} query
 * @returns {{ page:number, limit:number, skip:number }}
 */
function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Shape a paginated response.
 * @param {any[]} data
 * @param {number} total
 * @param {{ page:number, limit:number }} p
 */
function paginatedResponse(data, total, { page, limit }) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { parsePagination, paginatedResponse };

// =============================================================
// END OF FILE: backend/src/utils/pagination.js
// =============================================================