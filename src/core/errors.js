const errors = {
    ROUTE_NOT_FOUND: {
        description: "Route not found!",
        status: 404,
        code: 'ROUTE_NOT_FOUND_ERROR',
    },
    NOT_FOUND: {
        description: "Empty response, not found!",
        status: 404,
        code: 'NOT_FOUND_ERROR',
    },
    NO_ARGUMENT: {
        description: 'Required arguments not supplied',
        status: 500,
        code: 'NO_ARGUMENT_ERROR',
    },
    INVALID_ARGUMENT: {
        description: 'Required arguments not valid',
        status: 500,
        code: 'INVALID_ARGUMENT',
    },
    INVALID_CREDENTIALS: {
        description: 'Invalid credentials',
        status: 403,
        code: 'INVALID_CREDENTIALS_ERROR',
    },
    INVALID_TOKEN: {
        description: "Invalid token",
        status: 403,
        code: 'INVALID_TOKEN_ERROR'
    },
    DB: {
        description: 'Database error occurred',
        status: 500,
        code: 'DB_ERROR',
    },
};


function errorResponder(code, status, description, message = "") {
    const err = new Error(message);

    err.code = code;
    err.status = status;
    err.description = description;

    return err;
}

function errorResponder(type, message = "") {
    const error = new Error(message);

    if (type) {
        error.code = type.code || 'UNKNOWN_ERROR';
        error.status = type.status || 500;
        error.description = type.description || 'Unknown error occurred';
    }

    return error;
}

module.exports = {
    errorResponder,
    errors
};