package fr.epita.assistants.ping.errors;

import fr.epita.assistants.ping.utils.HttpError;
import fr.epita.assistants.ping.utils.IHttpError;
import jakarta.ws.rs.core.Response.Status;
import lombok.Getter;

import static jakarta.ws.rs.core.Response.Status.*;


@Getter
public enum ErrorsCode implements IHttpError {
    EXAMPLE_ERROR(BAD_REQUEST, "Example error: %s"),
    INVALID_FORMAT(Status.BAD_REQUEST, "Invalid %s format"),
    MISSING_ARG(Status.BAD_REQUEST, "%s is missing or empty."),
    ALREADY_EXIST(Status.CONFLICT, "%s '%s' is already taken."),
    NOT_AUTHENTICATED(Status.UNAUTHORIZED, "You must be authenticated."),
    FORBIDDEN(Status.FORBIDDEN, "You are not authorized to perform this action."),
    NOT_FOUND(Status.NOT_FOUND, "%s not found");
    ;

    private final HttpError error;
    private final String pattern;

    ErrorsCode(Status status, String message) {
        error = new HttpError(status, message);
        pattern = message;
    }

    @Override
    public RuntimeException get(Object... args) {
        return error.get(args);
    }

    @Override
    public void throwException(Object... args) {
        throw error.get(args);
    }
}
