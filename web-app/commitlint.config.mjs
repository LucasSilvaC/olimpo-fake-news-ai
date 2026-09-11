const commitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "type-empty": [2, "never"],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "type-case": [2, "always", "lower-case"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],
    "header-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 100],
  },
};

export default commitlintConfig;
