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
    VALIDATION: {
        description: 'Invalid request',
        status: 400,
        code: 'VALIDATION_ERROR',
    },
    BAD_REQUEST: {
        description: 'Bad request',
        status: 400,
        code: 'BAD_REQUEST_ERROR',
    },
    DB_DUPLICATE_CONFLICT: {
        description: 'Duplicate conflict. Resource already exists',
        status: 409,
        code: 'DB_DUPLICATE_CONFLICT_ERROR',
    },
    INVALID_CREDENTIALS: {
        description: 'Invalid credentials',
        status: 401,
        code: 'INVALID_CREDENTIALS_ERROR',
    },
    TOKEN_EXPIRED: {
        description: 'Provided token has expired!',
        status: 403,
        code: 'TOKEN_EXPIRED_ERROR',
    },
    UNPROCESSABLE_ENTITY: {
        description: 'Unprocessable entity',
        status: 422,
        code: 'UNPROCESSABLE_ENTITY_ERROR',
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

function processJoiValidationError(error) {
    if (error) {
        const errorType = error.details[0].type;
        if (errorType === 'any.required' || errorType === 'any.only'
        ) {
            throw errorResponder(errors.BAD_REQUEST, error.details[0].message);
        } else {
            // anggap ini field ada tapi tidak lolos validasi
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, error.details[0].message);
        }
    }
}

module.exports = {
    errorResponder,
    errors,
    processJoiValidationError
};