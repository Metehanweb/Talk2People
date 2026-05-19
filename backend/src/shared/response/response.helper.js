
export function successResponse(data) {
    return {
        success: true,
        data,
    };
}

export function listResponse(data, meta) {
    return {
        success: true,
        data,
        meta,
    };
}
