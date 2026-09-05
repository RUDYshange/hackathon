package za.co.royalsquare.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@SpringBootApplication
public class RoyalSquareCrmApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(RoyalSquareCrmApplication.class, args);
    }

    private static void loadDotEnv() {
        findDotEnvFiles().stream()
                .filter(Files::isRegularFile)
                .findFirst()
                .ifPresent(RoyalSquareCrmApplication::loadDotEnvFile);
    }

    private static Set<Path> findDotEnvFiles() {
        Set<Path> paths = new LinkedHashSet<>();
        addDotEnvCandidates(paths, Path.of(System.getProperty("user.dir")));

        try {
            URI location = RoyalSquareCrmApplication.class.getProtectionDomain()
                    .getCodeSource()
                    .getLocation()
                    .toURI();
            addDotEnvCandidates(paths, Path.of(location));
        } catch (URISyntaxException | IllegalArgumentException ignored) {
            // Fall back to user.dir only.
        }

        return paths;
    }

    private static void addDotEnvCandidates(Set<Path> paths, Path start) {
        Path current = Files.isRegularFile(start) ? start.getParent() : start;
        while (current != null) {
            paths.add(current.resolve(".env"));
            current = current.getParent();
        }
    }

    private static void loadDotEnvFile(Path file) {
        try {
            List<String> lines = Files.readAllLines(file);
            for (String line : lines) {
                loadDotEnvLine(line);
            }
        } catch (IOException ignored) {
            // Spring will still use normal environment variables and defaults.
        }
    }

    private static void loadDotEnvLine(String line) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return;
        }

        int separator = trimmed.indexOf('=');
        if (separator < 1) {
            return;
        }

        String key = trimmed.substring(0, separator).trim();
        String value = stripOptionalQuotes(trimmed.substring(separator + 1).trim());

        if (!System.getenv().containsKey(key) && System.getProperty(key) == null) {
            System.setProperty(key, value);
        }
    }

    private static String stripOptionalQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
