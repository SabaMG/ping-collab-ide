package fr.epita.assistants.ping.utils;

import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;


@Singleton
public class Logger {
    private static final String RESET_TEXT = "\u001B[0m";
    private static final String GREEN_TEXT = "\u001B[32m";

    public static String logFilePath;


    static {
        logFilePath = System.getProperty("LOG_FILE");
        if (logFilePath == null) {
            logFilePath = "/tmp/ping/log.txt";
        }

    }

    @Inject
    public Logger(@ConfigProperty(name = "LOG_FILE") String logFile) {
        Logger.logFilePath = logFile;
    }

    private static String timestamp() {
        return new SimpleDateFormat("dd/MM/yy - HH:mm:ss")
                .format(Calendar.getInstance().getTime());
    }

    public static void info(String message) {
        String log = GREEN_TEXT + "[" + timestamp() + "] " + message + RESET_TEXT;
        writeLog(log, logFilePath);
    }

    private static void writeLog(String message, String filePath) {
        if (filePath != null) {
            try {
                File file = new File(filePath);
                File parent = file.getParentFile();
                if (parent != null && !parent.exists()) {
                    parent.mkdirs();
                }

                try (FileWriter writer = new FileWriter(file, true)) {
                    writer.write(message + "\n");
                    return;
                }
            } catch (IOException e) {
                System.err.println("Failed to write to log file: " + e.getMessage());
            }
        }
        System.out.println(message);
    }
}
