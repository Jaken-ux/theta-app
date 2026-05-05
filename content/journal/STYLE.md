# Journal Writing Style

Read this before drafting any journal post in `content/journal/*.mdx`.

## Who reads this

People interested in Theta who want to extract information — the problem, the examples, the fix. They scan first, read second. They are not here for a story. They will close the tab if the post feels AI-written or padded.

## Tone

- Compressed
- On-point
- No filler words, no transitional fluff
- No emotional beats
- No narrative buildup

## Default structure

1. **Problem** — what was wrong, in one or two sentences. No setup.
2. **Examples** — concrete instances, scannable. Bullets when possible.
3. **Fix** — what was done. Specific.
4. **Lessons** — short, bolded one-liners.

Adapt as the topic requires. A post about a working setup might go: setup → first test → result → why it matters. The principle is the same — every section earns its place.

## Length

~400 words / 2–3 min reading is a **reference point, not a rule**.

- If 250 words covers it, write 250.
- If 700 words are necessary, write 700 — but every paragraph must earn its space.
- Cut every sentence that does not add information.
- Length is determined by the topic, not by a target word count.

## What to avoid

- Narrative buildup ("It worked beautifully. And then I started actually checking...")
- Emotional beats ("That was the moment I realised...")
- Drama and pacing ("Three core facts. Three hallucinations. Ten minutes.")
- Forward-looking promises ("I'll write that up here when I've got it running.")
- Filler transitions ("So here's what I did", "Let me explain", "Now, the interesting part is...")
- Restating the obvious ("As you can see above...")
- Generic AI tells: "let's dive in", "in this post", "it's important to note"

## Concrete examples

### Opening

❌ **Bad** (narrative buildup):
> A few weeks ago I added an AI chatbot to Thetasimplified. The idea was simple: someone lands on the site, has a question about THETA, TFUEL, the validator setup — and instead of digging through three pages, they just ask. It worked beautifully. The bot was articulate. And then I started actually checking what it said.

✅ **Good** (states the problem in one sentence):
> The chatbot on Thetasimplified was articulate, confident, and wrong.

### Listing examples

❌ **Bad** (prose form, redundant phrasing):
> The first thing I caught was block time. The bot told a user that Theta produces a new block roughly every 2 seconds. The actual target is around 6 seconds. Not even close. Then I asked about TFUEL burns. It said "50% of TFUEL paid to Edge Network nodes is burned." The real number is 25%.

✅ **Good** (scannable):
> - Block time is "around 2 seconds" (it's ~6)
> - "50% of TFUEL paid to Edge Network nodes is burned" (it's 25%)

### Lessons / takeaways

❌ **Bad**:
> A few things I didn't appreciate before I started. First, fluent does not mean correct. A confident, articulate answer from an AI tells you nothing about whether it's right. The model has no internal signal for "I'm guessing now." It just generates the most plausible next token. If you don't test it, you have no idea what it's saying.

✅ **Good**:
> **Fluent isn't correct.** A confident answer from an LLM tells you nothing about whether it's right. The model has no internal signal for "I'm guessing now."

### Closing

❌ **Bad** (over-promising, narrative):
> The next experiment: a multi-step pipeline. Generate an image on Theta. Transcribe an audio. I'll write that up here when I've got it running.

✅ **Good** (stop when the point is made):
> — Jacob

## Persona check

Before publishing, ask: would a Theta-interested reader who just landed here from Twitter feel like the post respected their time? If the answer requires hedging, cut more.

## Always-on rules

- **Sign every post with `— Jacob` on its own line at the very end.** No
  exceptions. The em-dash, not a hyphen. This makes the journal feel
  like a personal log, not a content stream — and reads consistently
  across the whole archive.
- **Default new posts to draft.** New `.mdx` files should not include
  `published: true` until Jacob explicitly says to ship. Drafts are
  invisible on `/journal`, kept out of the sitemap, never pre-rendered,
  and 404 to anyone without the admin cookie — but the URL is reachable
  by Jacob for review. To publish: add `published: true` to the
  frontmatter. To unpublish later: remove the line or set it to false.

## Pre-publish checklist

- [ ] First sentence states the problem or result. No setup.
- [ ] Every paragraph earns its space.
- [ ] No "And then..." or "It was at that moment..." transitions.
- [ ] No promises about future posts.
- [ ] Concrete examples present wherever a claim is made.
- [ ] Lessons bolded, one-line each.
- [ ] No filler closer ("Stay tuned", "More to come", "What do you think?").
- [ ] Post ends with `— Jacob` on its own line.
