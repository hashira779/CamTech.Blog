# File Upload & Media Asset Security

## 1. Storage Isolation
- Uploaded media is never written into executable web directories.
- File assets are stored in object storage (S3/Cloudflare R2) and delivered strictly through CDN domains.

## 2. Validation & Sanitization
- **MIME Type Allowlist**: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
- **Magic Byte Inspection**: File headers are inspected to verify that file content matches declared extensions.
- **Randomized Keys**: Filenames are replaced with UUIDv4 strings (e.g. `media_3fa85f64.webp`) to prevent directory traversal and path manipulation.
- **Stripping EXIF Metadata**: Location coordinates and personal camera metadata are stripped before public storage.
