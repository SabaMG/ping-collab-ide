package fr.epita.assistants.ping.utils;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;

public class Utils {
    public static boolean globExists(Path basePath, String pattern) {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(basePath, pattern)) {
            return stream.iterator().hasNext();
        } catch (IOException e) {
            return false;
        }
    }
}
