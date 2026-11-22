# Security

For vulnerabilities in the `@gvejs` packages or playground, use the private vulnerability reporting form when enabled. If the form is unavailable, contact a project maintainer privately through the channel where you obtained GVE. Keep vulnerability details out of public issues. [Private vulnerability reporting](https://github.com/rms-pro/gve/security/advisories/new)

Playground visitors supply JSON inputs only. Algorithms, custom schemas, reducers, renderer registrations, and themes are trusted application code. GVE uses React text nodes for user-visible strings and contains no dynamic source evaluator, dynamic algorithm imports, or browser storage. Namespaced schema lookup checks own properties. Reducers update records via computed own keys. Serialized trace readers bound the number of events, text length, and JSON depth. Imported trace results should be validated with an application-specific predicate.

Trace generation limits are cooperative. The generation deadline cannot interrupt a synchronous generator call, and serialized-size limits do not represent process memory quotas. Treat large trace inputs as a resource-exhaustion risk and set lower limits for public-facing entry points. A sandbox is required before accepting executable extensions from untrusted users.

Run `pnpm audit --audit-level high` against the registry before release. The release dry run consumes no publish credentials. Confirm and protect the GitHub repository and npm scope before setting up publishing.
