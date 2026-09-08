package fr.epita.assistants.ping.domain.executor;

import fr.epita.assistants.ping.errors.ErrorsCode;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class GitService {

    public void init(Path path) {
        runCommand(path, List.of("git", "init"));
    }

    public void add(Path path, List<String> params) {
        ensureGitRepo(path);
        for (String param : params) {
            if (!globExists(path, param)) {
                ErrorsCode.INVALID_FORMAT.throwException("File(s) not found: " + param);
            }
        }
        List<String> cmd = new ArrayList<>();
        cmd.add("git");
        cmd.add("add");
        cmd.addAll(params);
        runCommand(path, cmd);
    }

    public void commit(Path path, String message) {
        ensureGitRepo(path);
        if (message == null || message.isBlank()) {
            ErrorsCode.MISSING_ARG.throwException("Commit message missing");
        }
        runCommand(path, List.of("git", "commit", "-m", message));
    }

    public String log(Path path, List<String> params) {
        ensureGitRepo(path);
        List<String> cmd = new ArrayList<>();
        cmd.add("git");
        cmd.add("log");
        if (params != null) cmd.addAll(params);
        return runCommandWithOutput(path, cmd);
    }

    public String show(Path path, List<String> params) {
        ensureGitRepo(path);
        List<String> cmd = new ArrayList<>();
        cmd.add("git");
        cmd.add("show");
        if (params != null) cmd.addAll(params);
        return runCommandWithOutput(path, cmd);
    }

    private void ensureGitRepo(Path path) {
        if (!Files.exists(path.resolve(".git"))) {
            ErrorsCode.INVALID_FORMAT.throwException("Project is not a Git repository");
        }
    }

    private void runCommand(Path dir, List<String> command) {
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(dir.toFile());
            builder.redirectErrorStream(true);
            Process process = builder.start();
            if (process.waitFor() != 0) {
                throw new RuntimeException("Command failed: " + String.join(" ", command));
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Git execution error", e);
        }
    }

    private String runCommandWithOutput(Path dir, List<String> command) {
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(dir.toFile());
            builder.redirectErrorStream(true);
            Process process = builder.start();

            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().collect(Collectors.joining("\n"));
            }

            if (process.waitFor() != 0) {
                throw new RuntimeException("Command failed: " + String.join(" ", command));
            }
            return output;

        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Git execution error", e);
        }
    }

    private boolean globExists(Path dir, String pattern) {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, pattern)) {
            return stream.iterator().hasNext();
        } catch (IOException e) {
            return false;
        }
    }
}
