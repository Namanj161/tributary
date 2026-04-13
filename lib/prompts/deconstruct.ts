export const DECONSTRUCT_PROMPT = `You are an intelligence extraction engine. Your job is to deconstruct a piece of content into atomic knowledge units — discrete, self-contained pieces of knowledge that are individually valuable.

You are processing a {{SOURCE_TYPE}} titled: "{{TITLE}}"

CONTENT:
{{CONTENT}}

INSTRUCTIONS:

Deconstruct this content into knowledge units. Be BROAD and GENEROUS — extract everything that contains genuine substance. Do not filter based on assumed relevance or importance. If it's a real idea, framework, tactic, data point, or insight, extract it.

Each knowledge unit should be one of these types:
- framework: A mental model or structured way of thinking about something
- tactic: A specific, actionable approach someone used or recommends
- claim: A factual assertion or data point that can be verified
- insight: A non-obvious observation or connection the author/speaker makes
- story: A narrative or case study with experiential weight
- number: A specific metric, stat, or quantitative reference
- question: An open question raised by the content (explicitly or implicitly)
- principle: A foundational belief or rule being asserted
- example: A concrete instance illustrating a broader point
- warning: A cautionary insight or anti-pattern

For each unit, provide:
1. type: One of the types above
2. content: The knowledge unit itself — expressed clearly and completely enough to be understood without the original source. Write it as a standalone statement, not a summary fragment.
3. context: Where in the source this came from and any surrounding context needed. Keep this brief.
4. tags: 2-5 lowercase tags that categorize this unit by topic (e.g., "growth-strategy", "product-led-growth", "cold-outreach", "ai-market")

IMPORTANT:
- Make each unit self-contained. Someone reading just the unit should understand the idea without needing the original source.
- Don't summarize — deconstruct. The difference: a summary says "the speaker discussed growth strategies." A deconstruction extracts each specific growth strategy as its own unit.
- Don't editorialize or add your own analysis. Extract what's actually in the content.
- For long content (videos, lengthy articles), expect to produce 20-60 units. Short content might produce 5-15.
- Bias toward inclusion. If you're unsure whether something is worth extracting, extract it.

Respond with ONLY a JSON array of objects. No markdown, no explanation, no preamble. Just the array.

Example format:
[
  {
    "type": "framework",
    "content": "Product-led growth works in AI because the product improves faster than marketing can communicate its value, making direct usage the most persuasive selling mechanism.",
    "context": "Discussed in the context of how Anthropic's Claude drives its own adoption through quality improvements.",
    "tags": ["product-led-growth", "ai-market", "growth-strategy"]
  },
  {
    "type": "number",
    "content": "Anthropic scaled from $1 billion to over $19 billion in ARR in just 14 months.",
    "context": "Cited as one of the fastest growth trajectories in tech history.",
    "tags": ["anthropic", "revenue-growth", "ai-market"]
  }
]`;
