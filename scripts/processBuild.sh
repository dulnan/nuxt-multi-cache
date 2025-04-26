#!/usr/bin/env bash

find ./dist -type f -exec sed -i 's/import\.meta\.env\.VITEST_SERVER/undefined/g; s/import\.meta\.env\.VITEST/undefined/g' {} \;
