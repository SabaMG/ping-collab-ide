package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.api.request.ExecFeatureRequest;
import fr.epita.assistants.ping.api.request.NewProjectRequest;
import fr.epita.assistants.ping.api.request.UpdateProjectRequest;
import fr.epita.assistants.ping.api.request.UserProjectRequest;
import fr.epita.assistants.ping.api.response.ProjectResponse;
import fr.epita.assistants.ping.api.response.ProjectStorageResponse;
import fr.epita.assistants.ping.converter.ProjectConverter;
import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.domain.executor.ProjectService;

import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.Logger;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.core.Context;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.config.inject.ConfigProperty;


import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Path("/api/projects")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class ProjectResource {

    @Inject
    ProjectService projectService;

    @Inject
    JsonWebToken jwt;

    @POST
    public Response createProject(NewProjectRequest req) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID ownerId = UUID.fromString(jwt.getSubject());

        if (req == null || req.getName() == null || req.getName().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("Project name");
        }

        ProjectModel p = projectService.createProject(req, ownerId);
        ProjectResponse resp = ProjectConverter.convert(p);
        Logger.info("Project named " + req.getName() + " created and owned by " + ownerId);
        return Response.ok(resp).build();
    }

    @GET
    public Response listProjects(@QueryParam("onlyOwned") @DefaultValue("false") boolean onlyOwned) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = UUID.fromString(jwt.getSubject());

        List<ProjectModel> list = projectService.listProjects(userId, onlyOwned);
        List<ProjectResponse> out = list.stream()
                .map(ProjectConverter::convert)
                .collect(Collectors.toList());
        return Response.ok(out).build();
    }

    @GET
    @Path("/all")
    @RolesAllowed("admin")
    public Response listAllProjects() {
        List<ProjectResponse> out = projectService.listAllProjects().stream()
                .map(ProjectConverter::convert)
                .collect(Collectors.toList());
        return Response.ok(out).build();
    }

    @GET
    @Path("/{id}")
    public Response getProject(@PathParam("id") UUID id) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = UUID.fromString(jwt.getSubject());

        ProjectModel p = projectService.getProject(id, userId);
        return Response.ok(ProjectConverter.convert(p)).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateProject(@PathParam("id") UUID id, UpdateProjectRequest req) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = UUID.fromString(jwt.getSubject());

        if (req == null || req.getName() == null || req.getName().isBlank() || req.getNewOwnerId() == null) {
            ErrorsCode.MISSING_ARG.throwException("name or owner id");
        }

        ProjectModel updated = projectService.updateProject(id, req, userId);
        Logger.info("Project " + id + " updated by user " + userId + " with name " + req.getName() + " with new owner " + req.getNewOwnerId());
        return Response.ok(ProjectConverter.convert(updated)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteProject(@PathParam("id") UUID id) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = UUID.fromString(jwt.getSubject());

        projectService.deleteProject(id, userId);
        Logger.info("Project " + id + " deleted by user " + userId);
        return Response.noContent().build();
    }

    @GET
    @Path("/storage")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    public Response getProjectsStorage() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }

        List<ProjectStorageResponse> result = projectService.getProjectsStorage();
        return Response.ok(result).build();
    }


    @POST
    @Path("/{id}/add-user")
    public Response addUser(@PathParam("id") UUID id, UserProjectRequest req) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID callerId = UUID.fromString(jwt.getSubject());

        if (req == null || req.getUserId() == null) {
            ErrorsCode.MISSING_ARG.throwException("Userid");
        }

        projectService.addUserToProject(id, req.getUserId(), callerId);
        Logger.info("User " + req.getUserId() + " added to project " + id + " by user " + callerId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/remove-user")
    public Response removeUser(@PathParam("id") UUID id, UserProjectRequest req) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID callerId = UUID.fromString(jwt.getSubject());

        if (req == null || req.getUserId() == null) {
            ErrorsCode.MISSING_ARG.throwException("Userid");
        }

        projectService.removeUserFromProject(id, req.getUserId(), callerId);
        Logger.info("User " + req.getUserId() + " removed from project " + id + " by user " + callerId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/exec")
    @RolesAllowed({"user", "admin"})
    @Produces(MediaType.APPLICATION_JSON)
    public Response executeFeature(@PathParam("id") UUID projectId, ExecFeatureRequest req) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        boolean isAdmin = jwt.getGroups().contains("admin");

        if (req == null || req.getFeature() == null || req.getFeature().isBlank() ||
                req.getCommand() == null || req.getCommand().isBlank() || req.getParams() == null) {
            ErrorsCode.MISSING_ARG.throwException("feature or command or params");
        }

        String result = projectService.executeFeature(projectId, userId, isAdmin, req);

        if (result == null) {
            return Response.noContent().build();
        } else {
            return Response.ok(Map.of("output", result)).build();
        }
    }
}