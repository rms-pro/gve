# Manual accessibility verification

Record the commit, OS, browser, assistive technology and versions, viewport or zoom, theme, and PASS, FAIL, BLOCKED or NOT RUN per scenario. Attach the steps and actual output for a failure. The matrix is pending on physical devices.

| Setup | Input and assistive technology |
| --- | --- |
| Windows + Firefox or Chromium | Keyboard only, then NVDA |
| macOS + Safari | Keyboard only, then VoiceOver |
| iOS + Safari | Touch and VoiceOver |
| Android + Chrome | Touch and TalkBack |

1. Navigate from the catalog to the editor, player controls, timeline, and fullscreen. Check forward and reverse focus order, visible focus, and a way out of fullscreen. Verify the focused control remains visible at 200% and 400% zoom and that the page reflows at a narrow viewport.
2. Start, pause, resume, reset, and seek. Listen for meaningful control names, disabled states, and useful playback announcements. Check that repeated playback updates do not interrupt speech. Submit malformed JSON and confirm the error is discoverable and the editor remains usable.
3. Step through Bubble Sort and graph traversal. Check that highlighting and the current pseudocode line can be distinguished without color. Check whether the graph's accessible summary explains the current highlighted node. Inspect long node labels and reach both ends of horizontally scrolling views.
4. Switch light, dark, and system themes. Check visible focus indicators, text and control contrast, and highlight cues with forced colors where available. Enable reduced motion and verify animation stops.
5. On mobile, operate the catalog, editor, timeline, and playback controls using touch and the screen reader. Check target spacing, scrolling in narrow layouts, and rotation while an input error or fullscreen view is open.

Axe covers some WCAG 2.2 AA requirements in tested states. Screen reader usability, focus order, understandable diagram alternatives, and mobile interaction require manual evidence.
