# Auth Specification

## Purpose

Provides secure user registration, credential authentication with password hashing, JWT session token management via httpOnly cookies, and user session resolution.

## Requirements

### Requirement: User Registration
The system SHALL register new user accounts by validating their full name, unique email address, and password, securely storing the password hashed with a salt factor of at least 10 rounds.

#### Scenario: Successful registration
- **WHEN** an unauthenticated visitor submits a valid name, an unused email address, and a compliant password
- **THEN** the system creates the user record with password hashed, sets initial XP to 0, and returns the created user identity

#### Scenario: Duplicate email rejected
- **WHEN** an unauthenticated visitor attempts to register with an email address that is already registered
- **THEN** the system rejects the registration request with a conflict error

### Requirement: User Login & JWT Cookie Issuance
The system SHALL authenticate users against their registered credentials, issuing a signed JSON Web Token (JWT) stored in a secure httpOnly cookie upon successful verification.

#### Scenario: Successful login
- **WHEN** a user provides valid email and password matching the stored hash
- **THEN** the system verifies the password, generates a signed JWT containing the user identity, sets an httpOnly, secure, sameSite cookie, and returns user profile details

#### Scenario: Invalid credentials rejected
- **WHEN** a user provides an incorrect password or an email that does not exist
- **THEN** the system rejects the authentication attempt with an invalid credentials error without leaking whether the email exists

### Requirement: User Logout
The system SHALL clear the authentication session cookie when a user requests to log out.

#### Scenario: Successful logout
- **WHEN** an authenticated user invokes the logout action
- **THEN** the system clears the auth cookie and invalidates the client session

### Requirement: Authenticated Session Resolution
The system SHALL extract and verify the JWT from the request cookie to authenticate the user for protected Server Actions.

#### Scenario: Valid session resolved
- **WHEN** a request contains a valid, non-expired JWT cookie
- **THEN** the system extracts the user identity and provides it to the underlying use case

#### Scenario: Missing or expired session rejected
- **WHEN** a protected action is invoked without a valid or unexpired JWT cookie
- **THEN** the system rejects the action with an unauthorized error
