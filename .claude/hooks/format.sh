#!/usr/bin/env bash
# Hook PostToolUse: formatea con Prettier (y ESLint en código) el archivo recién escrito.
file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] && [ -f "$file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    npx prettier --write "$file" >&2
    npx eslint --fix "$file" >&2 || true
    ;;
  *.md|*.mdx|*.json|*.css|*.html)
    npx prettier --write "$file" >&2
    ;;
esac
exit 0
