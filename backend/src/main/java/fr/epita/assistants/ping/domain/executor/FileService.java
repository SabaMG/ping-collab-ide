package fr.epita.assistants.ping.domain.executor;

import fr.epita.assistants.ping.data.model.ProjectModel;
import fr.epita.assistants.ping.data.repository.ProjectRepository;
import fr.epita.assistants.ping.data.repository.UserRepository;
import fr.epita.assistants.ping.errors.ErrorsCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class FileService {

    @Inject
    ProjectRepository projectRepository;

    @ConfigProperty(name = "PROJECT_DEFAULT_PATH")
    String basePath;

    private Path resolvePath(UUID projectId, String relativePath, UUID userId, boolean isAdmin) {
        ProjectModel project = projectRepository.findByIdOptional(projectId)
                .orElseThrow(() -> ErrorsCode.NOT_FOUND.get("Project"));

        boolean allowed = isAdmin || project.getOwner().getId().equals(userId) ||
                project.getMembers().stream().anyMatch(u -> u.getId().equals(userId));

        if (!allowed) {
            ErrorsCode.FORBIDDEN.throwException();
        }

        if (relativePath == null || relativePath.contains("..")) {
            ErrorsCode.FORBIDDEN.throwException("Path traversal detected");
        }

        Path projectRoot = Path.of(basePath, projectId.toString()).normalize();
        Path target = projectRoot.resolve(relativePath).normalize();

        if (!target.startsWith(projectRoot)) {
            ErrorsCode.FORBIDDEN.throwException("Outside of project bounds");
        }

        return target;
    }

    public byte[] readFile(UUID projectId, UUID userId, boolean isAdmin, String relPath) {
        Path path = resolvePath(projectId, relPath, userId, isAdmin);
        if (!Files.exists(path) || Files.isDirectory(path)) {
            ErrorsCode.NOT_FOUND.throwException("File");
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Read failed", e);
        }
    }

    @Transactional
    public void createFile(UUID projectId, UUID userId, boolean isAdmin, String relPath) {
        Path path = resolvePath(projectId, relPath, userId, isAdmin);
        if (Files.exists(path)) {
            ErrorsCode.ALREADY_EXIST.throwException("File");
        }
        try {
            Files.createDirectories(path.getParent());
            Files.createFile(path);
        } catch (IOException e) {
            throw new RuntimeException("File creation failed", e);
        }
    }

    @Transactional
    public void deleteFile(UUID projectId, UUID userId, boolean isAdmin, String relPath) {
        Path path = resolvePath(projectId, relPath, userId, isAdmin);
        if (!Files.exists(path) || Files.isDirectory(path)) {
            ErrorsCode.NOT_FOUND.throwException("File");
        }
        try {
            Files.delete(path);
        } catch (IOException e) {
            throw new RuntimeException("File deletion failed", e);
        }
    }

    @Transactional
    public void moveFile(UUID projectId, UUID userId, boolean isAdmin, String src, String dst) {
        Path srcPath = resolvePath(projectId, src, userId, isAdmin);
        Path dstPath = resolvePath(projectId, dst, userId, isAdmin);
        if (!Files.exists(srcPath)) {
            ErrorsCode.NOT_FOUND.throwException("Source file");
        }
        if (Files.exists(dstPath)) {
            ErrorsCode.ALREADY_EXIST.throwException("Destination file already exists");
        }
        try {
            Files.createDirectories(dstPath.getParent());
            Files.move(srcPath, dstPath);
        } catch (IOException e) {
            throw new RuntimeException("Move failed", e);
        }
    }

    @Transactional
    public void uploadFile(UUID projectId, UUID userId, boolean isAdmin, String relPath, InputStream data) {
        Path path = resolvePath(projectId, relPath, userId, isAdmin);
        try {
            Files.createDirectories(path.getParent());
            Files.copy(data, path, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}
