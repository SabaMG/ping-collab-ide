package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.api.request.MoveRequest;
import fr.epita.assistants.ping.api.request.PathRequest;
import fr.epita.assistants.ping.api.response.FSEntryResponse;
import fr.epita.assistants.ping.domain.executor.FolderService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.Logger;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.UUID;

@Path("/api/projects/{projectId}/folders")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class FolderResource {

    @Inject
    FolderService folderService;

    @Inject
    JsonWebToken jwt;

    private UUID getUserId() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        return UUID.fromString(jwt.getSubject());
    }

    @GET
    public Response listFolder(@PathParam("projectId") UUID projectId,
                               @QueryParam("path") @DefaultValue("") String path) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = getUserId();
        List<FSEntryResponse> content = folderService.listFolder(projectId, userId, path);
        return Response.ok(content).build();
    }

    @POST
    public Response createFolder(@PathParam("projectId") UUID projectId, PathRequest request) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = getUserId();

        if (request == null || request.getRelativePath() == null || request.getRelativePath().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        folderService.createFolder(projectId, userId, request.getRelativePath());
        Logger.info("Folder '" + request.getRelativePath() + "' created in project " + projectId + " by user " + userId);
        return Response.status(Response.Status.CREATED).build();
    }

    @DELETE
    public Response deleteFolder(@PathParam("projectId") UUID projectId, PathRequest request) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = getUserId();

        if (request == null || request.getRelativePath() == null || request.getRelativePath().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        folderService.deleteFolder(projectId, userId, request.getRelativePath());
        Logger.info("Folder '" + request.getRelativePath() + "' deleted in project " + projectId + " by user " + userId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/move")
    public Response moveFolder(@PathParam("projectId") UUID projectId, MoveRequest request) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = getUserId();

        if (request == null || request.getSrc() == null || request.getSrc().isBlank() ||
                request.getDst() == null || request.getDst().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        folderService.moveFolder(projectId, userId, request.getSrc(), request.getDst());
        Logger.info("Folder moved in project " + projectId + " by user " + userId + " from '" + request.getSrc() + "' to '" + request.getDst() + "'");
        return Response.noContent().build();
    }

}