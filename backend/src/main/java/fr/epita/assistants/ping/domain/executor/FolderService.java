package fr.epita.assistants.ping.domain.executor;

import fr.epita.assistants.ping.api.response.FSEntryResponse;
import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.data.repository.ProjectRepository;
import fr.epita.assistants.ping.data.repository.UserRepository;
import fr.epita.assistants.ping.errors.ErrorsCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.transaction.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@ApplicationScoped
public class FolderService {

    @Inject
    ProjectRepository projectRepository;

    @Inject
    UserRepository userRepository;

    @ConfigProperty(name = "PROJECT_DEFAULT_PATH")
    String basePath;

    private Path resolveSafePath(UUID projectId, String relativePath) {
        Path base = Path.of(basePath, projectId.toString()).normalize();
        Path resolved = base.resolve(relativePath).normalize();

        if (!resolved.startsWith(base)) {
            ErrorsCode.FORBIDDEN.throwException(); // Path Traversal
        }

        return resolved;
    }

    private ProjectModel checkAccess(UUID projectId, UUID userId) {
        ProjectModel project = projectRepository.findById(projectId);
        if (project == null) ErrorsCode.NOT_FOUND.throwException("Project");

        UserModel user = userRepository.findById(userId);
        boolean isAdmin = Boolean.TRUE.equals(user.getIsAdmin());
        boolean isAuthorized = isAdmin ||
                project.getOwner().getId().equals(userId) ||
                project.getMembers().stream().anyMatch(u -> u.getId().equals(userId));

        if (!isAuthorized) ErrorsCode.FORBIDDEN.throwException();
        return project;
    }

    public List<FSEntryResponse> listFolder(UUID projectId, UUID userId, String relativePath) {
        checkAccess(projectId, userId);
        Path folder = resolveSafePath(projectId, relativePath);

        if (!Files.exists(folder) || !Files.isDirectory(folder)) {
            ErrorsCode.NOT_FOUND.throwException("Folder");
        }

        try (Stream<Path> stream = Files.list(folder)) {
            return stream.map(path -> {
                FSEntryResponse entry = new FSEntryResponse();
                entry.setName(path.getFileName().toString());
                entry.setPath(Path.of(basePath, projectId.toString()).relativize(path).toString());
                entry.setDirectory(Files.isDirectory(path));
                try {
                    entry.setSizeInBytes(Files.isDirectory(path) ? 0L : Files.size(path));
                } catch (IOException e) {
                    entry.setSizeInBytes(-1L);
                }
                return entry;
            }).collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to list folder", e);
        }
    }

    @Transactional
    public void createFolder(UUID projectId, UUID userId, String relativePath) {
        checkAccess(projectId, userId);
        if (relativePath == null || relativePath.isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }
        Path path = resolveSafePath(projectId, relativePath);
        if (Files.exists(path)) {
            ErrorsCode.ALREADY_EXIST.throwException("Folder", relativePath);
        }

        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            throw new RuntimeException("Could not create folder", e);
        }
    }

    @Transactional
    public void deleteFolder(UUID projectId, UUID userId, String relativePath) {
        checkAccess(projectId, userId);
        if (relativePath == null) {
            ErrorsCode.MISSING_ARG.throwException("relativePath");
        }

        Path base = Path.of(basePath, projectId.toString());
        Path path = resolveSafePath(projectId, relativePath);

        if (!Files.exists(path)) {
            ErrorsCode.NOT_FOUND.throwException("Folder");
        }

        if (base.equals(path)) {
            // root: juste le vider
            try (Stream<Path> stream = Files.list(path)) {
                for (Path child : stream.toList()) {
                    Files.walk(child)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                }
            } catch (IOException e) {
                throw new RuntimeException("Could not empty root folder", e);
            }
        } else {
            try {
                Files.walk(path)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            } catch (IOException e) {
                throw new RuntimeException("Could not delete folder", e);
            }
        }
    }

    @Transactional
    public void moveFolder(UUID projectId, UUID userId, String src, String dst) {
        checkAccess(projectId, userId);
        if (src == null || dst == null || src.isBlank() || dst.isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("src or dst");
        }

        Path srcPath = resolveSafePath(projectId, src);
        Path dstPath = resolveSafePath(projectId, dst);

        if (!Files.exists(srcPath) || !Files.isDirectory(srcPath)) {
            ErrorsCode.NOT_FOUND.throwException("Source folder");
        }
        if (Files.exists(dstPath)) {
            ErrorsCode.ALREADY_EXIST.throwException("Destination", dst);
        }

        try {
            Files.move(srcPath, dstPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not move folder", e);
        }
    }
}
