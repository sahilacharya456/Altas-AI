# AltasAI Startup Strategy

## What AltasAI Is

An execution accountability system for ambitious people who know what to do but don't consistently do it. It captures daily behavior signals (tasks, focus, reflection, digital usage) and returns one specific next action — backed by a strict AI mentor that holds you accountable to your own patterns.

**It is not a to-do app. It is not a chatbot. It is not another productivity dashboard.**

---

## Strongest Market Wedge

**Execution consistency for ambitious students and early builders.**

The pain is acute and daily:
- Final-year students with major deadlines stalling on small distractions
- Junior devs building portfolios while juggling jobs and applications  
- Indie builders who ship features in sprints but struggle to maintain momentum

Generic tools (Notion, Todoist, Obsidian) don't hold you accountable. AltasAI does. The strict mentor doesn't motivate — it diagnoses and redirects.

---

## First 10 Beta Users

Target these specific profiles:
1. Final-year CS student with a capstone/FYP project
2. Junior developer applying for first job, building a portfolio project
3. Indie hacker working on a SaaS or mobile app
4. Early founder pre-product-market-fit, struggling with consistent shipping
5. Repeat users from other productivity tools who feel guilty about not using them

**Where to find them**: GitHub (active repos with incomplete READMEs), Product Hunt (makers section), Twitter/X (#buildinpublic), university Discord servers.

---

## LinkedIn/GitHub Demo Strategy

**Show one real execution loop, not features.**

LinkedIn post script:
> "I built an AI mentor that tells you what to do today — and why your execution failed yesterday.
> 
> It uses your task history, focus sessions, and reflection logs to build a behavior model.
> No generic advice. One specific next move.
> 
> Here's the demo: [3-minute screen recording]
> 
> Stack: React Native (Expo), Firebase, Express, Python ML, Gemini (optional)."

**What to show in the recording:**
- Create one task → start focus → log reflection → mentor diagnoses the blocker → gives one action
- Show the offline fallback: "It works without AI keys"
- Show Cortex: "This is from your behavior, not from typing into a prompt"

**What NOT to show:**
- Finance/Khata (postponed)
- News Lab (placeholder)
- Device Safety (secondary)
- The RL/RAG/Vision slides from docs (overclaims)

---

## Features to Hide to Avoid Looking Fake

| Feature | Why |
|---|---|
| News Lab | Labeled "future feature" in code — shows immediately |
| Khata/Finance | Full featured but not the execution wedge |
| Device Safety | Secondary security feature |
| Scan Link | Replaced with ComingSoonScreen |
| Python ML RAG/Vision | C-grade scaffolding — never show these endpoints |
| RL contextual bandit | No reward signal yet — not credible |

---

## What Should Be Monetized Later

**Free**: Core loop (tasks, focus, reflection, basic mentor)  
**Premium (~$8–12/month)**:
- Unlimited mentor sessions (above daily quota)
- Cortex weekly report with full pattern breakdown
- Personalized interventions (ML-powered when Python service is production-ready)
- Strict accountability mode with daily forced check-ins
- Execution history export

**DO NOT price on API calls.** Price on outcome: consistent execution.

---

## 30-Day Beta Plan

**Week 1 (Days 1–7): First users**
- Recruit 5 users from target profiles
- Each completes onboarding + 3 full execution loops
- Collect: What did the mentor say? Was it useful? Did you do it?

**Week 2 (Days 8–14): Signal**
- Add push notification for daily 9pm reflection reminder
- Track: onboarding → task → focus → reflection completion rate
- Fix: Any blocker in the demo flow found by real users

**Week 3 (Days 15–21): Mentor quality**
- Review mentor responses from all sessions
- Improve intervention rules if responses feel generic
- A/B: strict tone vs mentor tone on first-time users

**Week 4 (Days 22–30): Retention**
- Check 7-day retention for all 5 users
- Target: 3 users complete at least 1 execution loop per day for 7 days
- Decision: Keep iterating or open to 50 users based on retention data

---

## Metrics That Prove Value

1. **Onboarding completion rate**: Target 80%+
2. **First execution loop rate**: % of registered users who complete task→focus→reflection
3. **Day 7 retention**: % who open AltasAI 4+ days in first week
4. **Weekly execution loops**: Target 2+ per retained user per week
5. **Mentor prompt rate**: % of sessions where user sends at least 1 message
6. **Recommendation acceptance rate**: % of intervention cards acted on

**If retention is below 30% at day 7**, the mentor quality is the problem — not the stack.

---

## What Would Impress Recruiters/Investors

For **recruiters**: A clean GitHub repo with a real 3-minute demo video, a working backend with tests, and an honest README that explains what is real vs in progress.

For **early-stage investors**: The deterministic AI pipeline (works without Gemini) is the moat. Every competitor uses raw LLM calls — AltasAI has a behavior model. Show the North Star metric trend over 30 days of beta.

For **technical interviewers**: The architecture — Zod validation, Firestore security rules with field-level validation, quota system with Firestore transactions, graceful ML fallback chain, test coverage for all AI models.
