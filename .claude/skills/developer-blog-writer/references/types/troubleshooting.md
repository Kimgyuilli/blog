# Troubleshooting

**Reader question:** What failed, why did it fail, and how do we know the fix worked?

State the symptom and its impact before explaining the cause. Show the observations that narrowed the search: logs, metrics, reproduction conditions, code paths, or eliminated hypotheses. Trace the causal chain from condition to failure. Then show the correction, its verification, and any remaining exposure.

When the source contains a detailed investigation, preserve the evidence that distinguishes the actual cause from plausible alternatives. Sections may be combined, but keep the observation behind each important inference and the settings and test conditions needed to assess the fix. A shorter account is useful only when those connections remain clear.

Do not present the first suspicion as a confirmed cause. Do not invent log lines, a reproduction, or a successful retest. If the source ends before verification, say what is confirmed and what still needs to be checked.
