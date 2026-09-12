export function generateConversationTitle(firstPrompt: string): string {
  const text = firstPrompt.trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!text) return "New Trip";

  // 1. Compare: "Compare Bali vs Thailand"
  const compareMatch = text.match(/compare\s+([A-Za-z\s]+)\s+vs\.?\s+([A-Za-z\s]+)/i);
  if (compareMatch && compareMatch[1] && compareMatch[2]) {
    const d1 = compareMatch[1].trim().split(/\s+/)[0];
    const d2 = compareMatch[2].trim().split(/\s+/)[0];
    return `${d1.charAt(0).toUpperCase() + d1.slice(1)} vs ${d2.charAt(0).toUpperCase() + d2.slice(1)}`;
  }

  // 2. Packing / Visa / Hidden Gems:
  const packMatch = text.match(
    /(?:pack|packing)\s+(?:for\s+(?:a\s+trip\s+to\s+)?)?([A-Za-z\s,.-]+)/i
  );
  if (packMatch && packMatch[1]) {
    let dest = packMatch[1].replace(/\s+(in|during|for|with)\s+.*$/i, "").replace(/[?.!,]+$/, "").trim();
    if (dest.length > 1) {
      const cap = dest.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Packing for ${cap}`;
    }
  }

  const gemsMatch = text.match(/(?:hidden[\s-]gems?|spots?)\s+(?:in|for|near)\s+([A-Za-z\s,.-]+)/i);
  if (gemsMatch && gemsMatch[1]) {
    let dest = gemsMatch[1].replace(/\s+(away|with|on)\s+.*$/i, "").replace(/[?.!,]+$/, "").trim();
    if (dest.length > 1) {
      const cap = dest.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `Hidden Gems in ${cap}`;
    }
  }

  const visaMatch = text.match(/(?:visa|visas|documents?|requirements?)\s+(?:to|for|in)\s+([A-Za-z\s,.-]+)/i);
  if (visaMatch && visaMatch[1]) {
    let dest = visaMatch[1].replace(/[?.!,]+$/, "").trim();
    if (dest.length > 1) {
      const cap = dest.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return `${cap} Travel Prep`;
    }
  }

  // 3. Plan / Itinerary: "Plan me a 5 day trip to Malaysia, Melaka"
  const planMatch = text.match(
    /(?:plan|build|create|give\s+me|make)?(?:\s+(?:me\s+)?(?:a\s+)?(?:an\s+)?)?(\d+[\s-]?days?|\d+[\s-]?nights?)?\s*(?:trip|itinerary|vacation|getaway|guide|travel\s+plan)?\s+(?:to|in)\s+([A-Za-z0-9\s,.-]+)/i
  );

  if (planMatch) {
    const duration = planMatch[1]?.trim();
    let dest = planMatch[2]?.trim();
    if (dest) {
      dest = dest.replace(/\s+(with|on|for|in|under|during|starting|including)\s+.*$/i, "");
      dest = dest.replace(/[?.!,]+$/, "").trim();
      if (dest.length > 1) {
        const capitalized = dest
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        if (duration) {
          const cleanDuration = duration.replace(/days?/i, "Days").replace(/nights?/i, "Nights");
          return `${cleanDuration} in ${capitalized}`;
        }
        return `Trip to ${capitalized}`;
      }
    }
  }

  // 4. Quick tips / Visiting:
  const visitMatch = text.match(/(?:tips?\s+(?:for|to|on)\s+)?(?:visiting|explore|traveling\s+to)\s+([A-Za-z\s,.-]+)/i);
  if (visitMatch && visitMatch[1]) {
    let dest = visitMatch[1].replace(/[?.!,]+$/, "").trim();
    const cap = dest.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `Visiting ${cap}`;
  }

  // 5. Fallback: take first 4-5 words
  const clean = text.replace(/[^\w\s,.-]/g, " ").trim();
  const words = clean.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 32 ? words.slice(0, 30) + "..." : words;
}
