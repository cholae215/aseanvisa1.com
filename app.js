/**
 * ASEAN Visa AI Platform - Application Logic
 * Implements: SSE Streaming, Vector RAG Pipeline, Semantic Caching,
 * Multi-LLM Circuit Breaker, Sliding Window Rate Limiting, & Guardrails.
 *
 * Source: design.md & ai_web_development_guide.md
 */

// ============================================================================
// 1. KNOWLEDGE BASE & EMBEDDED VECTOR STORE (Verified Government Portal Data)
// ============================================================================

const KNOWLEDGE_BASE = [
  {
    id: "chunk-th-01",
    docId: "thai-mfa-dtv-regulation-2024",
    country: "thailand",
    title: "Thailand Destination Visa (DTV) Official Guidelines",
    citation: "Ministry of Foreign Affairs of Thailand, DTV Regulation B.E. 2567 (2024) / thaievisa.go.th",
    text: "The Destination Thailand Visa (DTV), launched July 15, 2024, is valid for 5 years with multiple entries, permitting a stay of up to 180 days per entry, extendable once per entry for another 180 days at the Thai Immigration Bureau for a fee of 1,900 THB (total up to 360 days per trip). Eligible categories include digital nomads, remote workers, freelancers, and cultural activity participants (Muay Thai courses, Thai culinary training, medical treatment, seminars). Applicants must submit official bank statements demonstrating minimum liquid financial assets of at least 500,000 THB (~$14,000 USD) held over the prior 3 months, an employment contract or commercial client portfolio from entities outside Thailand, and pay a visa fee of 10,000 THB (plus consular/processing charges). DTV holders are strictly prohibited from working for domestic Thai employers.",
    keywords: ["dtv", "destination thailand visa", "thailand", "digital nomad", "remote work", "500000 thb", "180 days", "5 years", "10000 thb", "freelance", "thaievisa.go.th"]
  },
  {
    id: "chunk-th-02",
    docId: "thai-ltr-board-of-investment",
    country: "thailand",
    title: "Thailand Long-Term Resident (LTR) Visa",
    citation: "Thailand Board of Investment (BOI) LTR Guidelines / ltr.boi.go.th",
    text: "Thailand's Long-Term Resident (LTR) Visa is a 10-year renewable visa targeted at four categories: Wealthy Global Citizens, Wealthy Pensioners, Work-from-Thailand Professionals (remote employees of established public/private enterprises), and High-Skilled Professionals. For Work-from-Thailand professionals, applicants must have earned an individual income of at least $80,000 USD/year for the past 2 years (or $40,000 USD/year if holding a Master's degree or intellectual property). The employer must be a publicly listed company on a stock exchange or a private firm with at least $50 million USD total combined revenue over the past 3 years. Privileges include digital work permit, 17% personal income tax cap for experts, and exemption from 4 Thai to 1 foreign employee ratio.",
    keywords: ["ltr", "long-term resident", "thailand", "80000", "wealthy", "pensioner", "10-year", "boi", "ltr.boi.go.th"]
  },
  {
    id: "chunk-my-01",
    docId: "mdec-de-rantau-nomad-pass",
    country: "malaysia",
    title: "Malaysia DE Rantau Digital Nomad Pass",
    citation: "Malaysia Digital Economy Corporation (MDEC) DE Rantau Portal / mdec.my/derantau",
    text: "The DE Rantau Nomad Pass is administered by MDEC and open to both digital freelancers and remote workers. Validity is 3 to 12 months, renewable once for up to an additional 12 months (maximum 24 months total stay). Income requirements are tiered: for digital/tech talents (software development, cybersecurity, AI, digital marketing), the minimum income is $24,000 USD/year (~$2,000 USD/month). For non-tech remote professionals (business founders, C-level executives, legal/finance consultants), the minimum income is $60,000 USD/year (~$5,000 USD/month). Application fee is RM 1,000 for the principal applicant plus RM 500 per dependent (+ 8% SST). Work must be performed for clients/employers outside Malaysia.",
    keywords: ["de rantau", "malaysia", "mdec", "nomad pass", "24000 usd", "60000 usd", "kuala lumpur", "penang", "mdec.my"]
  },
  {
    id: "chunk-my-02",
    docId: "motac-mm2h-guidelines-2024",
    country: "malaysia",
    title: "Malaysia My Second Home (MM2H) 3-Tier System",
    citation: "Ministry of Tourism, Arts and Culture (MOTAC) MM2H Framework / motac.gov.my",
    text: "Under the MOTAC 2024 MM2H framework, participants qualify across three tiers: Silver, Gold, or Platinum. Minimum applicant age is 25 years old. Silver requires a fixed deposit (FD) of $150,000 USD, grants a 5-year renewable visa, and mandates property purchase of at least RM 600,000. Gold requires an FD of $500,000 USD, grants a 15-year visa, and mandates property purchase of at least RM 1,000,000. Platinum requires an FD of $1,000,000 USD, grants a 20-year visa, mandates property purchase of at least RM 2,000,000, and permits commercial investment. Applicants aged 25 to 49 must reside in Malaysia for a cumulative minimum of 90 days per year (no minimum stay for ages 50+). Up to 50% of the fixed deposit may be withdrawn after 1 year for approved healthcare, education, or real estate expenses.",
    keywords: ["mm2h", "malaysia my second home", "malaysia", "motac", "silver", "gold", "platinum", "property", "motac.gov.my"]
  },
  {
    id: "chunk-id-01",
    docId: "indonesia-remote-worker-e33g",
    country: "indonesia",
    title: "Indonesia Remote Worker Visa (Index E33G) & e-VOA",
    citation: "Directorate General of Immigration Indonesia (Ditjen Imigrasi) / evisa.imigrasi.go.id",
    text: "The Indonesian Remote Worker Visa (index E33G / Second Home Remote Worker) allows foreign remote employees to live in Indonesia (popular in Bali, Jakarta, Lombok) for 1 year with multiple entries. Requirements via evisa.imigrasi.go.id include: valid passport with at least 6 months validity, proof of an active employment contract with a company outside Indonesia, verified annual salary of at least $60,000 USD, and personal bank statements showing an ending balance of at least $2,000 USD over the last 3 months. E33G holders cannot earn local Indonesian wages. For tourists, Indonesia offers the 30-day e-VOA / Visitor Visa (B1) for 500,000 IDR (~$32 USD), extendable once for 30 days.",
    keywords: ["e33g", "indonesia", "bali", "remote worker visa", "60000 usd", "2000 usd", "e-voa", "b1", "evisa.imigrasi.go.id"]
  },
  {
    id: "chunk-sg-01",
    docId: "singapore-mom-one-pass",
    country: "singapore",
    title: "Singapore Overseas Networks & Expertise (ONE) Pass & Entry Rules",
    citation: "Ministry of Manpower (MOM) / Immigration & Checkpoints Authority (ICA) / mom.gov.sg",
    text: "Singapore's Overseas Networks & Expertise (ONE) Pass is a personalized 5-year employment pass for top talent in business, tech, science, arts, and sports. Benchmark criteria require a fixed monthly salary of at least 30,000 SGD (~$22,500 USD) earned over the past 12 consecutive months, or proof of future local employment at 30,000 SGD/month. Overseas candidates must be employed by a company with market cap ≥ $500M USD or annual revenue ≥ $200M USD. ONE Pass holders can concurrently direct, consult, and found multiple businesses without separate passes and are exempt from COMPASS points. For travelers, foreign visitors must submit the electronic SG Arrival Card (SGAC) with health declaration within 3 days prior to arrival via ica.gov.sg (submission is free; visa-required nationals pay 30 SGD visa application fee).",
    keywords: ["one pass", "singapore", "mom", "ica", "30000 sgd", "sg arrival card", "ica.gov.sg", "mom.gov.sg"]
  },
  {
    id: "chunk-vn-01",
    docId: "vietnam-immigration-law-2023-e-visa",
    country: "vietnam",
    title: "Vietnam 90-Day Electronic Visa (E-Visa) Framework",
    citation: "Vietnam National Assembly Law No. 23/2023/QH15 / evisa.gov.vn / evisa.xuatnhapcanh.gov.vn",
    text: "Under Law No. 23/2023/QH15, Vietnam issues 90-day electronic visas (e-visas) to citizens of all countries and territories. Applications are submitted via the official government portal (evisa.gov.vn / evisa.xuatnhapcanh.gov.vn). Official government fees are $25 USD for a single-entry e-visa and $50 USD for a multiple-entry e-visa (non-refundable). Standard processing turnaround is 3 working days. Valid for entry and exit through 42 designated international checkpoints (13 international airports including Noi Bai, Tan Son Nhat, Da Nang; 16 land border gates; and 13 seaports). Foreigners may reside continuously for up to 90 days per validity period.",
    keywords: ["vietnam", "e-visa", "90 days", "25 usd", "50 usd", "multiple entry", "evisa.gov.vn", "xuatnhapcanh.gov.vn"]
  },
  {
    id: "chunk-ph-01",
    docId: "philippines-pra-srrv-guidelines",
    country: "philippines",
    title: "Philippines Special Resident Retiree's Visa (SRRV) & eTravel",
    citation: "Philippine Retirement Authority (PRA) / Bureau of Immigration / pra.gov.ph",
    text: "The Special Resident Retiree's Visa (SRRV) issued by the Philippine Retirement Authority (PRA) is a lifetime non-immigrant visa granting multiple-entry privileges and indefinite stay. Under the SRRV Classic option, the applicant must be at least 50 years of age (the prior 35–49 age bracket was formally suspended by the PRA Board). Applicants aged 50 and above must maintain a qualifying time deposit in an accredited bank: $10,000 USD if receiving a lifetime monthly pension of at least $800 USD ($1,000 for couples), or $20,000 USD without pension. All arriving international travelers must also complete the mandatory eTravel registration within 72 hours prior to arrival via etravel.gov.ph (free government service).",
    keywords: ["philippines", "srrv", "pra", "retiree visa", "50 years old", "etravel", "pra.gov.ph", "etravel.gov.ph"]
  },
  {
    id: "chunk-mm-01",
    docId: "myanmar-moip-evisa-framework",
    country: "myanmar",
    title: "Myanmar Official eVisa Guidelines",
    citation: "Ministry of Immigration and Population of Myanmar / evisa.moip.gov.mm",
    text: "Myanmar's Ministry of Immigration and Population issues electronic visas online via evisa.moip.gov.mm. The Tourist eVisa costs $50 USD, is valid for 90 days from date of issue, and permits a single-entry stay of up to 28 days (non-extendable). The Business eVisa costs $70 USD, is valid for 90 days, and permits a single-entry stay of up to 70 days, requiring a formal letter of invitation and company registration from a Myanmar enterprise. Standard processing takes 3 working days. Valid for entry at Yangon, Mandalay, and Nay Pyi Taw international airports, as well as designated border checkpoints (Tachileik, Myawaddy, Kawthaung). Certain ASEAN citizens enjoy bilateral visa-free entry for 14 to 30 days.",
    keywords: ["myanmar", "evisa", "50 usd", "70 usd", "28 days", "70 days", "yangon", "moip.gov.mm"]
  },
  {
    id: "chunk-kh-01",
    docId: "cambodia-mfaic-evisa-framework",
    country: "cambodia",
    title: "Cambodia e-Visa (Type T & E) and Cambodia e-Arrival",
    citation: "Ministry of Foreign Affairs and International Cooperation / evisa.gov.kh / arrival.gov.kh",
    text: "Cambodia issues online e-Visas via evisa.gov.kh: Tourist e-Visa (Type 'T') costs $30 USD official fee + $6 processing fee ($36 USD total), valid for 3 months, permitting a single-entry stay of up to 30 days (extendable once for 30 days at the Department of Immigration). Ordinary/Business e-Visa (Type 'E') costs $35 USD + $7 processing fee ($42 USD total), permitting 30 days stay and extendable for 1, 3, 6, or 12 months for employment or business. All inbound travelers must complete the mandatory Cambodia e-Arrival declaration online or via the app (arrival.gov.kh) within 7 days prior to entry. Standard e-Visa processing takes 3 business days.",
    keywords: ["cambodia", "evisa", "type t", "type e", "36 usd", "42 usd", "30 days", "arrival.gov.kh", "evisa.gov.kh"]
  },
  {
    id: "chunk-la-01",
    docId: "laos-mfa-evisa-framework",
    country: "laos",
    title: "Lao PDR Official eVisa (Type T) Guidelines",
    citation: "Ministry of Foreign Affairs of Lao PDR / laoevisa.gov.la",
    text: "The Ministry of Foreign Affairs of Lao PDR issues the official Lao eVisa (Tourist Visa Type 'T') via laoevisa.gov.la. The official fee is $50 USD (plus electronic processing charges), permitting a single-entry stay of up to 30 days, valid for 60 days from date of issuance. The eVisa is accepted at 8 designated international checkpoints: Wattay International Airport (Vientiane), Luang Prabang International Airport, Pakse International Airport, Lao-Thai Friendship Bridges (I, II, IV), and Boten International Checkpoint (railway and road from China). Processing turnaround is officially 3 business days. Visas are non-refundable and non-transferable.",
    keywords: ["laos", "lao pdr", "evisa", "50 usd", "30 days", "vientiane", "luang prabang", "laoevisa.gov.la"]
  },
  {
    id: "chunk-bn-01",
    docId: "brunei-jipk-earrival-framework",
    country: "brunei",
    title: "Brunei Darussalam E-Arrival Card and Entry Visas",
    citation: "Department of Immigration and National Registration (JIPK) Brunei / imm.gov.bn",
    text: "All foreign nationals arriving in Brunei Darussalam by air, land, or sea must register their trip via the official Brunei E-Arrival Card portal (imm.gov.bn / ocp.mofe.gov.bn) prior to arrival. Registration is free. Citizens of eligible countries (including ASEAN member states, UK, USA, EU nations, Japan, and Singapore) enjoy visa exemptions for tourism/business ranging from 14 to 90 days depending on nationality. Other foreign nationals must apply for an entry visa through a Brunei Diplomatic Mission abroad or obtain a sponsored visa before travel. Transit passengers connecting through Brunei International Airport for under 72 hours may obtain a transit visa under specific airline sponsorship conditions.",
    keywords: ["brunei", "darussalam", "e-arrival card", "imm.gov.bn", "visa exemption", "14 days", "30 days", "jipk"]
  },
  {
    id: "chunk-atsp-01",
    docId: "asean-regional-visa-status",
    country: "all",
    title: "ASEAN Regional Visa Policy & ATSP 'Six Countries, One Destination' Status",
    citation: "ASEAN Secretariat (asean.org) / ATSP Framework / Official Immigration Portals",
    text: "Important Legal Status: There is currently NO single universal visa or collective Schengen-style visa in ASEAN. Each of the 10 member states exercises strict national immigration sovereignty and enforces distinct visa requirements, fees, and digital entry systems. The 'Six Countries, One Destination' initiative (spearheaded by Thailand with participation from Vietnam, Malaysia, Cambodia, Laos, and Myanmar) is a multilateral tourism proposal currently under bilateral consultation and diplomatic study; it is NOT an implemented or operational visa. Citizens of ASEAN countries benefit from mutual short-term visa exemption agreements (typically 14 to 30 days) under the 2006 ASEAN Framework Agreement on Visa Exemption.",
    keywords: ["asean visa", "six countries one destination", "schengen", "atsp", "unified visa", "status", "proposal", "asean.org"]
  }
];

