# API Endpoints Documentation

## Roles

The roles used in this documentation are as follows:

- **AD**: Admin
- **AF**: Affiliate
- **PR**: Partner
- **SUB_PR**: Sub Partner

---

## Endpoints

### Auth Module

1. **`/auth/signin`**
   - **Access**: Global
   - **Method**: POST
   - **Description**: Used for signing in to the application. `Email, Password & remember me` field to login.

2. **`/auth/profile`**
   - **Access**: All roles
   - **Method**: GET
   - **Description**: Fetches the profile information of the authenticated user.

---
