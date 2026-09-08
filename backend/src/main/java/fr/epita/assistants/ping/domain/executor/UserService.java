package fr.epita.assistants.ping.domain.executor;

import fr.epita.assistants.ping.api.request.UpdateUserRequest;
import fr.epita.assistants.ping.api.response.LoginResponse;
import fr.epita.assistants.ping.api.response.UserResponse;
import fr.epita.assistants.ping.converter.UserConverter;
import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.data.repository.ProjectRepository;
import fr.epita.assistants.ping.data.repository.UserRepository;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.JwtUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserService {
    @Inject
    UserRepository userRepository;

    @Inject
    ProjectRepository projectRepository;


    public List<UserResponse> getUsers() {
        List<UserResponse> users = new ArrayList<>();
        for (UserModel user : userRepository.listAll()) {
            users.add(UserConverter.convert(user));
        }
        return users;
    }


    @Transactional
    public UserResponse createUser(String login, String password, boolean is_admin) {
        if (!isValidLogin(login)) {
            ErrorsCode.INVALID_FORMAT.throwException("login");
        }

        if (userRepository.find("login", login).firstResultOptional().isPresent()) {
            ErrorsCode.ALREADY_EXIST.throwException("Login", login);
        }

        UserModel user = new UserModel();
        user.setLogin(login);
        user.setPassword(password);
        user.setIsAdmin(is_admin);
        user.setAvatar("");
        user.setDisplayName(generateDisplayName(login));

        userRepository.persist(user);
        return UserConverter.convert(user);
    }

    private boolean isValidLogin(String login) {
        if (login == null || login.isBlank()) return false;
        long dot = login.chars().filter(c -> c == '.').count();
        long underscore = login.chars().filter(c -> c == '_').count();
        return (dot + underscore) == 1;
    }

    private String generateDisplayName(String login) {
        String[] parts = login.split("[._]");

        if (login.chars().filter(ch -> ch == '.' || ch == '_').count() != 1) {
            throw new IllegalArgumentException("Invalid login format");
        }

        StringBuilder result = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                if (part.matches(".*[A-Z].*")) {
                    result.append(part);
                } else {
                    result.append(Character.toUpperCase(part.charAt(0)))
                            .append(part.substring(1).toLowerCase());
                }
                result.append(" ");
            }
        }
        return result.toString().trim();
    }

    @Transactional
    public void deleteUserById(UUID id) {
        UserModel user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("User"));

        if (projectRepository.existsByOwnerId(id)) {
            ErrorsCode.FORBIDDEN.throwException();
        }

        List<ProjectModel> projects = projectRepository.findByMemberId(id);
        for (ProjectModel project : projects) {
            project.getMembers().remove(user);
            projectRepository.persist(project);
        }

        userRepository.delete(user);
    }

    public UserModel authenticate(String login, String password) {
        if (login == null || password == null) {
            ErrorsCode.MISSING_ARG.throwException("Login or password");
        }

        UserModel user = userRepository.find("login", login)
                .firstResultOptional()
                .orElseThrow(() -> ErrorsCode.NOT_AUTHENTICATED.get());

        if (!user.getPassword().equals(password)) {
            ErrorsCode.NOT_AUTHENTICATED.throwException();
        }

        return user;
    }


    public LoginResponse refreshToken(UUID userId) {
        UserModel user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("User"));

        String newToken = JwtUtils.generateToken(user.getId(), Boolean.TRUE.equals(user.getIsAdmin()));
        return new LoginResponse(newToken);
    }

    @Transactional
    public UserResponse updateUser(UUID targetUserId, UUID requesterId, boolean isAdmin, UpdateUserRequest req) {
        UserModel targetUser = userRepository.findByIdOptional(targetUserId)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("User"));

        if (!requesterId.equals(targetUserId) && !isAdmin) {
            ErrorsCode.FORBIDDEN.throwException();
        }

        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            targetUser.setPassword(req.getPassword());
        }

        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            targetUser.setDisplayName(req.getDisplayName());
        }

        if (req.getAvatar() != null) {
            targetUser.setAvatar(req.getAvatar());
        }

        return UserConverter.convert(targetUser);
    }

    public UserResponse getUserByIdSecure(UUID targetId, UUID requesterId, boolean isAdmin) {
        if (!isAdmin && !targetId.equals(requesterId)) {
            ErrorsCode.FORBIDDEN.throwException();
        }

        UserModel user = userRepository.findByIdOptional(targetId)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("User"));
        return UserConverter.convert(user);
    }
}