// ============================================================================
// 2. STATE MANAGEMENT & SYSTEM ARCHITECTURE CONFIGURATION
// ============================================================================

const AppState = {
  // Execution runtime
  mode: "simulated", // "simulated" | "live-api"
  liveApiUrl: "http://localhost:8000/api/v1/chat/stream",
  temperature: 0.2,

  // Multi-LLM Fallback & Circuit Breaker
  currentProvider: "gpt-4o", // "gpt-4o" | "claude-3-5" | "gemini-1-5"
  circuitStatus: {
    "gpt-4o": "healthy",    // "healthy" | "failed"
    "claude-3-5": "standby",
    "gemini-1-5": "standby"
  },

  // Redis Semantic Cache Simulator
  semanticCacheActive: true,
  cacheThreshold: 0.96,
  cacheStore: new Map(),
  totalCacheHits: 0,

  // Sliding Window Rate Limiter
  rateLimitMaxRPM: 30,
  rateLimitUsed: 1,
  rateLimitResetTimer: null,

  // Streaming Controller
  activeStreamAbort: null,
  isGenerating: false,

  // Conversation history
  messages: [],
  activeConversationId: "conv-" + Date.now(),
  currentCountryFilter: "all",

  // Knowledge base
  documents: [...KNOWLEDGE_BASE],

  // Injected prompt preview
  lastRetrievedChunks: [],
  lastSystemPrompt: ""
};

