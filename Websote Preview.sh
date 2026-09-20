#!/usr/bin/env bash

cd -- "$(dirname -- "$0")" || exit 1

echo "Syncing the latest content from Notion..."

if ! npm start; then
    echo
    echo "The Notion sync failed."
    echo "Check that Node.js is installed and NOTION_TOKEN is correct in .env."
    read -r -p
    exit 1
fi

echo
echo "Starting the local website preview..."
echo "Press Ctrl+C when you are finished."

PREVIEW_URL="http://localhost:1313/"

# Wait briefly for Hugo, then open the browser.
(
    sleep 2

    case "$(uname -s)" in
        Darwin)
            open "$PREVIEW_URL"
            ;;
        Linux)
            if command -v xdg-open >/dev/null 2>&1; then
                xdg-open "$PREVIEW_URL" >/dev/null 2>&1
            else
                echo "Open $PREVIEW_URL in your browser."
            fi
            ;;
    esac
) &

hugo server --buildDrafts