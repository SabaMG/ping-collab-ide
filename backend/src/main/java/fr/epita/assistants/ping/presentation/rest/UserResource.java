package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.api.request.CreateUserRequest;
import fr.epita.assistants.ping.api.request.LoginRequest;
import fr.epita.assistants.ping.api.request.UpdateUserRequest;
import fr.epita.assistants.ping.api.response.LoginResponse;
import fr.epita.assistants.ping.api.response.UserResponse;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.domain.executor.UserService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.JwtUtils;
import fr.epita.assistants.ping.utils.Logger;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import java.util.UUID;

@Path("/api/user")
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {
    @Inject
    UserService userService;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/me")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    public Response getCurrentUser() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        UserResponse user = userService.getUserByIdSecure(userId, userId, jwt.getGroups().contains("admin"));
        return Response.ok(user).build();
    }

    @POST
    @Path("/")
    @RolesAllowed("admin")
    public Response createUser(CreateUserRequest request) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID adminId = UUID.fromString(jwt.getSubject());

        if (request == null || request.getLogin() == null || request.getLogin().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank() || request.getIsAdmin() == null) {
            ErrorsCode.MISSING_ARG.throwException("login or password or isAdmin");
        }

        UserResponse newUser = userService.createUser(request.getLogin(), request.getPassword(), request.getIsAdmin());
        Logger.info("User with login " + request.getLogin() + " created by admin " + adminId + " with admin rights: " + request.getIsAdmin());
        return Response.ok(newUser).build();
    }

    @GET
    @Path("/all")
    @RolesAllowed({"user", "admin"})
    public Response listUsers() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID adminId = UUID.fromString(jwt.getSubject());
        return Response.ok(userService.getUsers()).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response getUserById(@PathParam("id") UUID id) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID requesterId = UUID.fromString(jwt.getSubject());
        boolean isAdmin = jwt.getGroups().contains("admin");

        UserResponse user = userService.getUserByIdSecure(id, requesterId, isAdmin);
        return Response.ok(user).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    public Response deleteUser(@PathParam("id") UUID id) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID adminId = UUID.fromString(jwt.getSubject());

        userService.deleteUserById(id);
        Logger.info("User " + id + " deleted by admin " + adminId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response updateUser(@PathParam("id") UUID id, UpdateUserRequest request) {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID currentUserId = UUID.fromString(jwt.getSubject());
        boolean isAdmin = jwt.getGroups().contains("admin");

        if (request == null || request.getAvatar() == null || request.getPassword() == null || request.getDisplayName() == null) {
            ErrorsCode.MISSING_ARG.throwException("login or password or isAdmin");
        }

        UserResponse updated = userService.updateUser(id, currentUserId, isAdmin, request);
        Logger.info("User " + id + " updated by " + currentUserId + " (isAdmin: " + isAdmin + ")");
        return Response.ok(updated).build();
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request == null || request.getLogin() == null || request.getLogin().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("login or password or isAdmin");
        }

        UserModel user = userService.authenticate(request.getLogin(), request.getPassword());
        String token = JwtUtils.generateToken(user.getId(), Boolean.TRUE.equals(user.getIsAdmin()));
        return Response.ok(new LoginResponse(token)).build();
    }

    @GET
    @Path("/refresh")
    @RolesAllowed({"user", "admin"})
    public Response refreshToken() {
        if (jwt == null || jwt.getSubject() == null) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }
        UUID userId = UUID.fromString(jwt.getSubject());
        LoginResponse response = userService.refreshToken(userId);
        return Response.ok(response).build();
    }


}
