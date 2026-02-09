# Chrome Debug Skill

Debug web features running in Chrome browser via Chrome DevTools Protocol (CDP).
This skill launches a headless Chrome, navigates to the dev server, and provides tools for inspecting, screenshotting, and interacting with the page.

## Environment

- **Dev server**: `yarn serve` (Vite, port 8130 via .env.local)
- **Chrome debug port**: 9222
- **Profile dir**: `/tmp/klstudio-chrome-debug`
- **Screenshots dir**: `/tmp/klstudio-screenshots`
- **CDP helper**: `.claude/skills/chrome-debug/cdp.js`

## Setup

### 1. Start the dev server (if not already running)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8130 || echo "NOT_RUNNING"
```

If not running, remind the user to start it with `yarn serve` in a separate terminal.

### 2. Ensure `ws` module is available

```bash
node -e "require('ws')" 2>/dev/null || npm install -g ws
```

### 3. Start headless Chrome with remote debugging

```bash
mkdir -p /tmp/klstudio-chrome-debug /tmp/klstudio-screenshots

# Kill any existing debug Chrome instance
pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null; sleep 1

# Launch headless Chrome
nohup google-chrome \
  --headless \
  --remote-debugging-port=9222 \
  --disable-gpu \
  --no-sandbox \
  --window-size=1280,900 \
  --user-data-dir=/tmp/klstudio-chrome-debug \
  http://localhost:8130 > /tmp/klstudio-chrome-debug/chrome.log 2>&1 &

sleep 2
```

### 4. Verify connection

```bash
curl -s http://127.0.0.1:9222/json/version
```

## CDP Helper Script

The helper script at `.claude/skills/chrome-debug/cdp.js` provides a unified CLI for all CDP operations:

```bash
CDP=.claude/skills/chrome-debug/cdp.js
```

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `node $CDP page-id` | Get current page ID | `node $CDP page-id` |
| `node $CDP navigate <url>` | Navigate to URL | `node $CDP navigate http://localhost:8130/#/rubik` |
| `node $CDP screenshot [path]` | Take screenshot | `node $CDP screenshot /tmp/klstudio-screenshots/test.png` |
| `node $CDP console [ms]` | Capture console messages after reload | `node $CDP console 5000` |
| `node $CDP eval <expr>` | Evaluate JS in page | `node $CDP eval document.title` |
| `node $CDP network [ms]` | Monitor network after reload | `node $CDP network 5000` |
| `node $CDP dom` | Get accessibility tree | `node $CDP dom` |
| `node $CDP reload` | Reload page | `node $CDP reload` |

### Screenshot + Read pattern

After taking a screenshot, use the Read tool to visually inspect it:

```bash
SHOT=$(node $CDP screenshot)
# Then use Read tool on $SHOT to view the image
```

## Cleanup

```bash
pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null
rm -rf /tmp/klstudio-chrome-debug
```

## Typical Workflow

1. **Ensure dev server is running** (`yarn serve`)
2. **Install ws** if needed
3. **Start headless Chrome** (setup step 3)
4. **Verify** connection (setup step 4)
5. **Navigate** to the route/page being debugged: `node $CDP navigate <url>`
6. **Screenshot** to visually verify: `node $CDP screenshot` then Read the file
7. **Check console** for errors: `node $CDP console`
8. **Execute JS** to inspect state: `node $CDP eval <expr>`
9. **Iterate**: make code changes → `node $CDP reload` → screenshot → verify
10. **Cleanup** when done

## Tips

- Always take a screenshot after navigation to confirm the page loaded correctly.
- After code changes, Vite HMR should auto-reload; take a new screenshot to verify.
- If the page is blank or broken, check console messages for errors.
- Use eval to inspect Vue component state: `node $CDP eval "document.querySelector('#app').__vue_app__"`
- For routes, navigate to `http://localhost:8130/#/route-name` (Vue Router hash mode).
- Screenshot files can be read with the Read tool for visual inspection.
- The `console` and `network` commands reload the page and capture for the specified duration.
