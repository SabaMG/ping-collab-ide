package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.api.response.LogEntryResponse;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.Logger;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static fr.epita.assistants.ping.errors.ErrorsCode.EXAMPLE_ERROR;

@Path("/api")
public class HelloWorldResource {

    @Inject
    JsonWebToken jwt;


    @GET
    @Path("/hello")
    @Produces(MediaType.TEXT_PLAIN)
    public Response helloWorld() {
        Logger.info("GET /api/hello called");
        return Response.ok("Hello World !").build();
    }

    @GET
    @Path("/error")
    @Produces(MediaType.APPLICATION_JSON)
    public Response error() {
        EXAMPLE_ERROR.throwException("This is an error");
        return Response.noContent().build(); // unreachable
    }

    @GET
    @Path("/logs")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response getLogs() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }

        List<LogEntryResponse> logs = new ArrayList<>();
        File file = new File(Logger.logFilePath);

        if (!file.exists()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Log file not found"))
                    .build();
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.replaceAll("\u001B\\[[;\\d]*m", "");

                int closingBracketIndex = line.indexOf("]");
                if (closingBracketIndex > 0 && line.startsWith("[")) {
                    String timestamp = line.substring(1, closingBracketIndex).trim();
                    String message = line.substring(closingBracketIndex + 1).trim();
                    logs.add(new LogEntryResponse(timestamp, message));
                } else {
                    logs.add(new LogEntryResponse("unknown", line.trim()));
                }
            }
        } catch (IOException e) {
            return Response.serverError()
                    .entity(Map.of("error", "Unable to read log file"))
                    .build();
        }

        return Response.ok(logs).build();
    }

}