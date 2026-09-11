package com.internmatch.internmatch.features.common;

import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@Epic("File Management")
@Feature("File Upload")
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString());
    }

    @Nested
    @Story("Successful Uploads")
    class SuccessfulUploads {

        @Test
        @DisplayName("Stores PDF file with UUID name")
        void storesPdfWithUuidName() throws IOException {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "resume.pdf", "application/pdf", "PDF content".getBytes());

            String result = service.storeFile(file);

            assertTrue(result.endsWith(".pdf"));
            assertFalse(result.equals("resume.pdf"));
            assertTrue(Files.exists(tempDir.resolve(result)));
        }

        @Test
        @DisplayName("Stores docx file")
        void storesDocx() throws IOException {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "DOCX content".getBytes());

            String result = service.storeFile(file);

            assertTrue(result.endsWith(".docx"));
            assertTrue(Files.exists(tempDir.resolve(result)));
        }

        @Test
        @DisplayName("Stores PNG image")
        void storesPng() throws IOException {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.png", "image/png", "PNG content".getBytes());

            String result = service.storeFile(file);

            assertTrue(result.endsWith(".png"));
            assertTrue(Files.exists(tempDir.resolve(result)));
        }

        @Test
        @DisplayName("Stores zip archive")
        void storesZip() throws IOException {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "archive.zip", "application/zip", "ZIP content".getBytes());

            String result = service.storeFile(file);

            assertTrue(result.endsWith(".zip"));
        }

        @Test
        @DisplayName("UUID names prevent collisions for identical filenames")
        void uuidPreventsCollisions() throws IOException {
            MockMultipartFile file1 = new MockMultipartFile(
                    "file", "resume.pdf", "application/pdf", "Content 1".getBytes());
            MockMultipartFile file2 = new MockMultipartFile(
                    "file", "resume.pdf", "application/pdf", "Content 2".getBytes());

            String result1 = service.storeFile(file1);
            String result2 = service.storeFile(file2);

            assertNotEquals(result1, result2);
        }
    }

    @Nested
    @Story("Validation Rejections")
    class ValidationRejections {

        @Test
        @DisplayName("Rejects null file")
        void rejectsNull() {
            assertThrows(IllegalArgumentException.class, () -> service.storeFile(null));
        }

        @Test
        @DisplayName("Rejects empty file")
        void rejectsEmpty() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "empty.pdf", "application/pdf", new byte[0]);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.storeFile(file));
            assertEquals("File is empty", ex.getMessage());
        }

        @Test
        @DisplayName("Rejects disallowed extension (.exe)")
        void rejectsDisallowedExtension() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "malware.exe", "application/octet-stream", "EXE content".getBytes());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.storeFile(file));
            assertTrue(ex.getMessage().contains("File type not allowed"));
        }

        @Test
        @DisplayName("Rejects path traversal in filename")
        void rejectsPathTraversal() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "../../etc/passwd.pdf", "application/pdf", "content".getBytes());

            assertThrows(IllegalArgumentException.class, () -> service.storeFile(file));
        }

        @Test
        @DisplayName("Rejects HTML content type")
        void rejectsHtmlContentType() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "page.pdf", "text/html", "content".getBytes());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.storeFile(file));
            assertTrue(ex.getMessage().contains("File type not allowed"));
        }

        @Test
        @DisplayName("Rejects SVG content type")
        void rejectsSvgContentType() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "image.svg", "image/svg+xml", "content".getBytes());

            assertThrows(IllegalArgumentException.class, () -> service.storeFile(file));
        }

        @Test
        @DisplayName("Rejects extensionless file")
        void rejectsExtensionless() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "Makefile", "text/plain", "content".getBytes());

            assertThrows(IllegalArgumentException.class, () -> service.storeFile(file));
        }

        @Test
        @DisplayName("Rejects javascript content type")
        void rejectsJavascriptContentType() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "script.txt", "application/javascript", "content".getBytes());

            assertThrows(IllegalArgumentException.class, () -> service.storeFile(file));
        }
    }

    @Nested
    @Story("Directory Setup")
    class DirectorySetup {

        @Test
        @DisplayName("Creates upload directory on construction")
        void createsDirectoryOnStartup() {
            Path newDir = tempDir.resolve("subdir");
            FileStorageService newService = new FileStorageService(newDir.toString());

            assertTrue(Files.exists(newDir));
        }
    }
}
