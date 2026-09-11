# Security policy

Report vulnerabilities privately to the Acrux engineering team. Do not include credentials, customer information, or exploit details in public issues. Rotate any accidentally exposed credential immediately.

This template validates external input with Zod, keeps server modules server-only, and avoids exposing environment values. A Content Security Policy is deliberately not provided: each product must tailor one to its integrations before production.
