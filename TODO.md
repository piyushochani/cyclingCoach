# Project Roadmap: Security Hardening

## 1. Data Validation (DTOs)
- [x] **Activity Module:** Implemented `CreateActivityDto` and `UpdateActivityDto`.
- [x] **User Module:** Implemented `UpdateUserDto` for profile updates.
- [x] **Race Module:** Implemented `CreateRaceDto` and `UpdateRaceDto`.
- [x] **Expense Module:** Implemented `CreateExpenseDto` and `UpdateExpenseDto`.
- [x] **Gear Module:** Implemented `CreateBikeDto`, `UpdateBikeDto`, `CreateEquipmentDto`, and `UpdateEquipmentDto`.

## 2. Infrastructure Security
- [x] **Rate Limiting:** Implemented `@nestjs/throttler` (100 req/min default).
- [x] **Secret Management:** Secured `JwtStrategy` (removed hardcoded fallback, added environment check).
- [x] **Global Validation:** Enabled `ValidationPipe` globally with whitelist and transformation.
- [ ] **CORS Hardening:** Tighten CORS policy for production.

## 3. Authentication & Authorization
- [x] **JWT Strategy:** Verified and secured existing implementation.
- [x] **Global Guard:** Verified global `JwtAuthGuard`.
- [x] **User Decorator:** Verified secure `request.user` usage.
