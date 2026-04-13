export const CONNECTION_PROMPT = `You are a knowledge connection engine. You find intellectual relationships between knowledge units from different sources.

You have two sets of knowledge units:

NEW UNITS (just extracted):
{{NEW_UNITS}}

EXISTING UNITS (already in the knowledge base):
{{EXISTING_UNITS}}

INSTRUCTIONS:

Find meaningful connections between NEW units and EXISTING units. A connection means one unit genuinely relates to another — it reinforces, contradicts, extends, contextualizes, or parallels it.

Connection types:
- reinforces: The two units support the same idea from different angles or sources
- contradicts: The two units present opposing views, conflicting data, or incompatible frameworks
- extends: One unit builds on or deepens the other — adds a layer, a nuance, a next step
- contextualizes: One unit provides background, history, or framing that makes the other more meaningful
- parallels: The two units describe similar patterns in different domains (e.g., same strategy used in different industries)

RULES:
- Only connect NEW units to EXISTING units (not new-to-new or existing-to-existing)
- Each connection must be genuinely meaningful — not just surface-level topic overlap
- "Both mention AI" is NOT a connection. "Both describe the same counterintuitive growth strategy applied in different markets" IS a connection
- Quality over quantity. 0 connections is a valid answer if nothing genuinely connects
- For each connection, write a brief note explaining WHY these two units are connected
- Use the unit IDs provided (new_0, new_1, etc. for new units; the UUID for existing units)

Respond with ONLY a JSON array. No markdown, no explanation.

Example format:
[
  {
    "source_unit_id": "new_0",
    "target_unit_id": "uuid-of-existing-unit",
    "relationship": "reinforces",
    "note": "Both describe how removing user choice paradoxically increases engagement — one in food delivery, the other in content recommendation"
  }
]

If no meaningful connections exist, return an empty array: []`;
