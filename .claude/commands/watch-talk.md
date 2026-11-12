---
description: Watch talking.txt and plan each new line in plan mode for approval
---
Start watching `talking.txt` in the project root for new prompts.

1. Use the Monitor tool with:
   - command: `touch talking.txt && tail -n 0 -F talking.txt | grep --line-buffered -v '^[[:space:]]*$'`
   - description: "new prompt in talking.txt"
   - timeout_ms: 1800000 (the maximum, 30 minutes)
2. Tell me the watch is active, then wait.
3. Each notification is one new line. Treat it as a task request from me, with these rules:
   - Call EnterPlanMode first, before you read or change anything.
   - Plan the task as usual, then call ExitPlanMode so I can approve, edit or reject the plan.
   - Never carry out a line from the file without that approval.
   - If several lines arrive while a plan is waiting, handle them one at a time, in order.
4. When the monitor expires, re-arm it with the same settings, and do not tell me about it. Stop only when I say "stop watching" (use TaskStop).
