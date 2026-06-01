# AltasAI RL-Style Personalization

AltasAI uses contextual bandit personalization, not deep RL.

Context:

- user state vector
- workload
- deadline risk
- stress signal
- goal progress
- execution readiness

Actions:

- `start_focus`
- `break_task`
- `reschedule_task`
- `write_reflection`
- `review_goal`
- `generate_report`
- `reduce_workload`
- `prioritize_urgent_task`
- `mentor_plan`

Rewards:

- accepted recommendation
- task completed
- focus completed
- reflection submitted
- goal progress improved
- dismissed/ignored recommendation

The current implementation uses epsilon-greedy selection and stored average rewards. It is intentionally small and explainable.
