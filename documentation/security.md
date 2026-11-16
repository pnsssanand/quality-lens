# QualityLens – Security Architecture & Credential Management

## 1. Authentication & Token Verification

1. **Client-Side Identity Management**:
   - Handled exclusively via the official Firebase Web SDK (v13+ modular).
   - Passwords are encrypted and handled directly by Google Identity Toolkit; no plaintext passwords touch the application backend.
   - Upon successful login, the client receives a signed JWT ID token.

2. **Server-Side Token Verification**:
   - Every protected API route enforces the `verify_firebase_token` FastAPI dependency.
   - Decodes and verifies token signatures via the Firebase Admin SDK.
   - For offline test environments without active Google Cloud service credentials, a secure `DEV_AUTH_BYPASS` flag is explicitly isolated to non-production environments.

---

## 2. Cloudinary Photographic Storage Security

1. **Unsigned Upload Preset Restrictions**:
   - Client upload uses the pre-configured upload preset `Quality lens` constrained to folder `qualitylens/defects`.
   - Client uploads strictly validate MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/bmp`, `image/tiff`) and enforce a 10 MB file size cap before dispatch.
2. **Secret Key Isolation**:
   - `CLOUDINARY_API_SECRET` is strictly quarantined in backend environment variables and never transmitted to the frontend bundle.

---

## 3. Database Security & Injection Prevention

1. **SQL Injection Protection**:
   - Every analytical query utilizes SQLAlchemy parameterization and ORM abstraction.
   - Zero dynamic string interpolation in SQL clauses.
2. **Credential Hygiene**:
   - `.env` and all credential files are registered in `.gitignore`.
   - `.env.example` provides explicit configuration templates without embedding secret keys.
