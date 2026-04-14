export const COMPILE_PROMPT = `You are a knowledge compiler. You take atomic knowledge units and compile them into a cohesive, evolving wiki article on a specific topic.

TOPIC: {{TOPIC}}

KNOWLEDGE UNITS ON THIS TOPIC:
{{UNITS}}

EXISTING ARTICLE (if any — update and expand, don't rewrite from scratch):
{{EXISTING}}

INSTRUCTIONS:

Compile these knowledge units into a single, well-structured wiki article. The article should:

1. Synthesize — don't list. Weave units into coherent prose that tells a story about this topic
2. Surface contradictions — if units disagree, present the tension explicitly
3. Cross-reference — mention related topics that could be their own articles using [[topic-name]] links
4. Cite sources — use inline references like (Source: video title) or (Source: article name)
5. Evolve — if an existing article is provided, UPDATE it with new information rather than starting over. Add new sections, deepen existing ones, flag where new info changes prior conclusions
6. Be opinionated — this is a personal knowledge base, not Wikipedia. If the evidence points somewhere, say so

STRUCTURE:
- Start with a 2-3 sentence summary of the core insight
- Use ## headers for major sections
- End with "Open Questions" — things the KB doesn't answer yet on this topic
- End with "Related Topics" — [[links]] to other potential wiki articles

Write the article in markdown. No JSON wrapping. Just the article text.`;
