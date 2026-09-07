package com.internmatch.internmatch.features.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "doc", "docx", "txt", "rtf", "md",
            "png", "jpg", "jpeg", "gif", "webp",
            "ppt", "pptx", "xls", "xlsx", "csv", "zip"
    ));

    private static final String[] FORBIDDEN_CONTENT_PARTS = {
            "html", "xhtml", "svg", "javascript", "ecmascript"
    };

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        try {
            if (fileName.contains("..")) {
                throw new IllegalArgumentException("Filename contains invalid path sequence " + fileName);
            }

            String fileExtension = "";
            int i = fileName.lastIndexOf('.');
            if (i > 0) {
                fileExtension = fileName.substring(i + 1).toLowerCase();
            }

            if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
                throw new IllegalArgumentException("File type not allowed: " + fileName);
            }

            String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
            for (String forbidden : FORBIDDEN_CONTENT_PARTS) {
                if (contentType.contains(forbidden)) {
                    throw new IllegalArgumentException("File type not allowed: " + fileName);
                }
            }

            String newFileName = UUID.randomUUID().toString() + "." + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}