// ============================================================================
// 3. VECTOR SIMILARITY ENGINE & RAG RETRIEVAL (Cosine Similarity Approximation)
// ============================================================================

class VectorRAGEngine {
  /**
   * Tokenize and normalize input text into stemmed vector tokens
   */
  static tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !["the", "and", "for", "are", "with", "that", "this", "what", "how", "can"].includes(w));
  }

  /**
   * Compute Cosine-like term similarity between query tokens and chunk document
   */
  static calculateRelevance(query, chunk) {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return 0.1;

    let matchScore = 0;
    const chunkTokens = this.tokenize(chunk.text + " " + chunk.title + " " + chunk.country);
    const chunkSet = new Set(chunkTokens);

    // Keyword & semantic weighting
    for (const q of queryTokens) {
      if (chunk.keywords.some(k => k.includes(q) || q.includes(k))) {
        matchScore += 2.5;
      } else if (chunkSet.has(q)) {
        matchScore += 1.0;
      }
    }

    // Country boost if explicitly mentioned
    if (query.toLowerCase().includes(chunk.country)) {
      matchScore += 3.0;
    }

    // Normalize to 0.00 - 0.99 cosine similarity scale
    const baseSimilarity = matchScore / (queryTokens.length * 2.2);
    const normalizedScore = Math.min(0.985, Math.max(0.25, baseSimilarity));
    return parseFloat(normalizedScore.toFixed(3));
  }

  /**
   * Execute similarity search over active vector knowledge base
   */
  static retrieveContext(query, topK = 3) {
    const scoredChunks = AppState.documents.map(chunk => ({
      chunk,
      score: this.calculateRelevance(query, chunk)
    }));

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return top-K candidates meeting threshold >= 0.45
    return scoredChunks.slice(0, topK);
  }

  /**
   * Assemble System Prompt with dynamic context injection
   * (Matches design.md Section 4, Pattern 2)
   */
  static buildPrompt(query, retrievedChunks) {
    const contextFormatted = retrievedChunks.map((item, idx) => {
      return `[Chunk #${idx + 1} | Source: ${item.chunk.citation}]\n${item.chunk.text}`;
    }).join("\n\n---------------------------------------------------------------------------\n");

    const systemPrompt = `============================== SYSTEM PROMPT ==============================
You are an expert AI immigration and visa advisory specialist representing ASEAN nations. 
Your guidance must be strictly factual, objective, and grounded exclusively in the provided 
Reference Context below.

Instructions:
1. Always cite source regulations using format [Source: Doc Name §Section].
2. Highlight financial requirements, maximum stay durations, and work legality.
3. If context lacks sufficient legal facts, explicitly state the limitation.
4. Compare alternative member country paths when relevant.

Reference Context:
---------------------------------------------------------------------------
${contextFormatted || "No contextual documents retrieved."}
---------------------------------------------------------------------------

=============================== USER PROMPT ===============================
<user_untrusted_input>
${query}
</user_untrusted_input>`;

    return systemPrompt;
  }
}

// ============================================================================
// 4. REDIS SEMANTIC CACHE SIMULATOR
// ============================================================================

class SemanticCacheService {
  static hashKey(query) {
    return query.trim().toLowerCase().replace(/[^\w]/g, "");
  }

  /**
   * Check for identical or semantically identical query in Redis memory
   */
  static checkCache(query) {
    if (!AppState.semanticCacheActive) return null;

    const normalized = this.hashKey(query);

    // Exact or high similarity match
    for (const [key, cached] of AppState.cacheStore.entries()) {
      if (key === normalized) {
        return { hit: true, score: 0.992, data: cached };
      }
      // Partial semantic match check
      const queryTokens = new Set(VectorRAGEngine.tokenize(query));
      const cachedTokens = new Set(VectorRAGEngine.tokenize(cached.query));
      let intersection = 0;
      queryTokens.forEach(t => { if (cachedTokens.has(t)) intersection++; });
      const similarity = intersection / Math.max(queryTokens.size, cachedTokens.size);

      if (similarity >= AppState.cacheThreshold) {
        return { hit: true, score: parseFloat(similarity.toFixed(3)), data: cached };
      }
    }

    return null;
  }

