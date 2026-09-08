package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.api.request.MoveRequest;
import fr.epita.assistants.ping.api.request.PathRequest;
import fr.epita.assistants.ping.domain.executor.FileService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.Logger;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.InputStream;
import java.util.UUID;

@Path("/api/projects/{projectId}/files")
@Produces(MediaType.APPLICATION_JSON)
public class FileResource {

    @Inject
    FileService fileService;

    @Inject
    JsonWebToken jwt;

    private UUID getUserId() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        return UUID.fromString(jwt.getSubject());
    }

    private boolean isAdmin() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        return jwt.getGroups().contains("admin");
    }

    @GET
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response getFile(@PathParam("projectId") UUID projectId, @QueryParam("path") String relPath) {
        UUID userId = getUserId();
        byte[] content = fileService.readFile(projectId, userId, isAdmin(), relPath);
        return Response.ok(content, MediaType.APPLICATION_OCTET_STREAM).build();
    }

    @POST
    public Response createFile(@PathParam("projectId") UUID projectId, PathRequest req) {
        UUID userId = getUserId();

        if (req == null || req.getRelativePath() == null || req.getRelativePath().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        fileService.createFile(projectId, userId, isAdmin(), req.getRelativePath());
        Logger.info("File '" + req.getRelativePath() + "' created in project " + projectId + " by user " + userId);
        return Response.status(Response.Status.CREATED).build();
    }

    @DELETE
    public Response deleteFile(@PathParam("projectId") UUID projectId, PathRequest req) {
        UUID userId = getUserId();

        if (req == null || req.getRelativePath() == null || req.getRelativePath().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        fileService.deleteFile(projectId, userId, isAdmin(), req.getRelativePath());
        Logger.info("File '" + req.getRelativePath() + "' deleted in project " + projectId + " by user " + userId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/move")
    public Response moveFile(@PathParam("projectId") UUID projectId, MoveRequest req) {
        UUID userId = getUserId();

        if (req == null || req.getDst() == null || req.getDst().isBlank() || req.getSrc() == null || req.getSrc().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        fileService.moveFile(projectId, userId, isAdmin(), req.getSrc(), req.getDst());
        Logger.info("File moved in project " + projectId + " by user " + userId + " from '" + req.getSrc() + "' to '" + req.getDst() + "'");
        return Response.noContent().build();
    }

    @POST
    @Path("/upload")
    @Consumes(MediaType.APPLICATION_OCTET_STREAM)
    public Response upload(@PathParam("projectId") UUID projectId,
                           @QueryParam("path") String relPath,
                           InputStream fileContent) {
        UUID userId = getUserId();

        fileService.uploadFile(projectId, userId, isAdmin(), relPath, fileContent);
        Logger.info("File uploaded to '" + relPath + "' in project " + projectId + " by user " + userId);
        return Response.status(Response.Status.CREATED).build();
    }


}
