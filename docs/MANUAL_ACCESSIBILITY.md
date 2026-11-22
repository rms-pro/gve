# Manual accessibility verification

Record the commit, OS, browser, assistive technology and versions, viewport or zoom, theme, and PASS, FAIL, BLOCKED or NOT RUN per scenario. Attach the steps and actual output for a failure. The matrix is pending on physical devices.

| Setup | Input and assistive technology | Status |
| --- | --- | --- |
| Windows + Firefox or Chromium | Keyboard only, then NVDA | Not run |
| macOS + Safari | Keyboard only, then VoiceOver | Not run |
| iOS + Safari | Touch and VoiceOver | Not run |
| Android + Chrome | Touch and TalkBack | Not run |

1. Activate the skip link and confirm focus moves to the visualization's main content. Navigate the catalog, editor, player controls, timeline, and fullscreen in both directions. Check visible focus and a way out of fullscreen. Verify the focused control stays visible at 200% and 400% zoom and that the page reflows.
2. Start, pause, resume, reset, and seek. Listen for meaningful control names, disabled states, and useful playback announcements. Check that repeated playback updates do not interrupt speech. Submit malformed JSON and valid JSON with the wrong input shape. Return focus to the editor and check that it exposes the error. Correct the input and confirm the error clears.
3. Step through Bubble Sort and graph traversal. Check that highlighting and the current pseudocode line can be distinguished without color. Check whether the graph's accessible summary explains the current highlighted node. Inspect long node labels and use Shift+Left and Shift+Right on the canvas to reach both ends of a wide diagram without changing the playback step.
4. Switch light, dark, and system themes. Check visible focus indicators, text and control contrast, and highlight cues with forced colors where available. Enable reduced motion and verify animation stops.
5. On mobile, operate the catalog, editor, timeline, and playback controls using touch and the screen reader. Check target spacing, scrolling in narrow layouts, and rotation while an input error or fullscreen view is open.

Axe covers some WCAG 2.2 AA requirements in tested states. Screen reader usability, focus order, understandable diagram alternatives, and mobile interaction require manual evidence.
