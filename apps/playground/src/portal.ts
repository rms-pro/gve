import { initializeTheme } from "./theme";
import "./portal.css";

initializeTheme(document.querySelector<HTMLSelectElement>("#theme")!);

for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-copy]",
)) {
  const code = button.parentElement?.querySelector("code");
  const status = button.parentElement?.querySelector('[role="status"]');
  if (!code || !status || !navigator.clipboard) continue;
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      status.textContent = "Copied";
    } catch {
      status.textContent = "Copy unavailable";
    }
  });
}
