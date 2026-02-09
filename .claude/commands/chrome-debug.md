
Launch a Chrome browser debug session for the klstudio dev server.

Follow the instructions in `.claude/skills/chrome-debug/skill.md` to:

1. Check if the dev server (port 8080) is running; if not, remind the user to start it.
2. Start headless Chrome with remote debugging on port 9222.
3. Get the page WebSocket ID.
4. Navigate to the target URL: $ARGUMENTS (default: `http://localhost:8080`).
5. Take a screenshot and display it.
6. Check console for any errors.
7. Report the page status and await further debug instructions.
