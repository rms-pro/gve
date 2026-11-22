# Performance

Run `pnpm bench` on Node.js 22. The script uses deterministic inputs and reports wall-clock totals and retained V8 heap after a forced GC. Retained heap includes the trace and playback checkpoints. It excludes browser memory and peak allocations. Layout timing covers pure layout, excluding React, browser painting, and user interaction.

Release validation run on an Apple M2 MacBook Pro with 8 GB RAM, macOS 26.3.1, Node.js 22.23.4 and checkpoints every 64 events. Integer arrays use `(i * 31) % (size + 3)`. Navigation totals include equal numbers of forward and backward steps. The deterministic seek sequence uses `(i * 97) % (eventCount + 1)`.

| Workload | Events | Generate ms | Validate and index ms | Navigation ms | 1,000 seeks ms | Retained KiB | 100 layouts ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bubble Sort, 16 values | 163 | 1.20 | 0.80 | 5.08 for 326 | 19.89 | 229 | 1.13 |
| Merge Sort, 200 values | 2,891 | 8.79 | 9.01 | 55.67 for 2,000 | 44.42 | 1,107 | 4.92 |
| Merge Sort, 1,000 values | 17,928 | 37.15 | 110.38 | 170.38 for 2,000 | 148.90 | 8,911 | 14.07 |
| Fibonacci, n=10 | 1,061 | 3.23 | 3.21 | 34.42 for 2,000 | 33.01 | 427 | 3.06 |

Use tens of values for paced lessons. Prefer hundreds only when the algorithm and target device have been measured. The 1,000-value example demonstrates that synchronous preparation can exceed a frame budget. Generation defaults to a 2 second cooperative deadline, 128,000 input bytes, 16 million trace bytes, and 100,000 events. Reducing checkpoint intervals increases retained state while reducing worst-case replay. Use streaming batches for hosts that need to yield while generating. Browser painting should be profiled on target devices before introducing virtualization.

The Playwright responsiveness check measured 20 manual-step equivalents on the 200-cell Merge Sort view in Chrome for Testing headless shell 151.0.7922.34 using Playwright 1.58.2. The median click-to-next-animation-frame interval was 16.2 ms and the 95th percentile was 19.1 ms. This interval includes frame scheduling and precedes completion of browser painting. Reproduce it with `pnpm build && pnpm test:browser --grep "next-frame latency"`.
