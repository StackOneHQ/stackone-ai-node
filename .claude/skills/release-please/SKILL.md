# Release Please Trigger

Trigger a release-please PR for a specific version.

## Usage

```
/release-please <version>
```

## Examples

```
/release-please 2.3.0
/release-please 3.0.0
```

## Instructions

When this skill is invoked with a version argument:

1. **Validate the version format**: Ensure the version follows semantic versioning (X.Y.Z format)

2. **Create a new branch**: Create a branch named `chore/trigger-release-<version>`

   ```bash
   git switch -c chore/trigger-release-<version>
   ```

3. **Create an empty commit with Release-As trailer**: The commit message must include the `Release-As: <version>` trailer to trigger release-please

   ```bash
   git commit --allow-empty -m "chore: trigger release <version>

   Release-As: <version>"
   ```

4. **Push the branch and create a PR**:

   ```bash
   git push -u origin chore/trigger-release-<version>
   gh pr create --title "chore: trigger release <version>" --body "Trigger release-please to create version <version>."
   ```

5. **Report the PR URL** to the user

## Notes

- The `Release-As` trailer in the commit message tells release-please to use that specific version
- Once the PR is merged to main, release-please will automatically create a release PR with the specified version
- The release PR will update CHANGELOG.md, version files, and create a GitHub release when merged
