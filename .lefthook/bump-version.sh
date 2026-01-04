#!/bin/bash

# Bump the patch version of Tampermonkey scripts that are staged for commit
# This script is called by lefthook pre-commit hook

set -e

# Get the list of staged .user.js files in scripts/
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^scripts/.*\.user\.js$' || true)

if [ -z "$staged_files" ]; then
    exit 0
fi

for file in $staged_files; do
    if [ ! -f "$file" ]; then
        continue
    fi

    # Extract current version from @version line
    current_version=$(grep -m1 '@version' "$file" | sed -E 's/.*@version[[:space:]]+([0-9]+\.[0-9]+\.[0-9]+).*/\1/')

    if [ -z "$current_version" ]; then
        echo "Warning: No valid @version found in $file, skipping"
        continue
    fi

    # Split version into parts
    IFS='.' read -r major minor patch <<< "$current_version"

    # Increment patch version
    new_patch=$((patch + 1))
    new_version="$major.$minor.$new_patch"

    # Replace the version in the file
    sed -i '' -E "s/(@version[[:space:]]+)[0-9]+\.[0-9]+\.[0-9]+/\1$new_version/" "$file"

    echo "Bumped $file: $current_version -> $new_version"

    # Re-stage the file with the updated version
    git add "$file"
done