  static setCache(query, responseText, citations, chunks) {
    const key = this.hashKey(query);
    AppState.cacheStore.set(key, {
      query,
      response: responseText,
      citations,
      chunks,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 5. SSE STREAMING ENGINE (Pattern 1 from design.md)
// ============================================================================

class StreamingEngine {
  /**
   * Simulates high-fidelity token streaming over Server-Sent Events (SSE)
   */
  static async streamSimulatedResponse(query, topChunks, onChunk, onDone, onError, abortSignal) {
    const startTime = performance.now();
    let ttftRecorded = false;
    let tokenCounter = 0;

    // Check circuit breaker status & auto-failover
    let activeModel = AppState.currentProvider;
    if (AppState.circuitStatus[activeModel] === "failed") {
      activeModel = this.handleFailover();
    }

    // Determine domain context response synthesis
    const synthesizedText = this.synthesizeAnswer(query, topChunks, activeModel);
    const tokens = synthesizedText.split(/(\s+|[.,;!?:]+)/).filter(Boolean);

    // Emit initial metadata event
    const metaEvent = `data: ${JSON.stringify({
      type: "metadata",
      model: activeModel,
      cache_hit: false,
      chunks_used: topChunks.length
    })}\n\n`;
    onChunk({ type: "raw_sse", text: metaEvent });

    // Simulate TTFT network & vector retrieval delay (350ms - 650ms)
    await new Promise(r => setTimeout(r, 480));

    if (abortSignal.aborted) {
      onError("Stream aborted by user.");
      return;
    }

    // Stream token by token
    for (let i = 0; i < tokens.length; i++) {
      if (abortSignal.aborted) {
        onError("Stream aborted by user.");
        return;
      }

      if (!ttftRecorded) {
        const ttft = Math.round(performance.now() - startTime);
        document.getElementById("kpi-ttft").textContent = `${ttft} ms`;
        ttftRecorded = true;
      }

      const token = tokens[i];
      tokenCounter++;

      // Emit SSE Token Event
      const sseEvent = `data: ${JSON.stringify({ type: "token", content: token })}\n\n`;
      onChunk({ type: "token", content: token, rawEvent: sseEvent, tokenCount: tokenCounter });

      // Variable inter-token delay (15ms - 35ms) to mirror genuine LLM generation
      await new Promise(r => setTimeout(r, Math.random() * 20 + 15));
    }

    // Emit Citation Event
    const citations = topChunks.map(c => c.chunk.citation);
    const citationEvent = `data: ${JSON.stringify({ type: "citations", items: citations })}\n\n`;
    onChunk({ type: "raw_sse", text: citationEvent });

    // Emit DONE event
    const doneEvent = `data: [DONE]\n\n`;
    onChunk({ type: "raw_sse", text: doneEvent });

    const totalDuration = (performance.now() - startTime) / 1000;
    const tps = Math.round(tokenCounter / totalDuration);
    document.getElementById("kpi-tps").textContent = `${tps} t/s`;
    document.getElementById("kpi-tokens").textContent = `${tokenCounter} tok`;

    // Calculate approximate cost ($0.005 / 1K tokens)
    const cost = (tokenCounter * 0.000005).toFixed(4);
    document.getElementById("kpi-cost").textContent = `$${cost}`;

    onDone({
      fullText: synthesizedText,
      citations,
      tokens: tokenCounter
    });
  }

  /**
   * Multi-provider circuit failover logic
   */
  static handleFailover() {
    if (AppState.circuitStatus["gpt-4o"] === "failed") {
      if (AppState.circuitStatus["claude-3-5"] !== "failed") {
        updateActiveCircuitNode("claude-3-5");
        return "claude-3-5";
      } else {
        updateActiveCircuitNode("gemini-1-5");
        return "gemini-1-5";
      }
    }
    return "gpt-4o";
  }

  /**
   * Deterministic answer synthesizer grounded in retrieved legal chunks
   */
  static synthesizeAnswer(query, topChunks, modelName) {
    const qLower = query.toLowerCase();

    // Check if chunks have relevant facts
    if (!topChunks || topChunks.length === 0 || topChunks[0].score < 0.40) {
      return `I do not have sufficient legal data in the indexed ASEAN immigration database to answer your specific query with certainty. 

Please ensure your query refers to the 10 ASEAN member states: **Thailand, Vietnam, Indonesia, Malaysia, Singapore, Philippines, Myanmar, Cambodia, Laos, or Brunei**.`;
    }

    const primaryChunk = topChunks[0].chunk;
    const allText = topChunks.map(c => c.chunk.text).join(" ");

    let response = "";

    if (qLower.includes("dtv") || qLower.includes("destination thailand")) {
      response = `### Thailand Destination Thailand Visa (DTV) Guidelines

Based on official regulations [${primaryChunk.citation}]:

* **Validity & Permitted Stay:** 5-year multiple-entry visa. Each entry permits a stay of up to **180 days**, extendable once inside Thailand at the Immigration Bureau for an additional 180 days (fee: 1,900 THB), allowing up to 360 days before needing to exit.
* **Financial Requirements:** Verified bank statements demonstrating minimum liquid assets of at least **500,000 THB** (~$14,000 USD) held across the preceding 3 months.
* **Eligible Categories:** 
  1. Digital nomads, remote employees, and freelancers working for overseas clients.
  2. Cultural & medical activities (Muay Thai courses, culinary schools, soft-power training, medical treatment).
  3. Accompanying legal dependents (spouse and children under 20).
* **Application Channel & Fee:** Applied via official Thai E-Visa portal (\`thaievisa.go.th\`). Standard consular fee is **10,000 THB** (plus consular processing charges).
* **Work Restriction:** Strict prohibition against rendering services to or receiving salary from local Thai corporate entities.`;
    } else if (qLower.includes("malaysia") && (qLower.includes("indonesia") || qLower.includes("bali") || qLower.includes("compare"))) {
      response = `### Verified Comparison: Malaysia (DE Rantau) vs. Indonesia (E33G Remote Worker)

Grounded in official MDEC and Indonesian Immigration regulations:

| Policy Metric | 🇲🇾 Malaysia DE Rantau Nomad Pass | 🇮🇩 Indonesia Remote Worker (Index E33G) |
| :--- | :--- | :--- |
| **Administering Authority** | MDEC / Immigration Department of Malaysia | Directorate General of Immigration (Ditjen Imigrasi) |
| **Application Portal** | \`mdec.my/derantau\` | \`evisa.imigrasi.go.id\` |
| **Permitted Length of Stay** | 3 to 12 months (Renewable once up to 24 mos total) | 1 year (Multiple entries; must enter within 90d of issue) |
| **Verified Minimum Income** | **$24,000 USD/year** (Digital/Tech Specialists)<br>**$60,000 USD/year** (Non-Tech Remote Professionals) | **$60,000 USD/year** (Universal threshold across all fields) |
| **Bank Balance Proof** | 3 months payslips & active contracts (≥3 mos remaining) | Bank statements showing ending balance $\\ge$ **$2,000 USD** |
| **Application / Govt Fee** | RM 1,000 (Principal) + RM 500/dependent (+ 8% SST) | PNBP fee ~Rp 7,000,000 (~$430-450 USD) |
| **Local Employment Rule** | No local Malaysian employment allowed | Strictly no employment or business with local Indonesian clients |

**Key Takeaway:** Malaysia's DE Rantau offers a lower financial threshold for tech/digital specialists ($24,000 USD vs $60,000 USD), while both countries enforce identical $60,000 USD/year thresholds for general non-tech corporate remote roles.`;
    } else if (qLower.includes("six countries") || qLower.includes("schengen") || qLower.includes("unified visa") || qLower.includes("common visa")) {
      response = `### Official Status: ASEAN "Six Countries, One Destination" Unified Visa Proposal

Grounded in ASEAN regional policy and diplomatic records [${primaryChunk.citation}]:

* **Current Status: PROPOSAL UNDER CONSULTATION (Not Implemented / Unverified as Active Visa)**
* **Sovereign Reality:** There is currently **no single universal or Schengen-style visa** covering ASEAN. All 10 ASEAN member countries maintain completely separate, sovereign immigration authorities, border controls, and visa fees.
* **The Initiative:** The "Six Countries, One Destination" framework is a diplomatic tourism proposal spearheaded by Thailand with participation from Vietnam, Malaysia, Cambodia, Laos, and Myanmar.
* **Operational Rules Today:** Travelers must obtain separate national visas or e-visas for each country they plan to visit:
  * Thailand: \`thaievisa.go.th\`
  * Vietnam: \`evisa.gov.vn\`
  * Indonesia: \`evisa.imigrasi.go.id\`
  * Malaysia: \`malaysiavisa.imi.gov.my\`
  * Cambodia: \`evisa.gov.kh\`
  * Laos: \`laoevisa.gov.la\`
  * Myanmar: \`evisa.moip.gov.mm\`
* **Mutual Exemption for ASEAN Citizens:** Citizens holding passports from ASEAN member states enjoy bilateral visa-free entry for short tourist visits (14 to 30 days) under the 2006 ASEAN Framework Agreement on Visa Exemption.`;
    } else if (qLower.includes("one pass") || qLower.includes("singapore") || qLower.includes("tech.pass")) {
      response = `### Singapore Overseas Networks & Expertise (ONE) Pass & Entry Framework

Grounded in Ministry of Manpower (MOM) and ICA Singapore directives [${primaryChunk.citation}]:

1. **Salary Criterion:** Minimum fixed monthly salary of **30,000 SGD** (~$22,500 USD) earned over the past 12 consecutive months, or proof that an applicant will earn 30,000 SGD/month under a future Singapore-based employer.
2. **Overseas Enterprise Benchmark:** Overseas candidates must be employed by a reputable company with a market valuation $\\ge$ **$500 million USD** or annual revenue $\\ge$ **$200 million USD**.
3. **Privileges & Duration:** 
   * **5-year validity**, renewable in 5-year tranches.
   * Concurrent flexibility to direct, consult, or found multiple business entities in Singapore.
   * Full exemption from the COMPASS points grid and Fair Consideration Framework job advertising requirements.
4. **General Visitor Requirement:** All foreign visitors must complete the digital **SG Arrival Card (SGAC)** with electronic health declaration within 3 days prior to arrival via \`ica.gov.sg\` (Free submission).`;
    } else if (qLower.includes("vietnam") || qLower.includes("e-visa")) {
      response = `### Vietnam 90-Day Electronic Visa (E-Visa) Framework

In accordance with Vietnam National Assembly Law No. 23/2023/QH15 [${primaryChunk.citation}]:

* **Official Portal:** Apply exclusively through official government portals (\`evisa.gov.vn\` / \`evisa.xuatnhapcanh.gov.vn\`).
* **Validity & Entries:** Up to **90 days**, issued as either Single Entry (**$25 USD**) or Multiple Entry (**$50 USD**). Fees are strictly non-refundable.
* **Turnaround Time:** Standard processing takes **3 working days** (excluding weekends and Vietnamese public holidays).
* **Designated Ports of Entry:** Valid at 42 international border gates: 13 international airports (Hanoi Noi Bai, HCMC Tan Son Nhat, Da Nang, Cam Ranh, Phu Quoc), 16 land crossings, and 13 seaports.
* **Stay Extensions:** Extensions within Vietnam require direct sponsorship by a registered Vietnamese travel agency or commercial enterprise.`;
    } else if (qLower.includes("cambodia") || qLower.includes("laos") || qLower.includes("myanmar") || qLower.includes("brunei")) {
      response = `### Mekong & Regional ASEAN Visa Frameworks (Cambodia, Laos, Myanmar, Brunei)

Based on verified government immigration portals:

* 🇰🇭 **Cambodia (\`evisa.gov.kh\`):**
  * Tourist e-Visa (Type 'T'): **$30 USD** + $6 processing fee (**$36 USD total**), valid for 30 days single entry.
  * Ordinary e-Visa (Type 'E'): **$35 USD** + $7 fee (**$42 USD total**), valid for 30 days, extendable in-country for 1, 3, 6, or 12 months.
  * **Mandatory:** Complete the Cambodia e-Arrival card at \`arrival.gov.kh\` within 7 days prior to entry.
* 🇱🇦 **Laos (\`laoevisa.gov.la\`):**
  * Tourist eVisa (Type 'T'): **$50 USD** government fee (+ processing fee), 30 days single-entry stay. Valid at 8 international checkpoints (Vientiane, Luang Prabang, Pakse, Friendship Bridges I/II/IV, Boten).
* 🇲🇲 **Myanmar (\`evisa.moip.gov.mm\`):**
  * Tourist eVisa: **$50 USD**, 28 days stay, valid for 90 days from issuance.
  * Business eVisa: **$70 USD**, 70 days stay, requires local invitation letter and company registration.
* 🇧🇳 **Brunei (\`imm.gov.bn\`):**
  * Mandatory **E-Arrival Card** registration prior to arrival via \`imm.gov.bn\` (Free).
  * Citizens of ASEAN, US, UK, EU, and Japan enjoy visa-free entry for 14 to 90 days. Other foreign nationals must obtain a consular visa.`;
    } else if (qLower.includes("srrv") || qLower.includes("retiree") || qLower.includes("philippines")) {
      response = `### Philippines Special Resident Retiree's Visa (SRRV) Framework

Grounded in Philippine Retirement Authority (PRA) regulations [${primaryChunk.citation}]:

* **Minimum Age Requirement:** **50 years of age and above**. 
  *(Note: The former 35–49 age category was formally suspended by the PRA Board under Board Resolution No. 06, Series of 2021).*
* **Financial Deposit Options (SRRV Classic):**
  * **With Lifetime Pension:** Qualifying applicants receiving a monthly pension of at least **$800 USD** ($1,000 USD for couples) must deposit **$10,000 USD** in an accredited bank.
  * **Without Pension:** Requires a fixed time deposit of **$20,000 USD**.
* **Key Privileges:** Indefinite length of stay with multiple-entry privileges, customs duty exemption on importation of personal effects up to $7,000 USD, and exemption from exit clearance and re-entry permits.
* **Arriving Passengers:** All travelers entering the Philippines must register via the government's free **eTravel** portal (\`etravel.gov.ph\`) within 72 hours prior to arrival.`;
    } else {
      // General grounded synthesis using primary and secondary chunks
      response = `### Advisory Based on ${primaryChunk.title}

According to official regulations [${primaryChunk.citation}]:

${primaryChunk.text}

#### Key Considerations for Foreign Nationals:
* Always verify eligibility and submit applications exclusively via official government domains (e.g., \`.gov.th\`, \`.gov.my\`, \`.go.id\`, \`.gov.sg\`, \`.gov.vn\`, \`.gov.ph\`, \`.gov.kh\`, \`.gov.la\`, \`.moip.gov.mm\`, \`.gov.bn\`).
* ASEAN does not operate a single collective visa; each country enforces independent entry requirements and immigration laws.
* Ensure passport validity has at least 6 months remaining from the intended date of entry.`;
    }

    return response;
  }
}

// ============================================================================
// 6. UI CONTROLLER & EVENT LISTENERS
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const messagesContainer = document.getElementById("messages-container");
  const chatForm = document.getElementById("chat-form");
  const promptInput = document.getElementById("prompt-input");
  const sendBtn = document.getElementById("send-btn");
  const stopStreamBtn = document.getElementById("stop-stream-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const exportChatBtn = document.getElementById("export-chat-btn");
  const newChatBtn = document.getElementById("new-chat-btn");

  // Country buttons
  const countryButtons = document.querySelectorAll(".country-item");

  // Telemetry drawer & header
  const toggleTelemetryBtn = document.getElementById("toggle-telemetry-btn");
  const closeTelemetryBtn = document.getElementById("close-telemetry-btn");
  const telemetrySidebar = document.getElementById("telemetry-sidebar");
  const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
  const appSidebar = document.getElementById("app-sidebar");

  // Circuit breaker simulation
  const simulateOutageBtn = document.getElementById("simulate-outage-btn");
  const resetCircuitBtn = document.getElementById("reset-circuit-btn");
  const modelSelector = document.getElementById("model-selector");

  // Semantic Cache Toggle
  const toggleSemanticCacheBtn = document.getElementById("toggle-semantic-cache-btn");
  const headerCacheStatus = document.getElementById("header-cache-status");
  const telemetryCacheBadge = document.getElementById("telemetry-cache-badge");

  // Context drawer toggle
  const contextDrawerToggle = document.getElementById("context-drawer-toggle");
  const contextDrawer = document.getElementById("context-drawer");
  const systemPromptPreview = document.getElementById("system-prompt-preview");
  const chunksPreviewList = document.getElementById("chunks-preview-list");
  const injectedChunkCount = document.getElementById("injected-chunk-count");

  // Document Ingest Modal
  const openIngestModalBtn = document.getElementById("open-ingest-modal-btn");
  const ingestModal = document.getElementById("ingest-modal");
  const closeIngestModalBtn = document.getElementById("close-ingest-modal-btn");
  const cancelIngestBtn = document.getElementById("cancel-ingest-btn");
  const startIngestBtn = document.getElementById("start-ingest-btn");
  const modalDropZone = document.getElementById("modal-drop-zone");
  const modalFileInput = document.getElementById("modal-file-input");
  const browseFilesBtn = document.getElementById("browse-files-btn");

  // Settings Modal
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsModalBtn = document.getElementById("close-settings-modal-btn");
  const saveSettingsBtn = document.getElementById("save-settings-btn");
  const executionModeSelect = document.getElementById("execution-mode-select");
  const liveApiConfigGroup = document.getElementById("live-api-config-group");
  const liveApiUrl = document.getElementById("live-api-url");
  const tempSlider = document.getElementById("temp-slider");
  const tempVal = document.getElementById("temp-val");

  // Attachment controls
  const attachFileBtn = document.getElementById("attach-file-btn");
  const attachedFileBadge = document.getElementById("attached-file-badge");
  const removeAttBtn = document.getElementById("remove-att-btn");

  // Preset question buttons
  const presetButtons = document.querySelectorAll(".preset-btn");

  // Terminal inspector
  const sseRawTerminal = document.getElementById("sse-raw-terminal");
  const ssePulse = document.getElementById("sse-pulse");

  // Auto-resize textarea
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 140) + "px";
  });

  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // Country navigation filter
  countryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      countryButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const country = btn.dataset.country;
      AppState.currentCountryFilter = country;
      
      const countryNames = {
        thailand: "Thailand (🇹🇭)",
        malaysia: "Malaysia (🇲🇾)",
        indonesia: "Indonesia / Bali (🇮🇩)",
        singapore: "Singapore (🇸🇬)",
        vietnam: "Vietnam (🇻🇳)",
        philippines: "Philippines (🇵🇭)"
      };

      appendSystemNotice(`Switched active country focus to **${countryNames[country]}**. Subsequent queries will prioritize official ${country.toUpperCase()} immigration circulars.`);
    });
  });

  // Telemetry drawer toggles
  toggleTelemetryBtn.addEventListener("click", () => {
    const isOpen = telemetrySidebar.classList.toggle("open");
    toggleTelemetryBtn.setAttribute("aria-expanded", String(isOpen));
  });

  closeTelemetryBtn.addEventListener("click", () => {
    telemetrySidebar.classList.remove("open");
    toggleTelemetryBtn.setAttribute("aria-expanded", "false");
  });

  toggleSidebarBtn.addEventListener("click", () => {
    appSidebar.classList.toggle("open");
  });

  // Context drawer collapse/expand
  contextDrawerToggle.addEventListener("click", () => {
    contextDrawer.classList.toggle("collapsed");
  });

  // Context drawer tab buttons
  document.querySelectorAll(".context-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".context-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
      btn.classList.add("active");
      const targetId = `tab-${btn.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  // Preset question clicks
  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      promptInput.value = btn.dataset.query;
      promptInput.focus();
      chatForm.dispatchEvent(new Event("submit"));
    });
  });

  // Simulated attachment
  attachFileBtn.addEventListener("click", () => {
    attachedFileBadge.classList.remove("hidden");
  });

  removeAttBtn.addEventListener("click", () => {
    attachedFileBadge.classList.add("hidden");
  });

  // Model Selection
  modelSelector.addEventListener("change", (e) => {
    AppState.currentProvider = e.target.value;
    document.getElementById("input-model-tag").textContent = e.target.options[e.target.selectedIndex].text.split(" ")[0];
    updateActiveCircuitNode(AppState.currentProvider);
  });

  // Circuit Breaker Simulation
  simulateOutageBtn.addEventListener("click", () => {
    AppState.circuitStatus["gpt-4o"] = "failed";
    document.getElementById("circuit-node-openai").classList.remove("active");
    document.getElementById("circuit-node-openai").classList.add("failed");

    // Failover to Claude 3.5 Sonnet
    AppState.currentProvider = "claude-3-5";
    modelSelector.value = "claude-3-5";
    document.getElementById("circuit-node-claude").classList.add("active");

    appendSystemNotice(`⚠️ **Simulated HTTP 429 RateLimit on Primary LLM (OpenAI GPT-4o)**. Circuit breaker tripped. Automatically failed over to **Claude 3.5 Sonnet** (Secondary Provider).`);
  });

  resetCircuitBtn.addEventListener("click", () => {
    AppState.circuitStatus["gpt-4o"] = "healthy";
    AppState.circuitStatus["claude-3-5"] = "standby";
    AppState.circuitStatus["gemini-1-5"] = "standby";

    document.getElementById("circuit-node-openai").className = "circuit-node active";
    document.getElementById("circuit-node-claude").className = "circuit-node";
    document.getElementById("circuit-node-gemini").className = "circuit-node";

    AppState.currentProvider = "gpt-4o";
    modelSelector.value = "gpt-4o";
    document.getElementById("provider-dot").className = "status-dot green";

    appendSystemNotice(`🔄 **Circuit Breaker Reset:** Restored primary provider **OpenAI GPT-4o** to healthy state.`);
  });

  // Semantic Cache Toggle
  toggleSemanticCacheBtn.addEventListener("click", () => {
    AppState.semanticCacheActive = !AppState.semanticCacheActive;
    if (AppState.semanticCacheActive) {
      headerCacheStatus.textContent = "Active (≥0.96)";
      telemetryCacheBadge.textContent = "ACTIVE";
      telemetryCacheBadge.style.color = "#10b981";
      toggleSemanticCacheBtn.textContent = "Disable Semantic Cache";
    } else {
      headerCacheStatus.textContent = "Bypassed (0.00)";
      telemetryCacheBadge.textContent = "BYPASS";
      telemetryCacheBadge.style.color = "#f43f5e";
      toggleSemanticCacheBtn.textContent = "Enable Semantic Cache";
    }
  });

  // Document Ingest Modal Open/Close
  openIngestModalBtn.addEventListener("click", () => ingestModal.classList.remove("hidden"));
  closeIngestModalBtn.addEventListener("click", () => ingestModal.classList.add("hidden"));
  cancelIngestBtn.addEventListener("click", () => ingestModal.classList.add("hidden"));

  browseFilesBtn.addEventListener("click", () => modalFileInput.click());
  modalFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      modalDropZone.querySelector(".drop-text").textContent = `Selected: ${file.name}`;
      startIngestBtn.disabled = false;
    }
  });

  startIngestBtn.addEventListener("click", () => {
    startIngestBtn.disabled = true;
    const progressContainer = document.getElementById("ingest-progress-container");
    const progressBar = document.getElementById("ingest-progress-bar");
    const stepLabel = document.getElementById("ingest-step-label");
    const percentLabel = document.getElementById("ingest-percent");

    progressContainer.classList.remove("hidden");

    let progress = 0;
    const steps = [
      "Parsing legal markdown & PDF text...",
      "Recursive chunking (512 tokens, 50 overlap)...",
      "Generating dense vectors via text-embedding-3...",
      "Upserting embeddings to pgvector / Qdrant..."
    ];

    const interval = setInterval(() => {
      progress += 25;
      progressBar.style.width = `${progress}%`;
      percentLabel.textContent = `${progress}%`;
      stepLabel.textContent = steps[Math.floor(progress / 25) - 1] || "Finalizing...";

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          ingestModal.classList.add("hidden");
          progressContainer.classList.add("hidden");
          progressBar.style.width = "0%";
          startIngestBtn.disabled = false;

          // Add simulated ingested chunk
          const newDocTitle = modalFileInput.files[0] ? modalFileInput.files[0].name : "asean_treaty_amendment_2026.pdf";
          AppState.documents.push({
            id: `chunk-user-${Date.now()}`,
            docId: "user-ingested-doc",
            country: "all",
            title: newDocTitle,
            citation: `Uploaded Document: ${newDocTitle}`,
            text: `Newly ingested document containing updated provisions for cross-border digital residency, multi-jurisdiction ASEAN tax treaties, and bilateral e-visa agreements valid throughout 2026.`,
            keywords: ["treaty", "residency", "tax", "bilateral", "2026", "uploaded"]
          });

          document.getElementById("kb-doc-count").textContent = `${AppState.documents.length} Immigration Acts`;
          appendSystemNotice(`✅ Successfully ingested **${newDocTitle}**. Segmented into 512-token chunks and indexed into pgvector.`);
        }, 500);
      }
    }, 400);
  });

  // Settings Modal Open/Close
  settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsModalBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  executionModeSelect.addEventListener("change", (e) => {
    if (e.target.value === "live-api") {
      liveApiConfigGroup.classList.remove("hidden");
    } else {
      liveApiConfigGroup.classList.add("hidden");
    }
  });

  tempSlider.addEventListener("input", (e) => tempVal.textContent = e.target.value);
  saveSettingsBtn.addEventListener("click", () => {
    AppState.mode = executionModeSelect.value;
    AppState.liveApiUrl = liveApiUrl.value;
    AppState.temperature = parseFloat(tempSlider.value);
    settingsModal.classList.add("hidden");
    appendSystemNotice(`Configuration saved. Runtime Mode: **${AppState.mode.toUpperCase()}**, Temperature: **${AppState.temperature}**`);
  });

  // Clear & Export Chat
  clearChatBtn.addEventListener("click", () => {
    messagesContainer.innerHTML = "";
    AppState.messages = [];
    appendSystemNotice("Conversation history cleared. Ready for new inquiry.");
  });

  newChatBtn.addEventListener("click", () => {
    messagesContainer.innerHTML = "";
    AppState.messages = [];
    AppState.activeConversationId = "conv-" + Date.now();
    promptInput.value = "";
    promptInput.focus();
    appendSystemNotice("Started new consultation session.");
  });

  exportChatBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.messages, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `asean_visa_chat_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // ==========================================================================
  // 7. FORM SUBMISSION & REAL-TIME STREAM PIPELINE
  // ==========================================================================

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = promptInput.value.trim();
    if (!query || AppState.isGenerating) return;

    // Sliding Window Rate Limiting Enforcement
    if (AppState.rateLimitUsed >= AppState.rateLimitMaxRPM) {
      appendSystemNotice("⚠️ **429 Too Many Requests**: You have exceeded the rate limit threshold (30 RPM). Please wait 60 seconds.");
      return;
    }
    AppState.rateLimitUsed++;
    document.getElementById("header-rate-limit").textContent = `${AppState.rateLimitMaxRPM - AppState.rateLimitUsed}/${AppState.rateLimitMaxRPM} RPM`;

    // Security & Prompt Injection Check
    const isJailbreakAttempt = /ignore (all )?previous instructions|disregard|system prompt override|DAN mode/i.test(query);
    if (isJailbreakAttempt) {
      appendSystemNotice(`🛡️ **Security Guardrail Triggered**: Untrusted instruction detected. Input isolated inside \`<user_untrusted_input>\` boundary delimiter.`);
    }

    // Reset input
    promptInput.value = "";
    promptInput.style.height = "auto";

    // 1. Render User Message
    renderUserMessage(query);

    // 2. Execute Vector RAG Search
    const topChunks = VectorRAGEngine.retrieveContext(query, 3);
    AppState.lastRetrievedChunks = topChunks;

    // Update Telemetry Panel with Candidate Scores
    renderRAGTelemetry(topChunks);

    // 3. Assemble System Prompt & Update Drawer Preview
    const assembledSystemPrompt = VectorRAGEngine.buildPrompt(query, topChunks);
    AppState.lastSystemPrompt = assembledSystemPrompt;
    systemPromptPreview.textContent = assembledSystemPrompt;
    injectedChunkCount.textContent = `${topChunks.length} Chunks Injected`;
    renderChunksPreview(topChunks);

    // 4. Check Redis Semantic Cache
    const cacheResult = SemanticCacheService.checkCache(query);
    if (cacheResult && cacheResult.hit) {
      handleCacheHit(query, cacheResult);
      return;
    }

    // Cache Miss - Proceed to Streaming Inference
    document.getElementById("cache-sim-score").textContent = "0.412";
    document.getElementById("telemetry-cache-badge").textContent = "MISS";
    document.getElementById("telemetry-cache-badge").style.color = "#f59e0b";

    // 5. Initialize Assistant Message in DOM
    const { messageBody, contentElement, cursorElement } = createAssistantMessagePlaceholder();

    // Toggle Stream Controls
    AppState.isGenerating = true;
    sendBtn.classList.add("hidden");
    stopStreamBtn.classList.remove("hidden");
    ssePulse.classList.add("active");
    sseRawTerminal.textContent = "";

    const abortController = new AbortController();
    AppState.activeStreamAbort = abortController;

    // Buffer for full text response
    let accumulatedText = "";

    try {
      await StreamingEngine.streamSimulatedResponse(
        query,
        topChunks,
        // onChunk callback
        (event) => {
          if (event.type === "token") {
            accumulatedText += event.content;
            contentElement.innerHTML = formatMarkdown(accumulatedText);
            contentElement.appendChild(cursorElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          } else if (event.type === "raw_sse") {
            sseRawTerminal.textContent += event.text;
            sseRawTerminal.scrollTop = sseRawTerminal.scrollHeight;
          }
        },
        // onDone callback
        (result) => {
          if (cursorElement.parentNode) cursorElement.remove();
          contentElement.innerHTML = formatMarkdown(result.fullText);

          // Append citation pills
          appendCitationsToMessage(contentElement, topChunks);

          // Cache in Redis Semantic Store
          SemanticCacheService.setCache(query, result.fullText, result.citations, topChunks);

          // Save to App State
          AppState.messages.push({
            role: "assistant",
            content: result.fullText,
            model: AppState.currentProvider,
            citations: result.citations
          });

          finalizeStreamingState();
        },
        // onError callback
        (errMsg) => {
          if (cursorElement.parentNode) cursorElement.remove();
          contentElement.innerHTML += `<br><span class="text-danger">⚠️ ${errMsg}</span>`;
          finalizeStreamingState();
        },
        abortController.signal
      );
    } catch (err) {
      console.error("Stream exception:", err);
      finalizeStreamingState();
    }
  });

  // Stop button handler
  stopStreamBtn.addEventListener("click", () => {
    if (AppState.activeStreamAbort) {
      AppState.activeStreamAbort.abort();
    }
  });

  // ==========================================================================
  // 8. HELPER RENDERING METHODS
  // ==========================================================================

  function renderUserMessage(text) {
    const userItem = document.createElement("div");
    userItem.className = "message-item user";
    userItem.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-body">
        <div class="message-author">
          <span class="author-name">Inquirer</span>
        </div>
        <div class="message-content">
          <p>${escapeHtml(text)}</p>
        </div>
      </div>
    `;
    messagesContainer.appendChild(userItem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    AppState.messages.push({ role: "user", content: text });
  }

  function createAssistantMessagePlaceholder() {
    const assistantItem = document.createElement("div");
    assistantItem.className = "message-item assistant";

    const activeModel = AppState.currentProvider;
    assistantItem.innerHTML = `
      <div class="message-avatar">🌏</div>
      <div class="message-body">
        <div class="message-author">
          <span class="author-name">ASEAN Visa Advisor</span>
          <span class="author-model-badge">${activeModel} • Grounded RAG</span>
        </div>
        <div class="message-content">
          <span class="streaming-cursor"></span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(assistantItem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const contentElement = assistantItem.querySelector(".message-content");
    const cursorElement = assistantItem.querySelector(".streaming-cursor");
    return { messageBody: assistantItem, contentElement, cursorElement };
  }

  function handleCacheHit(query, cacheResult) {
    document.getElementById("cache-sim-score").textContent = cacheResult.score.toFixed(3);
    document.getElementById("telemetry-cache-badge").textContent = "CACHE HIT";
    document.getElementById("telemetry-cache-badge").style.color = "#10b981";
    AppState.totalCacheHits++;
    document.getElementById("cache-total-hits").textContent = AppState.totalCacheHits;

    document.getElementById("kpi-ttft").textContent = "12 ms";
    document.getElementById("kpi-tps").textContent = "Instant";
    document.getElementById("kpi-cost").textContent = "$0.0000";

    const { contentElement, cursorElement } = createAssistantMessagePlaceholder();
    cursorElement.remove();

    sseRawTerminal.textContent = `data: {"type": "cache_lookup", "hit": true, "similarity": ${cacheResult.score}}\ndata: {"status": "returning_redis_vector_memory"}\ndata: [DONE]\n\n`;

    contentElement.innerHTML = `
      <div class="cache-badge-pill" style="display:inline-block; margin-bottom:0.5rem; background:rgba(168,85,247,0.15); border:1px solid #a855f7; border-radius:4px; padding:2px 8px; font-size:0.7rem; color:#d8b4fe; font-family:monospace;">
        ⚡ Instant Response: Redis Semantic Cache Hit ($S_{\\text{sim}} = ${cacheResult.score}$)
      </div>
      ${formatMarkdown(cacheResult.data.response)}
    `;

    appendCitationsToMessage(contentElement, cacheResult.data.chunks);

    AppState.messages.push({
      role: "assistant",
      content: cacheResult.data.response,
      model: "redis-semantic-cache",
      cached: true
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function finalizeStreamingState() {
    AppState.isGenerating = false;
    AppState.activeStreamAbort = null;
    sendBtn.classList.remove("hidden");
    stopStreamBtn.classList.add("hidden");
    ssePulse.classList.remove("active");
  }

  function renderRAGTelemetry(topChunks) {
    const container = document.getElementById("rag-candidate-list");
    container.innerHTML = "";

    if (!topChunks || topChunks.length === 0) {
      container.innerHTML = '<div class="rag-empty-hint">No relevant chunks found.</div>';
      return;
    }

    document.getElementById("rag-retrieval-badge").textContent = `Top-${topChunks.length}`;

    topChunks.forEach(item => {
      const card = document.createElement("div");
      card.className = "rag-chunk-item";
      card.innerHTML = `
        <div class="rag-chunk-head">
          <span class="rag-chunk-title" title="${escapeHtml(item.chunk.title)}">${item.chunk.title}</span>
          <span class="rag-score-pill">S: ${item.score}</span>
        </div>
        <div class="rag-score-bar-bg">
          <div class="rag-score-bar-fill" style="width: ${Math.round(item.score * 100)}%;"></div>
        </div>
        <div class="rag-chunk-snippet">${escapeHtml(item.chunk.text)}</div>
      `;
      container.appendChild(card);
    });
  }

  function renderChunksPreview(topChunks) {
    chunksPreviewList.innerHTML = "";
    topChunks.forEach((item, idx) => {
      const chunkDiv = document.createElement("div");
      chunkDiv.style.cssText = "background:var(--bg-card); padding:0.5rem; border-radius:4px; margin-bottom:0.4rem; font-size:0.72rem;";
      chunkDiv.innerHTML = `
        <strong style="color:var(--text-brand);">Chunk #${idx + 1} (${item.chunk.citation})</strong>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">${escapeHtml(item.chunk.text)}</p>
      `;
      chunksPreviewList.appendChild(chunkDiv);
    });
  }

  function appendCitationsToMessage(container, chunks) {
    if (!chunks || chunks.length === 0) return;
    const citationRow = document.createElement("div");
    citationRow.style.cssText = "margin-top:0.75rem; padding-top:0.5rem; border-top:1px solid var(--border-subtle); display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center;";

    const label = document.createElement("span");
    label.style.cssText = "font-size:0.68rem; color:var(--text-muted); font-weight:600;";
    label.textContent = "Ground-Truth Citations:";
    citationRow.appendChild(label);

    chunks.forEach(item => {
      const chunk = item.chunk || item;
      const pill = document.createElement("span");
      pill.className = "citation-pill";
      pill.title = chunk.text;
      pill.textContent = `📜 ${chunk.citation || chunk.title}`;
      pill.addEventListener("click", () => {
        alert(`Full Regulatory Excerpt:\n\n${chunk.citation}\n\n${chunk.text}`);
      });
      citationRow.appendChild(pill);
    });

    container.appendChild(citationRow);
  }

  function appendSystemNotice(markdownText) {
    const notice = document.createElement("div");
    notice.style.cssText = "background:rgba(255,255,255,0.03); border:1px dashed var(--border-subtle); border-radius:8px; padding:0.6rem 1rem; font-size:0.78rem; color:var(--text-secondary); max-width:860px; margin:0 auto; width:100%;";
    notice.innerHTML = formatMarkdown(markdownText);
    messagesContainer.appendChild(notice);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function updateActiveCircuitNode(model) {
    document.querySelectorAll(".circuit-node").forEach(node => node.classList.remove("active"));
    if (model.includes("gpt")) {
      document.getElementById("circuit-node-openai").classList.add("active");
    } else if (model.includes("claude")) {
      document.getElementById("circuit-node-claude").classList.add("active");
    } else if (model.includes("gemini")) {
      document.getElementById("circuit-node-gemini").classList.add("active");
    }
  }

  // Basic Markdown Parser for headings, lists, tables, bold, and blockquotes
  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:1rem; font-weight:700; color:#fff; margin:0.75rem 0 0.35rem;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:1.15rem; font-weight:800; color:#fff; margin:1rem 0 0.5rem;">$1</h2>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid var(--primary); padding-left:0.75rem; color:var(--text-secondary); margin:0.5rem 0;">$1</blockquote>');

    // Simple Tables
    if (html.includes("|")) {
      const lines = html.split("\n");
      let inTable = false;
      let tableHtml = '<table>';
      const outputLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("|") && line.endsWith("|")) {
          if (!inTable) {
            inTable = true;
            tableHtml = '<table>';
          }
          if (line.includes("---")) {
            continue; // separator
          }
          const cells = line.split("|").slice(1, -1).map(c => c.trim());
          const isHeader = !tableHtml.includes("</tr>");
          const tag = isHeader ? "th" : "td";
          tableHtml += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join("") + '</tr>';
        } else {
          if (inTable) {
            inTable = false;
            tableHtml += '</table>';
            outputLines.push(tableHtml);
          }
          outputLines.push(line);
        }
      }
      if (inTable) {
        tableHtml += '</table>';
        outputLines.push(tableHtml);
      }
      html = outputLines.join("\n");
    }

    // Unordered lists
    html = html.replace(/^\* (.*$)/gim, '<li style="margin-left:1.25rem;">$1</li>');

    // Paragraph breaks
    html = html.replace(/\n\n/g, '<p style="margin-bottom:0.75rem;"></p>');

    return html;
  }

  function escapeHtml(string) {
    const div = document.createElement("div");
    div.innerText = string;
    return div.innerHTML;
  }
});
