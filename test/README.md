# Integration Test Scripts

This directory contains comprehensive integration test scripts for the StackOne AI SDK.

## Available Scripts

### `feedback-tool-integration.ts`

Comprehensive integration test for the feedback tool that validates:

- Authentication setup and verification
- Dry run testing (no actual API calls)
- Real API endpoint testing (with actual API calls)
- Error handling scenarios
- Integration with the StackOne AI SDK

**Usage:**

```bash
# Run without API key (dry run only)
bun run test/feedback-tool-integration.ts

# Run with API key (full testing)
STACKONE_API_KEY=your_key bun run test/feedback-tool-integration.ts
```

## Purpose

These scripts are for:

- **Integration testing** during development
- **End-to-end validation** of functionality
- **CI/CD pipeline** testing
- **Comprehensive verification** of features

## Note

For automated unit tests, see:

- `src/tools/tests/` - Unit tests for individual tools
- `src/tests/` - General unit tests
- `examples/` - Example usage scripts
