# Algorithm support

All listed implementations execute in the public SDK. Tests compare results and validate deterministic event generation and full replay.

| Algorithm | Implementation | Correctness tests | Visualization tests | Limitations |
| --- | --- | --- | --- | --- |
| Bubble Sort | Adjacent swaps | Seeded arrays, duplicates, empty, invalid | Compare/swap order and rewind | Quadratic worst case |
| Selection Sort | Minimum selection | Seeded arrays, duplicates, empty, invalid | Replay matches result | Quadratic and unstable |
| Insertion Sort | Adjacent insertion | Seeded arrays, duplicates, empty, invalid | Replay matches result | Quadratic worst case |
| Merge Sort | Bottom-up merge | Seeded arrays, duplicates, empty, invalid | Write replay | Additional merge storage |
| Quick Sort | Iterative partition | Seeded arrays, duplicates, empty, invalid | Pointer and swap replay | End pivot can produce quadratic traces |
| Linear Search | Left-to-right | First hit, miss, duplicates, invalid | Result variable and unchanged cells | Finite numeric values |
| Binary Search | Midpoint search | Hit, miss, duplicates, invalid and unsorted | Result variable and unchanged cells | Sorted input; any matching duplicate |
| Breadth-first Search | Directed traversal | Cycles, duplicate edges, singleton, invalid | Visited state | Start vertex required |
| Depth-first Search | Directed traversal | Cycles, duplicate edges, singleton, invalid | Visited state | Start vertex required |
| BST insertion | Unbalanced insertion | Empty, duplicates, depth and ancestry | Replayed nodes and edges | Duplicates go right |
| Stack operations | Push/pop | Empty, repeated values, invalid | Size and final state | Numeric values; empty pop is a no-op |
| Fibonacci recursion | Recursive expansion | Every input 0 through 12, invalid | Balanced calls and final stack | Exponential trace, integer inputs only |
