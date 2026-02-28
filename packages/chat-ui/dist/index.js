import { createOpencodeClient as we } from "@opencode-ai/sdk/client";
import "svelte/internal/disclose-version";
import * as l from "svelte/internal/client";
import "svelte/internal/flags/legacy";
class Zn {
  constructor(e) {
    this.abortController = null, this.publicQuestionHandler = null, this.showThinking = (e == null ? void 0 : e.showThinking) ?? !1, this.showQuestionPrompt = (e == null ? void 0 : e.showQuestion) ?? !1;
  }
  /**
   * Initialize the mock adapter
   * For MockAdapter, this is a no-op since there's no real connection to set up
   */
  async init() {
  }
  setPublicQuestionHandler(e) {
    this.publicQuestionHandler = e;
  }
  async showQuestion(e, t) {
    if (!this.publicQuestionHandler)
      throw new Error(
        "No question handler is registered. Mount ChatWidget with this adapter first."
      );
    return this.publicQuestionHandler(e, t);
  }
  async sendMessage(e, t) {
    this.abortController = new AbortController();
    const n = [
      "I understand your question. Let me help you with that. First, we need to consider the context of your request. Then, I'll provide you with a detailed explanation that addresses all aspects of your query.",
      "That's an interesting point. Here's what I think about it. Based on the information provided, there are several factors we should analyze. Let me break this down into manageable parts for better understanding.",
      "I'd be happy to assist you with that. Based on what you've asked, I recommend taking a systematic approach. We can explore multiple solutions and find the one that best fits your needs.",
      "Great question! The answer depends on several factors, but generally speaking, the most effective approach would be to first understand the requirements. Then we can proceed with implementing the solution step by step.",
      "I can help you with that. Let me break it down for you step by step. We'll start with the fundamentals and gradually move to more advanced concepts to ensure you have a complete understanding."
    ], r = [
      "Let me analyze this question... The user is asking about a complex topic. I should break this down into clear, logical steps.",
      "Hmm, interesting query. I need to consider multiple angles here: technical feasibility, best practices, and practical application.",
      "First, I'll identify the core problem. Then I'll explore potential solutions and their trade-offs before providing a recommendation.",
      "Let's think through this systematically. What are the key requirements? What constraints do we have? What's the optimal approach?",
      "Breaking down the problem: 1) Understand the context, 2) Identify relevant factors, 3) Formulate a clear, actionable response."
    ];
    try {
      if (this.showThinking && t.onThinking) {
        const f = r[Math.floor(Math.random() * r.length)].split(" ");
        let m = "";
        for (let b = 0; b < f.length; b++) {
          if (this.abortController.signal.aborted)
            throw new Error("Request cancelled");
          m += (b > 0 ? " " : "") + f[b], t.onThinking(m), await new Promise((h) => setTimeout(h, 40 + Math.random() * 40));
        }
        await new Promise((b) => setTimeout(b, 200));
      }
      let i = "";
      this.showQuestionPrompt && t.onQuestion && (i = ((await t.onQuestion({
        text: "Which response style should I use?",
        header: "Response style",
        options: [
          {
            label: "Concise",
            description: "Short and direct response"
          },
          {
            label: "Detailed",
            description: "More context and explanation"
          }
        ]
      }))[0] || "Concise") === "Detailed" ? "Great, I will provide a detailed answer. " : "Great, I will keep it concise. ");
      const s = n[Math.floor(Math.random() * n.length)], c = (i + s).split(" ");
      let a = "";
      for (let d = 0; d < c.length; d++) {
        if (this.abortController.signal.aborted)
          throw new Error("Request cancelled");
        a += (d > 0 ? " " : "") + c[d], t.onChunk(a), await new Promise((f) => setTimeout(f, 20 + Math.random() * 60));
      }
      t.onComplete();
    } catch (i) {
      this.abortController.signal.aborted || t.onError(i instanceof Error ? i : new Error("Unknown error"));
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort();
  }
}
class Vn {
  constructor(e = {}) {
    this.sessionId = null, this.client = null, this.abortController = null, this.eventStream = null, this.initPromise = null, this.currentCallbacks = null, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.currentText = "", this.currentReasoning = "", this.currentToolThinking = "", this.toolThinkingEntryKeys = /* @__PURE__ */ new Set(), this.lastEmittedThinking = "", this.activeMessageLog = [], this.lastMessageLog = [], this.combinedMessageLog = [], this.publicQuestionHandler = null, this.sessionId = e.sessionId || null, this.baseUrl = e.baseUrl || "http://localhost:4096", this.model = e.model, this.agent = e.agent, this.createSession = e.createSession ?? !0, this.logCombinedEvents = e.logCombinedEvents ?? !0;
  }
  async ensureClient() {
    return this.client || (this.client = we({
      baseUrl: this.baseUrl
    })), this.client;
  }
  /**
   * Initialize the OpenCode client and set up event listener
   * This can be called proactively to set up the connection before sending messages
   */
  async init() {
    if (!this.eventStream) {
      if (this.initPromise) {
        await this.initPromise;
        return;
      }
      this.initPromise = (async () => {
        const e = await this.ensureClient();
        if (this.eventStream)
          return;
        const t = await e.event.subscribe();
        this.eventStream = t.stream, this.startEventListener();
      })();
      try {
        await this.initPromise;
      } finally {
        this.initPromise = null;
      }
    }
  }
  async getAgents() {
    const t = await (await this.ensureClient()).app.agents();
    if (!t.data)
      throw new Error("Failed to fetch agents: no data returned");
    return t.data.map((n) => n.name);
  }
  /**
   * Start the background event listener
   */
  async startEventListener() {
    if (this.eventStream)
      try {
        for await (const e of this.eventStream)
          this.handleEvent(e);
      } catch (e) {
        console.error("Event stream error:", e), this.eventStream = null;
      }
  }
  appendCombinedLog(e) {
    const t = {
      at: (/* @__PURE__ */ new Date()).toISOString(),
      ...e
    };
    this.activeMessageLog = [...this.activeMessageLog, t], this.combinedMessageLog = [...this.combinedMessageLog, t];
  }
  startCombinedLog(e) {
    var t;
    this.activeMessageLog = [], this.appendCombinedLog({
      category: "request",
      type: "sendMessage.started",
      sessionId: this.sessionId ?? void 0,
      text: e.message,
      payload: {
        conversationHistoryLength: ((t = e.conversationHistory) == null ? void 0 : t.length) ?? 0
      }
    });
  }
  recordEvent(e, t = !1, n) {
    var b, h, k;
    const r = (b = e == null ? void 0 : e.properties) == null ? void 0 : b.info, i = (h = e == null ? void 0 : e.properties) == null ? void 0 : h.part, s = typeof (e == null ? void 0 : e.type) == "string" ? e.type : "unknown", o = typeof (r == null ? void 0 : r.id) == "string" ? r.id : typeof (i == null ? void 0 : i.messageID) == "string" ? i.messageID : void 0, c = typeof (r == null ? void 0 : r.sessionID) == "string" ? r.sessionID : typeof (i == null ? void 0 : i.sessionID) == "string" ? i.sessionID : void 0, a = typeof (r == null ? void 0 : r.role) == "string" ? r.role : void 0, d = typeof (i == null ? void 0 : i.type) == "string" ? i.type : void 0, f = typeof ((k = e == null ? void 0 : e.properties) == null ? void 0 : k.delta) == "string" ? e.properties.delta : void 0, m = typeof (i == null ? void 0 : i.text) == "string" ? i.text : typeof (i == null ? void 0 : i.thinking) == "string" ? i.thinking : void 0;
    this.appendCombinedLog({
      category: "event",
      type: s,
      sessionId: c,
      messageId: o,
      role: a,
      partType: d,
      delta: f,
      text: m,
      ignored: t,
      reason: n,
      payload: e
    });
  }
  finalizeCombinedLog(e) {
    this.activeMessageLog.length !== 0 && (this.appendCombinedLog({
      category: "state",
      type: "sendMessage.finished",
      sessionId: this.sessionId ?? void 0,
      messageId: this.currentAssistantMessageId ?? void 0,
      reason: e,
      payload: {
        userMessageId: this.currentUserMessageId,
        assistantMessageId: this.currentAssistantMessageId,
        textLength: this.currentText.length,
        reasoningLength: this.getCombinedThinkingContent().length
      }
    }), this.lastMessageLog = [...this.activeMessageLog], this.logCombinedEvents && console.info("[OpenCodeAdapter] Combined OpenCode message log:", this.lastMessageLog), this.activeMessageLog = []);
  }
  /**
   * Handle incoming events from the stream
   */
  handleEvent(e) {
    var t, n, r, i, s, o, c, a, d, f, m, b, h, k;
    if (this.currentCallbacks) {
      if ((t = this.abortController) != null && t.signal.aborted) {
        this.recordEvent(e, !0, "request-aborted");
        return;
      }
      if (console.log("Received event:", e), e.type === "message.updated") {
        const _ = (r = (n = e.properties) == null ? void 0 : n.info) == null ? void 0 : r.id, E = (s = (i = e.properties) == null ? void 0 : i.info) == null ? void 0 : s.role, x = (c = (o = e.properties) == null ? void 0 : o.info) == null ? void 0 : c.sessionID;
        if (this.sessionId && x && x !== this.sessionId) {
          this.recordEvent(e, !0, "session-mismatch");
          return;
        }
        this.recordEvent(e), E === "user" ? (this.currentUserMessageId = _, console.log("Tracking user message ID:", _)) : E === "assistant" && (this.currentAssistantMessageId = _, console.log("Tracking assistant message ID:", _));
        const C = (d = (a = e.properties) == null ? void 0 : a.info) == null ? void 0 : d.finish, g = !!((b = (m = (f = e.properties) == null ? void 0 : f.info) == null ? void 0 : m.time) != null && b.completed);
        (C === "stop" || g && C !== "tool-calls") && E === "assistant" && _ === this.currentAssistantMessageId && (console.log("Assistant message finished:", _), this.currentCallbacks.onComplete(), this.clearCurrentMessage("completed"));
      } else if (e.type === "message.part.updated") {
        const _ = (h = e.properties) == null ? void 0 : h.part, E = _ == null ? void 0 : _.messageID, x = _ == null ? void 0 : _.sessionID, C = typeof ((k = e.properties) == null ? void 0 : k.delta) == "string" ? e.properties.delta : "";
        if (!_) {
          this.recordEvent(e, !0, "missing-part");
          return;
        }
        if (this.sessionId && x && x !== this.sessionId) {
          this.recordEvent(e, !0, "session-mismatch");
          return;
        }
        if (!this.currentAssistantMessageId && E && E !== this.currentUserMessageId && (this.currentAssistantMessageId = E), E === this.currentAssistantMessageId && E !== this.currentUserMessageId) {
          if (this.recordEvent(e), console.log("Processing part update for assistant message:", E), _.type === "text")
            this.currentText = this.resolveAccumulatedContent(_.text, C, this.currentText), this.currentCallbacks.onChunk(this.currentText);
          else if (_.type === "reasoning" || _.type === "thinking") {
            const g = typeof _.text == "string" ? _.text : typeof _.thinking == "string" ? _.thinking : "";
            this.currentReasoning = this.resolveAccumulatedContent(
              g,
              C,
              this.currentReasoning
            ), this.emitThinkingUpdate();
          } else if (_.type === "tool") {
            const g = this.buildToolThinkingEntry(_);
            g && (this.currentToolThinking = this.currentToolThinking ? `${this.currentToolThinking}

${g}` : g, this.emitThinkingUpdate());
          }
        } else
          this.recordEvent(e, !0, "not-assistant-message");
      } else
        this.recordEvent(e, !0, "unsupported-event-type");
    }
  }
  resolveAccumulatedContent(e, t, n) {
    const r = typeof e == "string" ? e : "";
    if (r) {
      if (r.length >= n.length)
        return r;
      if (n.startsWith(r))
        return n;
    }
    const i = t || r;
    return !i || n.endsWith(i) ? n : n + i;
  }
  getCombinedThinkingContent() {
    const e = [];
    return this.currentReasoning.trim() && e.push(this.currentReasoning.trim()), this.currentToolThinking.trim() && e.push(this.currentToolThinking.trim()), e.join(`

`);
  }
  emitThinkingUpdate() {
    var t;
    if (!((t = this.currentCallbacks) != null && t.onThinking))
      return;
    const e = this.getCombinedThinkingContent();
    !e || e === this.lastEmittedThinking || (this.lastEmittedThinking = e, this.currentCallbacks.onThinking(e));
  }
  stringifyToolValue(e) {
    if (e == null)
      return "";
    if (typeof e == "string")
      return e;
    if (typeof e == "object")
      try {
        return JSON.stringify(e, null, 2);
      } catch {
        return "[unserializable tool value]";
      }
    return String(e);
  }
  formatToolOutput(e, t = 4e3) {
    return e.length <= t ? e : `${e.slice(0, t)}
... [truncated ${e.length - t} chars]`;
  }
  buildToolThinkingEntry(e) {
    const t = typeof (e == null ? void 0 : e.tool) == "string" ? e.tool : "unknown-tool", n = typeof (e == null ? void 0 : e.callID) == "string" ? e.callID : void 0, r = typeof (e == null ? void 0 : e.id) == "string" ? e.id : `${t}:${n ?? "n/a"}`, i = (e == null ? void 0 : e.state) ?? {}, s = typeof (i == null ? void 0 : i.status) == "string" ? i.status : "unknown", o = this.stringifyToolValue(i == null ? void 0 : i.output), c = `${r}|${s}|${o}`;
    if (this.toolThinkingEntryKeys.has(c))
      return null;
    this.toolThinkingEntryKeys.add(c);
    const a = `[tool ${s}] ${t}${n ? ` (${n})` : ""}`;
    if (s === "completed")
      return o ? `${a}
${this.formatToolOutput(o)}` : `${a}
(no output)`;
    if (s === "error" || s === "failed") {
      const d = this.stringifyToolValue((i == null ? void 0 : i.error) || (i == null ? void 0 : i.output) || (i == null ? void 0 : i.raw));
      return d ? `${a}
${this.formatToolOutput(d)}` : a;
    }
    return a;
  }
  /**
   * Clear current message tracking
   */
  clearCurrentMessage(e) {
    e && this.finalizeCombinedLog(e), this.currentCallbacks = null, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.currentText = "", this.currentReasoning = "", this.currentToolThinking = "", this.toolThinkingEntryKeys = /* @__PURE__ */ new Set(), this.lastEmittedThinking = "";
  }
  async ensureSession() {
    var t;
    if (console.log("Ensuring session..."), this.sessionId)
      return this.sessionId;
    if (!this.createSession)
      throw new Error("No session ID provided and createSession is false");
    const e = await this.ensureClient();
    try {
      const n = await e.session.create({
        body: {
          title: `Chat ${(/* @__PURE__ */ new Date()).toLocaleString()}`
        }
      });
      if (console.log("Session created:", n), !((t = n.data) != null && t.id))
        throw new Error("Failed to create session: no session ID returned");
      const r = n.data.id;
      return this.sessionId = r, r;
    } catch (n) {
      throw new Error(
        `Failed to create session: ${n instanceof Error ? n.message : "Unknown error"}`
      );
    }
  }
  async sendMessage(e, t) {
    var n;
    this.abortController = new AbortController(), this.startCombinedLog(e);
    try {
      const r = await this.ensureClient(), i = await this.ensureSession();
      this.appendCombinedLog({
        category: "state",
        type: "session.ready",
        sessionId: i,
        payload: {
          model: this.model,
          agent: this.agent
        }
      }), this.eventStream || await this.init(), this.currentCallbacks = t, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.currentText = "", this.currentReasoning = "", this.currentToolThinking = "", this.toolThinkingEntryKeys = /* @__PURE__ */ new Set(), this.lastEmittedThinking = "";
      const s = [
        {
          type: "text",
          text: e.message
        }
      ];
      console.info("Sending prompt to session:", i, s, this.model, this.agent), this.appendCombinedLog({
        category: "request",
        type: "session.prompt",
        sessionId: i,
        payload: {
          model: this.model,
          agent: this.agent,
          parts: s
        }
      }), await r.session.prompt({
        path: { id: i },
        body: {
          model: this.model,
          agent: this.agent,
          parts: s
        }
      }), console.log("Prompt sent successfully"), this.appendCombinedLog({
        category: "state",
        type: "session.prompt.sent",
        sessionId: i
      });
    } catch (r) {
      const i = ((n = this.abortController) == null ? void 0 : n.signal.aborted) ?? !1;
      i || t.onError(r instanceof Error ? r : new Error("Unknown error")), this.clearCurrentMessage(i ? "cancelled" : "error");
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort(), this.clearCurrentMessage("cancelled");
  }
  setPublicQuestionHandler(e) {
    this.publicQuestionHandler = e;
  }
  async showQuestion(e, t) {
    if (!this.publicQuestionHandler)
      throw new Error(
        "No question handler is registered. Mount ChatWidget with this adapter first."
      );
    return this.publicQuestionHandler(e, t);
  }
  /**
   * Returns the most recent per-request combined log.
   */
  getLastCombinedLog() {
    return [...this.lastMessageLog];
  }
  /**
   * Returns a flat combined log of all request entries captured by this adapter instance.
   */
  getCombinedLog() {
    return [...this.combinedMessageLog];
  }
  /**
   * Get the current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * Set a specific session ID to use
   */
  setSessionId(e) {
    this.sessionId = e;
  }
  /**
   * Clear the current session (will create a new one on next message)
   */
  clearSession() {
    this.sessionId = null;
  }
}
class Gn {
  constructor(e) {
    this.ws = null, this.currentCallbacks = null, this.accumulatedText = "", this.accumulatedThinking = "", this.currentTurnId = null, this.reconnectCount = 0, this.reconnectTimer = null, this.heartbeatTimer = null, this.publicQuestionHandler = null, this.isConnecting = !1, this.pendingMessages = [], this.websocketUrl = e.websocketUrl, this.sessionToken = e.sessionToken, this.sessionId = e.sessionId, this.bridgeUrl = e.bridgeUrl || this.inferBridgeUrl(e.websocketUrl), this.reconnectAttempts = e.reconnectAttempts ?? 5, this.reconnectBaseDelay = e.reconnectBaseDelay ?? 1e3, this.reconnectMaxDelay = e.reconnectMaxDelay ?? 3e4, this.heartbeatIntervalMs = e.heartbeatIntervalMs ?? 3e4;
  }
  inferBridgeUrl(e) {
    const t = new URL(e);
    return `${t.protocol === "wss:" ? "https:" : "http:"}//${t.host}`;
  }
  async init() {
    if (!(this.ws && this.ws.readyState === WebSocket.OPEN)) {
      if (this.isConnecting)
        return new Promise((e, t) => {
          const n = () => {
            this.ws && this.ws.readyState === WebSocket.OPEN ? e() : this.isConnecting ? setTimeout(n, 100) : this.ws && this.ws.readyState === WebSocket.OPEN ? e() : t(new Error("Connection failed"));
          };
          n();
        });
      await this.connect();
    }
  }
  async connect() {
    if (!this.isConnecting)
      return this.isConnecting = !0, new Promise((e, t) => {
        try {
          const n = `${this.websocketUrl}?token=${encodeURIComponent(this.sessionToken)}`;
          this.ws = new WebSocket(n);
          const r = () => {
            var s, o;
            for (console.log("[WebSocketAdapter] Connected"), this.isConnecting = !1, this.reconnectCount = 0, this.startHeartbeat(); this.pendingMessages.length > 0; ) {
              const c = this.pendingMessages.shift();
              c && this.ws && this.ws.send(c);
            }
            (s = this.ws) == null || s.removeEventListener("open", r), (o = this.ws) == null || o.removeEventListener("error", i), e();
          }, i = (s) => {
            var o, c;
            console.error("[WebSocketAdapter] Connection error:", s), this.isConnecting = !1, (o = this.ws) == null || o.removeEventListener("open", r), (c = this.ws) == null || c.removeEventListener("error", i), t(new Error("WebSocket connection failed"));
          };
          this.ws.addEventListener("open", r), this.ws.addEventListener("error", i), this.ws.addEventListener("message", this.handleMessage.bind(this)), this.ws.addEventListener("close", this.handleClose.bind(this)), this.ws.addEventListener("error", this.handleError.bind(this));
        } catch (n) {
          this.isConnecting = !1, t(n);
        }
      });
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({ type: "ping" }));
    }, this.heartbeatIntervalMs);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
  handleMessage(e) {
    try {
      const t = JSON.parse(e.data);
      if (t.type === "pong")
        return;
      this.handleSessionEvent(t);
    } catch (t) {
      console.error("[WebSocketAdapter] Failed to parse message:", t);
    }
  }
  handleSessionEvent(e) {
    if (this.currentCallbacks)
      switch (console.log("[WebSocketAdapter] Received event:", e), e.type) {
        case "agent.text_delta":
          this.handleTextDelta(e);
          break;
        case "agent.turn_start":
          this.handleTurnStart(e);
          break;
        case "agent.turn_end":
          this.handleTurnEnd(e);
          break;
        case "agent.tool_start":
          this.handleToolStart(e);
          break;
        case "agent.tool_end":
          this.handleToolEnd(e);
          break;
        case "agent.error":
          this.handleAgentError(e);
          break;
        case "hub.request":
          this.handleHubRequest(e);
          break;
        default:
          console.log("[WebSocketAdapter] Unhandled event type:", e.type);
      }
  }
  handleTextDelta(e) {
    var t;
    this.accumulatedText += e.payload.delta, (t = this.currentCallbacks) == null || t.onChunk(this.accumulatedText);
  }
  handleTurnStart(e) {
    this.currentTurnId = e.payload.turnId, this.accumulatedText = "", this.accumulatedThinking = "", console.log("[WebSocketAdapter] Turn started:", this.currentTurnId);
  }
  handleTurnEnd(e) {
    var t;
    console.log("[WebSocketAdapter] Turn ended:", e.payload.turnId), (t = this.currentCallbacks) == null || t.onComplete(), this.clearCurrentTurn();
  }
  handleToolStart(e) {
    var t;
    if ((t = this.currentCallbacks) != null && t.onThinking) {
      const r = `Using tool: ${e.payload.toolName}`;
      this.accumulatedThinking ? this.accumulatedThinking += `
${r}` : this.accumulatedThinking = r, this.currentCallbacks.onThinking(this.accumulatedThinking);
    }
  }
  handleToolEnd(e) {
    var t;
    if ((t = this.currentCallbacks) != null && t.onThinking) {
      const n = e.payload.toolName, r = e.payload.toolOutput, i = typeof r == "string" ? r : JSON.stringify(r), s = `Completed tool: ${n}
Output: ${this.truncateOutput(i, 200)}`;
      this.accumulatedThinking ? this.accumulatedThinking += `
${s}` : this.accumulatedThinking = s, this.currentCallbacks.onThinking(this.accumulatedThinking);
    }
  }
  truncateOutput(e, t) {
    return e.length <= t ? e : `${e.slice(0, t)}... [truncated]`;
  }
  handleAgentError(e) {
    var r;
    const t = e.payload.errorMessage || "Unknown agent error", n = new Error(t);
    e.payload.errorCode && (n.code = e.payload.errorCode), (r = this.currentCallbacks) == null || r.onError(n), this.clearCurrentTurn();
  }
  async handleHubRequest(e) {
    var s;
    if (!((s = this.currentCallbacks) != null && s.onQuestion)) {
      console.warn("[WebSocketAdapter] Received hub.request but no onQuestion handler registered");
      return;
    }
    const { requestId: t, requestType: n, payload: r } = e.payload;
    if (n !== "question.ask") {
      console.warn("[WebSocketAdapter] Unsupported request type:", n);
      return;
    }
    const i = r;
    try {
      const o = await this.currentCallbacks.onQuestion(i), c = `${this.bridgeUrl}/api/session/${encodeURIComponent(this.sessionId)}/events/request/${encodeURIComponent(t)}/response`;
      await fetch(c, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.sessionToken}`
        },
        body: JSON.stringify({ response: o })
      }), console.log("[WebSocketAdapter] Question response posted:", t);
    } catch (o) {
      console.error("[WebSocketAdapter] Failed to handle question:", o);
      try {
        const c = `${this.bridgeUrl}/api/session/${encodeURIComponent(this.sessionId)}/events/request/${encodeURIComponent(t)}/response`;
        await fetch(c, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.sessionToken}`
          },
          body: JSON.stringify({ response: [] })
        });
      } catch (c) {
        console.error("[WebSocketAdapter] Failed to post error response:", c);
      }
    }
  }
  handleClose(e) {
    var t;
    console.log("[WebSocketAdapter] Connection closed:", e.code, e.reason), this.stopHeartbeat(), e.code !== 1e3 && this.reconnectCount < this.reconnectAttempts ? this.scheduleReconnect() : this.reconnectCount >= this.reconnectAttempts && (console.error("[WebSocketAdapter] Max reconnection attempts reached"), (t = this.currentCallbacks) == null || t.onError(
      new Error("Connection lost and max reconnection attempts reached")
    ), this.clearCurrentTurn());
  }
  handleError(e) {
    console.error("[WebSocketAdapter] WebSocket error:", e);
  }
  scheduleReconnect() {
    if (this.reconnectTimer)
      return;
    this.reconnectCount++;
    const e = Math.min(
      this.reconnectBaseDelay * 2 ** (this.reconnectCount - 1),
      this.reconnectMaxDelay
    );
    console.log(
      `[WebSocketAdapter] Scheduling reconnect attempt ${this.reconnectCount}/${this.reconnectAttempts} in ${e}ms`
    ), this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect(), console.log("[WebSocketAdapter] Reconnected successfully");
      } catch (t) {
        console.error("[WebSocketAdapter] Reconnection failed:", t);
      }
    }, e);
  }
  clearCurrentTurn() {
    this.currentCallbacks = null, this.currentTurnId = null, this.accumulatedText = "", this.accumulatedThinking = "";
  }
  async sendMessage(e, t) {
    if ((!this.ws || this.ws.readyState !== WebSocket.OPEN) && await this.init(), !this.ws || this.ws.readyState !== WebSocket.OPEN)
      throw new Error("WebSocket is not connected");
    this.currentCallbacks = t, this.accumulatedText = "", this.accumulatedThinking = "";
    const n = JSON.stringify({
      type: "user_message",
      content: e.message
    });
    this.ws.readyState === WebSocket.OPEN ? this.ws.send(n) : this.pendingMessages.push(n);
  }
  cancel() {
    this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({ type: "cancel" })), this.clearCurrentTurn();
  }
  setPublicQuestionHandler(e) {
    this.publicQuestionHandler = e;
  }
  async showQuestion(e, t) {
    if (!this.publicQuestionHandler)
      throw new Error(
        "No question handler is registered. Mount ChatWidget with this adapter first."
      );
    return this.publicQuestionHandler(e, t);
  }
  /**
   * Close the WebSocket connection and clean up
   */
  disconnect() {
    this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.stopHeartbeat(), this.ws && (this.ws.close(1e3, "Client disconnect"), this.ws = null), this.clearCurrentTurn(), this.reconnectCount = 0, this.pendingMessages = [];
  }
}
const Yu = "Welcome to Audako MCP Chat. How can I assist you today?", Bu = "Audako Assistant", Fe = (u) => ({
  text: u.trim(),
  attachments: []
}), ue = (u = 0) => (Date.now() + u).toString(), ve = (u, e = "1") => ({
  id: e,
  from: "system",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), Te = (u) => ({
  id: ue(),
  from: "user",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), Se = (u) => ({
  id: u,
  from: "assistant",
  text: "",
  timestamp: /* @__PURE__ */ new Date(),
  isStreaming: !0
}), Ie = (u) => u.label, Me = 300, qe = ({ getConfig: u, getShowThinking: e, scrollToBottom: t }) => {
  const n = l.proxy({
    messages: [],
    draft: "",
    isTyping: !1,
    streamingMessageId: null,
    pendingQuestion: null,
    selectedQuestionAnswers: [],
    shouldFocusQuestion: !1
  });
  let r = null, i = null, s = null, o = !1;
  const c = (...g) => {
    console.log("[chat-ui]", ...g);
  }, a = () => {
    n.pendingQuestion = null, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = !1, r = null;
  }, d = (g) => {
    const p = r;
    a(), p == null || p(g);
  }, f = (g, p = !1) => (r && r([]), n.pendingQuestion = g, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = p, new Promise((y) => {
    r = y;
  })), m = (g, p) => {
    const y = n.messages.findIndex((D) => D.id === g);
    y !== -1 && (n.messages[y] = p(n.messages[y]), n.messages = [...n.messages]);
  };
  return {
    state: n,
    syncConfig: () => {
      var y, D, A, v;
      const g = u(), p = g == null ? void 0 : g.adapter;
      if (c("config resolved", {
        title: g == null ? void 0 : g.title,
        hasAdapter: !!(g != null && g.adapter),
        adapterType: (D = (y = g == null ? void 0 : g.adapter) == null ? void 0 : y.constructor) == null ? void 0 : D.name,
        hasInitialMessage: !!(g != null && g.initialMessage)
      }), s && s !== p && ((A = s.setPublicQuestionHandler) == null || A.call(s, null), s = null), p && s !== p) {
        const w = (T, U) => f(T, (U == null ? void 0 : U.autoFocus) ?? !1);
        (v = p.setPublicQuestionHandler) == null || v.call(p, w), s = p;
      }
      p && typeof p.init == "function" && p !== i && (i = p, c("initializing adapter"), p.init().catch((w) => {
        console.error("Failed to initialize adapter:", w);
      })), o || (o = !0, n.messages = [
        ve((g == null ? void 0 : g.initialMessage) ?? Yu)
      ]);
    },
    setDraft: (g) => {
      n.draft = g;
    },
    sendMessage: async () => {
      var v;
      const g = u(), p = Fe(n.draft);
      if (c("sendMessage called", {
        draftLength: n.draft.length,
        isDraftEmpty: !p.text,
        hasStreamingMessage: !!n.streamingMessageId,
        hasAdapter: !!(g != null && g.adapter),
        attachmentCount: p.attachments.length
      }), !p.text || n.streamingMessageId || !(g != null && g.adapter)) {
        c("sendMessage aborted", {
          reason: {
            emptyDraft: !p.text,
            streamingInProgress: !!n.streamingMessageId,
            missingAdapter: !(g != null && g.adapter)
          }
        });
        return;
      }
      const y = Te(p.text);
      n.messages = [...n.messages, y], c("user message appended", {
        messageId: y.id,
        totalMessages: n.messages.length
      }), n.draft = "", t(), n.isTyping = !0, await new Promise((w) => setTimeout(w, Me));
      const D = ue(1), A = Se(D);
      n.messages = [...n.messages, A], n.isTyping = !1, n.streamingMessageId = D, c("assistant streaming message created", {
        messageId: D,
        historyLength: n.messages.filter((w) => w.from !== "system").length,
        adapterType: (v = g.adapter.constructor) == null ? void 0 : v.name
      }), t();
      try {
        c("calling adapter.sendMessage"), await g.adapter.sendMessage(
          {
            message: p.text,
            conversationHistory: n.messages.filter((w) => w.from !== "system")
          },
          {
            onChunk: (w) => {
              c("adapter chunk received", { messageId: D, chunkLength: w.length }), m(D, (T) => ({ ...T, text: w })), t();
            },
            onThinking: (w) => {
              e() && (c("adapter thinking chunk received", { messageId: D, chunkLength: w.length }), m(D, (T) => ({ ...T, thinking: { content: w, isStreaming: !0 } })), t());
            },
            onQuestion: async (w) => {
              var Z;
              c("adapter question received", {
                optionCount: ((Z = w.options) == null ? void 0 : Z.length) ?? 0,
                allowMultiple: !!w.allowMultiple
              });
              const T = typeof document < "u" ? document.activeElement : null, U = T instanceof HTMLElement && T.classList.contains("chat-widget__input");
              return f(w, U);
            },
            onComplete: () => {
              c("adapter stream completed", { messageId: D }), m(D, (w) => ({
                ...w,
                isStreaming: !1,
                thinking: e() && w.thinking ? { ...w.thinking, isStreaming: !1 } : void 0
              })), a(), n.streamingMessageId = null, t();
            },
            onError: (w) => {
              c("adapter stream errored", { messageId: D, errorMessage: w.message }), console.error("Chat error:", w), m(D, (T) => ({
                ...T,
                text: `Error: ${w.message}`,
                isStreaming: !1
              })), a(), n.streamingMessageId = null, t();
            }
          }
        ), c("adapter.sendMessage resolved", { messageId: D });
      } catch (w) {
        c("adapter.sendMessage threw", {
          messageId: D,
          errorMessage: w instanceof Error ? w.message : "Unknown error"
        }), console.error("Unexpected error:", w), m(D, (T) => ({
          ...T,
          text: "Unexpected error occurred",
          isStreaming: !1
        })), a(), n.streamingMessageId = null, t();
      }
    },
    toggleQuestionAnswer: (g) => {
      if (n.pendingQuestion) {
        if (!n.pendingQuestion.allowMultiple) {
          d([g]);
          return;
        }
        n.selectedQuestionAnswers.includes(g) ? n.selectedQuestionAnswers = n.selectedQuestionAnswers.filter((p) => p !== g) : n.selectedQuestionAnswers = [...n.selectedQuestionAnswers, g];
      }
    },
    submitQuestionAnswers: () => {
      var g;
      !((g = n.pendingQuestion) != null && g.allowMultiple) || n.selectedQuestionAnswers.length === 0 || d(n.selectedQuestionAnswers);
    },
    submitCustomAnswer: (g) => {
      !n.pendingQuestion || !g || d([g]);
    },
    clearQuestionFocusRequest: () => {
      n.shouldFocusQuestion = !1;
    }
  };
};
var Be = l.from_html('<h2 class="chat-widget__header-title svelte-hbwy0v"> </h2>'), ze = l.from_html('<header class="chat-widget__header svelte-hbwy0v"><div><!></div></header>');
function Le(u, e) {
  var t = ze(), n = l.child(t), r = l.child(n);
  {
    var i = (o) => {
      var c = l.comment(), a = l.first_child(c);
      l.snippet(a, () => e.header, () => e.title), l.append(o, c);
    }, s = (o) => {
      var c = Be(), a = l.child(c, !0);
      l.reset(c), l.template_effect(() => l.set_text(a, e.title)), l.append(o, c);
    };
    l.if(r, (o) => {
      e.header ? o(i) : o(s, !1);
    });
  }
  l.reset(n), l.reset(t), l.append(u, t);
}
var Re = l.from_html('<form class="chat-widget__composer svelte-1m0eido"><div class="chat-widget__input-wrap svelte-1m0eido"><textarea class="chat-widget__input svelte-1m0eido" rows="1"></textarea></div> <button type="submit" class="chat-widget__send svelte-1m0eido" title="Send message"><svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon svelte-1m0eido" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button></form>');
function Pe(u, e) {
  l.push(e, !0);
  const t = 160;
  let n = l.state(void 0);
  const r = l.derived(() => !e.draft.trim() || e.disabled), i = (b = l.get(n)) => {
    if (!b)
      return;
    b.style.height = "auto";
    const h = Math.min(b.scrollHeight, t);
    b.style.height = `${h}px`, b.style.overflowY = b.scrollHeight > t ? "auto" : "hidden";
  }, s = (b) => {
    b.preventDefault(), !l.get(r) && e.onSubmit();
  }, o = (b) => {
    b.isComposing || b.key !== "Enter" || b.shiftKey || (b.preventDefault(), !l.get(r) && e.onSubmit());
  }, c = (b) => {
    const h = b.currentTarget;
    e.onDraftChange(h.value), i(h);
  };
  l.user_effect(() => {
    e.draft, i();
  });
  var a = Re(), d = l.child(a), f = l.child(d);
  l.remove_textarea_child(f), f.__input = c, f.__keydown = o, l.bind_this(f, (b) => l.set(n, b), () => l.get(n)), l.reset(d);
  var m = l.sibling(d, 2);
  l.reset(a), l.template_effect(() => {
    l.set_attribute(f, "placeholder", e.placeholder), l.set_value(f, e.draft), f.disabled = e.disabled, m.disabled = l.get(r);
  }), l.event("submit", a, s), l.append(u, a), l.pop();
}
l.delegate(["input", "keydown"]);
const zu = {};
function Oe(u) {
  let e = zu[u];
  if (e)
    return e;
  e = zu[u] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    e.push(n);
  }
  for (let t = 0; t < u.length; t++) {
    const n = u.charCodeAt(t);
    e[n] = "%" + ("0" + n.toString(16).toUpperCase()).slice(-2);
  }
  return e;
}
function $(u, e) {
  typeof e != "string" && (e = $.defaultChars);
  const t = Oe(e);
  return u.replace(/(%[a-f0-9]{2})+/gi, function(n) {
    let r = "";
    for (let i = 0, s = n.length; i < s; i += 3) {
      const o = parseInt(n.slice(i + 1, i + 3), 16);
      if (o < 128) {
        r += t[o];
        continue;
      }
      if ((o & 224) === 192 && i + 3 < s) {
        const c = parseInt(n.slice(i + 4, i + 6), 16);
        if ((c & 192) === 128) {
          const a = o << 6 & 1984 | c & 63;
          a < 128 ? r += "��" : r += String.fromCharCode(a), i += 3;
          continue;
        }
      }
      if ((o & 240) === 224 && i + 6 < s) {
        const c = parseInt(n.slice(i + 4, i + 6), 16), a = parseInt(n.slice(i + 7, i + 9), 16);
        if ((c & 192) === 128 && (a & 192) === 128) {
          const d = o << 12 & 61440 | c << 6 & 4032 | a & 63;
          d < 2048 || d >= 55296 && d <= 57343 ? r += "���" : r += String.fromCharCode(d), i += 6;
          continue;
        }
      }
      if ((o & 248) === 240 && i + 9 < s) {
        const c = parseInt(n.slice(i + 4, i + 6), 16), a = parseInt(n.slice(i + 7, i + 9), 16), d = parseInt(n.slice(i + 10, i + 12), 16);
        if ((c & 192) === 128 && (a & 192) === 128 && (d & 192) === 128) {
          let f = o << 18 & 1835008 | c << 12 & 258048 | a << 6 & 4032 | d & 63;
          f < 65536 || f > 1114111 ? r += "����" : (f -= 65536, r += String.fromCharCode(55296 + (f >> 10), 56320 + (f & 1023))), i += 9;
          continue;
        }
      }
      r += "�";
    }
    return r;
  });
}
$.defaultChars = ";/?:@&=+$,#";
$.componentChars = "";
const Lu = {};
function Ne(u) {
  let e = Lu[u];
  if (e)
    return e;
  e = Lu[u] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    /^[0-9a-z]$/i.test(n) ? e.push(n) : e.push("%" + ("0" + t.toString(16).toUpperCase()).slice(-2));
  }
  for (let t = 0; t < u.length; t++)
    e[u.charCodeAt(t)] = u[t];
  return e;
}
function nu(u, e, t) {
  typeof e != "string" && (t = e, e = nu.defaultChars), typeof t > "u" && (t = !0);
  const n = Ne(e);
  let r = "";
  for (let i = 0, s = u.length; i < s; i++) {
    const o = u.charCodeAt(i);
    if (t && o === 37 && i + 2 < s && /^[0-9a-f]{2}$/i.test(u.slice(i + 1, i + 3))) {
      r += u.slice(i, i + 3), i += 2;
      continue;
    }
    if (o < 128) {
      r += n[o];
      continue;
    }
    if (o >= 55296 && o <= 57343) {
      if (o >= 55296 && o <= 56319 && i + 1 < s) {
        const c = u.charCodeAt(i + 1);
        if (c >= 56320 && c <= 57343) {
          r += encodeURIComponent(u[i] + u[i + 1]), i++;
          continue;
        }
      }
      r += "%EF%BF%BD";
      continue;
    }
    r += encodeURIComponent(u[i]);
  }
  return r;
}
nu.defaultChars = ";/?:@&=+$,-_.!~*'()#";
nu.componentChars = "-_.!~*'()";
function wu(u) {
  let e = "";
  return e += u.protocol || "", e += u.slashes ? "//" : "", e += u.auth ? u.auth + "@" : "", u.hostname && u.hostname.indexOf(":") !== -1 ? e += "[" + u.hostname + "]" : e += u.hostname || "", e += u.port ? ":" + u.port : "", e += u.pathname || "", e += u.search || "", e += u.hash || "", e;
}
function au() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const Ue = /^([a-z0-9.+-]+:)/i, He = /:[0-9]*$/, Qe = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, je = ["<", ">", '"', "`", " ", "\r", `
`, "	"], We = ["{", "}", "|", "\\", "^", "`"].concat(je), Ze = ["'"].concat(We), Ru = ["%", "/", "?", ";", "#"].concat(Ze), Pu = ["/", "?", "#"], Ve = 255, Ou = /^[+a-z0-9A-Z_-]{0,63}$/, Ge = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Nu = {
  javascript: !0,
  "javascript:": !0
}, Uu = {
  http: !0,
  https: !0,
  ftp: !0,
  gopher: !0,
  file: !0,
  "http:": !0,
  "https:": !0,
  "ftp:": !0,
  "gopher:": !0,
  "file:": !0
};
function Fu(u, e) {
  if (u && u instanceof au) return u;
  const t = new au();
  return t.parse(u, e), t;
}
au.prototype.parse = function(u, e) {
  let t, n, r, i = u;
  if (i = i.trim(), !e && u.split("#").length === 1) {
    const a = Qe.exec(i);
    if (a)
      return this.pathname = a[1], a[2] && (this.search = a[2]), this;
  }
  let s = Ue.exec(i);
  if (s && (s = s[0], t = s.toLowerCase(), this.protocol = s, i = i.substr(s.length)), (e || s || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(s && Nu[s]) && (i = i.substr(2), this.slashes = !0)), !Nu[s] && (r || s && !Uu[s])) {
    let a = -1;
    for (let h = 0; h < Pu.length; h++)
      n = i.indexOf(Pu[h]), n !== -1 && (a === -1 || n < a) && (a = n);
    let d, f;
    a === -1 ? f = i.lastIndexOf("@") : f = i.lastIndexOf("@", a), f !== -1 && (d = i.slice(0, f), i = i.slice(f + 1), this.auth = d), a = -1;
    for (let h = 0; h < Ru.length; h++)
      n = i.indexOf(Ru[h]), n !== -1 && (a === -1 || n < a) && (a = n);
    a === -1 && (a = i.length), i[a - 1] === ":" && a--;
    const m = i.slice(0, a);
    i = i.slice(a), this.parseHost(m), this.hostname = this.hostname || "";
    const b = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!b) {
      const h = this.hostname.split(/\./);
      for (let k = 0, _ = h.length; k < _; k++) {
        const E = h[k];
        if (E && !E.match(Ou)) {
          let x = "";
          for (let C = 0, g = E.length; C < g; C++)
            E.charCodeAt(C) > 127 ? x += "x" : x += E[C];
          if (!x.match(Ou)) {
            const C = h.slice(0, k), g = h.slice(k + 1), p = E.match(Ge);
            p && (C.push(p[1]), g.unshift(p[2])), g.length && (i = g.join(".") + i), this.hostname = C.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Ve && (this.hostname = ""), b && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const o = i.indexOf("#");
  o !== -1 && (this.hash = i.substr(o), i = i.slice(0, o));
  const c = i.indexOf("?");
  return c !== -1 && (this.search = i.substr(c), i = i.slice(0, c)), i && (this.pathname = i), Uu[t] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
au.prototype.parseHost = function(u) {
  let e = He.exec(u);
  e && (e = e[0], e !== ":" && (this.port = e.substr(1)), u = u.substr(0, u.length - e.length)), u && (this.hostname = u);
};
const Je = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: $,
  encode: nu,
  format: wu,
  parse: Fu
}, Symbol.toStringTag, { value: "Module" })), ee = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, te = /[\0-\x1F\x7F-\x9F]/, $e = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, vu = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, ne = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, re = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Ke = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: ee,
  Cc: te,
  Cf: $e,
  P: vu,
  S: ne,
  Z: re
}, Symbol.toStringTag, { value: "Module" })), Xe = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((u) => u.charCodeAt(0))
), Ye = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((u) => u.charCodeAt(0))
);
var gu;
const ut = /* @__PURE__ */ new Map([
  [0, 65533],
  // C1 Unicode control character reference replacements
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]), et = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (gu = String.fromCodePoint) !== null && gu !== void 0 ? gu : function(u) {
    let e = "";
    return u > 65535 && (u -= 65536, e += String.fromCharCode(u >>> 10 & 1023 | 55296), u = 56320 | u & 1023), e += String.fromCharCode(u), e;
  }
);
function tt(u) {
  var e;
  return u >= 55296 && u <= 57343 || u > 1114111 ? 65533 : (e = ut.get(u)) !== null && e !== void 0 ? e : u;
}
var I;
(function(u) {
  u[u.NUM = 35] = "NUM", u[u.SEMI = 59] = "SEMI", u[u.EQUALS = 61] = "EQUALS", u[u.ZERO = 48] = "ZERO", u[u.NINE = 57] = "NINE", u[u.LOWER_A = 97] = "LOWER_A", u[u.LOWER_F = 102] = "LOWER_F", u[u.LOWER_X = 120] = "LOWER_X", u[u.LOWER_Z = 122] = "LOWER_Z", u[u.UPPER_A = 65] = "UPPER_A", u[u.UPPER_F = 70] = "UPPER_F", u[u.UPPER_Z = 90] = "UPPER_Z";
})(I || (I = {}));
const nt = 32;
var j;
(function(u) {
  u[u.VALUE_LENGTH = 49152] = "VALUE_LENGTH", u[u.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", u[u.JUMP_TABLE = 127] = "JUMP_TABLE";
})(j || (j = {}));
function Eu(u) {
  return u >= I.ZERO && u <= I.NINE;
}
function rt(u) {
  return u >= I.UPPER_A && u <= I.UPPER_F || u >= I.LOWER_A && u <= I.LOWER_F;
}
function it(u) {
  return u >= I.UPPER_A && u <= I.UPPER_Z || u >= I.LOWER_A && u <= I.LOWER_Z || Eu(u);
}
function st(u) {
  return u === I.EQUALS || it(u);
}
var S;
(function(u) {
  u[u.EntityStart = 0] = "EntityStart", u[u.NumericStart = 1] = "NumericStart", u[u.NumericDecimal = 2] = "NumericDecimal", u[u.NumericHex = 3] = "NumericHex", u[u.NamedEntity = 4] = "NamedEntity";
})(S || (S = {}));
var Q;
(function(u) {
  u[u.Legacy = 0] = "Legacy", u[u.Strict = 1] = "Strict", u[u.Attribute = 2] = "Attribute";
})(Q || (Q = {}));
class ot {
  constructor(e, t, n) {
    this.decodeTree = e, this.emitCodePoint = t, this.errors = n, this.state = S.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = Q.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(e) {
    this.decodeMode = e, this.state = S.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   *
   * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
   * entity is incomplete, and resume when the next string is written.
   *
   * @param string The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(e, t) {
    switch (this.state) {
      case S.EntityStart:
        return e.charCodeAt(t) === I.NUM ? (this.state = S.NumericStart, this.consumed += 1, this.stateNumericStart(e, t + 1)) : (this.state = S.NamedEntity, this.stateNamedEntity(e, t));
      case S.NumericStart:
        return this.stateNumericStart(e, t);
      case S.NumericDecimal:
        return this.stateNumericDecimal(e, t);
      case S.NumericHex:
        return this.stateNumericHex(e, t);
      case S.NamedEntity:
        return this.stateNamedEntity(e, t);
    }
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(e, t) {
    return t >= e.length ? -1 : (e.charCodeAt(t) | nt) === I.LOWER_X ? (this.state = S.NumericHex, this.consumed += 1, this.stateNumericHex(e, t + 1)) : (this.state = S.NumericDecimal, this.stateNumericDecimal(e, t));
  }
  addToNumericResult(e, t, n, r) {
    if (t !== n) {
      const i = n - t;
      this.result = this.result * Math.pow(r, i) + parseInt(e.substr(t, i), r), this.consumed += i;
    }
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexademical character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(e, t) {
    const n = t;
    for (; t < e.length; ) {
      const r = e.charCodeAt(t);
      if (Eu(r) || rt(r))
        t += 1;
      else
        return this.addToNumericResult(e, n, t, 16), this.emitNumericEntity(r, 3);
    }
    return this.addToNumericResult(e, n, t, 16), -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(e, t) {
    const n = t;
    for (; t < e.length; ) {
      const r = e.charCodeAt(t);
      if (Eu(r))
        t += 1;
      else
        return this.addToNumericResult(e, n, t, 10), this.emitNumericEntity(r, 2);
    }
    return this.addToNumericResult(e, n, t, 10), -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexademical character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   *
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(e, t) {
    var n;
    if (this.consumed <= t)
      return (n = this.errors) === null || n === void 0 || n.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (e === I.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === Q.Strict)
      return 0;
    return this.emitCodePoint(tt(this.result), this.consumed), this.errors && (e !== I.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
  }
  /**
   * Parses a named entity.
   *
   * Equivalent to the `Named character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNamedEntity(e, t) {
    const { decodeTree: n } = this;
    let r = n[this.treeIndex], i = (r & j.VALUE_LENGTH) >> 14;
    for (; t < e.length; t++, this.excess++) {
      const s = e.charCodeAt(t);
      if (this.treeIndex = ct(n, r, this.treeIndex + Math.max(1, i), s), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === Q.Attribute && // We shouldn't have consumed any characters after the entity,
        (i === 0 || // And there should be no invalid characters.
        st(s)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (r = n[this.treeIndex], i = (r & j.VALUE_LENGTH) >> 14, i !== 0) {
        if (s === I.SEMI)
          return this.emitNamedEntityData(this.treeIndex, i, this.consumed + this.excess);
        this.decodeMode !== Q.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
      }
    }
    return -1;
  }
  /**
   * Emit a named entity that was not terminated with a semicolon.
   *
   * @returns The number of characters consumed.
   */
  emitNotTerminatedNamedEntity() {
    var e;
    const { result: t, decodeTree: n } = this, r = (n[t] & j.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(t, r, this.consumed), (e = this.errors) === null || e === void 0 || e.missingSemicolonAfterCharacterReference(), this.consumed;
  }
  /**
   * Emit a named entity.
   *
   * @param result The index of the entity in the decode tree.
   * @param valueLength The number of bytes in the entity.
   * @param consumed The number of characters consumed.
   *
   * @returns The number of characters consumed.
   */
  emitNamedEntityData(e, t, n) {
    const { decodeTree: r } = this;
    return this.emitCodePoint(t === 1 ? r[e] & ~j.VALUE_LENGTH : r[e + 1], n), t === 3 && this.emitCodePoint(r[e + 2], n), n;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   *
   * @returns The number of characters consumed.
   */
  end() {
    var e;
    switch (this.state) {
      case S.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== Q.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case S.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case S.NumericHex:
        return this.emitNumericEntity(0, 3);
      case S.NumericStart:
        return (e = this.errors) === null || e === void 0 || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case S.EntityStart:
        return 0;
    }
  }
}
function ie(u) {
  let e = "";
  const t = new ot(u, (n) => e += et(n));
  return function(r, i) {
    let s = 0, o = 0;
    for (; (o = r.indexOf("&", o)) >= 0; ) {
      e += r.slice(s, o), t.startEntity(i);
      const a = t.write(
        r,
        // Skip the "&"
        o + 1
      );
      if (a < 0) {
        s = o + t.end();
        break;
      }
      s = o + a, o = a === 0 ? s + 1 : s;
    }
    const c = e + r.slice(s);
    return e = "", c;
  };
}
function ct(u, e, t, n) {
  const r = (e & j.BRANCH_LENGTH) >> 7, i = e & j.JUMP_TABLE;
  if (r === 0)
    return i !== 0 && n === i ? t : -1;
  if (i) {
    const c = n - i;
    return c < 0 || c >= r ? -1 : u[t + c] - 1;
  }
  let s = t, o = s + r - 1;
  for (; s <= o; ) {
    const c = s + o >>> 1, a = u[c];
    if (a < n)
      s = c + 1;
    else if (a > n)
      o = c - 1;
    else
      return u[c + r];
  }
  return -1;
}
const at = ie(Xe);
ie(Ye);
function se(u, e = Q.Legacy) {
  return at(u, e);
}
function lt(u) {
  return Object.prototype.toString.call(u);
}
function Tu(u) {
  return lt(u) === "[object String]";
}
const dt = Object.prototype.hasOwnProperty;
function ft(u, e) {
  return dt.call(u, e);
}
function fu(u) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    if (t) {
      if (typeof t != "object")
        throw new TypeError(t + "must be object");
      Object.keys(t).forEach(function(n) {
        u[n] = t[n];
      });
    }
  }), u;
}
function oe(u, e, t) {
  return [].concat(u.slice(0, e), t, u.slice(e + 1));
}
function Su(u) {
  return !(u >= 55296 && u <= 57343 || u >= 64976 && u <= 65007 || (u & 65535) === 65535 || (u & 65535) === 65534 || u >= 0 && u <= 8 || u === 11 || u >= 14 && u <= 31 || u >= 127 && u <= 159 || u > 1114111);
}
function lu(u) {
  if (u > 65535) {
    u -= 65536;
    const e = 55296 + (u >> 10), t = 56320 + (u & 1023);
    return String.fromCharCode(e, t);
  }
  return String.fromCharCode(u);
}
const ce = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, ht = /&([a-z#][a-z0-9]{1,31});/gi, bt = new RegExp(ce.source + "|" + ht.source, "gi"), pt = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function gt(u, e) {
  if (e.charCodeAt(0) === 35 && pt.test(e)) {
    const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Su(n) ? lu(n) : u;
  }
  const t = se(u);
  return t !== u ? t : u;
}
function mt(u) {
  return u.indexOf("\\") < 0 ? u : u.replace(ce, "$1");
}
function K(u) {
  return u.indexOf("\\") < 0 && u.indexOf("&") < 0 ? u : u.replace(bt, function(e, t, n) {
    return t || gt(e, n);
  });
}
const _t = /[&<>"]/, xt = /[&<>"]/g, kt = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function yt(u) {
  return kt[u];
}
function W(u) {
  return _t.test(u) ? u.replace(xt, yt) : u;
}
const Ct = /[.?*+^$[\]\\(){}|-]/g;
function Et(u) {
  return u.replace(Ct, "\\$&");
}
function F(u) {
  switch (u) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function Y(u) {
  if (u >= 8192 && u <= 8202)
    return !0;
  switch (u) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function uu(u) {
  return vu.test(u) || ne.test(u);
}
function eu(u) {
  switch (u) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function hu(u) {
  return u = u.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (u = u.replace(/ẞ/g, "ß")), u.toLowerCase().toUpperCase();
}
const Dt = { mdurl: Je, ucmicro: Ke }, At = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: oe,
  assign: fu,
  escapeHtml: W,
  escapeRE: Et,
  fromCodePoint: lu,
  has: ft,
  isMdAsciiPunct: eu,
  isPunctChar: uu,
  isSpace: F,
  isString: Tu,
  isValidEntityCode: Su,
  isWhiteSpace: Y,
  lib: Dt,
  normalizeReference: hu,
  unescapeAll: K,
  unescapeMd: mt
}, Symbol.toStringTag, { value: "Module" }));
function wt(u, e, t) {
  let n, r, i, s;
  const o = u.posMax, c = u.pos;
  for (u.pos = e + 1, n = 1; u.pos < o; ) {
    if (i = u.src.charCodeAt(u.pos), i === 93 && (n--, n === 0)) {
      r = !0;
      break;
    }
    if (s = u.pos, u.md.inline.skipToken(u), i === 91) {
      if (s === u.pos - 1)
        n++;
      else if (t)
        return u.pos = c, -1;
    }
  }
  let a = -1;
  return r && (a = u.pos), u.pos = c, a;
}
function Ft(u, e, t) {
  let n, r = e;
  const i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (u.charCodeAt(r) === 60) {
    for (r++; r < t; ) {
      if (n = u.charCodeAt(r), n === 10 || n === 60)
        return i;
      if (n === 62)
        return i.pos = r + 1, i.str = K(u.slice(e + 1, r)), i.ok = !0, i;
      if (n === 92 && r + 1 < t) {
        r += 2;
        continue;
      }
      r++;
    }
    return i;
  }
  let s = 0;
  for (; r < t && (n = u.charCodeAt(r), !(n === 32 || n < 32 || n === 127)); ) {
    if (n === 92 && r + 1 < t) {
      if (u.charCodeAt(r + 1) === 32)
        break;
      r += 2;
      continue;
    }
    if (n === 40 && (s++, s > 32))
      return i;
    if (n === 41) {
      if (s === 0)
        break;
      s--;
    }
    r++;
  }
  return e === r || s !== 0 || (i.str = K(u.slice(e, r)), i.pos = r, i.ok = !0), i;
}
function vt(u, e, t, n) {
  let r, i = e;
  const s = {
    // if `true`, this is a valid link title
    ok: !1,
    // if `true`, this link can be continued on the next line
    can_continue: !1,
    // if `ok`, it's the position of the first character after the closing marker
    pos: 0,
    // if `ok`, it's the unescaped title
    str: "",
    // expected closing marker character code
    marker: 0
  };
  if (n)
    s.str = n.str, s.marker = n.marker;
  else {
    if (i >= t)
      return s;
    let o = u.charCodeAt(i);
    if (o !== 34 && o !== 39 && o !== 40)
      return s;
    e++, i++, o === 40 && (o = 41), s.marker = o;
  }
  for (; i < t; ) {
    if (r = u.charCodeAt(i), r === s.marker)
      return s.pos = i + 1, s.str += K(u.slice(e, i)), s.ok = !0, s;
    if (r === 40 && s.marker === 41)
      return s;
    r === 92 && i + 1 < t && i++, i++;
  }
  return s.can_continue = !0, s.str += K(u.slice(e, i)), s;
}
const Tt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: Ft,
  parseLinkLabel: wt,
  parseLinkTitle: vt
}, Symbol.toStringTag, { value: "Module" })), O = {};
O.code_inline = function(u, e, t, n, r) {
  const i = u[e];
  return "<code" + r.renderAttrs(i) + ">" + W(i.content) + "</code>";
};
O.code_block = function(u, e, t, n, r) {
  const i = u[e];
  return "<pre" + r.renderAttrs(i) + "><code>" + W(u[e].content) + `</code></pre>
`;
};
O.fence = function(u, e, t, n, r) {
  const i = u[e], s = i.info ? K(i.info).trim() : "";
  let o = "", c = "";
  if (s) {
    const d = s.split(/(\s+)/g);
    o = d[0], c = d.slice(2).join("");
  }
  let a;
  if (t.highlight ? a = t.highlight(i.content, o, c) || W(i.content) : a = W(i.content), a.indexOf("<pre") === 0)
    return a + `
`;
  if (s) {
    const d = i.attrIndex("class"), f = i.attrs ? i.attrs.slice() : [];
    d < 0 ? f.push(["class", t.langPrefix + o]) : (f[d] = f[d].slice(), f[d][1] += " " + t.langPrefix + o);
    const m = {
      attrs: f
    };
    return `<pre><code${r.renderAttrs(m)}>${a}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${a}</code></pre>
`;
};
O.image = function(u, e, t, n, r) {
  const i = u[e];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, t, n), r.renderToken(u, e, t);
};
O.hardbreak = function(u, e, t) {
  return t.xhtmlOut ? `<br />
` : `<br>
`;
};
O.softbreak = function(u, e, t) {
  return t.breaks ? t.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
O.text = function(u, e) {
  return W(u[e].content);
};
O.html_block = function(u, e) {
  return u[e].content;
};
O.html_inline = function(u, e) {
  return u[e].content;
};
function X() {
  this.rules = fu({}, O);
}
X.prototype.renderAttrs = function(e) {
  let t, n, r;
  if (!e.attrs)
    return "";
  for (r = "", t = 0, n = e.attrs.length; t < n; t++)
    r += " " + W(e.attrs[t][0]) + '="' + W(e.attrs[t][1]) + '"';
  return r;
};
X.prototype.renderToken = function(e, t, n) {
  const r = e[t];
  let i = "";
  if (r.hidden)
    return "";
  r.block && r.nesting !== -1 && t && e[t - 1].hidden && (i += `
`), i += (r.nesting === -1 ? "</" : "<") + r.tag, i += this.renderAttrs(r), r.nesting === 0 && n.xhtmlOut && (i += " /");
  let s = !1;
  if (r.block && (s = !0, r.nesting === 1 && t + 1 < e.length)) {
    const o = e[t + 1];
    (o.type === "inline" || o.hidden || o.nesting === -1 && o.tag === r.tag) && (s = !1);
  }
  return i += s ? `>
` : ">", i;
};
X.prototype.renderInline = function(u, e, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, s = u.length; i < s; i++) {
    const o = u[i].type;
    typeof r[o] < "u" ? n += r[o](u, i, e, t, this) : n += this.renderToken(u, i, e);
  }
  return n;
};
X.prototype.renderInlineAsText = function(u, e, t) {
  let n = "";
  for (let r = 0, i = u.length; r < i; r++)
    switch (u[r].type) {
      case "text":
        n += u[r].content;
        break;
      case "image":
        n += this.renderInlineAsText(u[r].children, e, t);
        break;
      case "html_inline":
      case "html_block":
        n += u[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        n += `
`;
        break;
    }
  return n;
};
X.prototype.render = function(u, e, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, s = u.length; i < s; i++) {
    const o = u[i].type;
    o === "inline" ? n += this.renderInline(u[i].children, e, t) : typeof r[o] < "u" ? n += r[o](u, i, e, t, this) : n += this.renderToken(u, i, e, t);
  }
  return n;
};
function q() {
  this.__rules__ = [], this.__cache__ = null;
}
q.prototype.__find__ = function(u) {
  for (let e = 0; e < this.__rules__.length; e++)
    if (this.__rules__[e].name === u)
      return e;
  return -1;
};
q.prototype.__compile__ = function() {
  const u = this, e = [""];
  u.__rules__.forEach(function(t) {
    t.enabled && t.alt.forEach(function(n) {
      e.indexOf(n) < 0 && e.push(n);
    });
  }), u.__cache__ = {}, e.forEach(function(t) {
    u.__cache__[t] = [], u.__rules__.forEach(function(n) {
      n.enabled && (t && n.alt.indexOf(t) < 0 || u.__cache__[t].push(n.fn));
    });
  });
};
q.prototype.at = function(u, e, t) {
  const n = this.__find__(u), r = t || {};
  if (n === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__[n].fn = e, this.__rules__[n].alt = r.alt || [], this.__cache__ = null;
};
q.prototype.before = function(u, e, t, n) {
  const r = this.__find__(u), i = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__.splice(r, 0, {
    name: e,
    enabled: !0,
    fn: t,
    alt: i.alt || []
  }), this.__cache__ = null;
};
q.prototype.after = function(u, e, t, n) {
  const r = this.__find__(u), i = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__.splice(r + 1, 0, {
    name: e,
    enabled: !0,
    fn: t,
    alt: i.alt || []
  }), this.__cache__ = null;
};
q.prototype.push = function(u, e, t) {
  const n = t || {};
  this.__rules__.push({
    name: u,
    enabled: !0,
    fn: e,
    alt: n.alt || []
  }), this.__cache__ = null;
};
q.prototype.enable = function(u, e) {
  Array.isArray(u) || (u = [u]);
  const t = [];
  return u.forEach(function(n) {
    const r = this.__find__(n);
    if (r < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[r].enabled = !0, t.push(n);
  }, this), this.__cache__ = null, t;
};
q.prototype.enableOnly = function(u, e) {
  Array.isArray(u) || (u = [u]), this.__rules__.forEach(function(t) {
    t.enabled = !1;
  }), this.enable(u, e);
};
q.prototype.disable = function(u, e) {
  Array.isArray(u) || (u = [u]);
  const t = [];
  return u.forEach(function(n) {
    const r = this.__find__(n);
    if (r < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[r].enabled = !1, t.push(n);
  }, this), this.__cache__ = null, t;
};
q.prototype.getRules = function(u) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[u] || [];
};
function L(u, e, t) {
  this.type = u, this.tag = e, this.attrs = null, this.map = null, this.nesting = t, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
L.prototype.attrIndex = function(e) {
  if (!this.attrs)
    return -1;
  const t = this.attrs;
  for (let n = 0, r = t.length; n < r; n++)
    if (t[n][0] === e)
      return n;
  return -1;
};
L.prototype.attrPush = function(e) {
  this.attrs ? this.attrs.push(e) : this.attrs = [e];
};
L.prototype.attrSet = function(e, t) {
  const n = this.attrIndex(e), r = [e, t];
  n < 0 ? this.attrPush(r) : this.attrs[n] = r;
};
L.prototype.attrGet = function(e) {
  const t = this.attrIndex(e);
  let n = null;
  return t >= 0 && (n = this.attrs[t][1]), n;
};
L.prototype.attrJoin = function(e, t) {
  const n = this.attrIndex(e);
  n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = this.attrs[n][1] + " " + t;
};
function ae(u, e, t) {
  this.src = u, this.env = t, this.tokens = [], this.inlineMode = !1, this.md = e;
}
ae.prototype.Token = L;
const St = /\r\n?|\n/g, It = /\0/g;
function Mt(u) {
  let e;
  e = u.src.replace(St, `
`), e = e.replace(It, "�"), u.src = e;
}
function qt(u) {
  let e;
  u.inlineMode ? (e = new u.Token("inline", "", 0), e.content = u.src, e.map = [0, 1], e.children = [], u.tokens.push(e)) : u.md.block.parse(u.src, u.md, u.env, u.tokens);
}
function Bt(u) {
  const e = u.tokens;
  for (let t = 0, n = e.length; t < n; t++) {
    const r = e[t];
    r.type === "inline" && u.md.inline.parse(r.content, u.md, u.env, r.children);
  }
}
function zt(u) {
  return /^<a[>\s]/i.test(u);
}
function Lt(u) {
  return /^<\/a\s*>/i.test(u);
}
function Rt(u) {
  const e = u.tokens;
  if (u.md.options.linkify)
    for (let t = 0, n = e.length; t < n; t++) {
      if (e[t].type !== "inline" || !u.md.linkify.pretest(e[t].content))
        continue;
      let r = e[t].children, i = 0;
      for (let s = r.length - 1; s >= 0; s--) {
        const o = r[s];
        if (o.type === "link_close") {
          for (s--; r[s].level !== o.level && r[s].type !== "link_open"; )
            s--;
          continue;
        }
        if (o.type === "html_inline" && (zt(o.content) && i > 0 && i--, Lt(o.content) && i++), !(i > 0) && o.type === "text" && u.md.linkify.test(o.content)) {
          const c = o.content;
          let a = u.md.linkify.match(c);
          const d = [];
          let f = o.level, m = 0;
          a.length > 0 && a[0].index === 0 && s > 0 && r[s - 1].type === "text_special" && (a = a.slice(1));
          for (let b = 0; b < a.length; b++) {
            const h = a[b].url, k = u.md.normalizeLink(h);
            if (!u.md.validateLink(k))
              continue;
            let _ = a[b].text;
            a[b].schema ? a[b].schema === "mailto:" && !/^mailto:/i.test(_) ? _ = u.md.normalizeLinkText("mailto:" + _).replace(/^mailto:/, "") : _ = u.md.normalizeLinkText(_) : _ = u.md.normalizeLinkText("http://" + _).replace(/^http:\/\//, "");
            const E = a[b].index;
            if (E > m) {
              const p = new u.Token("text", "", 0);
              p.content = c.slice(m, E), p.level = f, d.push(p);
            }
            const x = new u.Token("link_open", "a", 1);
            x.attrs = [["href", k]], x.level = f++, x.markup = "linkify", x.info = "auto", d.push(x);
            const C = new u.Token("text", "", 0);
            C.content = _, C.level = f, d.push(C);
            const g = new u.Token("link_close", "a", -1);
            g.level = --f, g.markup = "linkify", g.info = "auto", d.push(g), m = a[b].lastIndex;
          }
          if (m < c.length) {
            const b = new u.Token("text", "", 0);
            b.content = c.slice(m), b.level = f, d.push(b);
          }
          e[t].children = r = oe(r, s, d);
        }
      }
    }
}
const le = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Pt = /\((c|tm|r)\)/i, Ot = /\((c|tm|r)\)/ig, Nt = {
  c: "©",
  r: "®",
  tm: "™"
};
function Ut(u, e) {
  return Nt[e.toLowerCase()];
}
function Ht(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && (n.content = n.content.replace(Ot, Ut)), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function Qt(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && le.test(n.content) && (n.content = n.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function jt(u) {
  let e;
  if (u.md.options.typographer)
    for (e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type === "inline" && (Pt.test(u.tokens[e].content) && Ht(u.tokens[e].children), le.test(u.tokens[e].content) && Qt(u.tokens[e].children));
}
const Wt = /['"]/, Hu = /['"]/g, Qu = "’";
function ou(u, e, t) {
  return u.slice(0, e) + t + u.slice(e + 1);
}
function Zt(u, e) {
  let t;
  const n = [];
  for (let r = 0; r < u.length; r++) {
    const i = u[r], s = u[r].level;
    for (t = n.length - 1; t >= 0 && !(n[t].level <= s); t--)
      ;
    if (n.length = t + 1, i.type !== "text")
      continue;
    let o = i.content, c = 0, a = o.length;
    u:
      for (; c < a; ) {
        Hu.lastIndex = c;
        const d = Hu.exec(o);
        if (!d)
          break;
        let f = !0, m = !0;
        c = d.index + 1;
        const b = d[0] === "'";
        let h = 32;
        if (d.index - 1 >= 0)
          h = o.charCodeAt(d.index - 1);
        else
          for (t = r - 1; t >= 0 && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t--)
            if (u[t].content) {
              h = u[t].content.charCodeAt(u[t].content.length - 1);
              break;
            }
        let k = 32;
        if (c < a)
          k = o.charCodeAt(c);
        else
          for (t = r + 1; t < u.length && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t++)
            if (u[t].content) {
              k = u[t].content.charCodeAt(0);
              break;
            }
        const _ = eu(h) || uu(String.fromCharCode(h)), E = eu(k) || uu(String.fromCharCode(k)), x = Y(h), C = Y(k);
        if (C ? f = !1 : E && (x || _ || (f = !1)), x ? m = !1 : _ && (C || E || (m = !1)), k === 34 && d[0] === '"' && h >= 48 && h <= 57 && (m = f = !1), f && m && (f = _, m = E), !f && !m) {
          b && (i.content = ou(i.content, d.index, Qu));
          continue;
        }
        if (m)
          for (t = n.length - 1; t >= 0; t--) {
            let g = n[t];
            if (n[t].level < s)
              break;
            if (g.single === b && n[t].level === s) {
              g = n[t];
              let p, y;
              b ? (p = e.md.options.quotes[2], y = e.md.options.quotes[3]) : (p = e.md.options.quotes[0], y = e.md.options.quotes[1]), i.content = ou(i.content, d.index, y), u[g.token].content = ou(
                u[g.token].content,
                g.pos,
                p
              ), c += y.length - 1, g.token === r && (c += p.length - 1), o = i.content, a = o.length, n.length = t;
              continue u;
            }
          }
        f ? n.push({
          token: r,
          pos: d.index,
          single: b,
          level: s
        }) : m && b && (i.content = ou(i.content, d.index, Qu));
      }
  }
}
function Vt(u) {
  if (u.md.options.typographer)
    for (let e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type !== "inline" || !Wt.test(u.tokens[e].content) || Zt(u.tokens[e].children, u);
}
function Gt(u) {
  let e, t;
  const n = u.tokens, r = n.length;
  for (let i = 0; i < r; i++) {
    if (n[i].type !== "inline") continue;
    const s = n[i].children, o = s.length;
    for (e = 0; e < o; e++)
      s[e].type === "text_special" && (s[e].type = "text");
    for (e = t = 0; e < o; e++)
      s[e].type === "text" && e + 1 < o && s[e + 1].type === "text" ? s[e + 1].content = s[e].content + s[e + 1].content : (e !== t && (s[t] = s[e]), t++);
    e !== t && (s.length = t);
  }
}
const mu = [
  ["normalize", Mt],
  ["block", qt],
  ["inline", Bt],
  ["linkify", Rt],
  ["replacements", jt],
  ["smartquotes", Vt],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", Gt]
];
function Iu() {
  this.ruler = new q();
  for (let u = 0; u < mu.length; u++)
    this.ruler.push(mu[u][0], mu[u][1]);
}
Iu.prototype.process = function(u) {
  const e = this.ruler.getRules("");
  for (let t = 0, n = e.length; t < n; t++)
    e[t](u);
};
Iu.prototype.State = ae;
function N(u, e, t, n) {
  this.src = u, this.md = e, this.env = t, this.tokens = n, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const r = this.src;
  for (let i = 0, s = 0, o = 0, c = 0, a = r.length, d = !1; s < a; s++) {
    const f = r.charCodeAt(s);
    if (!d)
      if (F(f)) {
        o++, f === 9 ? c += 4 - c % 4 : c++;
        continue;
      } else
        d = !0;
    (f === 10 || s === a - 1) && (f !== 10 && s++, this.bMarks.push(i), this.eMarks.push(s), this.tShift.push(o), this.sCount.push(c), this.bsCount.push(0), d = !1, o = 0, c = 0, i = s + 1);
  }
  this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
N.prototype.push = function(u, e, t) {
  const n = new L(u, e, t);
  return n.block = !0, t < 0 && this.level--, n.level = this.level, t > 0 && this.level++, this.tokens.push(n), n;
};
N.prototype.isEmpty = function(e) {
  return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
};
N.prototype.skipEmptyLines = function(e) {
  for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++)
    ;
  return e;
};
N.prototype.skipSpaces = function(e) {
  for (let t = this.src.length; e < t; e++) {
    const n = this.src.charCodeAt(e);
    if (!F(n))
      break;
  }
  return e;
};
N.prototype.skipSpacesBack = function(e, t) {
  if (e <= t)
    return e;
  for (; e > t; )
    if (!F(this.src.charCodeAt(--e)))
      return e + 1;
  return e;
};
N.prototype.skipChars = function(e, t) {
  for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++)
    ;
  return e;
};
N.prototype.skipCharsBack = function(e, t, n) {
  if (e <= n)
    return e;
  for (; e > n; )
    if (t !== this.src.charCodeAt(--e))
      return e + 1;
  return e;
};
N.prototype.getLines = function(e, t, n, r) {
  if (e >= t)
    return "";
  const i = new Array(t - e);
  for (let s = 0, o = e; o < t; o++, s++) {
    let c = 0;
    const a = this.bMarks[o];
    let d = a, f;
    for (o + 1 < t || r ? f = this.eMarks[o] + 1 : f = this.eMarks[o]; d < f && c < n; ) {
      const m = this.src.charCodeAt(d);
      if (F(m))
        m === 9 ? c += 4 - (c + this.bsCount[o]) % 4 : c++;
      else if (d - a < this.tShift[o])
        c++;
      else
        break;
      d++;
    }
    c > n ? i[s] = new Array(c - n + 1).join(" ") + this.src.slice(d, f) : i[s] = this.src.slice(d, f);
  }
  return i.join("");
};
N.prototype.Token = L;
const Jt = 65536;
function _u(u, e) {
  const t = u.bMarks[e] + u.tShift[e], n = u.eMarks[e];
  return u.src.slice(t, n);
}
function ju(u) {
  const e = [], t = u.length;
  let n = 0, r = u.charCodeAt(n), i = !1, s = 0, o = "";
  for (; n < t; )
    r === 124 && (i ? (o += u.substring(s, n - 1), s = n) : (e.push(o + u.substring(s, n)), o = "", s = n + 1)), i = r === 92, n++, r = u.charCodeAt(n);
  return e.push(o + u.substring(s)), e;
}
function $t(u, e, t, n) {
  if (e + 2 > t)
    return !1;
  let r = e + 1;
  if (u.sCount[r] < u.blkIndent || u.sCount[r] - u.blkIndent >= 4)
    return !1;
  let i = u.bMarks[r] + u.tShift[r];
  if (i >= u.eMarks[r])
    return !1;
  const s = u.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 || i >= u.eMarks[r])
    return !1;
  const o = u.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 && !F(o) || s === 45 && F(o))
    return !1;
  for (; i < u.eMarks[r]; ) {
    const g = u.src.charCodeAt(i);
    if (g !== 124 && g !== 45 && g !== 58 && !F(g))
      return !1;
    i++;
  }
  let c = _u(u, e + 1), a = c.split("|");
  const d = [];
  for (let g = 0; g < a.length; g++) {
    const p = a[g].trim();
    if (!p) {
      if (g === 0 || g === a.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(p))
      return !1;
    p.charCodeAt(p.length - 1) === 58 ? d.push(p.charCodeAt(0) === 58 ? "center" : "right") : p.charCodeAt(0) === 58 ? d.push("left") : d.push("");
  }
  if (c = _u(u, e).trim(), c.indexOf("|") === -1 || u.sCount[e] - u.blkIndent >= 4)
    return !1;
  a = ju(c), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop();
  const f = a.length;
  if (f === 0 || f !== d.length)
    return !1;
  if (n)
    return !0;
  const m = u.parentType;
  u.parentType = "table";
  const b = u.md.block.ruler.getRules("blockquote"), h = u.push("table_open", "table", 1), k = [e, 0];
  h.map = k;
  const _ = u.push("thead_open", "thead", 1);
  _.map = [e, e + 1];
  const E = u.push("tr_open", "tr", 1);
  E.map = [e, e + 1];
  for (let g = 0; g < a.length; g++) {
    const p = u.push("th_open", "th", 1);
    d[g] && (p.attrs = [["style", "text-align:" + d[g]]]);
    const y = u.push("inline", "", 0);
    y.content = a[g].trim(), y.children = [], u.push("th_close", "th", -1);
  }
  u.push("tr_close", "tr", -1), u.push("thead_close", "thead", -1);
  let x, C = 0;
  for (r = e + 2; r < t && !(u.sCount[r] < u.blkIndent); r++) {
    let g = !1;
    for (let y = 0, D = b.length; y < D; y++)
      if (b[y](u, r, t, !0)) {
        g = !0;
        break;
      }
    if (g || (c = _u(u, r).trim(), !c) || u.sCount[r] - u.blkIndent >= 4 || (a = ju(c), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop(), C += f - a.length, C > Jt))
      break;
    if (r === e + 2) {
      const y = u.push("tbody_open", "tbody", 1);
      y.map = x = [e + 2, 0];
    }
    const p = u.push("tr_open", "tr", 1);
    p.map = [r, r + 1];
    for (let y = 0; y < f; y++) {
      const D = u.push("td_open", "td", 1);
      d[y] && (D.attrs = [["style", "text-align:" + d[y]]]);
      const A = u.push("inline", "", 0);
      A.content = a[y] ? a[y].trim() : "", A.children = [], u.push("td_close", "td", -1);
    }
    u.push("tr_close", "tr", -1);
  }
  return x && (u.push("tbody_close", "tbody", -1), x[1] = r), u.push("table_close", "table", -1), k[1] = r, u.parentType = m, u.line = r, !0;
}
function Kt(u, e, t) {
  if (u.sCount[e] - u.blkIndent < 4)
    return !1;
  let n = e + 1, r = n;
  for (; n < t; ) {
    if (u.isEmpty(n)) {
      n++;
      continue;
    }
    if (u.sCount[n] - u.blkIndent >= 4) {
      n++, r = n;
      continue;
    }
    break;
  }
  u.line = r;
  const i = u.push("code_block", "code", 0);
  return i.content = u.getLines(e, r, 4 + u.blkIndent, !1) + `
`, i.map = [e, u.line], !0;
}
function Xt(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || r + 3 > i)
    return !1;
  const s = u.src.charCodeAt(r);
  if (s !== 126 && s !== 96)
    return !1;
  let o = r;
  r = u.skipChars(r, s);
  let c = r - o;
  if (c < 3)
    return !1;
  const a = u.src.slice(o, r), d = u.src.slice(r, i);
  if (s === 96 && d.indexOf(String.fromCharCode(s)) >= 0)
    return !1;
  if (n)
    return !0;
  let f = e, m = !1;
  for (; f++, !(f >= t || (r = o = u.bMarks[f] + u.tShift[f], i = u.eMarks[f], r < i && u.sCount[f] < u.blkIndent)); )
    if (u.src.charCodeAt(r) === s && !(u.sCount[f] - u.blkIndent >= 4) && (r = u.skipChars(r, s), !(r - o < c) && (r = u.skipSpaces(r), !(r < i)))) {
      m = !0;
      break;
    }
  c = u.sCount[e], u.line = f + (m ? 1 : 0);
  const b = u.push("fence", "code", 0);
  return b.info = d, b.content = u.getLines(e + 1, f, c, !0), b.markup = a, b.map = [e, u.line], !0;
}
function Yt(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  const s = u.lineMax;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(r) !== 62)
    return !1;
  if (n)
    return !0;
  const o = [], c = [], a = [], d = [], f = u.md.block.ruler.getRules("blockquote"), m = u.parentType;
  u.parentType = "blockquote";
  let b = !1, h;
  for (h = e; h < t; h++) {
    const C = u.sCount[h] < u.blkIndent;
    if (r = u.bMarks[h] + u.tShift[h], i = u.eMarks[h], r >= i)
      break;
    if (u.src.charCodeAt(r++) === 62 && !C) {
      let p = u.sCount[h] + 1, y, D;
      u.src.charCodeAt(r) === 32 ? (r++, p++, D = !1, y = !0) : u.src.charCodeAt(r) === 9 ? (y = !0, (u.bsCount[h] + p) % 4 === 3 ? (r++, p++, D = !1) : D = !0) : y = !1;
      let A = p;
      for (o.push(u.bMarks[h]), u.bMarks[h] = r; r < i; ) {
        const v = u.src.charCodeAt(r);
        if (F(v))
          v === 9 ? A += 4 - (A + u.bsCount[h] + (D ? 1 : 0)) % 4 : A++;
        else
          break;
        r++;
      }
      b = r >= i, c.push(u.bsCount[h]), u.bsCount[h] = u.sCount[h] + 1 + (y ? 1 : 0), a.push(u.sCount[h]), u.sCount[h] = A - p, d.push(u.tShift[h]), u.tShift[h] = r - u.bMarks[h];
      continue;
    }
    if (b)
      break;
    let g = !1;
    for (let p = 0, y = f.length; p < y; p++)
      if (f[p](u, h, t, !0)) {
        g = !0;
        break;
      }
    if (g) {
      u.lineMax = h, u.blkIndent !== 0 && (o.push(u.bMarks[h]), c.push(u.bsCount[h]), d.push(u.tShift[h]), a.push(u.sCount[h]), u.sCount[h] -= u.blkIndent);
      break;
    }
    o.push(u.bMarks[h]), c.push(u.bsCount[h]), d.push(u.tShift[h]), a.push(u.sCount[h]), u.sCount[h] = -1;
  }
  const k = u.blkIndent;
  u.blkIndent = 0;
  const _ = u.push("blockquote_open", "blockquote", 1);
  _.markup = ">";
  const E = [e, 0];
  _.map = E, u.md.block.tokenize(u, e, h);
  const x = u.push("blockquote_close", "blockquote", -1);
  x.markup = ">", u.lineMax = s, u.parentType = m, E[1] = u.line;
  for (let C = 0; C < d.length; C++)
    u.bMarks[C + e] = o[C], u.tShift[C + e] = d[C], u.sCount[C + e] = a[C], u.bsCount[C + e] = c[C];
  return u.blkIndent = k, !0;
}
function u0(u, e, t, n) {
  const r = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let i = u.bMarks[e] + u.tShift[e];
  const s = u.src.charCodeAt(i++);
  if (s !== 42 && s !== 45 && s !== 95)
    return !1;
  let o = 1;
  for (; i < r; ) {
    const a = u.src.charCodeAt(i++);
    if (a !== s && !F(a))
      return !1;
    a === s && o++;
  }
  if (o < 3)
    return !1;
  if (n)
    return !0;
  u.line = e + 1;
  const c = u.push("hr", "hr", 0);
  return c.map = [e, u.line], c.markup = Array(o + 1).join(String.fromCharCode(s)), !0;
}
function Wu(u, e) {
  const t = u.eMarks[e];
  let n = u.bMarks[e] + u.tShift[e];
  const r = u.src.charCodeAt(n++);
  if (r !== 42 && r !== 45 && r !== 43)
    return -1;
  if (n < t) {
    const i = u.src.charCodeAt(n);
    if (!F(i))
      return -1;
  }
  return n;
}
function Zu(u, e) {
  const t = u.bMarks[e] + u.tShift[e], n = u.eMarks[e];
  let r = t;
  if (r + 1 >= n)
    return -1;
  let i = u.src.charCodeAt(r++);
  if (i < 48 || i > 57)
    return -1;
  for (; ; ) {
    if (r >= n)
      return -1;
    if (i = u.src.charCodeAt(r++), i >= 48 && i <= 57) {
      if (r - t >= 10)
        return -1;
      continue;
    }
    if (i === 41 || i === 46)
      break;
    return -1;
  }
  return r < n && (i = u.src.charCodeAt(r), !F(i)) ? -1 : r;
}
function e0(u, e) {
  const t = u.level + 2;
  for (let n = e + 2, r = u.tokens.length - 2; n < r; n++)
    u.tokens[n].level === t && u.tokens[n].type === "paragraph_open" && (u.tokens[n + 2].hidden = !0, u.tokens[n].hidden = !0, n += 2);
}
function t0(u, e, t, n) {
  let r, i, s, o, c = e, a = !0;
  if (u.sCount[c] - u.blkIndent >= 4 || u.listIndent >= 0 && u.sCount[c] - u.listIndent >= 4 && u.sCount[c] < u.blkIndent)
    return !1;
  let d = !1;
  n && u.parentType === "paragraph" && u.sCount[c] >= u.blkIndent && (d = !0);
  let f, m, b;
  if ((b = Zu(u, c)) >= 0) {
    if (f = !0, s = u.bMarks[c] + u.tShift[c], m = Number(u.src.slice(s, b - 1)), d && m !== 1) return !1;
  } else if ((b = Wu(u, c)) >= 0)
    f = !1;
  else
    return !1;
  if (d && u.skipSpaces(b) >= u.eMarks[c])
    return !1;
  if (n)
    return !0;
  const h = u.src.charCodeAt(b - 1), k = u.tokens.length;
  f ? (o = u.push("ordered_list_open", "ol", 1), m !== 1 && (o.attrs = [["start", m]])) : o = u.push("bullet_list_open", "ul", 1);
  const _ = [c, 0];
  o.map = _, o.markup = String.fromCharCode(h);
  let E = !1;
  const x = u.md.block.ruler.getRules("list"), C = u.parentType;
  for (u.parentType = "list"; c < t; ) {
    i = b, r = u.eMarks[c];
    const g = u.sCount[c] + b - (u.bMarks[c] + u.tShift[c]);
    let p = g;
    for (; i < r; ) {
      const M = u.src.charCodeAt(i);
      if (M === 9)
        p += 4 - (p + u.bsCount[c]) % 4;
      else if (M === 32)
        p++;
      else
        break;
      i++;
    }
    const y = i;
    let D;
    y >= r ? D = 1 : D = p - g, D > 4 && (D = 1);
    const A = g + D;
    o = u.push("list_item_open", "li", 1), o.markup = String.fromCharCode(h);
    const v = [c, 0];
    o.map = v, f && (o.info = u.src.slice(s, b - 1));
    const w = u.tight, T = u.tShift[c], U = u.sCount[c], Z = u.listIndent;
    if (u.listIndent = u.blkIndent, u.blkIndent = A, u.tight = !0, u.tShift[c] = y - u.bMarks[c], u.sCount[c] = p, y >= r && u.isEmpty(c + 1) ? u.line = Math.min(u.line + 2, t) : u.md.block.tokenize(u, c, t, !0), (!u.tight || E) && (a = !1), E = u.line - c > 1 && u.isEmpty(u.line - 1), u.blkIndent = u.listIndent, u.listIndent = Z, u.tShift[c] = T, u.sCount[c] = U, u.tight = w, o = u.push("list_item_close", "li", -1), o.markup = String.fromCharCode(h), c = u.line, v[1] = c, c >= t || u.sCount[c] < u.blkIndent || u.sCount[c] - u.blkIndent >= 4)
      break;
    let su = !1;
    for (let M = 0, V = x.length; M < V; M++)
      if (x[M](u, c, t, !0)) {
        su = !0;
        break;
      }
    if (su)
      break;
    if (f) {
      if (b = Zu(u, c), b < 0)
        break;
      s = u.bMarks[c] + u.tShift[c];
    } else if (b = Wu(u, c), b < 0)
      break;
    if (h !== u.src.charCodeAt(b - 1))
      break;
  }
  return f ? o = u.push("ordered_list_close", "ol", -1) : o = u.push("bullet_list_close", "ul", -1), o.markup = String.fromCharCode(h), _[1] = c, u.line = c, u.parentType = C, a && e0(u, k), !0;
}
function n0(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e], s = e + 1;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(r) !== 91)
    return !1;
  function o(x) {
    const C = u.lineMax;
    if (x >= C || u.isEmpty(x))
      return null;
    let g = !1;
    if (u.sCount[x] - u.blkIndent > 3 && (g = !0), u.sCount[x] < 0 && (g = !0), !g) {
      const D = u.md.block.ruler.getRules("reference"), A = u.parentType;
      u.parentType = "reference";
      let v = !1;
      for (let w = 0, T = D.length; w < T; w++)
        if (D[w](u, x, C, !0)) {
          v = !0;
          break;
        }
      if (u.parentType = A, v)
        return null;
    }
    const p = u.bMarks[x] + u.tShift[x], y = u.eMarks[x];
    return u.src.slice(p, y + 1);
  }
  let c = u.src.slice(r, i + 1);
  i = c.length;
  let a = -1;
  for (r = 1; r < i; r++) {
    const x = c.charCodeAt(r);
    if (x === 91)
      return !1;
    if (x === 93) {
      a = r;
      break;
    } else if (x === 10) {
      const C = o(s);
      C !== null && (c += C, i = c.length, s++);
    } else if (x === 92 && (r++, r < i && c.charCodeAt(r) === 10)) {
      const C = o(s);
      C !== null && (c += C, i = c.length, s++);
    }
  }
  if (a < 0 || c.charCodeAt(a + 1) !== 58)
    return !1;
  for (r = a + 2; r < i; r++) {
    const x = c.charCodeAt(r);
    if (x === 10) {
      const C = o(s);
      C !== null && (c += C, i = c.length, s++);
    } else if (!F(x)) break;
  }
  const d = u.md.helpers.parseLinkDestination(c, r, i);
  if (!d.ok)
    return !1;
  const f = u.md.normalizeLink(d.str);
  if (!u.md.validateLink(f))
    return !1;
  r = d.pos;
  const m = r, b = s, h = r;
  for (; r < i; r++) {
    const x = c.charCodeAt(r);
    if (x === 10) {
      const C = o(s);
      C !== null && (c += C, i = c.length, s++);
    } else if (!F(x)) break;
  }
  let k = u.md.helpers.parseLinkTitle(c, r, i);
  for (; k.can_continue; ) {
    const x = o(s);
    if (x === null) break;
    c += x, r = i, i = c.length, s++, k = u.md.helpers.parseLinkTitle(c, r, i, k);
  }
  let _;
  for (r < i && h !== r && k.ok ? (_ = k.str, r = k.pos) : (_ = "", r = m, s = b); r < i; ) {
    const x = c.charCodeAt(r);
    if (!F(x))
      break;
    r++;
  }
  if (r < i && c.charCodeAt(r) !== 10 && _)
    for (_ = "", r = m, s = b; r < i; ) {
      const x = c.charCodeAt(r);
      if (!F(x))
        break;
      r++;
    }
  if (r < i && c.charCodeAt(r) !== 10)
    return !1;
  const E = hu(c.slice(1, a));
  return E ? (n || (typeof u.env.references > "u" && (u.env.references = {}), typeof u.env.references[E] > "u" && (u.env.references[E] = { title: _, href: f }), u.line = s), !0) : !1;
}
const r0 = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
], i0 = "[a-zA-Z_:][a-zA-Z0-9:._-]*", s0 = "[^\"'=<>`\\x00-\\x20]+", o0 = "'[^']*'", c0 = '"[^"]*"', a0 = "(?:" + s0 + "|" + o0 + "|" + c0 + ")", l0 = "(?:\\s+" + i0 + "(?:\\s*=\\s*" + a0 + ")?)", de = "<[A-Za-z][A-Za-z0-9\\-]*" + l0 + "*\\s*\\/?>", fe = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", d0 = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", f0 = "<[?][\\s\\S]*?[?]>", h0 = "<![A-Za-z][^>]*>", b0 = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", p0 = new RegExp("^(?:" + de + "|" + fe + "|" + d0 + "|" + f0 + "|" + h0 + "|" + b0 + ")"), g0 = new RegExp("^(?:" + de + "|" + fe + ")"), G = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + r0.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(g0.source + "\\s*$"), /^$/, !1]
];
function m0(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || !u.md.options.html || u.src.charCodeAt(r) !== 60)
    return !1;
  let s = u.src.slice(r, i), o = 0;
  for (; o < G.length && !G[o][0].test(s); o++)
    ;
  if (o === G.length)
    return !1;
  if (n)
    return G[o][2];
  let c = e + 1;
  if (!G[o][1].test(s)) {
    for (; c < t && !(u.sCount[c] < u.blkIndent); c++)
      if (r = u.bMarks[c] + u.tShift[c], i = u.eMarks[c], s = u.src.slice(r, i), G[o][1].test(s)) {
        s.length !== 0 && c++;
        break;
      }
  }
  u.line = c;
  const a = u.push("html_block", "", 0);
  return a.map = [e, c], a.content = u.getLines(e, c, u.blkIndent, !0), !0;
}
function _0(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let s = u.src.charCodeAt(r);
  if (s !== 35 || r >= i)
    return !1;
  let o = 1;
  for (s = u.src.charCodeAt(++r); s === 35 && r < i && o <= 6; )
    o++, s = u.src.charCodeAt(++r);
  if (o > 6 || r < i && !F(s))
    return !1;
  if (n)
    return !0;
  i = u.skipSpacesBack(i, r);
  const c = u.skipCharsBack(i, 35, r);
  c > r && F(u.src.charCodeAt(c - 1)) && (i = c), u.line = e + 1;
  const a = u.push("heading_open", "h" + String(o), 1);
  a.markup = "########".slice(0, o), a.map = [e, u.line];
  const d = u.push("inline", "", 0);
  d.content = u.src.slice(r, i).trim(), d.map = [e, u.line], d.children = [];
  const f = u.push("heading_close", "h" + String(o), -1);
  return f.markup = "########".slice(0, o), !0;
}
function x0(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph");
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  const r = u.parentType;
  u.parentType = "paragraph";
  let i = 0, s, o = e + 1;
  for (; o < t && !u.isEmpty(o); o++) {
    if (u.sCount[o] - u.blkIndent > 3)
      continue;
    if (u.sCount[o] >= u.blkIndent) {
      let b = u.bMarks[o] + u.tShift[o];
      const h = u.eMarks[o];
      if (b < h && (s = u.src.charCodeAt(b), (s === 45 || s === 61) && (b = u.skipChars(b, s), b = u.skipSpaces(b), b >= h))) {
        i = s === 61 ? 1 : 2;
        break;
      }
    }
    if (u.sCount[o] < 0)
      continue;
    let m = !1;
    for (let b = 0, h = n.length; b < h; b++)
      if (n[b](u, o, t, !0)) {
        m = !0;
        break;
      }
    if (m)
      break;
  }
  if (!i)
    return !1;
  const c = u.getLines(e, o, u.blkIndent, !1).trim();
  u.line = o + 1;
  const a = u.push("heading_open", "h" + String(i), 1);
  a.markup = String.fromCharCode(s), a.map = [e, u.line];
  const d = u.push("inline", "", 0);
  d.content = c, d.map = [e, u.line - 1], d.children = [];
  const f = u.push("heading_close", "h" + String(i), -1);
  return f.markup = String.fromCharCode(s), u.parentType = r, !0;
}
function k0(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph"), r = u.parentType;
  let i = e + 1;
  for (u.parentType = "paragraph"; i < t && !u.isEmpty(i); i++) {
    if (u.sCount[i] - u.blkIndent > 3 || u.sCount[i] < 0)
      continue;
    let a = !1;
    for (let d = 0, f = n.length; d < f; d++)
      if (n[d](u, i, t, !0)) {
        a = !0;
        break;
      }
    if (a)
      break;
  }
  const s = u.getLines(e, i, u.blkIndent, !1).trim();
  u.line = i;
  const o = u.push("paragraph_open", "p", 1);
  o.map = [e, u.line];
  const c = u.push("inline", "", 0);
  return c.content = s, c.map = [e, u.line], c.children = [], u.push("paragraph_close", "p", -1), u.parentType = r, !0;
}
const cu = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", $t, ["paragraph", "reference"]],
  ["code", Kt],
  ["fence", Xt, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", Yt, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", u0, ["paragraph", "reference", "blockquote", "list"]],
  ["list", t0, ["paragraph", "reference", "blockquote"]],
  ["reference", n0],
  ["html_block", m0, ["paragraph", "reference", "blockquote"]],
  ["heading", _0, ["paragraph", "reference", "blockquote"]],
  ["lheading", x0],
  ["paragraph", k0]
];
function bu() {
  this.ruler = new q();
  for (let u = 0; u < cu.length; u++)
    this.ruler.push(cu[u][0], cu[u][1], { alt: (cu[u][2] || []).slice() });
}
bu.prototype.tokenize = function(u, e, t) {
  const n = this.ruler.getRules(""), r = n.length, i = u.md.options.maxNesting;
  let s = e, o = !1;
  for (; s < t && (u.line = s = u.skipEmptyLines(s), !(s >= t || u.sCount[s] < u.blkIndent)); ) {
    if (u.level >= i) {
      u.line = t;
      break;
    }
    const c = u.line;
    let a = !1;
    for (let d = 0; d < r; d++)
      if (a = n[d](u, s, t, !1), a) {
        if (c >= u.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!a) throw new Error("none of the block rules matched");
    u.tight = !o, u.isEmpty(u.line - 1) && (o = !0), s = u.line, s < t && u.isEmpty(s) && (o = !0, s++, u.line = s);
  }
};
bu.prototype.parse = function(u, e, t, n) {
  if (!u)
    return;
  const r = new this.State(u, e, t, n);
  this.tokenize(r, r.line, r.lineMax);
};
bu.prototype.State = N;
function ru(u, e, t, n) {
  this.src = u, this.env = t, this.md = e, this.tokens = n, this.tokens_meta = Array(n.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
ru.prototype.pushPending = function() {
  const u = new L("text", "", 0);
  return u.content = this.pending, u.level = this.pendingLevel, this.tokens.push(u), this.pending = "", u;
};
ru.prototype.push = function(u, e, t) {
  this.pending && this.pushPending();
  const n = new L(u, e, t);
  let r = null;
  return t < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, t > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(r), n;
};
ru.prototype.scanDelims = function(u, e) {
  const t = this.posMax, n = this.src.charCodeAt(u), r = u > 0 ? this.src.charCodeAt(u - 1) : 32;
  let i = u;
  for (; i < t && this.src.charCodeAt(i) === n; )
    i++;
  const s = i - u, o = i < t ? this.src.charCodeAt(i) : 32, c = eu(r) || uu(String.fromCharCode(r)), a = eu(o) || uu(String.fromCharCode(o)), d = Y(r), f = Y(o), m = !f && (!a || d || c), b = !d && (!c || f || a);
  return { can_open: m && (e || !b || c), can_close: b && (e || !m || a), length: s };
};
ru.prototype.Token = L;
function y0(u) {
  switch (u) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function C0(u, e) {
  let t = u.pos;
  for (; t < u.posMax && !y0(u.src.charCodeAt(t)); )
    t++;
  return t === u.pos ? !1 : (e || (u.pending += u.src.slice(u.pos, t)), u.pos = t, !0);
}
const E0 = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function D0(u, e) {
  if (!u.md.options.linkify || u.linkLevel > 0) return !1;
  const t = u.pos, n = u.posMax;
  if (t + 3 > n || u.src.charCodeAt(t) !== 58 || u.src.charCodeAt(t + 1) !== 47 || u.src.charCodeAt(t + 2) !== 47) return !1;
  const r = u.pending.match(E0);
  if (!r) return !1;
  const i = r[1], s = u.md.linkify.matchAtStart(u.src.slice(t - i.length));
  if (!s) return !1;
  let o = s.url;
  if (o.length <= i.length) return !1;
  let c = o.length;
  for (; c > 0 && o.charCodeAt(c - 1) === 42; )
    c--;
  c !== o.length && (o = o.slice(0, c));
  const a = u.md.normalizeLink(o);
  if (!u.md.validateLink(a)) return !1;
  if (!e) {
    u.pending = u.pending.slice(0, -i.length);
    const d = u.push("link_open", "a", 1);
    d.attrs = [["href", a]], d.markup = "linkify", d.info = "auto";
    const f = u.push("text", "", 0);
    f.content = u.md.normalizeLinkText(o);
    const m = u.push("link_close", "a", -1);
    m.markup = "linkify", m.info = "auto";
  }
  return u.pos += o.length - i.length, !0;
}
function A0(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 10)
    return !1;
  const n = u.pending.length - 1, r = u.posMax;
  if (!e)
    if (n >= 0 && u.pending.charCodeAt(n) === 32)
      if (n >= 1 && u.pending.charCodeAt(n - 1) === 32) {
        let i = n - 1;
        for (; i >= 1 && u.pending.charCodeAt(i - 1) === 32; ) i--;
        u.pending = u.pending.slice(0, i), u.push("hardbreak", "br", 0);
      } else
        u.pending = u.pending.slice(0, -1), u.push("softbreak", "br", 0);
    else
      u.push("softbreak", "br", 0);
  for (t++; t < r && F(u.src.charCodeAt(t)); )
    t++;
  return u.pos = t, !0;
}
const Mu = [];
for (let u = 0; u < 256; u++)
  Mu.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(u) {
  Mu[u.charCodeAt(0)] = 1;
});
function w0(u, e) {
  let t = u.pos;
  const n = u.posMax;
  if (u.src.charCodeAt(t) !== 92 || (t++, t >= n)) return !1;
  let r = u.src.charCodeAt(t);
  if (r === 10) {
    for (e || u.push("hardbreak", "br", 0), t++; t < n && (r = u.src.charCodeAt(t), !!F(r)); )
      t++;
    return u.pos = t, !0;
  }
  let i = u.src[t];
  if (r >= 55296 && r <= 56319 && t + 1 < n) {
    const o = u.src.charCodeAt(t + 1);
    o >= 56320 && o <= 57343 && (i += u.src[t + 1], t++);
  }
  const s = "\\" + i;
  if (!e) {
    const o = u.push("text_special", "", 0);
    r < 256 && Mu[r] !== 0 ? o.content = i : o.content = s, o.markup = s, o.info = "escape";
  }
  return u.pos = t + 1, !0;
}
function F0(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 96)
    return !1;
  const r = t;
  t++;
  const i = u.posMax;
  for (; t < i && u.src.charCodeAt(t) === 96; )
    t++;
  const s = u.src.slice(r, t), o = s.length;
  if (u.backticksScanned && (u.backticks[o] || 0) <= r)
    return e || (u.pending += s), u.pos += o, !0;
  let c = t, a;
  for (; (a = u.src.indexOf("`", c)) !== -1; ) {
    for (c = a + 1; c < i && u.src.charCodeAt(c) === 96; )
      c++;
    const d = c - a;
    if (d === o) {
      if (!e) {
        const f = u.push("code_inline", "code", 0);
        f.markup = s, f.content = u.src.slice(t, a).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return u.pos = c, !0;
    }
    u.backticks[d] = a;
  }
  return u.backticksScanned = !0, e || (u.pending += s), u.pos += o, !0;
}
function v0(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 126)
    return !1;
  const r = u.scanDelims(u.pos, !0);
  let i = r.length;
  const s = String.fromCharCode(n);
  if (i < 2)
    return !1;
  let o;
  i % 2 && (o = u.push("text", "", 0), o.content = s, i--);
  for (let c = 0; c < i; c += 2)
    o = u.push("text", "", 0), o.content = s + s, u.delimiters.push({
      marker: n,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: u.tokens.length - 1,
      end: -1,
      open: r.can_open,
      close: r.can_close
    });
  return u.pos += r.length, !0;
}
function Vu(u, e) {
  let t;
  const n = [], r = e.length;
  for (let i = 0; i < r; i++) {
    const s = e[i];
    if (s.marker !== 126 || s.end === -1)
      continue;
    const o = e[s.end];
    t = u.tokens[s.token], t.type = "s_open", t.tag = "s", t.nesting = 1, t.markup = "~~", t.content = "", t = u.tokens[o.token], t.type = "s_close", t.tag = "s", t.nesting = -1, t.markup = "~~", t.content = "", u.tokens[o.token - 1].type === "text" && u.tokens[o.token - 1].content === "~" && n.push(o.token - 1);
  }
  for (; n.length; ) {
    const i = n.pop();
    let s = i + 1;
    for (; s < u.tokens.length && u.tokens[s].type === "s_close"; )
      s++;
    s--, i !== s && (t = u.tokens[s], u.tokens[s] = u.tokens[i], u.tokens[i] = t);
  }
}
function T0(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Vu(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Vu(u, e[n].delimiters);
}
const he = {
  tokenize: v0,
  postProcess: T0
};
function S0(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 95 && n !== 42)
    return !1;
  const r = u.scanDelims(u.pos, n === 42);
  for (let i = 0; i < r.length; i++) {
    const s = u.push("text", "", 0);
    s.content = String.fromCharCode(n), u.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: n,
      // Total length of these series of delimiters.
      //
      length: r.length,
      // A position of the token this delimiter corresponds to.
      //
      token: u.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: r.can_open,
      close: r.can_close
    });
  }
  return u.pos += r.length, !0;
}
function Gu(u, e) {
  const t = e.length;
  for (let n = t - 1; n >= 0; n--) {
    const r = e[n];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1)
      continue;
    const i = e[r.end], s = n > 0 && e[n - 1].end === r.end + 1 && // check that first two markers match and adjacent
    e[n - 1].marker === r.marker && e[n - 1].token === r.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    e[r.end + 1].token === i.token + 1, o = String.fromCharCode(r.marker), c = u.tokens[r.token];
    c.type = s ? "strong_open" : "em_open", c.tag = s ? "strong" : "em", c.nesting = 1, c.markup = s ? o + o : o, c.content = "";
    const a = u.tokens[i.token];
    a.type = s ? "strong_close" : "em_close", a.tag = s ? "strong" : "em", a.nesting = -1, a.markup = s ? o + o : o, a.content = "", s && (u.tokens[e[n - 1].token].content = "", u.tokens[e[r.end + 1].token].content = "", n--);
  }
}
function I0(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Gu(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Gu(u, e[n].delimiters);
}
const be = {
  tokenize: S0,
  postProcess: I0
};
function M0(u, e) {
  let t, n, r, i, s = "", o = "", c = u.pos, a = !0;
  if (u.src.charCodeAt(u.pos) !== 91)
    return !1;
  const d = u.pos, f = u.posMax, m = u.pos + 1, b = u.md.helpers.parseLinkLabel(u, u.pos, !0);
  if (b < 0)
    return !1;
  let h = b + 1;
  if (h < f && u.src.charCodeAt(h) === 40) {
    for (a = !1, h++; h < f && (t = u.src.charCodeAt(h), !(!F(t) && t !== 10)); h++)
      ;
    if (h >= f)
      return !1;
    if (c = h, r = u.md.helpers.parseLinkDestination(u.src, h, u.posMax), r.ok) {
      for (s = u.md.normalizeLink(r.str), u.md.validateLink(s) ? h = r.pos : s = "", c = h; h < f && (t = u.src.charCodeAt(h), !(!F(t) && t !== 10)); h++)
        ;
      if (r = u.md.helpers.parseLinkTitle(u.src, h, u.posMax), h < f && c !== h && r.ok)
        for (o = r.str, h = r.pos; h < f && (t = u.src.charCodeAt(h), !(!F(t) && t !== 10)); h++)
          ;
    }
    (h >= f || u.src.charCodeAt(h) !== 41) && (a = !0), h++;
  }
  if (a) {
    if (typeof u.env.references > "u")
      return !1;
    if (h < f && u.src.charCodeAt(h) === 91 ? (c = h + 1, h = u.md.helpers.parseLinkLabel(u, h), h >= 0 ? n = u.src.slice(c, h++) : h = b + 1) : h = b + 1, n || (n = u.src.slice(m, b)), i = u.env.references[hu(n)], !i)
      return u.pos = d, !1;
    s = i.href, o = i.title;
  }
  if (!e) {
    u.pos = m, u.posMax = b;
    const k = u.push("link_open", "a", 1), _ = [["href", s]];
    k.attrs = _, o && _.push(["title", o]), u.linkLevel++, u.md.inline.tokenize(u), u.linkLevel--, u.push("link_close", "a", -1);
  }
  return u.pos = h, u.posMax = f, !0;
}
function q0(u, e) {
  let t, n, r, i, s, o, c, a, d = "";
  const f = u.pos, m = u.posMax;
  if (u.src.charCodeAt(u.pos) !== 33 || u.src.charCodeAt(u.pos + 1) !== 91)
    return !1;
  const b = u.pos + 2, h = u.md.helpers.parseLinkLabel(u, u.pos + 1, !1);
  if (h < 0)
    return !1;
  if (i = h + 1, i < m && u.src.charCodeAt(i) === 40) {
    for (i++; i < m && (t = u.src.charCodeAt(i), !(!F(t) && t !== 10)); i++)
      ;
    if (i >= m)
      return !1;
    for (a = i, o = u.md.helpers.parseLinkDestination(u.src, i, u.posMax), o.ok && (d = u.md.normalizeLink(o.str), u.md.validateLink(d) ? i = o.pos : d = ""), a = i; i < m && (t = u.src.charCodeAt(i), !(!F(t) && t !== 10)); i++)
      ;
    if (o = u.md.helpers.parseLinkTitle(u.src, i, u.posMax), i < m && a !== i && o.ok)
      for (c = o.str, i = o.pos; i < m && (t = u.src.charCodeAt(i), !(!F(t) && t !== 10)); i++)
        ;
    else
      c = "";
    if (i >= m || u.src.charCodeAt(i) !== 41)
      return u.pos = f, !1;
    i++;
  } else {
    if (typeof u.env.references > "u")
      return !1;
    if (i < m && u.src.charCodeAt(i) === 91 ? (a = i + 1, i = u.md.helpers.parseLinkLabel(u, i), i >= 0 ? r = u.src.slice(a, i++) : i = h + 1) : i = h + 1, r || (r = u.src.slice(b, h)), s = u.env.references[hu(r)], !s)
      return u.pos = f, !1;
    d = s.href, c = s.title;
  }
  if (!e) {
    n = u.src.slice(b, h);
    const k = [];
    u.md.inline.parse(
      n,
      u.md,
      u.env,
      k
    );
    const _ = u.push("image", "img", 0), E = [["src", d], ["alt", ""]];
    _.attrs = E, _.children = k, _.content = n, c && E.push(["title", c]);
  }
  return u.pos = i, u.posMax = m, !0;
}
const B0 = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, z0 = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function L0(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 60)
    return !1;
  const n = u.pos, r = u.posMax;
  for (; ; ) {
    if (++t >= r) return !1;
    const s = u.src.charCodeAt(t);
    if (s === 60) return !1;
    if (s === 62) break;
  }
  const i = u.src.slice(n + 1, t);
  if (z0.test(i)) {
    const s = u.md.normalizeLink(i);
    if (!u.md.validateLink(s))
      return !1;
    if (!e) {
      const o = u.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      const c = u.push("text", "", 0);
      c.content = u.md.normalizeLinkText(i);
      const a = u.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return u.pos += i.length + 2, !0;
  }
  if (B0.test(i)) {
    const s = u.md.normalizeLink("mailto:" + i);
    if (!u.md.validateLink(s))
      return !1;
    if (!e) {
      const o = u.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      const c = u.push("text", "", 0);
      c.content = u.md.normalizeLinkText(i);
      const a = u.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return u.pos += i.length + 2, !0;
  }
  return !1;
}
function R0(u) {
  return /^<a[>\s]/i.test(u);
}
function P0(u) {
  return /^<\/a\s*>/i.test(u);
}
function O0(u) {
  const e = u | 32;
  return e >= 97 && e <= 122;
}
function N0(u, e) {
  if (!u.md.options.html)
    return !1;
  const t = u.posMax, n = u.pos;
  if (u.src.charCodeAt(n) !== 60 || n + 2 >= t)
    return !1;
  const r = u.src.charCodeAt(n + 1);
  if (r !== 33 && r !== 63 && r !== 47 && !O0(r))
    return !1;
  const i = u.src.slice(n).match(p0);
  if (!i)
    return !1;
  if (!e) {
    const s = u.push("html_inline", "", 0);
    s.content = i[0], R0(s.content) && u.linkLevel++, P0(s.content) && u.linkLevel--;
  }
  return u.pos += i[0].length, !0;
}
const U0 = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, H0 = /^&([a-z][a-z0-9]{1,31});/i;
function Q0(u, e) {
  const t = u.pos, n = u.posMax;
  if (u.src.charCodeAt(t) !== 38 || t + 1 >= n) return !1;
  if (u.src.charCodeAt(t + 1) === 35) {
    const i = u.src.slice(t).match(U0);
    if (i) {
      if (!e) {
        const s = i[1][0].toLowerCase() === "x" ? parseInt(i[1].slice(1), 16) : parseInt(i[1], 10), o = u.push("text_special", "", 0);
        o.content = Su(s) ? lu(s) : lu(65533), o.markup = i[0], o.info = "entity";
      }
      return u.pos += i[0].length, !0;
    }
  } else {
    const i = u.src.slice(t).match(H0);
    if (i) {
      const s = se(i[0]);
      if (s !== i[0]) {
        if (!e) {
          const o = u.push("text_special", "", 0);
          o.content = s, o.markup = i[0], o.info = "entity";
        }
        return u.pos += i[0].length, !0;
      }
    }
  }
  return !1;
}
function Ju(u) {
  const e = {}, t = u.length;
  if (!t) return;
  let n = 0, r = -2;
  const i = [];
  for (let s = 0; s < t; s++) {
    const o = u[s];
    if (i.push(0), (u[n].marker !== o.marker || r !== o.token - 1) && (n = s), r = o.token, o.length = o.length || 0, !o.close) continue;
    e.hasOwnProperty(o.marker) || (e[o.marker] = [-1, -1, -1, -1, -1, -1]);
    const c = e[o.marker][(o.open ? 3 : 0) + o.length % 3];
    let a = n - i[n] - 1, d = a;
    for (; a > c; a -= i[a] + 1) {
      const f = u[a];
      if (f.marker === o.marker && f.open && f.end < 0) {
        let m = !1;
        if ((f.close || o.open) && (f.length + o.length) % 3 === 0 && (f.length % 3 !== 0 || o.length % 3 !== 0) && (m = !0), !m) {
          const b = a > 0 && !u[a - 1].open ? i[a - 1] + 1 : 0;
          i[s] = s - a + b, i[a] = b, o.open = !1, f.end = s, f.close = !1, d = -1, r = -2;
          break;
        }
      }
    }
    d !== -1 && (e[o.marker][(o.open ? 3 : 0) + (o.length || 0) % 3] = d);
  }
}
function j0(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Ju(u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Ju(e[n].delimiters);
}
function W0(u) {
  let e, t, n = 0;
  const r = u.tokens, i = u.tokens.length;
  for (e = t = 0; e < i; e++)
    r[e].nesting < 0 && n--, r[e].level = n, r[e].nesting > 0 && n++, r[e].type === "text" && e + 1 < i && r[e + 1].type === "text" ? r[e + 1].content = r[e].content + r[e + 1].content : (e !== t && (r[t] = r[e]), t++);
  e !== t && (r.length = t);
}
const xu = [
  ["text", C0],
  ["linkify", D0],
  ["newline", A0],
  ["escape", w0],
  ["backticks", F0],
  ["strikethrough", he.tokenize],
  ["emphasis", be.tokenize],
  ["link", M0],
  ["image", q0],
  ["autolink", L0],
  ["html_inline", N0],
  ["entity", Q0]
], ku = [
  ["balance_pairs", j0],
  ["strikethrough", he.postProcess],
  ["emphasis", be.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", W0]
];
function iu() {
  this.ruler = new q();
  for (let u = 0; u < xu.length; u++)
    this.ruler.push(xu[u][0], xu[u][1]);
  this.ruler2 = new q();
  for (let u = 0; u < ku.length; u++)
    this.ruler2.push(ku[u][0], ku[u][1]);
}
iu.prototype.skipToken = function(u) {
  const e = u.pos, t = this.ruler.getRules(""), n = t.length, r = u.md.options.maxNesting, i = u.cache;
  if (typeof i[e] < "u") {
    u.pos = i[e];
    return;
  }
  let s = !1;
  if (u.level < r) {
    for (let o = 0; o < n; o++)
      if (u.level++, s = t[o](u, !0), u.level--, s) {
        if (e >= u.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    u.pos = u.posMax;
  s || u.pos++, i[e] = u.pos;
};
iu.prototype.tokenize = function(u) {
  const e = this.ruler.getRules(""), t = e.length, n = u.posMax, r = u.md.options.maxNesting;
  for (; u.pos < n; ) {
    const i = u.pos;
    let s = !1;
    if (u.level < r) {
      for (let o = 0; o < t; o++)
        if (s = e[o](u, !1), s) {
          if (i >= u.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (s) {
      if (u.pos >= n)
        break;
      continue;
    }
    u.pending += u.src[u.pos++];
  }
  u.pending && u.pushPending();
};
iu.prototype.parse = function(u, e, t, n) {
  const r = new this.State(u, e, t, n);
  this.tokenize(r);
  const i = this.ruler2.getRules(""), s = i.length;
  for (let o = 0; o < s; o++)
    i[o](r);
};
iu.prototype.State = ru;
function Z0(u) {
  const e = {};
  u = u || {}, e.src_Any = ee.source, e.src_Cc = te.source, e.src_Z = re.source, e.src_P = vu.source, e.src_ZPCc = [e.src_Z, e.src_P, e.src_Cc].join("|"), e.src_ZCc = [e.src_Z, e.src_Cc].join("|");
  const t = "[><｜]";
  return e.src_pseudo_letter = "(?:(?!" + t + "|" + e.src_ZPCc + ")" + e.src_Any + ")", e.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", e.src_auth = "(?:(?:(?!" + e.src_ZCc + "|[@/\\[\\]()]).)+@)?", e.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", e.src_host_terminator = "(?=$|" + t + "|" + e.src_ZPCc + ")(?!" + (u["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + e.src_ZPCc + "))", e.src_path = "(?:[/?#](?:(?!" + e.src_ZCc + "|" + t + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + e.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + e.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + e.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + e.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + e.src_ZCc + "|[']).)+\\'|\\'(?=" + e.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + e.src_ZCc + "|[.]|$)|" + (u["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + e.src_ZCc + "|$)|;(?!" + e.src_ZCc + "|$)|\\!+(?!" + e.src_ZCc + "|[!]|$)|\\?(?!" + e.src_ZCc + "|[?]|$))+|\\/)?", e.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', e.src_xn = "xn--[a-z0-9\\-]{1,59}", e.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + e.src_xn + "|" + e.src_pseudo_letter + "{1,63})", e.src_domain = "(?:" + e.src_xn + "|(?:" + e.src_pseudo_letter + ")|(?:" + e.src_pseudo_letter + "(?:-|" + e.src_pseudo_letter + "){0,61}" + e.src_pseudo_letter + "))", e.src_host = "(?:(?:(?:(?:" + e.src_domain + ")\\.)*" + e.src_domain + "))", e.tpl_host_fuzzy = "(?:" + e.src_ip4 + "|(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%)))", e.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%))", e.src_host_strict = e.src_host + e.src_host_terminator, e.tpl_host_fuzzy_strict = e.tpl_host_fuzzy + e.src_host_terminator, e.src_host_port_strict = e.src_host + e.src_port + e.src_host_terminator, e.tpl_host_port_fuzzy_strict = e.tpl_host_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_port_no_ip_fuzzy_strict = e.tpl_host_no_ip_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + e.src_ZPCc + "|>|$))", e.tpl_email_fuzzy = "(^|" + t + '|"|\\(|' + e.src_ZCc + ")(" + e.src_email_name + "@" + e.tpl_host_fuzzy_strict + ")", e.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_fuzzy_strict + e.src_path + ")", e.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_no_ip_fuzzy_strict + e.src_path + ")", e;
}
function Du(u) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    t && Object.keys(t).forEach(function(n) {
      u[n] = t[n];
    });
  }), u;
}
function pu(u) {
  return Object.prototype.toString.call(u);
}
function V0(u) {
  return pu(u) === "[object String]";
}
function G0(u) {
  return pu(u) === "[object Object]";
}
function J0(u) {
  return pu(u) === "[object RegExp]";
}
function $u(u) {
  return pu(u) === "[object Function]";
}
function $0(u) {
  return u.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const pe = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function K0(u) {
  return Object.keys(u || {}).reduce(function(e, t) {
    return e || pe.hasOwnProperty(t);
  }, !1);
}
const X0 = {
  "http:": {
    validate: function(u, e, t) {
      const n = u.slice(e);
      return t.re.http || (t.re.http = new RegExp(
        "^\\/\\/" + t.re.src_auth + t.re.src_host_port_strict + t.re.src_path,
        "i"
      )), t.re.http.test(n) ? n.match(t.re.http)[0].length : 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(u, e, t) {
      const n = u.slice(e);
      return t.re.no_http || (t.re.no_http = new RegExp(
        "^" + t.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        "(?:localhost|(?:(?:" + t.re.src_domain + ")\\.)+" + t.re.src_domain_root + ")" + t.re.src_port + t.re.src_host_terminator + t.re.src_path,
        "i"
      )), t.re.no_http.test(n) ? e >= 3 && u[e - 3] === ":" || e >= 3 && u[e - 3] === "/" ? 0 : n.match(t.re.no_http)[0].length : 0;
    }
  },
  "mailto:": {
    validate: function(u, e, t) {
      const n = u.slice(e);
      return t.re.mailto || (t.re.mailto = new RegExp(
        "^" + t.re.src_email_name + "@" + t.re.src_host_strict,
        "i"
      )), t.re.mailto.test(n) ? n.match(t.re.mailto)[0].length : 0;
    }
  }
}, Y0 = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", un = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function en(u) {
  u.__index__ = -1, u.__text_cache__ = "";
}
function tn(u) {
  return function(e, t) {
    const n = e.slice(t);
    return u.test(n) ? n.match(u)[0].length : 0;
  };
}
function Ku() {
  return function(u, e) {
    e.normalize(u);
  };
}
function du(u) {
  const e = u.re = Z0(u.__opts__), t = u.__tlds__.slice();
  u.onCompile(), u.__tlds_replaced__ || t.push(Y0), t.push(e.src_xn), e.src_tlds = t.join("|");
  function n(o) {
    return o.replace("%TLDS%", e.src_tlds);
  }
  e.email_fuzzy = RegExp(n(e.tpl_email_fuzzy), "i"), e.link_fuzzy = RegExp(n(e.tpl_link_fuzzy), "i"), e.link_no_ip_fuzzy = RegExp(n(e.tpl_link_no_ip_fuzzy), "i"), e.host_fuzzy_test = RegExp(n(e.tpl_host_fuzzy_test), "i");
  const r = [];
  u.__compiled__ = {};
  function i(o, c) {
    throw new Error('(LinkifyIt) Invalid schema "' + o + '": ' + c);
  }
  Object.keys(u.__schemas__).forEach(function(o) {
    const c = u.__schemas__[o];
    if (c === null)
      return;
    const a = { validate: null, link: null };
    if (u.__compiled__[o] = a, G0(c)) {
      J0(c.validate) ? a.validate = tn(c.validate) : $u(c.validate) ? a.validate = c.validate : i(o, c), $u(c.normalize) ? a.normalize = c.normalize : c.normalize ? i(o, c) : a.normalize = Ku();
      return;
    }
    if (V0(c)) {
      r.push(o);
      return;
    }
    i(o, c);
  }), r.forEach(function(o) {
    u.__compiled__[u.__schemas__[o]] && (u.__compiled__[o].validate = u.__compiled__[u.__schemas__[o]].validate, u.__compiled__[o].normalize = u.__compiled__[u.__schemas__[o]].normalize);
  }), u.__compiled__[""] = { validate: null, normalize: Ku() };
  const s = Object.keys(u.__compiled__).filter(function(o) {
    return o.length > 0 && u.__compiled__[o];
  }).map($0).join("|");
  u.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + s + ")", "i"), u.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + s + ")", "ig"), u.re.schema_at_start = RegExp("^" + u.re.schema_search.source, "i"), u.re.pretest = RegExp(
    "(" + u.re.schema_test.source + ")|(" + u.re.host_fuzzy_test.source + ")|@",
    "i"
  ), en(u);
}
function nn(u, e) {
  const t = u.__index__, n = u.__last_index__, r = u.__text_cache__.slice(t, n);
  this.schema = u.__schema__.toLowerCase(), this.index = t + e, this.lastIndex = n + e, this.raw = r, this.text = r, this.url = r;
}
function Au(u, e) {
  const t = new nn(u, e);
  return u.__compiled__[t.schema].normalize(t, u), t;
}
function B(u, e) {
  if (!(this instanceof B))
    return new B(u, e);
  e || K0(u) && (e = u, u = {}), this.__opts__ = Du({}, pe, e), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = Du({}, X0, u), this.__compiled__ = {}, this.__tlds__ = un, this.__tlds_replaced__ = !1, this.re = {}, du(this);
}
B.prototype.add = function(e, t) {
  return this.__schemas__[e] = t, du(this), this;
};
B.prototype.set = function(e) {
  return this.__opts__ = Du(this.__opts__, e), this;
};
B.prototype.test = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length)
    return !1;
  let t, n, r, i, s, o, c, a, d;
  if (this.re.schema_test.test(e)) {
    for (c = this.re.schema_search, c.lastIndex = 0; (t = c.exec(e)) !== null; )
      if (i = this.testSchemaAt(e, t[2], c.lastIndex), i) {
        this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + i;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (a = e.search(this.re.host_fuzzy_test), a >= 0 && (this.__index__ < 0 || a < this.__index__) && (n = e.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (s = n.index + n[1].length, (this.__index__ < 0 || s < this.__index__) && (this.__schema__ = "", this.__index__ = s, this.__last_index__ = n.index + n[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (d = e.indexOf("@"), d >= 0 && (r = e.match(this.re.email_fuzzy)) !== null && (s = r.index + r[1].length, o = r.index + r[0].length, (this.__index__ < 0 || s < this.__index__ || s === this.__index__ && o > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = s, this.__last_index__ = o))), this.__index__ >= 0;
};
B.prototype.pretest = function(e) {
  return this.re.pretest.test(e);
};
B.prototype.testSchemaAt = function(e, t, n) {
  return this.__compiled__[t.toLowerCase()] ? this.__compiled__[t.toLowerCase()].validate(e, n, this) : 0;
};
B.prototype.match = function(e) {
  const t = [];
  let n = 0;
  this.__index__ >= 0 && this.__text_cache__ === e && (t.push(Au(this, n)), n = this.__last_index__);
  let r = n ? e.slice(n) : e;
  for (; this.test(r); )
    t.push(Au(this, n)), r = r.slice(this.__last_index__), n += this.__last_index__;
  return t.length ? t : null;
};
B.prototype.matchAtStart = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length) return null;
  const t = this.re.schema_at_start.exec(e);
  if (!t) return null;
  const n = this.testSchemaAt(e, t[2], t[0].length);
  return n ? (this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + n, Au(this, 0)) : null;
};
B.prototype.tlds = function(e, t) {
  return e = Array.isArray(e) ? e : [e], t ? (this.__tlds__ = this.__tlds__.concat(e).sort().filter(function(n, r, i) {
    return n !== i[r - 1];
  }).reverse(), du(this), this) : (this.__tlds__ = e.slice(), this.__tlds_replaced__ = !0, du(this), this);
};
B.prototype.normalize = function(e) {
  e.schema || (e.url = "http://" + e.url), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = "mailto:" + e.url);
};
B.prototype.onCompile = function() {
};
const J = 2147483647, R = 36, qu = 1, tu = 26, rn = 38, sn = 700, ge = 72, me = 128, _e = "-", on = /^xn--/, cn = /[^\0-\x7F]/, an = /[\x2E\u3002\uFF0E\uFF61]/g, ln = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, yu = R - qu, P = Math.floor, Cu = String.fromCharCode;
function H(u) {
  throw new RangeError(ln[u]);
}
function dn(u, e) {
  const t = [];
  let n = u.length;
  for (; n--; )
    t[n] = e(u[n]);
  return t;
}
function xe(u, e) {
  const t = u.split("@");
  let n = "";
  t.length > 1 && (n = t[0] + "@", u = t[1]), u = u.replace(an, ".");
  const r = u.split("."), i = dn(r, e).join(".");
  return n + i;
}
function ke(u) {
  const e = [];
  let t = 0;
  const n = u.length;
  for (; t < n; ) {
    const r = u.charCodeAt(t++);
    if (r >= 55296 && r <= 56319 && t < n) {
      const i = u.charCodeAt(t++);
      (i & 64512) == 56320 ? e.push(((r & 1023) << 10) + (i & 1023) + 65536) : (e.push(r), t--);
    } else
      e.push(r);
  }
  return e;
}
const fn = (u) => String.fromCodePoint(...u), hn = function(u) {
  return u >= 48 && u < 58 ? 26 + (u - 48) : u >= 65 && u < 91 ? u - 65 : u >= 97 && u < 123 ? u - 97 : R;
}, Xu = function(u, e) {
  return u + 22 + 75 * (u < 26) - ((e != 0) << 5);
}, ye = function(u, e, t) {
  let n = 0;
  for (u = t ? P(u / sn) : u >> 1, u += P(u / e); u > yu * tu >> 1; n += R)
    u = P(u / yu);
  return P(n + (yu + 1) * u / (u + rn));
}, Ce = function(u) {
  const e = [], t = u.length;
  let n = 0, r = me, i = ge, s = u.lastIndexOf(_e);
  s < 0 && (s = 0);
  for (let o = 0; o < s; ++o)
    u.charCodeAt(o) >= 128 && H("not-basic"), e.push(u.charCodeAt(o));
  for (let o = s > 0 ? s + 1 : 0; o < t; ) {
    const c = n;
    for (let d = 1, f = R; ; f += R) {
      o >= t && H("invalid-input");
      const m = hn(u.charCodeAt(o++));
      m >= R && H("invalid-input"), m > P((J - n) / d) && H("overflow"), n += m * d;
      const b = f <= i ? qu : f >= i + tu ? tu : f - i;
      if (m < b)
        break;
      const h = R - b;
      d > P(J / h) && H("overflow"), d *= h;
    }
    const a = e.length + 1;
    i = ye(n - c, a, c == 0), P(n / a) > J - r && H("overflow"), r += P(n / a), n %= a, e.splice(n++, 0, r);
  }
  return String.fromCodePoint(...e);
}, Ee = function(u) {
  const e = [];
  u = ke(u);
  const t = u.length;
  let n = me, r = 0, i = ge;
  for (const c of u)
    c < 128 && e.push(Cu(c));
  const s = e.length;
  let o = s;
  for (s && e.push(_e); o < t; ) {
    let c = J;
    for (const d of u)
      d >= n && d < c && (c = d);
    const a = o + 1;
    c - n > P((J - r) / a) && H("overflow"), r += (c - n) * a, n = c;
    for (const d of u)
      if (d < n && ++r > J && H("overflow"), d === n) {
        let f = r;
        for (let m = R; ; m += R) {
          const b = m <= i ? qu : m >= i + tu ? tu : m - i;
          if (f < b)
            break;
          const h = f - b, k = R - b;
          e.push(
            Cu(Xu(b + h % k, 0))
          ), f = P(h / k);
        }
        e.push(Cu(Xu(f, 0))), i = ye(r, a, o === s), r = 0, ++o;
      }
    ++r, ++n;
  }
  return e.join("");
}, bn = function(u) {
  return xe(u, function(e) {
    return on.test(e) ? Ce(e.slice(4).toLowerCase()) : e;
  });
}, pn = function(u) {
  return xe(u, function(e) {
    return cn.test(e) ? "xn--" + Ee(e) : e;
  });
}, De = {
  /**
   * A string representing the current Punycode.js version number.
   * @memberOf punycode
   * @type String
   */
  version: "2.3.1",
  /**
   * An object of methods to convert from JavaScript's internal character
   * representation (UCS-2) to Unicode code points, and back.
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode
   * @type Object
   */
  ucs2: {
    decode: ke,
    encode: fn
  },
  decode: Ce,
  encode: Ee,
  toASCII: pn,
  toUnicode: bn
}, gn = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 100
  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
}, mn = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "text"
      ],
      rules2: [
        "balance_pairs",
        "fragments_join"
      ]
    }
  }
}, _n = {
  options: {
    // Enable HTML tags in source
    html: !0,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !0,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "autolink",
        "backticks",
        "emphasis",
        "entity",
        "escape",
        "html_inline",
        "image",
        "link",
        "newline",
        "text"
      ],
      rules2: [
        "balance_pairs",
        "emphasis",
        "fragments_join"
      ]
    }
  }
}, xn = {
  default: gn,
  zero: mn,
  commonmark: _n
}, kn = /^(vbscript|javascript|file|data):/, yn = /^data:image\/(gif|png|jpeg|webp);/;
function Cn(u) {
  const e = u.trim().toLowerCase();
  return kn.test(e) ? yn.test(e) : !0;
}
const Ae = ["http:", "https:", "mailto:"];
function En(u) {
  const e = Fu(u, !0);
  if (e.hostname && (!e.protocol || Ae.indexOf(e.protocol) >= 0))
    try {
      e.hostname = De.toASCII(e.hostname);
    } catch {
    }
  return nu(wu(e));
}
function Dn(u) {
  const e = Fu(u, !0);
  if (e.hostname && (!e.protocol || Ae.indexOf(e.protocol) >= 0))
    try {
      e.hostname = De.toUnicode(e.hostname);
    } catch {
    }
  return $(wu(e), $.defaultChars + "%");
}
function z(u, e) {
  if (!(this instanceof z))
    return new z(u, e);
  e || Tu(u) || (e = u || {}, u = "default"), this.inline = new iu(), this.block = new bu(), this.core = new Iu(), this.renderer = new X(), this.linkify = new B(), this.validateLink = Cn, this.normalizeLink = En, this.normalizeLinkText = Dn, this.utils = At, this.helpers = fu({}, Tt), this.options = {}, this.configure(u), e && this.set(e);
}
z.prototype.set = function(u) {
  return fu(this.options, u), this;
};
z.prototype.configure = function(u) {
  const e = this;
  if (Tu(u)) {
    const t = u;
    if (u = xn[t], !u)
      throw new Error('Wrong `markdown-it` preset "' + t + '", check name');
  }
  if (!u)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return u.options && e.set(u.options), u.components && Object.keys(u.components).forEach(function(t) {
    u.components[t].rules && e[t].ruler.enableOnly(u.components[t].rules), u.components[t].rules2 && e[t].ruler2.enableOnly(u.components[t].rules2);
  }), this;
};
z.prototype.enable = function(u, e) {
  let t = [];
  Array.isArray(u) || (u = [u]), ["core", "block", "inline"].forEach(function(r) {
    t = t.concat(this[r].ruler.enable(u, !0));
  }, this), t = t.concat(this.inline.ruler2.enable(u, !0));
  const n = u.filter(function(r) {
    return t.indexOf(r) < 0;
  });
  if (n.length && !e)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + n);
  return this;
};
z.prototype.disable = function(u, e) {
  let t = [];
  Array.isArray(u) || (u = [u]), ["core", "block", "inline"].forEach(function(r) {
    t = t.concat(this[r].ruler.disable(u, !0));
  }, this), t = t.concat(this.inline.ruler2.disable(u, !0));
  const n = u.filter(function(r) {
    return t.indexOf(r) < 0;
  });
  if (n.length && !e)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + n);
  return this;
};
z.prototype.use = function(u) {
  const e = [this].concat(Array.prototype.slice.call(arguments, 1));
  return u.apply(u, e), this;
};
z.prototype.parse = function(u, e) {
  if (typeof u != "string")
    throw new Error("Input data should be a String");
  const t = new this.core.State(u, this, e);
  return this.core.process(t), t.tokens;
};
z.prototype.render = function(u, e) {
  return e = e || {}, this.renderer.render(this.parse(u, e), this.options, e);
};
z.prototype.parseInline = function(u, e) {
  const t = new this.core.State(u, this, e);
  return t.inlineMode = !0, this.core.process(t), t.tokens;
};
z.prototype.renderInline = function(u, e) {
  return e = e || {}, this.renderer.render(this.parseInline(u, e), this.options, e);
};
const An = new z({
  html: !1,
  breaks: !0,
  linkify: !0
}), wn = (u) => u ? An.render(u) : "", Fn = (u) => u.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
var vn = l.from_html('<span class="chat-widget__thinking-pulse svelte-6zhkyr"></span>'), Tn = l.from_html('<details class="chat-widget__thinking svelte-6zhkyr"><summary class="chat-widget__thinking-summary svelte-6zhkyr"><div class="chat-widget__thinking-toggle svelte-6zhkyr"><svg class="chat-widget__thinking-chevron svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg> <span class="chat-widget__thinking-label svelte-6zhkyr"><svg class="chat-widget__thinking-icon svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg> Thinking <!></span></div></summary> <div class="chat-widget__thinking-content svelte-6zhkyr"><p class="chat-widget__thinking-text svelte-6zhkyr"> </p></div></details>');
function Sn(u, e) {
  l.push(e, !0);
  var t = Tn(), n = l.child(t), r = l.child(n), i = l.sibling(l.child(r), 2), s = l.sibling(l.child(i), 2);
  {
    var o = (f) => {
      var m = vn();
      l.append(f, m);
    };
    l.if(s, (f) => {
      e.thinking.isStreaming && f(o);
    });
  }
  l.reset(i), l.reset(r), l.reset(n);
  var c = l.sibling(n, 2), a = l.child(c), d = l.child(a, !0);
  l.reset(a), l.reset(c), l.reset(t), l.template_effect(() => {
    t.open = e.thinking.isStreaming, l.set_text(d, e.thinking.content);
  }), l.append(u, t), l.pop();
}
var In = l.from_html('<div><div class="chat-widget__bubble-content svelte-1m4gqe"><!></div></div> <span> </span>', 1), Mn = l.from_html('<div><div class="chat-widget__message svelte-1m4gqe"><!> <!></div></div>');
function qn(u, e) {
  l.push(e, !0);
  var t = Mn();
  let n;
  var r = l.child(t), i = l.child(r);
  {
    var s = (a) => {
      Sn(a, {
        get thinking() {
          return e.message.thinking;
        }
      });
    };
    l.if(i, (a) => {
      e.showThinking && e.message.thinking && e.message.from === "assistant" && a(s);
    });
  }
  var o = l.sibling(i, 2);
  {
    var c = (a) => {
      var d = In(), f = l.first_child(d);
      let m;
      var b = l.child(f), h = l.child(b);
      l.html(h, () => wn(e.message.text)), l.reset(b), l.reset(f);
      var k = l.sibling(f, 2);
      let _;
      var E = l.child(k, !0);
      l.reset(k), l.template_effect(
        (x) => {
          m = l.set_class(f, 1, "chat-widget__bubble svelte-1m4gqe", null, m, {
            "chat-widget__bubble--user": e.message.from === "user",
            "chat-widget__bubble--assistant": e.message.from === "assistant",
            "chat-widget__bubble--system": e.message.from === "system"
          }), _ = l.set_class(k, 1, "chat-widget__timestamp svelte-1m4gqe", null, _, {
            "chat-widget__timestamp--user": e.message.from === "user"
          }), l.set_text(E, x);
        },
        [() => Fn(e.message.timestamp)]
      ), l.append(a, d);
    };
    l.if(o, (a) => {
      e.message.text && a(c);
    });
  }
  l.reset(r), l.reset(t), l.template_effect(() => n = l.set_class(t, 1, "chat-widget__message-row svelte-1m4gqe", null, n, {
    "chat-widget__message-row--user": e.message.from === "user",
    "chat-widget__message-row--assistant": e.message.from === "assistant",
    "chat-widget__message-row--system": e.message.from === "system"
  })), l.append(u, t), l.pop();
}
var Bn = l.from_html('<div class="chat-widget__typing-dots svelte-gu507e" aria-label="Loading" aria-live="polite"><div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 0ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 160ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 320ms"></div></div>');
function zn(u) {
  var e = Bn();
  l.append(u, e);
}
var Ln = l.from_html("<!> <!>", 1);
function Rn(u, e) {
  var t = Ln(), n = l.first_child(t);
  l.each(n, 17, () => e.messages, (s) => s.id, (s, o) => {
    qn(s, {
      get message() {
        return l.get(o);
      },
      get showThinking() {
        return e.showThinking;
      }
    });
  });
  var r = l.sibling(n, 2);
  {
    var i = (s) => {
      zn(s);
    };
    l.if(r, (s) => {
      e.isTyping && s(i);
    });
  }
  l.append(u, t);
}
var Pn = l.from_html('<button type="button"><span class="chat-widget__question-option-label svelte-11fq3uo"> </span> <span class="chat-widget__question-option-description svelte-11fq3uo"> </span></button>'), On = l.from_html('<button type="button" class="chat-widget__question-submit svelte-11fq3uo">Submit selection</button>'), Nn = l.from_html('<div class="chat-widget__question-panel svelte-11fq3uo"><p class="chat-widget__question-text svelte-11fq3uo"> </p> <div class="chat-widget__question-options svelte-11fq3uo"><!> <div class="chat-widget__question-option chat-widget__question-option--custom svelte-11fq3uo"><span class="chat-widget__question-option-label svelte-11fq3uo">Type your own answer</span> <div class="chat-widget__custom-input-row svelte-11fq3uo"><input type="text" class="chat-widget__custom-input svelte-11fq3uo" placeholder="Your answer..."/> <button type="button" class="chat-widget__custom-submit svelte-11fq3uo">Send</button></div></div></div> <!></div>');
function Un(u, e) {
  l.push(e, !0);
  let t = l.prop(e, "autoFocusFirst", 3, !1), n = l.state(l.proxy([])), r = l.state(""), i = l.state(void 0);
  const s = (p) => {
    var D;
    if (e.question.options.length === 0)
      return;
    const y = (p % e.question.options.length + e.question.options.length) % e.question.options.length;
    (D = l.get(n)[y]) == null || D.focus();
  }, o = (p, y, D) => {
    if (!p.isComposing) {
      if (p.key === "ArrowDown" || p.key === "ArrowRight") {
        p.preventDefault(), s(D + 1);
        return;
      }
      if (p.key === "ArrowUp" || p.key === "ArrowLeft") {
        p.preventDefault(), s(D - 1);
        return;
      }
      if (p.key === "Home") {
        p.preventDefault(), s(0);
        return;
      }
      if (p.key === "End") {
        p.preventDefault(), s(e.question.options.length - 1);
        return;
      }
      (p.key === "Enter" || p.key === " ") && (p.preventDefault(), e.onToggleAnswer(y));
    }
  }, c = () => {
    const p = l.get(r).trim();
    p && (e.onSubmitCustomAnswer(p), l.set(r, ""));
  }, a = (p) => {
    p.isComposing || p.key === "Enter" && (p.preventDefault(), c());
  };
  l.user_effect(() => {
    e.question, l.set(n, [], !0), l.set(r, "");
  }), l.user_effect(() => {
    var p;
    t() && (s(0), (p = e.onAutoFocusHandled) == null || p.call(e));
  });
  var d = Nn(), f = l.child(d), m = l.child(f, !0);
  l.reset(f);
  var b = l.sibling(f, 2), h = l.child(b);
  l.each(h, 19, () => e.question.options, (p, y) => `${p.label}-${y}`, (p, y, D) => {
    const A = l.derived(() => Ie(l.get(y)));
    var v = Pn();
    let w;
    v.__click = () => e.onToggleAnswer(l.get(A)), v.__keydown = (M) => o(M, l.get(A), l.get(D));
    var T = l.child(v), U = l.child(T, !0);
    l.reset(T);
    var Z = l.sibling(T, 2), su = l.child(Z, !0);
    l.reset(Z), l.reset(v), l.bind_this(v, (M, V) => l.get(n)[V] = M, (M) => {
      var V;
      return (V = l.get(n)) == null ? void 0 : V[M];
    }, () => [l.get(D)]), l.template_effect(
      (M) => {
        w = l.set_class(v, 1, "chat-widget__question-option svelte-11fq3uo", null, w, M), l.set_text(U, l.get(y).label), l.set_text(su, l.get(y).description);
      },
      [
        () => ({
          "chat-widget__question-option--selected": e.selectedAnswers.includes(l.get(A))
        })
      ]
    ), l.append(p, v);
  });
  var k = l.sibling(h, 2), _ = l.sibling(l.child(k), 2), E = l.child(_);
  l.remove_input_defaults(E), E.__keydown = a, l.bind_this(E, (p) => l.set(i, p), () => l.get(i));
  var x = l.sibling(E, 2);
  x.__click = c, l.reset(_), l.reset(k), l.reset(b);
  var C = l.sibling(b, 2);
  {
    var g = (p) => {
      var y = On();
      y.__click = function(...D) {
        var A;
        (A = e.onSubmitAnswers) == null || A.apply(this, D);
      }, l.template_effect(() => y.disabled = e.selectedAnswers.length === 0), l.append(p, y);
    };
    l.if(C, (p) => {
      e.question.allowMultiple && p(g);
    });
  }
  l.reset(d), l.template_effect(
    (p) => {
      l.set_text(m, e.question.text), x.disabled = p;
    },
    [() => !l.get(r).trim()]
  ), l.bind_value(E, () => l.get(r), (p) => l.set(r, p)), l.append(u, d), l.pop();
}
l.delegate(["click", "keydown"]);
var Hn = l.from_html('<div><!> <div class="chat-widget__messages svelte-3vislt"><!></div> <footer class="chat-widget__footer svelte-3vislt"><!></footer></div>');
function Jn(u, e) {
  l.push(e, !0);
  const t = {
    title: Bu,
    placeholder: "Type a message",
    initialMessage: Yu,
    showThinking: !0,
    adapter: void 0
  };
  let n = l.prop(e, "primary", 3, "#0B57D0"), r = l.prop(e, "secondary", 3, "#4D5F7A"), i = l.prop(e, "darkMode", 3, !1);
  const s = l.derived(() => e.config ?? t), o = l.derived(() => {
    var A;
    return ((A = l.get(s)) == null ? void 0 : A.title) || Bu;
  }), c = l.derived(() => `--chat-primary: ${n()}; --chat-secondary: ${r()};`), a = l.derived(() => {
    var A;
    return ((A = l.get(s)) == null ? void 0 : A.showThinking) ?? !0;
  }), d = l.derived(() => {
    var A;
    return ((A = l.get(s)) == null ? void 0 : A.placeholder) || "Type a message";
  });
  let f = l.state(void 0);
  const b = qe({
    getConfig: () => l.get(s),
    getShowThinking: () => l.get(a),
    scrollToBottom: () => {
      l.get(f) && setTimeout(
        () => {
          l.get(f) && (l.get(f).scrollTop = l.get(f).scrollHeight);
        },
        50
      );
    }
  }), h = l.derived(() => b.state.isTyping || !!b.state.streamingMessageId);
  l.user_effect(() => {
    b.syncConfig();
  });
  var k = Hn();
  let _;
  k.__keydown = (A) => A.stopPropagation(), k.__keyup = (A) => A.stopPropagation();
  var E = l.child(k);
  Le(E, {
    get title() {
      return l.get(o);
    },
    get header() {
      return e.header;
    }
  });
  var x = l.sibling(E, 2), C = l.child(x);
  Rn(C, {
    get messages() {
      return b.state.messages;
    },
    get showThinking() {
      return l.get(a);
    },
    get isTyping() {
      return l.get(h);
    }
  }), l.reset(x), l.bind_this(x, (A) => l.set(f, A), () => l.get(f));
  var g = l.sibling(x, 2), p = l.child(g);
  {
    var y = (A) => {
      Un(A, {
        get question() {
          return b.state.pendingQuestion;
        },
        get selectedAnswers() {
          return b.state.selectedQuestionAnswers;
        },
        get autoFocusFirst() {
          return b.state.shouldFocusQuestion;
        },
        get onToggleAnswer() {
          return b.toggleQuestionAnswer;
        },
        get onSubmitAnswers() {
          return b.submitQuestionAnswers;
        },
        get onSubmitCustomAnswer() {
          return b.submitCustomAnswer;
        },
        get onAutoFocusHandled() {
          return b.clearQuestionFocusRequest;
        }
      });
    }, D = (A) => {
      Pe(A, {
        get draft() {
          return b.state.draft;
        },
        get placeholder() {
          return l.get(d);
        },
        get disabled() {
          return l.get(h);
        },
        get onDraftChange() {
          return b.setDraft;
        },
        get onSubmit() {
          return b.sendMessage;
        }
      });
    };
    l.if(p, (A) => {
      b.state.pendingQuestion ? A(y) : A(D, !1);
    });
  }
  l.reset(g), l.reset(k), l.template_effect(() => {
    _ = l.set_class(k, 1, "chat-widget svelte-3vislt", null, _, { "chat-widget--dark": i() }), l.set_style(k, l.get(c));
  }), l.event("keypress", k, (A) => A.stopPropagation()), l.append(u, k), l.pop();
}
l.delegate(["keydown", "keyup"]);
export {
  Jn as ChatWidget,
  Yu as DEFAULT_INITIAL_MESSAGE,
  Bu as DEFAULT_TITLE,
  Zn as MockAdapter,
  Vn as OpenCodeAdapter,
  Gn as WebSocketAdapter
};
