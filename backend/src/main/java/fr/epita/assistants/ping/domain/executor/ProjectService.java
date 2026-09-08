package fr.epita.assistants.ping.domain.executor;

import fr.epita.assistants.ping.api.request.ExecFeatureRequest;
import fr.epita.assistants.ping.api.request.NewProjectRequest;
import fr.epita.assistants.ping.api.request.UpdateProjectRequest;
import fr.epita.assistants.ping.api.response.ProjectStorageResponse;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.data.repository.ProjectRepository;
import fr.epita.assistants.ping.data.repository.UserRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class ProjectService {

    @Inject
    ProjectRepository projectRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    GitService gitService;

    @ConfigProperty(name = "PROJECT_DEFAULT_PATH")
    String basePath;

    @Transactional
    public ProjectModel createProject(NewProjectRequest req, UUID ownerId) {
        UserModel owner = userRepository.findById(ownerId);
        if (owner == null) {
            ErrorsCode.NOT_FOUND.throwException("Owner");
        }

        ProjectModel p = new ProjectModel();
        p.setName(req.getName().trim());
        p.setOwner(owner);

        List<UserModel> members = new ArrayList<>();
        members.add(owner);
        p.setMembers(members);

        projectRepository.persist(p);

        p.setPath(basePath + "/" + p.getId());

        try {
            Files.createDirectories(Paths.get(p.getPath()));
        } catch (IOException e) {
            ErrorsCode.EXAMPLE_ERROR.throwException("Impossible de créer le répertoire");
        }
        return p;
    }

    public List<ProjectModel> listAllProjects() {
        return projectRepository.listAll();
    }

    public List<ProjectModel> listProjects(UUID userId, boolean onlyOwned) {
        if (onlyOwned) {
            return projectRepository.find("owner.id", userId).list();
        } else {
            UserModel user = userRepository.findById(userId);

            Set<ProjectModel> result = new HashSet<>();
            result.addAll(projectRepository.find("owner.id", userId).list());
            result.addAll(
                projectRepository.listAll().stream()
                    .filter(p -> p.getMembers().contains(user))
                    .collect(Collectors.toList())
            );

            return new ArrayList<>(result);
        }
    }

    @Transactional
    public ProjectModel getProject(UUID projectId, UUID userId) {
        ProjectModel p = projectRepository.findById(projectId);
        if (p == null) {
            ErrorsCode.NOT_FOUND.throwException("Project");
        }
        UserModel user = userRepository.findById(userId);
        boolean isAdmin  = Boolean.TRUE.equals(user.getIsAdmin());
        boolean isOwner  = p.getOwner().getId().equals(userId);
        boolean isMember = p.getMembers().stream().anyMatch(u -> u.getId().equals(userId));

        if (!isAdmin && !isOwner && !isMember) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        return p;
    }

    @Transactional
    public ProjectModel updateProject(UUID id, UpdateProjectRequest req, UUID userId) {
        ProjectModel p = projectRepository.findById(id);
        if (p == null) {
            ErrorsCode.NOT_FOUND.throwException("Project");
        }
        UserModel caller = userRepository.findById(userId);
        boolean isAdmin = Boolean.TRUE.equals(caller.getIsAdmin());
        boolean isOwner = p.getOwner().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        if (req.getName() == null && req.getNewOwnerId() == null) {
            ErrorsCode.MISSING_ARG.throwException("name or newOwnerId");
        }
        if (req.getName() != null) {
            if (req.getName().isBlank()) {
                ErrorsCode.MISSING_ARG.throwException("Project name");
            }
            p.setName(req.getName().trim());
        }
        if (req.getNewOwnerId() != null) {
            boolean isMember = p.getMembers().stream()
                                .anyMatch(u -> u.getId().equals(req.getNewOwnerId()));
            if (!isMember) {
                ErrorsCode.NOT_FOUND.throwException("Owner");
            }
            UserModel newOwner = userRepository.findById(req.getNewOwnerId());
            p.setOwner(newOwner);
        }
        projectRepository.persist(p);
        return p;
    }

    @Transactional
    public void deleteProject(UUID id, UUID userId) {
        ProjectModel p = projectRepository.findById(id);
        if (p == null) {
            ErrorsCode.NOT_FOUND.throwException("Project");
        }
        UserModel caller = userRepository.findById(userId);
        boolean isAdmin = Boolean.TRUE.equals(caller.getIsAdmin());
        boolean isOwner = p.getOwner().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        try {
            Path root = Paths.get(p.getPath());
            if (Files.exists(root)) {
                Files.walk(root)
                     .sorted(Comparator.reverseOrder())
                     .map(Path::toFile)
                     .forEach(File::delete);
            }
        } catch (IOException e) {
        }
        projectRepository.delete(p);
    }

    @Transactional
    public void addUserToProject(UUID projectId, UUID newMemberId, UUID callerId) {
        if (newMemberId == null) {
            ErrorsCode.MISSING_ARG.throwException("userId");
        }
        ProjectModel p = projectRepository.findById(projectId);
        if (p == null) {
            ErrorsCode.NOT_FOUND.throwException("Project");
        }
        UserModel caller = userRepository.findById(callerId);
        boolean isAdmin  = Boolean.TRUE.equals(caller.getIsAdmin());
        boolean isMember = p.getMembers().stream().anyMatch(u -> u.getId().equals(callerId));
        if (!isAdmin && !isMember) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        UserModel newUser = userRepository.findById(newMemberId);
        if (newUser == null) {
            ErrorsCode.NOT_FOUND.throwException("User");
        }
        boolean already = p.getMembers().stream().anyMatch(u -> u.getId().equals(newMemberId));
        if (already) {
            ErrorsCode.ALREADY_EXIST.throwException("Member", newMemberId.toString());
        }
        p.getMembers().add(newUser);
        projectRepository.persist(p);
    }

    @Transactional
    public void removeUserFromProject(UUID projectId, UUID removeId, UUID callerId) {
        if (removeId == null) {
            ErrorsCode.MISSING_ARG.throwException("userId");
        }
        ProjectModel p = projectRepository.findById(projectId);
        if (p == null) {
            ErrorsCode.NOT_FOUND.throwException("Project");
        }
        UserModel caller = userRepository.findById(callerId);
        boolean isAdmin = Boolean.TRUE.equals(caller.getIsAdmin());
        boolean isOwner = p.getOwner().getId().equals(callerId);
        if (!isAdmin && !isOwner) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        if (p.getOwner().getId().equals(removeId)) {
            ErrorsCode.FORBIDDEN.throwException();
        }
        boolean removed = p.getMembers().removeIf(u -> u.getId().equals(removeId));
        if (!removed) {
            ErrorsCode.NOT_FOUND.throwException("member");
        }
        projectRepository.persist(p);
    }

    @Transactional
    public String executeFeature(UUID projectId, UUID userId, boolean isAdmin, ExecFeatureRequest request) {
        ProjectModel project = projectRepository.findByIdOptional(projectId)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("Project"));

        boolean isOwnerOrMember = project.getOwner().getId().equals(userId)
                || project.getMembers().stream().anyMatch(u -> u.getId().equals(userId));

        if (!isOwnerOrMember && !isAdmin) {
            ErrorsCode.FORBIDDEN.throwException();
        }

        Path projectPath = Path.of(basePath, projectId.toString());

        if (!"git".equalsIgnoreCase(request.getFeature())) {
            ErrorsCode.INVALID_FORMAT.throwException("Only 'git' feature is supported");
        }

        return switch (request.getCommand()) {
            case "init" -> {
                gitService.init(projectPath);
                yield null;
            }
            case "add" -> {
                gitService.add(projectPath, request.getParams());
                yield null;
            }
            case "commit" -> {
                if (request.getParams() == null || request.getParams().isEmpty()) {
                    ErrorsCode.MISSING_ARG.throwException("Commit message missing");
                }
                gitService.commit(projectPath, request.getParams().get(0));
                yield null;
            }
            case "log" -> gitService.log(projectPath, request.getParams());
            case "show" -> gitService.show(projectPath, request.getParams());
            default -> throw ErrorsCode.INVALID_FORMAT.get("Unsupported git command");
        };
    }


    public List<ProjectStorageResponse> getProjectsStorage() {
        List<ProjectModel> projects = projectRepository.listAll();
        List<ProjectStorageResponse> responseList = new ArrayList<>();

        for (ProjectModel project : projects) {
            UUID projectId = project.getId();
            String projectName = project.getName();

            Path path = Paths.get(basePath, projectId.toString());
            long size = 0L;

            try {
                if (Files.exists(path)) {
                    size = Files.walk(path)
                            .filter(Files::isRegularFile)
                            .mapToLong(p -> {
                                try {
                                    return Files.size(p);
                                } catch (IOException e) {
                                    return 0L;
                                }
                            }).sum();
                }
            } catch (IOException e) {
                // log si besoin
            }

            responseList.add(new ProjectStorageResponse(projectId, projectName, size));
        }

        return responseList;
    }
}

