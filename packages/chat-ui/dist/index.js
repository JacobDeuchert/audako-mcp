import "svelte/internal/disclose-version";
import * as o from "svelte/internal/client";
import "svelte/internal/flags/legacy";
class Xn {
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
      const c = n[Math.floor(Math.random() * n.length)], a = (i + c).split(" ");
      let l = "";
      for (let d = 0; d < a.length; d++) {
        if (this.abortController.signal.aborted)
          throw new Error("Request cancelled");
        l += (d > 0 ? " " : "") + a[d], t.onChunk(l), await new Promise((f) => setTimeout(f, 20 + Math.random() * 60));
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
  getSlashCommands() {
    return [
      { name: "new", description: "Start a new conversation" },
      { name: "help", description: "Show available commands and usage tips" }
    ];
  }
  async newSession() {
  }
}
class Yn {
  constructor(e) {
    this.ws = null, this.currentCallbacks = null, this.accumulatedText = "", this.accumulatedThinking = "", this.currentTurnId = null, this.reconnectCount = 0, this.reconnectTimer = null, this.heartbeatTimer = null, this.publicQuestionHandler = null, this.isConnecting = !1, this.pendingMessages = [], this.baseUrl = e.baseUrl.replace(/\/+$/, ""), this.websocketPath = e.websocketPath, this.sessionToken = e.sessionToken, this.sessionId = e.sessionId, this.reconnectAttempts = e.reconnectAttempts ?? 5, this.reconnectBaseDelay = e.reconnectBaseDelay ?? 1e3, this.reconnectMaxDelay = e.reconnectMaxDelay ?? 3e4, this.heartbeatIntervalMs = e.heartbeatIntervalMs ?? 3e4, this.onDebugEvent = e.onDebugEvent, this.onCustomEvent = e.onCustomEvent;
  }
  emitDebugEvent(e, t) {
    if (this.onDebugEvent)
      try {
        this.onDebugEvent({ type: e, payload: t });
      } catch (n) {
        console.warn("[WebSocketAdapter] Debug callback failed:", n);
      }
  }
  errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
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
          const n = new URL(this.websocketPath, this.baseUrl);
          n.protocol = n.protocol === "https:" ? "wss:" : "ws:", n.searchParams.set("sessionToken", this.sessionToken), this.emitDebugEvent("connection.attempt", {
            url: `${n.origin}${n.pathname}`,
            reconnectCount: this.reconnectCount
          }), this.ws = new WebSocket(n.toString());
          const r = () => {
            var c, s;
            for (console.log("[WebSocketAdapter] Connected"), this.isConnecting = !1, this.reconnectCount = 0, this.startHeartbeat(), this.emitDebugEvent("connection.open", {
              url: `${n.origin}${n.pathname}`
            }); this.pendingMessages.length > 0; ) {
              const a = this.pendingMessages.shift();
              a && this.ws && (this.ws.send(a), this.emitDebugEvent("message.outbound.queued.flush", {
                preview: a.slice(0, 200)
              }));
            }
            (c = this.ws) == null || c.removeEventListener("open", r), (s = this.ws) == null || s.removeEventListener("error", i), e();
          }, i = (c) => {
            var s, a;
            console.error("[WebSocketAdapter] Connection error:", c), this.isConnecting = !1, this.emitDebugEvent("connection.error", {
              phase: "connect"
            }), (s = this.ws) == null || s.removeEventListener("open", r), (a = this.ws) == null || a.removeEventListener("error", i), t(new Error("WebSocket connection failed"));
          };
          this.ws.addEventListener("open", r), this.ws.addEventListener("error", i), this.ws.addEventListener("message", this.handleMessage.bind(this)), this.ws.addEventListener("close", this.handleClose.bind(this)), this.ws.addEventListener("error", this.handleError.bind(this));
        } catch (n) {
          this.isConnecting = !1, this.emitDebugEvent("connection.error", {
            phase: "connect.setup",
            message: this.errorMessage(n)
          }), t(n);
        }
      });
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const e = { type: "ping" };
        this.ws.send(JSON.stringify(e)), this.emitDebugEvent("message.outbound.ping", {});
      }
    }, this.heartbeatIntervalMs);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
  handleMessage(e) {
    try {
      const t = typeof e.data == "string" ? e.data : String(e.data);
      this.emitDebugEvent("message.inbound.raw", {
        preview: t.slice(0, 200)
      });
      const n = JSON.parse(t);
      if (n.type === "pong") {
        this.emitDebugEvent("message.inbound.pong", {});
        return;
      }
      this.handleSessionEvent(n);
    } catch (t) {
      console.error("[WebSocketAdapter] Failed to parse message:", t), this.emitDebugEvent("message.inbound.parse_error", {
        message: this.errorMessage(t)
      });
    }
  }
  handleSessionEvent(e) {
    switch (this.emitDebugEvent("message.inbound.event", {
      eventType: e.type,
      payload: e.payload
    }), e.type) {
      case "agent.text_delta":
        if (!this.currentCallbacks) return;
        this.handleTextDelta(e);
        break;
      case "agent.turn_start":
        if (!this.currentCallbacks) return;
        this.handleTurnStart(e);
        break;
      case "agent.turn_end":
        if (!this.currentCallbacks) return;
        this.handleTurnEnd(e);
        break;
      case "agent.tool_start":
        if (!this.currentCallbacks) return;
        this.handleToolStart(e);
        break;
      case "agent.tool_end":
        if (!this.currentCallbacks) return;
        this.handleToolEnd(e);
        break;
      case "agent.error":
        if (!this.currentCallbacks) return;
        this.handleAgentError(e);
        break;
      case "hub.request":
        this.handleHubRequest(e);
        break;
      default:
        if (this.emitDebugEvent("message.inbound.custom_event", {
          eventType: e.type,
          payload: e.payload
        }), !this.onCustomEvent)
          return;
        try {
          this.onCustomEvent(e);
        } catch (t) {
          this.emitDebugEvent("message.inbound.custom_handler_error", {
            eventType: e.type,
            message: this.errorMessage(t)
          });
        }
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
      const n = e.payload.toolName, r = e.payload.toolOutput, i = typeof r == "string" ? r : JSON.stringify(r), c = `Completed tool: ${n}
Output: ${this.truncateOutput(i, 200)}`;
      this.accumulatedThinking ? this.accumulatedThinking += `
${c}` : this.accumulatedThinking = c, this.currentCallbacks.onThinking(this.accumulatedThinking);
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
    const { requestId: t, requestType: n, payload: r } = e.payload;
    if (n !== "question.ask") {
      console.warn("[WebSocketAdapter] Unsupported request type:", n);
      return;
    }
    const i = r, c = (s = this.currentCallbacks) != null && s.onQuestion ? (a) => {
      var l, d;
      return (d = (l = this.currentCallbacks) == null ? void 0 : l.onQuestion) == null ? void 0 : d.call(l, a);
    } : this.publicQuestionHandler ? (a) => {
      var l;
      return (l = this.publicQuestionHandler) == null ? void 0 : l.call(this, a, { autoFocus: !1 });
    } : null;
    try {
      if (!c) {
        console.warn(
          "[WebSocketAdapter] Received hub.request but no question handler is registered"
        ), this.postHubResponse(t, []);
        return;
      }
      const a = await c(i);
      this.postHubResponse(t, a), this.emitDebugEvent("question.response.posted", {
        requestId: t,
        answersCount: a.length
      });
    } catch (a) {
      console.error("[WebSocketAdapter] Failed to handle question:", a), this.emitDebugEvent("question.response.post_error", {
        requestId: t,
        message: this.errorMessage(a)
      });
      try {
        this.postHubResponse(t, []);
      } catch (l) {
        console.error("[WebSocketAdapter] Failed to send fallback response:", l);
      }
    }
  }
  postHubResponse(e, t) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      throw new Error("WebSocket is not connected");
    const n = {
      type: "hub.response",
      requestId: e,
      response: t
    };
    this.ws.send(JSON.stringify(n)), console.log("[WebSocketAdapter] Question response sent:", e);
  }
  handleClose(e) {
    var t;
    console.log("[WebSocketAdapter] Connection closed:", e.code, e.reason), this.emitDebugEvent("connection.close", {
      code: e.code,
      reason: e.reason,
      wasClean: e.wasClean
    }), this.stopHeartbeat(), e.code !== 1e3 && this.reconnectCount < this.reconnectAttempts ? this.scheduleReconnect() : this.reconnectCount >= this.reconnectAttempts && (console.error("[WebSocketAdapter] Max reconnection attempts reached"), (t = this.currentCallbacks) == null || t.onError(
      new Error("Connection lost and max reconnection attempts reached")
    ), this.clearCurrentTurn());
  }
  handleError(e) {
    console.error("[WebSocketAdapter] WebSocket error:", e), this.emitDebugEvent("connection.error", {
      phase: "runtime"
    });
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
    ), this.emitDebugEvent("connection.reconnect.scheduled", {
      attempt: this.reconnectCount,
      maxAttempts: this.reconnectAttempts,
      delayMs: e
    }), this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect(), console.log("[WebSocketAdapter] Reconnected successfully"), this.emitDebugEvent("connection.reconnect.success", {
          attempt: this.reconnectCount
        });
      } catch (t) {
        console.error("[WebSocketAdapter] Reconnection failed:", t), this.emitDebugEvent("connection.reconnect.failure", {
          attempt: this.reconnectCount,
          message: this.errorMessage(t)
        });
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
    const n = {
      type: "user_message",
      content: e.message
    }, r = JSON.stringify(n);
    this.ws.readyState === WebSocket.OPEN ? (this.ws.send(r), this.emitDebugEvent("message.outbound.user_message", {
      textLength: e.message.length
    })) : (this.pendingMessages.push(r), this.emitDebugEvent("message.outbound.queued", {
      reason: "socket_not_open"
    }));
  }
  cancel() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const e = { type: "cancel" };
      this.ws.send(JSON.stringify(e)), this.emitDebugEvent("message.outbound.cancel", {});
    }
    this.clearCurrentTurn();
  }
  async updateSessionInfo(e) {
    const n = JSON.stringify({
      type: "session.info.update",
      sessionInfo: e
    });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(n), this.emitDebugEvent("message.outbound.session_info_update", { sessionInfo: e });
      return;
    }
    this.pendingMessages.push(n), this.emitDebugEvent("message.outbound.queued", {
      reason: "socket_not_open",
      messageType: "session.info.update"
    });
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
    this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.stopHeartbeat(), this.ws && (this.ws.close(1e3, "Client disconnect"), this.ws = null), this.emitDebugEvent("connection.disconnect", {}), this.clearCurrentTurn(), this.reconnectCount = 0, this.pendingMessages = [];
  }
  getSlashCommands() {
    return [{ name: "new", description: "Start a new conversation" }];
  }
  async newSession() {
    this.disconnect();
  }
}
const Du = "Welcome to Audako MCP Chat. How can I assist you today?", zu = "Audako Assistant", Fe = (u) => ({
  text: u.trim(),
  attachments: []
}), ee = (u = 0) => (Date.now() + u).toString(), Ru = (u, e = "1") => ({
  id: e,
  from: "system",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), ve = (u) => ({
  id: ee(),
  from: "user",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), Se = (u) => ({
  id: u,
  from: "assistant",
  text: "",
  timestamp: /* @__PURE__ */ new Date(),
  isStreaming: !0
}), Te = (u) => u.label, Me = 300, Ie = ({ getConfig: u, getShowThinking: e, scrollToBottom: t }) => {
  const n = o.proxy({
    messages: [],
    draft: "",
    isTyping: !1,
    streamingMessageId: null,
    pendingQuestion: null,
    selectedQuestionAnswers: [],
    shouldFocusQuestion: !1
  });
  let r = null, i = null, c = null, s = !1;
  const a = (...p) => {
    console.log("[chat-ui]", ...p);
  }, l = () => {
    n.pendingQuestion = null, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = !1, r = null;
  }, d = (p) => {
    const _ = r;
    l(), _ == null || _(p);
  }, f = (p, _ = !1) => (r && r([]), n.pendingQuestion = p, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = _, new Promise((x) => {
    r = x;
  })), m = (p, _) => {
    const x = n.messages.findIndex((y) => y.id === p);
    x !== -1 && (n.messages[x] = _(n.messages[x]), n.messages = [...n.messages]);
  };
  return {
    state: n,
    syncConfig: () => {
      var x, y, S, L;
      const p = u(), _ = p == null ? void 0 : p.adapter;
      if (a("config resolved", {
        title: p == null ? void 0 : p.title,
        hasAdapter: !!(p != null && p.adapter),
        adapterType: (y = (x = p == null ? void 0 : p.adapter) == null ? void 0 : x.constructor) == null ? void 0 : y.name,
        hasInitialMessage: !!(p != null && p.initialMessage)
      }), c && c !== _ && ((S = c.setPublicQuestionHandler) == null || S.call(c, null), c = null), _ && c !== _) {
        const v = (B, M) => f(B, (M == null ? void 0 : M.autoFocus) ?? !1);
        (L = _.setPublicQuestionHandler) == null || L.call(_, v), c = _;
      }
      _ && typeof _.init == "function" && _ !== i && (i = _, a("initializing adapter"), _.init().catch((v) => {
        console.error("Failed to initialize adapter:", v);
      })), s || (s = !0, n.messages = [
        Ru((p == null ? void 0 : p.initialMessage) ?? Du)
      ]);
    },
    setDraft: (p) => {
      n.draft = p;
    },
    sendMessage: async () => {
      var L;
      const p = u(), _ = Fe(n.draft);
      if (a("sendMessage called", {
        draftLength: n.draft.length,
        isDraftEmpty: !_.text,
        hasStreamingMessage: !!n.streamingMessageId,
        hasAdapter: !!(p != null && p.adapter),
        attachmentCount: _.attachments.length
      }), !_.text || n.streamingMessageId || !(p != null && p.adapter)) {
        a("sendMessage aborted", {
          reason: {
            emptyDraft: !_.text,
            streamingInProgress: !!n.streamingMessageId,
            missingAdapter: !(p != null && p.adapter)
          }
        });
        return;
      }
      const x = ve(_.text);
      n.messages = [...n.messages, x], a("user message appended", {
        messageId: x.id,
        totalMessages: n.messages.length
      }), n.draft = "", t(), n.isTyping = !0, await new Promise((v) => setTimeout(v, Me));
      const y = ee(1), S = Se(y);
      n.messages = [...n.messages, S], n.isTyping = !1, n.streamingMessageId = y, a("assistant streaming message created", {
        messageId: y,
        historyLength: n.messages.filter((v) => v.from !== "system").length,
        adapterType: (L = p.adapter.constructor) == null ? void 0 : L.name
      }), t();
      try {
        a("calling adapter.sendMessage"), await p.adapter.sendMessage(
          {
            message: _.text,
            conversationHistory: n.messages.filter((v) => v.from !== "system")
          },
          {
            onChunk: (v) => {
              a("adapter chunk received", { messageId: y, chunkLength: v.length }), m(y, (B) => ({ ...B, text: v })), t();
            },
            onThinking: (v) => {
              e() && (a("adapter thinking chunk received", { messageId: y, chunkLength: v.length }), m(y, (B) => ({ ...B, thinking: { content: v, isStreaming: !0 } })), t());
            },
            onQuestion: async (v) => {
              var j;
              a("adapter question received", {
                optionCount: ((j = v.options) == null ? void 0 : j.length) ?? 0,
                allowMultiple: !!v.allowMultiple
              });
              const B = typeof document < "u" ? document.activeElement : null, M = B instanceof HTMLElement && B.classList.contains("chat-widget__input");
              return f(v, M);
            },
            onComplete: () => {
              a("adapter stream completed", { messageId: y }), m(y, (v) => ({
                ...v,
                isStreaming: !1,
                thinking: e() && v.thinking ? { ...v.thinking, isStreaming: !1 } : void 0
              })), l(), n.streamingMessageId = null, t();
            },
            onError: (v) => {
              a("adapter stream errored", { messageId: y, errorMessage: v.message }), console.error("Chat error:", v), m(y, (B) => ({
                ...B,
                text: `Error: ${v.message}`,
                isStreaming: !1
              })), l(), n.streamingMessageId = null, t();
            }
          }
        ), a("adapter.sendMessage resolved", { messageId: y });
      } catch (v) {
        a("adapter.sendMessage threw", {
          messageId: y,
          errorMessage: v instanceof Error ? v.message : "Unknown error"
        }), console.error("Unexpected error:", v), m(y, (B) => ({
          ...B,
          text: "Unexpected error occurred",
          isStreaming: !1
        })), l(), n.streamingMessageId = null, t();
      }
    },
    cancelMessage: () => {
      var x, y;
      const p = u(), _ = n.streamingMessageId;
      _ && (a("cancelMessage called", { messageId: _ }), (y = (x = p == null ? void 0 : p.adapter) == null ? void 0 : x.cancel) == null || y.call(x), m(_, (S) => ({
        ...S,
        isStreaming: !1,
        thinking: S.thinking ? { ...S.thinking, isStreaming: !1 } : void 0
      })), l(), n.streamingMessageId = null, n.isTyping = !1);
    },
    toggleQuestionAnswer: (p) => {
      if (n.pendingQuestion) {
        if (!n.pendingQuestion.allowMultiple) {
          d([p]);
          return;
        }
        n.selectedQuestionAnswers.includes(p) ? n.selectedQuestionAnswers = n.selectedQuestionAnswers.filter((_) => _ !== p) : n.selectedQuestionAnswers = [...n.selectedQuestionAnswers, p];
      }
    },
    submitQuestionAnswers: () => {
      var p;
      !((p = n.pendingQuestion) != null && p.allowMultiple) || n.selectedQuestionAnswers.length === 0 || d(n.selectedQuestionAnswers);
    },
    submitCustomAnswer: (p) => {
      !n.pendingQuestion || !p || d([p]);
    },
    clearQuestionFocusRequest: () => {
      n.shouldFocusQuestion = !1;
    },
    getSlashCommands: () => {
      var _, x;
      const p = u();
      return ((x = (_ = p == null ? void 0 : p.adapter) == null ? void 0 : _.getSlashCommands) == null ? void 0 : x.call(_)) ?? [];
    },
    executeSlashCommand: async (p) => {
      var x, y;
      const _ = u();
      a("executeSlashCommand called", { commandName: p }), p === "new" && (await ((y = (x = _ == null ? void 0 : _.adapter) == null ? void 0 : x.newSession) == null ? void 0 : y.call(x)), s = !1, n.messages = [], n.draft = "", n.isTyping = !1, n.streamingMessageId = null, l(), s = !0, n.messages = [
        Ru((_ == null ? void 0 : _.initialMessage) ?? Du)
      ], a("new session started"));
    }
  };
};
var qe = o.from_html('<h2 class="chat-widget__header-title svelte-hbwy0v"> </h2>'), Be = o.from_html('<header class="chat-widget__header svelte-hbwy0v"><div><!></div></header>');
function ze(u, e) {
  var t = Be(), n = o.child(t), r = o.child(n);
  {
    var i = (s) => {
      var a = o.comment(), l = o.first_child(a);
      o.snippet(l, () => e.header, () => e.title), o.append(s, a);
    }, c = (s) => {
      var a = qe(), l = o.child(a, !0);
      o.reset(a), o.template_effect(() => o.set_text(l, e.title)), o.append(s, a);
    };
    o.if(r, (s) => {
      e.header ? s(i) : s(c, !1);
    });
  }
  o.reset(n), o.reset(t), o.append(u, t);
}
var Re = o.from_html('<button type="button"><span class="chat-widget__slash-name svelte-u1oxqp"> </span> <span class="chat-widget__slash-desc svelte-u1oxqp"> </span></button>'), Le = o.from_html('<div class="chat-widget__slash-menu svelte-u1oxqp"></div>');
function Pe(u, e) {
  o.push(e, !0);
  var t = Le();
  o.each(t, 21, () => e.commands, o.index, (n, r, i) => {
    var c = Re();
    let s;
    c.__click = () => e.onSelect(o.get(r));
    var a = o.child(c), l = o.child(a);
    o.reset(a);
    var d = o.sibling(a, 2), f = o.child(d, !0);
    o.reset(d), o.reset(c), o.template_effect(() => {
      s = o.set_class(c, 1, "chat-widget__slash-item svelte-u1oxqp", null, s, {
        "chat-widget__slash-item--selected": i === e.selectedIndex
      }), o.set_text(l, `/${o.get(r).name ?? ""}`), o.set_text(f, o.get(r).description);
    }), o.append(n, c);
  }), o.reset(t), o.append(u, t), o.pop();
}
o.delegate(["click"]);
var Oe = o.from_html('<div class="chat-widget__slash-menu-anchor svelte-1m0eido"><!></div>'), Ne = o.from_html('<button type="button" class="chat-widget__send chat-widget__send--cancel svelte-1m0eido" title="Stop generating"><svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon svelte-1m0eido" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="5" width="10" height="10" rx="1.5"></rect></svg></button>'), He = o.from_html('<button type="submit" class="chat-widget__send svelte-1m0eido" title="Send message"><svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon svelte-1m0eido" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button>'), Ue = o.from_html('<div class="chat-widget__composer-wrap svelte-1m0eido"><!> <form class="chat-widget__composer svelte-1m0eido"><div class="chat-widget__input-wrap svelte-1m0eido"><textarea class="chat-widget__input svelte-1m0eido" rows="1"></textarea></div> <!></form></div>');
function Qe(u, e) {
  o.push(e, !0);
  let t = o.prop(e, "isStreaming", 3, !1), n = o.prop(e, "slashCommands", 19, () => []);
  const r = 160;
  let i = o.state(void 0), c = o.state(0);
  const s = o.derived(() => e.draft.startsWith("/") ? e.draft.slice(1).toLowerCase() : null), a = o.derived(() => o.get(s) !== null ? n().filter((x) => x.name.toLowerCase().startsWith(o.get(s))) : []), l = o.derived(() => o.get(s) !== null && o.get(a).length > 0), d = o.derived(() => !e.draft.trim() || e.disabled || o.get(l));
  o.user_effect(() => {
    o.get(a), o.set(c, 0);
  });
  const f = (x = o.get(i)) => {
    if (!x)
      return;
    x.style.height = "auto";
    const y = Math.min(x.scrollHeight, r);
    x.style.height = `${y}px`, x.style.overflowY = x.scrollHeight > r ? "auto" : "hidden";
  }, m = (x) => {
    var y;
    (y = e.onSlashCommand) == null || y.call(e, x), e.onDraftChange("");
  }, b = (x) => {
    if (x.preventDefault(), o.get(l)) {
      const y = o.get(a)[o.get(c)];
      y && m(y);
      return;
    }
    o.get(d) || e.onSubmit();
  }, h = (x) => {
    var y;
    if (!x.isComposing) {
      if (o.get(l)) {
        if (x.key === "ArrowDown") {
          x.preventDefault(), o.set(c, (o.get(c) + 1) % o.get(a).length);
          return;
        }
        if (x.key === "ArrowUp") {
          x.preventDefault(), o.set(c, (o.get(c) - 1 + o.get(a).length) % o.get(a).length);
          return;
        }
        if (x.key === "Enter") {
          x.preventDefault();
          const S = o.get(a)[o.get(c)];
          S && m(S);
          return;
        }
        if (x.key === "Escape") {
          x.preventDefault(), e.onDraftChange("");
          return;
        }
        if (x.key === "Tab") {
          x.preventDefault();
          const S = o.get(a)[o.get(c)];
          S && e.onDraftChange(`/${S.name}`);
          return;
        }
        return;
      }
      if (x.key === "Escape") {
        x.preventDefault(), (y = e.onCancel) == null || y.call(e);
        return;
      }
      x.key !== "Enter" || x.shiftKey || (x.preventDefault(), !o.get(d) && e.onSubmit());
    }
  }, D = (x) => {
    const y = x.currentTarget;
    e.onDraftChange(y.value), f(y);
  };
  o.user_effect(() => {
    e.draft, f();
  });
  var A = Ue(), F = o.child(A);
  {
    var k = (x) => {
      var y = Oe(), S = o.child(y);
      Pe(S, {
        get commands() {
          return o.get(a);
        },
        get selectedIndex() {
          return o.get(c);
        },
        onSelect: m
      }), o.reset(y), o.append(x, y);
    };
    o.if(F, (x) => {
      o.get(l) && x(k);
    });
  }
  var E = o.sibling(F, 2), C = o.child(E), g = o.child(C);
  o.remove_textarea_child(g), g.__input = D, g.__keydown = h, o.bind_this(g, (x) => o.set(i, x), () => o.get(i)), o.reset(C);
  var w = o.sibling(C, 2);
  {
    var p = (x) => {
      var y = Ne();
      y.__click = function(...S) {
        var L;
        (L = e.onCancel) == null || L.apply(this, S);
      }, o.append(x, y);
    }, _ = (x) => {
      var y = He();
      o.template_effect(() => y.disabled = o.get(d)), o.append(x, y);
    };
    o.if(w, (x) => {
      t() ? x(p) : x(_, !1);
    });
  }
  o.reset(E), o.reset(A), o.template_effect(() => {
    o.set_attribute(g, "placeholder", e.placeholder), o.set_value(g, e.draft);
  }), o.event("submit", E, b), o.append(u, A), o.pop();
}
o.delegate(["input", "keydown", "click"]);
const Lu = {};
function je(u) {
  let e = Lu[u];
  if (e)
    return e;
  e = Lu[u] = [];
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
function Y(u, e) {
  typeof e != "string" && (e = Y.defaultChars);
  const t = je(e);
  return u.replace(/(%[a-f0-9]{2})+/gi, function(n) {
    let r = "";
    for (let i = 0, c = n.length; i < c; i += 3) {
      const s = parseInt(n.slice(i + 1, i + 3), 16);
      if (s < 128) {
        r += t[s];
        continue;
      }
      if ((s & 224) === 192 && i + 3 < c) {
        const a = parseInt(n.slice(i + 4, i + 6), 16);
        if ((a & 192) === 128) {
          const l = s << 6 & 1984 | a & 63;
          l < 128 ? r += "��" : r += String.fromCharCode(l), i += 3;
          continue;
        }
      }
      if ((s & 240) === 224 && i + 6 < c) {
        const a = parseInt(n.slice(i + 4, i + 6), 16), l = parseInt(n.slice(i + 7, i + 9), 16);
        if ((a & 192) === 128 && (l & 192) === 128) {
          const d = s << 12 & 61440 | a << 6 & 4032 | l & 63;
          d < 2048 || d >= 55296 && d <= 57343 ? r += "���" : r += String.fromCharCode(d), i += 6;
          continue;
        }
      }
      if ((s & 248) === 240 && i + 9 < c) {
        const a = parseInt(n.slice(i + 4, i + 6), 16), l = parseInt(n.slice(i + 7, i + 9), 16), d = parseInt(n.slice(i + 10, i + 12), 16);
        if ((a & 192) === 128 && (l & 192) === 128 && (d & 192) === 128) {
          let f = s << 18 & 1835008 | a << 12 & 258048 | l << 6 & 4032 | d & 63;
          f < 65536 || f > 1114111 ? r += "����" : (f -= 65536, r += String.fromCharCode(55296 + (f >> 10), 56320 + (f & 1023))), i += 9;
          continue;
        }
      }
      r += "�";
    }
    return r;
  });
}
Y.defaultChars = ";/?:@&=+$,#";
Y.componentChars = "";
const Pu = {};
function We(u) {
  let e = Pu[u];
  if (e)
    return e;
  e = Pu[u] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    /^[0-9a-z]$/i.test(n) ? e.push(n) : e.push("%" + ("0" + t.toString(16).toUpperCase()).slice(-2));
  }
  for (let t = 0; t < u.length; t++)
    e[u.charCodeAt(t)] = u[t];
  return e;
}
function ru(u, e, t) {
  typeof e != "string" && (t = e, e = ru.defaultChars), typeof t > "u" && (t = !0);
  const n = We(e);
  let r = "";
  for (let i = 0, c = u.length; i < c; i++) {
    const s = u.charCodeAt(i);
    if (t && s === 37 && i + 2 < c && /^[0-9a-f]{2}$/i.test(u.slice(i + 1, i + 3))) {
      r += u.slice(i, i + 3), i += 2;
      continue;
    }
    if (s < 128) {
      r += n[s];
      continue;
    }
    if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && i + 1 < c) {
        const a = u.charCodeAt(i + 1);
        if (a >= 56320 && a <= 57343) {
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
ru.defaultChars = ";/?:@&=+$,-_.!~*'()#";
ru.componentChars = "-_.!~*'()";
function Fu(u) {
  let e = "";
  return e += u.protocol || "", e += u.slashes ? "//" : "", e += u.auth ? u.auth + "@" : "", u.hostname && u.hostname.indexOf(":") !== -1 ? e += "[" + u.hostname + "]" : e += u.hostname || "", e += u.port ? ":" + u.port : "", e += u.pathname || "", e += u.search || "", e += u.hash || "", e;
}
function ou() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const Ze = /^([a-z0-9.+-]+:)/i, Ge = /:[0-9]*$/, Ve = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, Je = ["<", ">", '"', "`", " ", "\r", `
`, "	"], Xe = ["{", "}", "|", "\\", "^", "`"].concat(Je), Ye = ["'"].concat(Xe), Ou = ["%", "/", "?", ";", "#"].concat(Ye), Nu = ["/", "?", "#"], Ke = 255, Hu = /^[+a-z0-9A-Z_-]{0,63}$/, $e = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Uu = {
  javascript: !0,
  "javascript:": !0
}, Qu = {
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
function vu(u, e) {
  if (u && u instanceof ou) return u;
  const t = new ou();
  return t.parse(u, e), t;
}
ou.prototype.parse = function(u, e) {
  let t, n, r, i = u;
  if (i = i.trim(), !e && u.split("#").length === 1) {
    const l = Ve.exec(i);
    if (l)
      return this.pathname = l[1], l[2] && (this.search = l[2]), this;
  }
  let c = Ze.exec(i);
  if (c && (c = c[0], t = c.toLowerCase(), this.protocol = c, i = i.substr(c.length)), (e || c || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(c && Uu[c]) && (i = i.substr(2), this.slashes = !0)), !Uu[c] && (r || c && !Qu[c])) {
    let l = -1;
    for (let h = 0; h < Nu.length; h++)
      n = i.indexOf(Nu[h]), n !== -1 && (l === -1 || n < l) && (l = n);
    let d, f;
    l === -1 ? f = i.lastIndexOf("@") : f = i.lastIndexOf("@", l), f !== -1 && (d = i.slice(0, f), i = i.slice(f + 1), this.auth = d), l = -1;
    for (let h = 0; h < Ou.length; h++)
      n = i.indexOf(Ou[h]), n !== -1 && (l === -1 || n < l) && (l = n);
    l === -1 && (l = i.length), i[l - 1] === ":" && l--;
    const m = i.slice(0, l);
    i = i.slice(l), this.parseHost(m), this.hostname = this.hostname || "";
    const b = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!b) {
      const h = this.hostname.split(/\./);
      for (let D = 0, A = h.length; D < A; D++) {
        const F = h[D];
        if (F && !F.match(Hu)) {
          let k = "";
          for (let E = 0, C = F.length; E < C; E++)
            F.charCodeAt(E) > 127 ? k += "x" : k += F[E];
          if (!k.match(Hu)) {
            const E = h.slice(0, D), C = h.slice(D + 1), g = F.match($e);
            g && (E.push(g[1]), C.unshift(g[2])), C.length && (i = C.join(".") + i), this.hostname = E.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Ke && (this.hostname = ""), b && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const s = i.indexOf("#");
  s !== -1 && (this.hash = i.substr(s), i = i.slice(0, s));
  const a = i.indexOf("?");
  return a !== -1 && (this.search = i.substr(a), i = i.slice(0, a)), i && (this.pathname = i), Qu[t] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
ou.prototype.parseHost = function(u) {
  let e = Ge.exec(u);
  e && (e = e[0], e !== ":" && (this.port = e.substr(1)), u = u.substr(0, u.length - e.length)), u && (this.hostname = u);
};
const u0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: Y,
  encode: ru,
  format: Fu,
  parse: vu
}, Symbol.toStringTag, { value: "Module" })), te = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, ne = /[\0-\x1F\x7F-\x9F]/, e0 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Su = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, re = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, ie = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, t0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: te,
  Cc: ne,
  Cf: e0,
  P: Su,
  S: re,
  Z: ie
}, Symbol.toStringTag, { value: "Module" })), n0 = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((u) => u.charCodeAt(0))
), r0 = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((u) => u.charCodeAt(0))
);
var mu;
const i0 = /* @__PURE__ */ new Map([
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
]), c0 = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (mu = String.fromCodePoint) !== null && mu !== void 0 ? mu : function(u) {
    let e = "";
    return u > 65535 && (u -= 65536, e += String.fromCharCode(u >>> 10 & 1023 | 55296), u = 56320 | u & 1023), e += String.fromCharCode(u), e;
  }
);
function s0(u) {
  var e;
  return u >= 55296 && u <= 57343 || u > 1114111 ? 65533 : (e = i0.get(u)) !== null && e !== void 0 ? e : u;
}
var q;
(function(u) {
  u[u.NUM = 35] = "NUM", u[u.SEMI = 59] = "SEMI", u[u.EQUALS = 61] = "EQUALS", u[u.ZERO = 48] = "ZERO", u[u.NINE = 57] = "NINE", u[u.LOWER_A = 97] = "LOWER_A", u[u.LOWER_F = 102] = "LOWER_F", u[u.LOWER_X = 120] = "LOWER_X", u[u.LOWER_Z = 122] = "LOWER_Z", u[u.UPPER_A = 65] = "UPPER_A", u[u.UPPER_F = 70] = "UPPER_F", u[u.UPPER_Z = 90] = "UPPER_Z";
})(q || (q = {}));
const a0 = 32;
var G;
(function(u) {
  u[u.VALUE_LENGTH = 49152] = "VALUE_LENGTH", u[u.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", u[u.JUMP_TABLE = 127] = "JUMP_TABLE";
})(G || (G = {}));
function Eu(u) {
  return u >= q.ZERO && u <= q.NINE;
}
function o0(u) {
  return u >= q.UPPER_A && u <= q.UPPER_F || u >= q.LOWER_A && u <= q.LOWER_F;
}
function l0(u) {
  return u >= q.UPPER_A && u <= q.UPPER_Z || u >= q.LOWER_A && u <= q.LOWER_Z || Eu(u);
}
function d0(u) {
  return u === q.EQUALS || l0(u);
}
var I;
(function(u) {
  u[u.EntityStart = 0] = "EntityStart", u[u.NumericStart = 1] = "NumericStart", u[u.NumericDecimal = 2] = "NumericDecimal", u[u.NumericHex = 3] = "NumericHex", u[u.NamedEntity = 4] = "NamedEntity";
})(I || (I = {}));
var Z;
(function(u) {
  u[u.Legacy = 0] = "Legacy", u[u.Strict = 1] = "Strict", u[u.Attribute = 2] = "Attribute";
})(Z || (Z = {}));
class f0 {
  constructor(e, t, n) {
    this.decodeTree = e, this.emitCodePoint = t, this.errors = n, this.state = I.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = Z.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(e) {
    this.decodeMode = e, this.state = I.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
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
      case I.EntityStart:
        return e.charCodeAt(t) === q.NUM ? (this.state = I.NumericStart, this.consumed += 1, this.stateNumericStart(e, t + 1)) : (this.state = I.NamedEntity, this.stateNamedEntity(e, t));
      case I.NumericStart:
        return this.stateNumericStart(e, t);
      case I.NumericDecimal:
        return this.stateNumericDecimal(e, t);
      case I.NumericHex:
        return this.stateNumericHex(e, t);
      case I.NamedEntity:
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
    return t >= e.length ? -1 : (e.charCodeAt(t) | a0) === q.LOWER_X ? (this.state = I.NumericHex, this.consumed += 1, this.stateNumericHex(e, t + 1)) : (this.state = I.NumericDecimal, this.stateNumericDecimal(e, t));
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
      if (Eu(r) || o0(r))
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
    if (e === q.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === Z.Strict)
      return 0;
    return this.emitCodePoint(s0(this.result), this.consumed), this.errors && (e !== q.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
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
    let r = n[this.treeIndex], i = (r & G.VALUE_LENGTH) >> 14;
    for (; t < e.length; t++, this.excess++) {
      const c = e.charCodeAt(t);
      if (this.treeIndex = h0(n, r, this.treeIndex + Math.max(1, i), c), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === Z.Attribute && // We shouldn't have consumed any characters after the entity,
        (i === 0 || // And there should be no invalid characters.
        d0(c)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (r = n[this.treeIndex], i = (r & G.VALUE_LENGTH) >> 14, i !== 0) {
        if (c === q.SEMI)
          return this.emitNamedEntityData(this.treeIndex, i, this.consumed + this.excess);
        this.decodeMode !== Z.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
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
    const { result: t, decodeTree: n } = this, r = (n[t] & G.VALUE_LENGTH) >> 14;
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
    return this.emitCodePoint(t === 1 ? r[e] & ~G.VALUE_LENGTH : r[e + 1], n), t === 3 && this.emitCodePoint(r[e + 2], n), n;
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
      case I.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== Z.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case I.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case I.NumericHex:
        return this.emitNumericEntity(0, 3);
      case I.NumericStart:
        return (e = this.errors) === null || e === void 0 || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case I.EntityStart:
        return 0;
    }
  }
}
function ce(u) {
  let e = "";
  const t = new f0(u, (n) => e += c0(n));
  return function(r, i) {
    let c = 0, s = 0;
    for (; (s = r.indexOf("&", s)) >= 0; ) {
      e += r.slice(c, s), t.startEntity(i);
      const l = t.write(
        r,
        // Skip the "&"
        s + 1
      );
      if (l < 0) {
        c = s + t.end();
        break;
      }
      c = s + l, s = l === 0 ? c + 1 : c;
    }
    const a = e + r.slice(c);
    return e = "", a;
  };
}
function h0(u, e, t, n) {
  const r = (e & G.BRANCH_LENGTH) >> 7, i = e & G.JUMP_TABLE;
  if (r === 0)
    return i !== 0 && n === i ? t : -1;
  if (i) {
    const a = n - i;
    return a < 0 || a >= r ? -1 : u[t + a] - 1;
  }
  let c = t, s = c + r - 1;
  for (; c <= s; ) {
    const a = c + s >>> 1, l = u[a];
    if (l < n)
      c = a + 1;
    else if (l > n)
      s = a - 1;
    else
      return u[a + r];
  }
  return -1;
}
const b0 = ce(n0);
ce(r0);
function se(u, e = Z.Legacy) {
  return b0(u, e);
}
function p0(u) {
  return Object.prototype.toString.call(u);
}
function Tu(u) {
  return p0(u) === "[object String]";
}
const m0 = Object.prototype.hasOwnProperty;
function g0(u, e) {
  return m0.call(u, e);
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
function ae(u, e, t) {
  return [].concat(u.slice(0, e), t, u.slice(e + 1));
}
function Mu(u) {
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
const oe = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, _0 = /&([a-z#][a-z0-9]{1,31});/gi, x0 = new RegExp(oe.source + "|" + _0.source, "gi"), k0 = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function y0(u, e) {
  if (e.charCodeAt(0) === 35 && k0.test(e)) {
    const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Mu(n) ? lu(n) : u;
  }
  const t = se(u);
  return t !== u ? t : u;
}
function C0(u) {
  return u.indexOf("\\") < 0 ? u : u.replace(oe, "$1");
}
function K(u) {
  return u.indexOf("\\") < 0 && u.indexOf("&") < 0 ? u : u.replace(x0, function(e, t, n) {
    return t || y0(e, n);
  });
}
const D0 = /[&<>"]/, E0 = /[&<>"]/g, w0 = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function A0(u) {
  return w0[u];
}
function V(u) {
  return D0.test(u) ? u.replace(E0, A0) : u;
}
const F0 = /[.?*+^$[\]\\(){}|-]/g;
function v0(u) {
  return u.replace(F0, "\\$&");
}
function T(u) {
  switch (u) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function uu(u) {
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
function eu(u) {
  return Su.test(u) || re.test(u);
}
function tu(u) {
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
const S0 = { mdurl: u0, ucmicro: t0 }, T0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: ae,
  assign: fu,
  escapeHtml: V,
  escapeRE: v0,
  fromCodePoint: lu,
  has: g0,
  isMdAsciiPunct: tu,
  isPunctChar: eu,
  isSpace: T,
  isString: Tu,
  isValidEntityCode: Mu,
  isWhiteSpace: uu,
  lib: S0,
  normalizeReference: hu,
  unescapeAll: K,
  unescapeMd: C0
}, Symbol.toStringTag, { value: "Module" }));
function M0(u, e, t) {
  let n, r, i, c;
  const s = u.posMax, a = u.pos;
  for (u.pos = e + 1, n = 1; u.pos < s; ) {
    if (i = u.src.charCodeAt(u.pos), i === 93 && (n--, n === 0)) {
      r = !0;
      break;
    }
    if (c = u.pos, u.md.inline.skipToken(u), i === 91) {
      if (c === u.pos - 1)
        n++;
      else if (t)
        return u.pos = a, -1;
    }
  }
  let l = -1;
  return r && (l = u.pos), u.pos = a, l;
}
function I0(u, e, t) {
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
  let c = 0;
  for (; r < t && (n = u.charCodeAt(r), !(n === 32 || n < 32 || n === 127)); ) {
    if (n === 92 && r + 1 < t) {
      if (u.charCodeAt(r + 1) === 32)
        break;
      r += 2;
      continue;
    }
    if (n === 40 && (c++, c > 32))
      return i;
    if (n === 41) {
      if (c === 0)
        break;
      c--;
    }
    r++;
  }
  return e === r || c !== 0 || (i.str = K(u.slice(e, r)), i.pos = r, i.ok = !0), i;
}
function q0(u, e, t, n) {
  let r, i = e;
  const c = {
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
    c.str = n.str, c.marker = n.marker;
  else {
    if (i >= t)
      return c;
    let s = u.charCodeAt(i);
    if (s !== 34 && s !== 39 && s !== 40)
      return c;
    e++, i++, s === 40 && (s = 41), c.marker = s;
  }
  for (; i < t; ) {
    if (r = u.charCodeAt(i), r === c.marker)
      return c.pos = i + 1, c.str += K(u.slice(e, i)), c.ok = !0, c;
    if (r === 40 && c.marker === 41)
      return c;
    r === 92 && i + 1 < t && i++, i++;
  }
  return c.can_continue = !0, c.str += K(u.slice(e, i)), c;
}
const B0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: I0,
  parseLinkLabel: M0,
  parseLinkTitle: q0
}, Symbol.toStringTag, { value: "Module" })), U = {};
U.code_inline = function(u, e, t, n, r) {
  const i = u[e];
  return "<code" + r.renderAttrs(i) + ">" + V(i.content) + "</code>";
};
U.code_block = function(u, e, t, n, r) {
  const i = u[e];
  return "<pre" + r.renderAttrs(i) + "><code>" + V(u[e].content) + `</code></pre>
`;
};
U.fence = function(u, e, t, n, r) {
  const i = u[e], c = i.info ? K(i.info).trim() : "";
  let s = "", a = "";
  if (c) {
    const d = c.split(/(\s+)/g);
    s = d[0], a = d.slice(2).join("");
  }
  let l;
  if (t.highlight ? l = t.highlight(i.content, s, a) || V(i.content) : l = V(i.content), l.indexOf("<pre") === 0)
    return l + `
`;
  if (c) {
    const d = i.attrIndex("class"), f = i.attrs ? i.attrs.slice() : [];
    d < 0 ? f.push(["class", t.langPrefix + s]) : (f[d] = f[d].slice(), f[d][1] += " " + t.langPrefix + s);
    const m = {
      attrs: f
    };
    return `<pre><code${r.renderAttrs(m)}>${l}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${l}</code></pre>
`;
};
U.image = function(u, e, t, n, r) {
  const i = u[e];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, t, n), r.renderToken(u, e, t);
};
U.hardbreak = function(u, e, t) {
  return t.xhtmlOut ? `<br />
` : `<br>
`;
};
U.softbreak = function(u, e, t) {
  return t.breaks ? t.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
U.text = function(u, e) {
  return V(u[e].content);
};
U.html_block = function(u, e) {
  return u[e].content;
};
U.html_inline = function(u, e) {
  return u[e].content;
};
function $() {
  this.rules = fu({}, U);
}
$.prototype.renderAttrs = function(e) {
  let t, n, r;
  if (!e.attrs)
    return "";
  for (r = "", t = 0, n = e.attrs.length; t < n; t++)
    r += " " + V(e.attrs[t][0]) + '="' + V(e.attrs[t][1]) + '"';
  return r;
};
$.prototype.renderToken = function(e, t, n) {
  const r = e[t];
  let i = "";
  if (r.hidden)
    return "";
  r.block && r.nesting !== -1 && t && e[t - 1].hidden && (i += `
`), i += (r.nesting === -1 ? "</" : "<") + r.tag, i += this.renderAttrs(r), r.nesting === 0 && n.xhtmlOut && (i += " /");
  let c = !1;
  if (r.block && (c = !0, r.nesting === 1 && t + 1 < e.length)) {
    const s = e[t + 1];
    (s.type === "inline" || s.hidden || s.nesting === -1 && s.tag === r.tag) && (c = !1);
  }
  return i += c ? `>
` : ">", i;
};
$.prototype.renderInline = function(u, e, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, c = u.length; i < c; i++) {
    const s = u[i].type;
    typeof r[s] < "u" ? n += r[s](u, i, e, t, this) : n += this.renderToken(u, i, e);
  }
  return n;
};
$.prototype.renderInlineAsText = function(u, e, t) {
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
$.prototype.render = function(u, e, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, c = u.length; i < c; i++) {
    const s = u[i].type;
    s === "inline" ? n += this.renderInline(u[i].children, e, t) : typeof r[s] < "u" ? n += r[s](u, i, e, t, this) : n += this.renderToken(u, i, e, t);
  }
  return n;
};
function z() {
  this.__rules__ = [], this.__cache__ = null;
}
z.prototype.__find__ = function(u) {
  for (let e = 0; e < this.__rules__.length; e++)
    if (this.__rules__[e].name === u)
      return e;
  return -1;
};
z.prototype.__compile__ = function() {
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
z.prototype.at = function(u, e, t) {
  const n = this.__find__(u), r = t || {};
  if (n === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__[n].fn = e, this.__rules__[n].alt = r.alt || [], this.__cache__ = null;
};
z.prototype.before = function(u, e, t, n) {
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
z.prototype.after = function(u, e, t, n) {
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
z.prototype.push = function(u, e, t) {
  const n = t || {};
  this.__rules__.push({
    name: u,
    enabled: !0,
    fn: e,
    alt: n.alt || []
  }), this.__cache__ = null;
};
z.prototype.enable = function(u, e) {
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
z.prototype.enableOnly = function(u, e) {
  Array.isArray(u) || (u = [u]), this.__rules__.forEach(function(t) {
    t.enabled = !1;
  }), this.enable(u, e);
};
z.prototype.disable = function(u, e) {
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
z.prototype.getRules = function(u) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[u] || [];
};
function O(u, e, t) {
  this.type = u, this.tag = e, this.attrs = null, this.map = null, this.nesting = t, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
O.prototype.attrIndex = function(e) {
  if (!this.attrs)
    return -1;
  const t = this.attrs;
  for (let n = 0, r = t.length; n < r; n++)
    if (t[n][0] === e)
      return n;
  return -1;
};
O.prototype.attrPush = function(e) {
  this.attrs ? this.attrs.push(e) : this.attrs = [e];
};
O.prototype.attrSet = function(e, t) {
  const n = this.attrIndex(e), r = [e, t];
  n < 0 ? this.attrPush(r) : this.attrs[n] = r;
};
O.prototype.attrGet = function(e) {
  const t = this.attrIndex(e);
  let n = null;
  return t >= 0 && (n = this.attrs[t][1]), n;
};
O.prototype.attrJoin = function(e, t) {
  const n = this.attrIndex(e);
  n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = this.attrs[n][1] + " " + t;
};
function le(u, e, t) {
  this.src = u, this.env = t, this.tokens = [], this.inlineMode = !1, this.md = e;
}
le.prototype.Token = O;
const z0 = /\r\n?|\n/g, R0 = /\0/g;
function L0(u) {
  let e;
  e = u.src.replace(z0, `
`), e = e.replace(R0, "�"), u.src = e;
}
function P0(u) {
  let e;
  u.inlineMode ? (e = new u.Token("inline", "", 0), e.content = u.src, e.map = [0, 1], e.children = [], u.tokens.push(e)) : u.md.block.parse(u.src, u.md, u.env, u.tokens);
}
function O0(u) {
  const e = u.tokens;
  for (let t = 0, n = e.length; t < n; t++) {
    const r = e[t];
    r.type === "inline" && u.md.inline.parse(r.content, u.md, u.env, r.children);
  }
}
function N0(u) {
  return /^<a[>\s]/i.test(u);
}
function H0(u) {
  return /^<\/a\s*>/i.test(u);
}
function U0(u) {
  const e = u.tokens;
  if (u.md.options.linkify)
    for (let t = 0, n = e.length; t < n; t++) {
      if (e[t].type !== "inline" || !u.md.linkify.pretest(e[t].content))
        continue;
      let r = e[t].children, i = 0;
      for (let c = r.length - 1; c >= 0; c--) {
        const s = r[c];
        if (s.type === "link_close") {
          for (c--; r[c].level !== s.level && r[c].type !== "link_open"; )
            c--;
          continue;
        }
        if (s.type === "html_inline" && (N0(s.content) && i > 0 && i--, H0(s.content) && i++), !(i > 0) && s.type === "text" && u.md.linkify.test(s.content)) {
          const a = s.content;
          let l = u.md.linkify.match(a);
          const d = [];
          let f = s.level, m = 0;
          l.length > 0 && l[0].index === 0 && c > 0 && r[c - 1].type === "text_special" && (l = l.slice(1));
          for (let b = 0; b < l.length; b++) {
            const h = l[b].url, D = u.md.normalizeLink(h);
            if (!u.md.validateLink(D))
              continue;
            let A = l[b].text;
            l[b].schema ? l[b].schema === "mailto:" && !/^mailto:/i.test(A) ? A = u.md.normalizeLinkText("mailto:" + A).replace(/^mailto:/, "") : A = u.md.normalizeLinkText(A) : A = u.md.normalizeLinkText("http://" + A).replace(/^http:\/\//, "");
            const F = l[b].index;
            if (F > m) {
              const g = new u.Token("text", "", 0);
              g.content = a.slice(m, F), g.level = f, d.push(g);
            }
            const k = new u.Token("link_open", "a", 1);
            k.attrs = [["href", D]], k.level = f++, k.markup = "linkify", k.info = "auto", d.push(k);
            const E = new u.Token("text", "", 0);
            E.content = A, E.level = f, d.push(E);
            const C = new u.Token("link_close", "a", -1);
            C.level = --f, C.markup = "linkify", C.info = "auto", d.push(C), m = l[b].lastIndex;
          }
          if (m < a.length) {
            const b = new u.Token("text", "", 0);
            b.content = a.slice(m), b.level = f, d.push(b);
          }
          e[t].children = r = ae(r, c, d);
        }
      }
    }
}
const de = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Q0 = /\((c|tm|r)\)/i, j0 = /\((c|tm|r)\)/ig, W0 = {
  c: "©",
  r: "®",
  tm: "™"
};
function Z0(u, e) {
  return W0[e.toLowerCase()];
}
function G0(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && (n.content = n.content.replace(j0, Z0)), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function V0(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && de.test(n.content) && (n.content = n.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function J0(u) {
  let e;
  if (u.md.options.typographer)
    for (e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type === "inline" && (Q0.test(u.tokens[e].content) && G0(u.tokens[e].children), de.test(u.tokens[e].content) && V0(u.tokens[e].children));
}
const X0 = /['"]/, ju = /['"]/g, Wu = "’";
function su(u, e, t) {
  return u.slice(0, e) + t + u.slice(e + 1);
}
function Y0(u, e) {
  let t;
  const n = [];
  for (let r = 0; r < u.length; r++) {
    const i = u[r], c = u[r].level;
    for (t = n.length - 1; t >= 0 && !(n[t].level <= c); t--)
      ;
    if (n.length = t + 1, i.type !== "text")
      continue;
    let s = i.content, a = 0, l = s.length;
    u:
      for (; a < l; ) {
        ju.lastIndex = a;
        const d = ju.exec(s);
        if (!d)
          break;
        let f = !0, m = !0;
        a = d.index + 1;
        const b = d[0] === "'";
        let h = 32;
        if (d.index - 1 >= 0)
          h = s.charCodeAt(d.index - 1);
        else
          for (t = r - 1; t >= 0 && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t--)
            if (u[t].content) {
              h = u[t].content.charCodeAt(u[t].content.length - 1);
              break;
            }
        let D = 32;
        if (a < l)
          D = s.charCodeAt(a);
        else
          for (t = r + 1; t < u.length && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t++)
            if (u[t].content) {
              D = u[t].content.charCodeAt(0);
              break;
            }
        const A = tu(h) || eu(String.fromCharCode(h)), F = tu(D) || eu(String.fromCharCode(D)), k = uu(h), E = uu(D);
        if (E ? f = !1 : F && (k || A || (f = !1)), k ? m = !1 : A && (E || F || (m = !1)), D === 34 && d[0] === '"' && h >= 48 && h <= 57 && (m = f = !1), f && m && (f = A, m = F), !f && !m) {
          b && (i.content = su(i.content, d.index, Wu));
          continue;
        }
        if (m)
          for (t = n.length - 1; t >= 0; t--) {
            let C = n[t];
            if (n[t].level < c)
              break;
            if (C.single === b && n[t].level === c) {
              C = n[t];
              let g, w;
              b ? (g = e.md.options.quotes[2], w = e.md.options.quotes[3]) : (g = e.md.options.quotes[0], w = e.md.options.quotes[1]), i.content = su(i.content, d.index, w), u[C.token].content = su(
                u[C.token].content,
                C.pos,
                g
              ), a += w.length - 1, C.token === r && (a += g.length - 1), s = i.content, l = s.length, n.length = t;
              continue u;
            }
          }
        f ? n.push({
          token: r,
          pos: d.index,
          single: b,
          level: c
        }) : m && b && (i.content = su(i.content, d.index, Wu));
      }
  }
}
function K0(u) {
  if (u.md.options.typographer)
    for (let e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type !== "inline" || !X0.test(u.tokens[e].content) || Y0(u.tokens[e].children, u);
}
function $0(u) {
  let e, t;
  const n = u.tokens, r = n.length;
  for (let i = 0; i < r; i++) {
    if (n[i].type !== "inline") continue;
    const c = n[i].children, s = c.length;
    for (e = 0; e < s; e++)
      c[e].type === "text_special" && (c[e].type = "text");
    for (e = t = 0; e < s; e++)
      c[e].type === "text" && e + 1 < s && c[e + 1].type === "text" ? c[e + 1].content = c[e].content + c[e + 1].content : (e !== t && (c[t] = c[e]), t++);
    e !== t && (c.length = t);
  }
}
const gu = [
  ["normalize", L0],
  ["block", P0],
  ["inline", O0],
  ["linkify", U0],
  ["replacements", J0],
  ["smartquotes", K0],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", $0]
];
function Iu() {
  this.ruler = new z();
  for (let u = 0; u < gu.length; u++)
    this.ruler.push(gu[u][0], gu[u][1]);
}
Iu.prototype.process = function(u) {
  const e = this.ruler.getRules("");
  for (let t = 0, n = e.length; t < n; t++)
    e[t](u);
};
Iu.prototype.State = le;
function Q(u, e, t, n) {
  this.src = u, this.md = e, this.env = t, this.tokens = n, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const r = this.src;
  for (let i = 0, c = 0, s = 0, a = 0, l = r.length, d = !1; c < l; c++) {
    const f = r.charCodeAt(c);
    if (!d)
      if (T(f)) {
        s++, f === 9 ? a += 4 - a % 4 : a++;
        continue;
      } else
        d = !0;
    (f === 10 || c === l - 1) && (f !== 10 && c++, this.bMarks.push(i), this.eMarks.push(c), this.tShift.push(s), this.sCount.push(a), this.bsCount.push(0), d = !1, s = 0, a = 0, i = c + 1);
  }
  this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
Q.prototype.push = function(u, e, t) {
  const n = new O(u, e, t);
  return n.block = !0, t < 0 && this.level--, n.level = this.level, t > 0 && this.level++, this.tokens.push(n), n;
};
Q.prototype.isEmpty = function(e) {
  return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
};
Q.prototype.skipEmptyLines = function(e) {
  for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++)
    ;
  return e;
};
Q.prototype.skipSpaces = function(e) {
  for (let t = this.src.length; e < t; e++) {
    const n = this.src.charCodeAt(e);
    if (!T(n))
      break;
  }
  return e;
};
Q.prototype.skipSpacesBack = function(e, t) {
  if (e <= t)
    return e;
  for (; e > t; )
    if (!T(this.src.charCodeAt(--e)))
      return e + 1;
  return e;
};
Q.prototype.skipChars = function(e, t) {
  for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++)
    ;
  return e;
};
Q.prototype.skipCharsBack = function(e, t, n) {
  if (e <= n)
    return e;
  for (; e > n; )
    if (t !== this.src.charCodeAt(--e))
      return e + 1;
  return e;
};
Q.prototype.getLines = function(e, t, n, r) {
  if (e >= t)
    return "";
  const i = new Array(t - e);
  for (let c = 0, s = e; s < t; s++, c++) {
    let a = 0;
    const l = this.bMarks[s];
    let d = l, f;
    for (s + 1 < t || r ? f = this.eMarks[s] + 1 : f = this.eMarks[s]; d < f && a < n; ) {
      const m = this.src.charCodeAt(d);
      if (T(m))
        m === 9 ? a += 4 - (a + this.bsCount[s]) % 4 : a++;
      else if (d - l < this.tShift[s])
        a++;
      else
        break;
      d++;
    }
    a > n ? i[c] = new Array(a - n + 1).join(" ") + this.src.slice(d, f) : i[c] = this.src.slice(d, f);
  }
  return i.join("");
};
Q.prototype.Token = O;
const ut = 65536;
function _u(u, e) {
  const t = u.bMarks[e] + u.tShift[e], n = u.eMarks[e];
  return u.src.slice(t, n);
}
function Zu(u) {
  const e = [], t = u.length;
  let n = 0, r = u.charCodeAt(n), i = !1, c = 0, s = "";
  for (; n < t; )
    r === 124 && (i ? (s += u.substring(c, n - 1), c = n) : (e.push(s + u.substring(c, n)), s = "", c = n + 1)), i = r === 92, n++, r = u.charCodeAt(n);
  return e.push(s + u.substring(c)), e;
}
function et(u, e, t, n) {
  if (e + 2 > t)
    return !1;
  let r = e + 1;
  if (u.sCount[r] < u.blkIndent || u.sCount[r] - u.blkIndent >= 4)
    return !1;
  let i = u.bMarks[r] + u.tShift[r];
  if (i >= u.eMarks[r])
    return !1;
  const c = u.src.charCodeAt(i++);
  if (c !== 124 && c !== 45 && c !== 58 || i >= u.eMarks[r])
    return !1;
  const s = u.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 && !T(s) || c === 45 && T(s))
    return !1;
  for (; i < u.eMarks[r]; ) {
    const C = u.src.charCodeAt(i);
    if (C !== 124 && C !== 45 && C !== 58 && !T(C))
      return !1;
    i++;
  }
  let a = _u(u, e + 1), l = a.split("|");
  const d = [];
  for (let C = 0; C < l.length; C++) {
    const g = l[C].trim();
    if (!g) {
      if (C === 0 || C === l.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(g))
      return !1;
    g.charCodeAt(g.length - 1) === 58 ? d.push(g.charCodeAt(0) === 58 ? "center" : "right") : g.charCodeAt(0) === 58 ? d.push("left") : d.push("");
  }
  if (a = _u(u, e).trim(), a.indexOf("|") === -1 || u.sCount[e] - u.blkIndent >= 4)
    return !1;
  l = Zu(a), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop();
  const f = l.length;
  if (f === 0 || f !== d.length)
    return !1;
  if (n)
    return !0;
  const m = u.parentType;
  u.parentType = "table";
  const b = u.md.block.ruler.getRules("blockquote"), h = u.push("table_open", "table", 1), D = [e, 0];
  h.map = D;
  const A = u.push("thead_open", "thead", 1);
  A.map = [e, e + 1];
  const F = u.push("tr_open", "tr", 1);
  F.map = [e, e + 1];
  for (let C = 0; C < l.length; C++) {
    const g = u.push("th_open", "th", 1);
    d[C] && (g.attrs = [["style", "text-align:" + d[C]]]);
    const w = u.push("inline", "", 0);
    w.content = l[C].trim(), w.children = [], u.push("th_close", "th", -1);
  }
  u.push("tr_close", "tr", -1), u.push("thead_close", "thead", -1);
  let k, E = 0;
  for (r = e + 2; r < t && !(u.sCount[r] < u.blkIndent); r++) {
    let C = !1;
    for (let w = 0, p = b.length; w < p; w++)
      if (b[w](u, r, t, !0)) {
        C = !0;
        break;
      }
    if (C || (a = _u(u, r).trim(), !a) || u.sCount[r] - u.blkIndent >= 4 || (l = Zu(a), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop(), E += f - l.length, E > ut))
      break;
    if (r === e + 2) {
      const w = u.push("tbody_open", "tbody", 1);
      w.map = k = [e + 2, 0];
    }
    const g = u.push("tr_open", "tr", 1);
    g.map = [r, r + 1];
    for (let w = 0; w < f; w++) {
      const p = u.push("td_open", "td", 1);
      d[w] && (p.attrs = [["style", "text-align:" + d[w]]]);
      const _ = u.push("inline", "", 0);
      _.content = l[w] ? l[w].trim() : "", _.children = [], u.push("td_close", "td", -1);
    }
    u.push("tr_close", "tr", -1);
  }
  return k && (u.push("tbody_close", "tbody", -1), k[1] = r), u.push("table_close", "table", -1), D[1] = r, u.parentType = m, u.line = r, !0;
}
function tt(u, e, t) {
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
function nt(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || r + 3 > i)
    return !1;
  const c = u.src.charCodeAt(r);
  if (c !== 126 && c !== 96)
    return !1;
  let s = r;
  r = u.skipChars(r, c);
  let a = r - s;
  if (a < 3)
    return !1;
  const l = u.src.slice(s, r), d = u.src.slice(r, i);
  if (c === 96 && d.indexOf(String.fromCharCode(c)) >= 0)
    return !1;
  if (n)
    return !0;
  let f = e, m = !1;
  for (; f++, !(f >= t || (r = s = u.bMarks[f] + u.tShift[f], i = u.eMarks[f], r < i && u.sCount[f] < u.blkIndent)); )
    if (u.src.charCodeAt(r) === c && !(u.sCount[f] - u.blkIndent >= 4) && (r = u.skipChars(r, c), !(r - s < a) && (r = u.skipSpaces(r), !(r < i)))) {
      m = !0;
      break;
    }
  a = u.sCount[e], u.line = f + (m ? 1 : 0);
  const b = u.push("fence", "code", 0);
  return b.info = d, b.content = u.getLines(e + 1, f, a, !0), b.markup = l, b.map = [e, u.line], !0;
}
function rt(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  const c = u.lineMax;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(r) !== 62)
    return !1;
  if (n)
    return !0;
  const s = [], a = [], l = [], d = [], f = u.md.block.ruler.getRules("blockquote"), m = u.parentType;
  u.parentType = "blockquote";
  let b = !1, h;
  for (h = e; h < t; h++) {
    const E = u.sCount[h] < u.blkIndent;
    if (r = u.bMarks[h] + u.tShift[h], i = u.eMarks[h], r >= i)
      break;
    if (u.src.charCodeAt(r++) === 62 && !E) {
      let g = u.sCount[h] + 1, w, p;
      u.src.charCodeAt(r) === 32 ? (r++, g++, p = !1, w = !0) : u.src.charCodeAt(r) === 9 ? (w = !0, (u.bsCount[h] + g) % 4 === 3 ? (r++, g++, p = !1) : p = !0) : w = !1;
      let _ = g;
      for (s.push(u.bMarks[h]), u.bMarks[h] = r; r < i; ) {
        const x = u.src.charCodeAt(r);
        if (T(x))
          x === 9 ? _ += 4 - (_ + u.bsCount[h] + (p ? 1 : 0)) % 4 : _++;
        else
          break;
        r++;
      }
      b = r >= i, a.push(u.bsCount[h]), u.bsCount[h] = u.sCount[h] + 1 + (w ? 1 : 0), l.push(u.sCount[h]), u.sCount[h] = _ - g, d.push(u.tShift[h]), u.tShift[h] = r - u.bMarks[h];
      continue;
    }
    if (b)
      break;
    let C = !1;
    for (let g = 0, w = f.length; g < w; g++)
      if (f[g](u, h, t, !0)) {
        C = !0;
        break;
      }
    if (C) {
      u.lineMax = h, u.blkIndent !== 0 && (s.push(u.bMarks[h]), a.push(u.bsCount[h]), d.push(u.tShift[h]), l.push(u.sCount[h]), u.sCount[h] -= u.blkIndent);
      break;
    }
    s.push(u.bMarks[h]), a.push(u.bsCount[h]), d.push(u.tShift[h]), l.push(u.sCount[h]), u.sCount[h] = -1;
  }
  const D = u.blkIndent;
  u.blkIndent = 0;
  const A = u.push("blockquote_open", "blockquote", 1);
  A.markup = ">";
  const F = [e, 0];
  A.map = F, u.md.block.tokenize(u, e, h);
  const k = u.push("blockquote_close", "blockquote", -1);
  k.markup = ">", u.lineMax = c, u.parentType = m, F[1] = u.line;
  for (let E = 0; E < d.length; E++)
    u.bMarks[E + e] = s[E], u.tShift[E + e] = d[E], u.sCount[E + e] = l[E], u.bsCount[E + e] = a[E];
  return u.blkIndent = D, !0;
}
function it(u, e, t, n) {
  const r = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let i = u.bMarks[e] + u.tShift[e];
  const c = u.src.charCodeAt(i++);
  if (c !== 42 && c !== 45 && c !== 95)
    return !1;
  let s = 1;
  for (; i < r; ) {
    const l = u.src.charCodeAt(i++);
    if (l !== c && !T(l))
      return !1;
    l === c && s++;
  }
  if (s < 3)
    return !1;
  if (n)
    return !0;
  u.line = e + 1;
  const a = u.push("hr", "hr", 0);
  return a.map = [e, u.line], a.markup = Array(s + 1).join(String.fromCharCode(c)), !0;
}
function Gu(u, e) {
  const t = u.eMarks[e];
  let n = u.bMarks[e] + u.tShift[e];
  const r = u.src.charCodeAt(n++);
  if (r !== 42 && r !== 45 && r !== 43)
    return -1;
  if (n < t) {
    const i = u.src.charCodeAt(n);
    if (!T(i))
      return -1;
  }
  return n;
}
function Vu(u, e) {
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
  return r < n && (i = u.src.charCodeAt(r), !T(i)) ? -1 : r;
}
function ct(u, e) {
  const t = u.level + 2;
  for (let n = e + 2, r = u.tokens.length - 2; n < r; n++)
    u.tokens[n].level === t && u.tokens[n].type === "paragraph_open" && (u.tokens[n + 2].hidden = !0, u.tokens[n].hidden = !0, n += 2);
}
function st(u, e, t, n) {
  let r, i, c, s, a = e, l = !0;
  if (u.sCount[a] - u.blkIndent >= 4 || u.listIndent >= 0 && u.sCount[a] - u.listIndent >= 4 && u.sCount[a] < u.blkIndent)
    return !1;
  let d = !1;
  n && u.parentType === "paragraph" && u.sCount[a] >= u.blkIndent && (d = !0);
  let f, m, b;
  if ((b = Vu(u, a)) >= 0) {
    if (f = !0, c = u.bMarks[a] + u.tShift[a], m = Number(u.src.slice(c, b - 1)), d && m !== 1) return !1;
  } else if ((b = Gu(u, a)) >= 0)
    f = !1;
  else
    return !1;
  if (d && u.skipSpaces(b) >= u.eMarks[a])
    return !1;
  if (n)
    return !0;
  const h = u.src.charCodeAt(b - 1), D = u.tokens.length;
  f ? (s = u.push("ordered_list_open", "ol", 1), m !== 1 && (s.attrs = [["start", m]])) : s = u.push("bullet_list_open", "ul", 1);
  const A = [a, 0];
  s.map = A, s.markup = String.fromCharCode(h);
  let F = !1;
  const k = u.md.block.ruler.getRules("list"), E = u.parentType;
  for (u.parentType = "list"; a < t; ) {
    i = b, r = u.eMarks[a];
    const C = u.sCount[a] + b - (u.bMarks[a] + u.tShift[a]);
    let g = C;
    for (; i < r; ) {
      const M = u.src.charCodeAt(i);
      if (M === 9)
        g += 4 - (g + u.bsCount[a]) % 4;
      else if (M === 32)
        g++;
      else
        break;
      i++;
    }
    const w = i;
    let p;
    w >= r ? p = 1 : p = g - C, p > 4 && (p = 1);
    const _ = C + p;
    s = u.push("list_item_open", "li", 1), s.markup = String.fromCharCode(h);
    const x = [a, 0];
    s.map = x, f && (s.info = u.src.slice(c, b - 1));
    const y = u.tight, S = u.tShift[a], L = u.sCount[a], v = u.listIndent;
    if (u.listIndent = u.blkIndent, u.blkIndent = _, u.tight = !0, u.tShift[a] = w - u.bMarks[a], u.sCount[a] = g, w >= r && u.isEmpty(a + 1) ? u.line = Math.min(u.line + 2, t) : u.md.block.tokenize(u, a, t, !0), (!u.tight || F) && (l = !1), F = u.line - a > 1 && u.isEmpty(u.line - 1), u.blkIndent = u.listIndent, u.listIndent = v, u.tShift[a] = S, u.sCount[a] = L, u.tight = y, s = u.push("list_item_close", "li", -1), s.markup = String.fromCharCode(h), a = u.line, x[1] = a, a >= t || u.sCount[a] < u.blkIndent || u.sCount[a] - u.blkIndent >= 4)
      break;
    let B = !1;
    for (let M = 0, j = k.length; M < j; M++)
      if (k[M](u, a, t, !0)) {
        B = !0;
        break;
      }
    if (B)
      break;
    if (f) {
      if (b = Vu(u, a), b < 0)
        break;
      c = u.bMarks[a] + u.tShift[a];
    } else if (b = Gu(u, a), b < 0)
      break;
    if (h !== u.src.charCodeAt(b - 1))
      break;
  }
  return f ? s = u.push("ordered_list_close", "ol", -1) : s = u.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(h), A[1] = a, u.line = a, u.parentType = E, l && ct(u, D), !0;
}
function at(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e], c = e + 1;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(r) !== 91)
    return !1;
  function s(k) {
    const E = u.lineMax;
    if (k >= E || u.isEmpty(k))
      return null;
    let C = !1;
    if (u.sCount[k] - u.blkIndent > 3 && (C = !0), u.sCount[k] < 0 && (C = !0), !C) {
      const p = u.md.block.ruler.getRules("reference"), _ = u.parentType;
      u.parentType = "reference";
      let x = !1;
      for (let y = 0, S = p.length; y < S; y++)
        if (p[y](u, k, E, !0)) {
          x = !0;
          break;
        }
      if (u.parentType = _, x)
        return null;
    }
    const g = u.bMarks[k] + u.tShift[k], w = u.eMarks[k];
    return u.src.slice(g, w + 1);
  }
  let a = u.src.slice(r, i + 1);
  i = a.length;
  let l = -1;
  for (r = 1; r < i; r++) {
    const k = a.charCodeAt(r);
    if (k === 91)
      return !1;
    if (k === 93) {
      l = r;
      break;
    } else if (k === 10) {
      const E = s(c);
      E !== null && (a += E, i = a.length, c++);
    } else if (k === 92 && (r++, r < i && a.charCodeAt(r) === 10)) {
      const E = s(c);
      E !== null && (a += E, i = a.length, c++);
    }
  }
  if (l < 0 || a.charCodeAt(l + 1) !== 58)
    return !1;
  for (r = l + 2; r < i; r++) {
    const k = a.charCodeAt(r);
    if (k === 10) {
      const E = s(c);
      E !== null && (a += E, i = a.length, c++);
    } else if (!T(k)) break;
  }
  const d = u.md.helpers.parseLinkDestination(a, r, i);
  if (!d.ok)
    return !1;
  const f = u.md.normalizeLink(d.str);
  if (!u.md.validateLink(f))
    return !1;
  r = d.pos;
  const m = r, b = c, h = r;
  for (; r < i; r++) {
    const k = a.charCodeAt(r);
    if (k === 10) {
      const E = s(c);
      E !== null && (a += E, i = a.length, c++);
    } else if (!T(k)) break;
  }
  let D = u.md.helpers.parseLinkTitle(a, r, i);
  for (; D.can_continue; ) {
    const k = s(c);
    if (k === null) break;
    a += k, r = i, i = a.length, c++, D = u.md.helpers.parseLinkTitle(a, r, i, D);
  }
  let A;
  for (r < i && h !== r && D.ok ? (A = D.str, r = D.pos) : (A = "", r = m, c = b); r < i; ) {
    const k = a.charCodeAt(r);
    if (!T(k))
      break;
    r++;
  }
  if (r < i && a.charCodeAt(r) !== 10 && A)
    for (A = "", r = m, c = b; r < i; ) {
      const k = a.charCodeAt(r);
      if (!T(k))
        break;
      r++;
    }
  if (r < i && a.charCodeAt(r) !== 10)
    return !1;
  const F = hu(a.slice(1, l));
  return F ? (n || (typeof u.env.references > "u" && (u.env.references = {}), typeof u.env.references[F] > "u" && (u.env.references[F] = { title: A, href: f }), u.line = c), !0) : !1;
}
const ot = [
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
], lt = "[a-zA-Z_:][a-zA-Z0-9:._-]*", dt = "[^\"'=<>`\\x00-\\x20]+", ft = "'[^']*'", ht = '"[^"]*"', bt = "(?:" + dt + "|" + ft + "|" + ht + ")", pt = "(?:\\s+" + lt + "(?:\\s*=\\s*" + bt + ")?)", fe = "<[A-Za-z][A-Za-z0-9\\-]*" + pt + "*\\s*\\/?>", he = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", mt = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", gt = "<[?][\\s\\S]*?[?]>", _t = "<![A-Za-z][^>]*>", xt = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", kt = new RegExp("^(?:" + fe + "|" + he + "|" + mt + "|" + gt + "|" + _t + "|" + xt + ")"), yt = new RegExp("^(?:" + fe + "|" + he + ")"), J = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + ot.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(yt.source + "\\s*$"), /^$/, !1]
];
function Ct(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || !u.md.options.html || u.src.charCodeAt(r) !== 60)
    return !1;
  let c = u.src.slice(r, i), s = 0;
  for (; s < J.length && !J[s][0].test(c); s++)
    ;
  if (s === J.length)
    return !1;
  if (n)
    return J[s][2];
  let a = e + 1;
  if (!J[s][1].test(c)) {
    for (; a < t && !(u.sCount[a] < u.blkIndent); a++)
      if (r = u.bMarks[a] + u.tShift[a], i = u.eMarks[a], c = u.src.slice(r, i), J[s][1].test(c)) {
        c.length !== 0 && a++;
        break;
      }
  }
  u.line = a;
  const l = u.push("html_block", "", 0);
  return l.map = [e, a], l.content = u.getLines(e, a, u.blkIndent, !0), !0;
}
function Dt(u, e, t, n) {
  let r = u.bMarks[e] + u.tShift[e], i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let c = u.src.charCodeAt(r);
  if (c !== 35 || r >= i)
    return !1;
  let s = 1;
  for (c = u.src.charCodeAt(++r); c === 35 && r < i && s <= 6; )
    s++, c = u.src.charCodeAt(++r);
  if (s > 6 || r < i && !T(c))
    return !1;
  if (n)
    return !0;
  i = u.skipSpacesBack(i, r);
  const a = u.skipCharsBack(i, 35, r);
  a > r && T(u.src.charCodeAt(a - 1)) && (i = a), u.line = e + 1;
  const l = u.push("heading_open", "h" + String(s), 1);
  l.markup = "########".slice(0, s), l.map = [e, u.line];
  const d = u.push("inline", "", 0);
  d.content = u.src.slice(r, i).trim(), d.map = [e, u.line], d.children = [];
  const f = u.push("heading_close", "h" + String(s), -1);
  return f.markup = "########".slice(0, s), !0;
}
function Et(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph");
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  const r = u.parentType;
  u.parentType = "paragraph";
  let i = 0, c, s = e + 1;
  for (; s < t && !u.isEmpty(s); s++) {
    if (u.sCount[s] - u.blkIndent > 3)
      continue;
    if (u.sCount[s] >= u.blkIndent) {
      let b = u.bMarks[s] + u.tShift[s];
      const h = u.eMarks[s];
      if (b < h && (c = u.src.charCodeAt(b), (c === 45 || c === 61) && (b = u.skipChars(b, c), b = u.skipSpaces(b), b >= h))) {
        i = c === 61 ? 1 : 2;
        break;
      }
    }
    if (u.sCount[s] < 0)
      continue;
    let m = !1;
    for (let b = 0, h = n.length; b < h; b++)
      if (n[b](u, s, t, !0)) {
        m = !0;
        break;
      }
    if (m)
      break;
  }
  if (!i)
    return !1;
  const a = u.getLines(e, s, u.blkIndent, !1).trim();
  u.line = s + 1;
  const l = u.push("heading_open", "h" + String(i), 1);
  l.markup = String.fromCharCode(c), l.map = [e, u.line];
  const d = u.push("inline", "", 0);
  d.content = a, d.map = [e, u.line - 1], d.children = [];
  const f = u.push("heading_close", "h" + String(i), -1);
  return f.markup = String.fromCharCode(c), u.parentType = r, !0;
}
function wt(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph"), r = u.parentType;
  let i = e + 1;
  for (u.parentType = "paragraph"; i < t && !u.isEmpty(i); i++) {
    if (u.sCount[i] - u.blkIndent > 3 || u.sCount[i] < 0)
      continue;
    let l = !1;
    for (let d = 0, f = n.length; d < f; d++)
      if (n[d](u, i, t, !0)) {
        l = !0;
        break;
      }
    if (l)
      break;
  }
  const c = u.getLines(e, i, u.blkIndent, !1).trim();
  u.line = i;
  const s = u.push("paragraph_open", "p", 1);
  s.map = [e, u.line];
  const a = u.push("inline", "", 0);
  return a.content = c, a.map = [e, u.line], a.children = [], u.push("paragraph_close", "p", -1), u.parentType = r, !0;
}
const au = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", et, ["paragraph", "reference"]],
  ["code", tt],
  ["fence", nt, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", rt, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", it, ["paragraph", "reference", "blockquote", "list"]],
  ["list", st, ["paragraph", "reference", "blockquote"]],
  ["reference", at],
  ["html_block", Ct, ["paragraph", "reference", "blockquote"]],
  ["heading", Dt, ["paragraph", "reference", "blockquote"]],
  ["lheading", Et],
  ["paragraph", wt]
];
function bu() {
  this.ruler = new z();
  for (let u = 0; u < au.length; u++)
    this.ruler.push(au[u][0], au[u][1], { alt: (au[u][2] || []).slice() });
}
bu.prototype.tokenize = function(u, e, t) {
  const n = this.ruler.getRules(""), r = n.length, i = u.md.options.maxNesting;
  let c = e, s = !1;
  for (; c < t && (u.line = c = u.skipEmptyLines(c), !(c >= t || u.sCount[c] < u.blkIndent)); ) {
    if (u.level >= i) {
      u.line = t;
      break;
    }
    const a = u.line;
    let l = !1;
    for (let d = 0; d < r; d++)
      if (l = n[d](u, c, t, !1), l) {
        if (a >= u.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!l) throw new Error("none of the block rules matched");
    u.tight = !s, u.isEmpty(u.line - 1) && (s = !0), c = u.line, c < t && u.isEmpty(c) && (s = !0, c++, u.line = c);
  }
};
bu.prototype.parse = function(u, e, t, n) {
  if (!u)
    return;
  const r = new this.State(u, e, t, n);
  this.tokenize(r, r.line, r.lineMax);
};
bu.prototype.State = Q;
function iu(u, e, t, n) {
  this.src = u, this.env = t, this.md = e, this.tokens = n, this.tokens_meta = Array(n.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
iu.prototype.pushPending = function() {
  const u = new O("text", "", 0);
  return u.content = this.pending, u.level = this.pendingLevel, this.tokens.push(u), this.pending = "", u;
};
iu.prototype.push = function(u, e, t) {
  this.pending && this.pushPending();
  const n = new O(u, e, t);
  let r = null;
  return t < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, t > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(r), n;
};
iu.prototype.scanDelims = function(u, e) {
  const t = this.posMax, n = this.src.charCodeAt(u), r = u > 0 ? this.src.charCodeAt(u - 1) : 32;
  let i = u;
  for (; i < t && this.src.charCodeAt(i) === n; )
    i++;
  const c = i - u, s = i < t ? this.src.charCodeAt(i) : 32, a = tu(r) || eu(String.fromCharCode(r)), l = tu(s) || eu(String.fromCharCode(s)), d = uu(r), f = uu(s), m = !f && (!l || d || a), b = !d && (!a || f || l);
  return { can_open: m && (e || !b || a), can_close: b && (e || !m || l), length: c };
};
iu.prototype.Token = O;
function At(u) {
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
function Ft(u, e) {
  let t = u.pos;
  for (; t < u.posMax && !At(u.src.charCodeAt(t)); )
    t++;
  return t === u.pos ? !1 : (e || (u.pending += u.src.slice(u.pos, t)), u.pos = t, !0);
}
const vt = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function St(u, e) {
  if (!u.md.options.linkify || u.linkLevel > 0) return !1;
  const t = u.pos, n = u.posMax;
  if (t + 3 > n || u.src.charCodeAt(t) !== 58 || u.src.charCodeAt(t + 1) !== 47 || u.src.charCodeAt(t + 2) !== 47) return !1;
  const r = u.pending.match(vt);
  if (!r) return !1;
  const i = r[1], c = u.md.linkify.matchAtStart(u.src.slice(t - i.length));
  if (!c) return !1;
  let s = c.url;
  if (s.length <= i.length) return !1;
  let a = s.length;
  for (; a > 0 && s.charCodeAt(a - 1) === 42; )
    a--;
  a !== s.length && (s = s.slice(0, a));
  const l = u.md.normalizeLink(s);
  if (!u.md.validateLink(l)) return !1;
  if (!e) {
    u.pending = u.pending.slice(0, -i.length);
    const d = u.push("link_open", "a", 1);
    d.attrs = [["href", l]], d.markup = "linkify", d.info = "auto";
    const f = u.push("text", "", 0);
    f.content = u.md.normalizeLinkText(s);
    const m = u.push("link_close", "a", -1);
    m.markup = "linkify", m.info = "auto";
  }
  return u.pos += s.length - i.length, !0;
}
function Tt(u, e) {
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
  for (t++; t < r && T(u.src.charCodeAt(t)); )
    t++;
  return u.pos = t, !0;
}
const qu = [];
for (let u = 0; u < 256; u++)
  qu.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(u) {
  qu[u.charCodeAt(0)] = 1;
});
function Mt(u, e) {
  let t = u.pos;
  const n = u.posMax;
  if (u.src.charCodeAt(t) !== 92 || (t++, t >= n)) return !1;
  let r = u.src.charCodeAt(t);
  if (r === 10) {
    for (e || u.push("hardbreak", "br", 0), t++; t < n && (r = u.src.charCodeAt(t), !!T(r)); )
      t++;
    return u.pos = t, !0;
  }
  let i = u.src[t];
  if (r >= 55296 && r <= 56319 && t + 1 < n) {
    const s = u.src.charCodeAt(t + 1);
    s >= 56320 && s <= 57343 && (i += u.src[t + 1], t++);
  }
  const c = "\\" + i;
  if (!e) {
    const s = u.push("text_special", "", 0);
    r < 256 && qu[r] !== 0 ? s.content = i : s.content = c, s.markup = c, s.info = "escape";
  }
  return u.pos = t + 1, !0;
}
function It(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 96)
    return !1;
  const r = t;
  t++;
  const i = u.posMax;
  for (; t < i && u.src.charCodeAt(t) === 96; )
    t++;
  const c = u.src.slice(r, t), s = c.length;
  if (u.backticksScanned && (u.backticks[s] || 0) <= r)
    return e || (u.pending += c), u.pos += s, !0;
  let a = t, l;
  for (; (l = u.src.indexOf("`", a)) !== -1; ) {
    for (a = l + 1; a < i && u.src.charCodeAt(a) === 96; )
      a++;
    const d = a - l;
    if (d === s) {
      if (!e) {
        const f = u.push("code_inline", "code", 0);
        f.markup = c, f.content = u.src.slice(t, l).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return u.pos = a, !0;
    }
    u.backticks[d] = l;
  }
  return u.backticksScanned = !0, e || (u.pending += c), u.pos += s, !0;
}
function qt(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 126)
    return !1;
  const r = u.scanDelims(u.pos, !0);
  let i = r.length;
  const c = String.fromCharCode(n);
  if (i < 2)
    return !1;
  let s;
  i % 2 && (s = u.push("text", "", 0), s.content = c, i--);
  for (let a = 0; a < i; a += 2)
    s = u.push("text", "", 0), s.content = c + c, u.delimiters.push({
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
function Ju(u, e) {
  let t;
  const n = [], r = e.length;
  for (let i = 0; i < r; i++) {
    const c = e[i];
    if (c.marker !== 126 || c.end === -1)
      continue;
    const s = e[c.end];
    t = u.tokens[c.token], t.type = "s_open", t.tag = "s", t.nesting = 1, t.markup = "~~", t.content = "", t = u.tokens[s.token], t.type = "s_close", t.tag = "s", t.nesting = -1, t.markup = "~~", t.content = "", u.tokens[s.token - 1].type === "text" && u.tokens[s.token - 1].content === "~" && n.push(s.token - 1);
  }
  for (; n.length; ) {
    const i = n.pop();
    let c = i + 1;
    for (; c < u.tokens.length && u.tokens[c].type === "s_close"; )
      c++;
    c--, i !== c && (t = u.tokens[c], u.tokens[c] = u.tokens[i], u.tokens[i] = t);
  }
}
function Bt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Ju(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Ju(u, e[n].delimiters);
}
const be = {
  tokenize: qt,
  postProcess: Bt
};
function zt(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 95 && n !== 42)
    return !1;
  const r = u.scanDelims(u.pos, n === 42);
  for (let i = 0; i < r.length; i++) {
    const c = u.push("text", "", 0);
    c.content = String.fromCharCode(n), u.delimiters.push({
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
function Xu(u, e) {
  const t = e.length;
  for (let n = t - 1; n >= 0; n--) {
    const r = e[n];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1)
      continue;
    const i = e[r.end], c = n > 0 && e[n - 1].end === r.end + 1 && // check that first two markers match and adjacent
    e[n - 1].marker === r.marker && e[n - 1].token === r.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    e[r.end + 1].token === i.token + 1, s = String.fromCharCode(r.marker), a = u.tokens[r.token];
    a.type = c ? "strong_open" : "em_open", a.tag = c ? "strong" : "em", a.nesting = 1, a.markup = c ? s + s : s, a.content = "";
    const l = u.tokens[i.token];
    l.type = c ? "strong_close" : "em_close", l.tag = c ? "strong" : "em", l.nesting = -1, l.markup = c ? s + s : s, l.content = "", c && (u.tokens[e[n - 1].token].content = "", u.tokens[e[r.end + 1].token].content = "", n--);
  }
}
function Rt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Xu(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Xu(u, e[n].delimiters);
}
const pe = {
  tokenize: zt,
  postProcess: Rt
};
function Lt(u, e) {
  let t, n, r, i, c = "", s = "", a = u.pos, l = !0;
  if (u.src.charCodeAt(u.pos) !== 91)
    return !1;
  const d = u.pos, f = u.posMax, m = u.pos + 1, b = u.md.helpers.parseLinkLabel(u, u.pos, !0);
  if (b < 0)
    return !1;
  let h = b + 1;
  if (h < f && u.src.charCodeAt(h) === 40) {
    for (l = !1, h++; h < f && (t = u.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
      ;
    if (h >= f)
      return !1;
    if (a = h, r = u.md.helpers.parseLinkDestination(u.src, h, u.posMax), r.ok) {
      for (c = u.md.normalizeLink(r.str), u.md.validateLink(c) ? h = r.pos : c = "", a = h; h < f && (t = u.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
        ;
      if (r = u.md.helpers.parseLinkTitle(u.src, h, u.posMax), h < f && a !== h && r.ok)
        for (s = r.str, h = r.pos; h < f && (t = u.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
          ;
    }
    (h >= f || u.src.charCodeAt(h) !== 41) && (l = !0), h++;
  }
  if (l) {
    if (typeof u.env.references > "u")
      return !1;
    if (h < f && u.src.charCodeAt(h) === 91 ? (a = h + 1, h = u.md.helpers.parseLinkLabel(u, h), h >= 0 ? n = u.src.slice(a, h++) : h = b + 1) : h = b + 1, n || (n = u.src.slice(m, b)), i = u.env.references[hu(n)], !i)
      return u.pos = d, !1;
    c = i.href, s = i.title;
  }
  if (!e) {
    u.pos = m, u.posMax = b;
    const D = u.push("link_open", "a", 1), A = [["href", c]];
    D.attrs = A, s && A.push(["title", s]), u.linkLevel++, u.md.inline.tokenize(u), u.linkLevel--, u.push("link_close", "a", -1);
  }
  return u.pos = h, u.posMax = f, !0;
}
function Pt(u, e) {
  let t, n, r, i, c, s, a, l, d = "";
  const f = u.pos, m = u.posMax;
  if (u.src.charCodeAt(u.pos) !== 33 || u.src.charCodeAt(u.pos + 1) !== 91)
    return !1;
  const b = u.pos + 2, h = u.md.helpers.parseLinkLabel(u, u.pos + 1, !1);
  if (h < 0)
    return !1;
  if (i = h + 1, i < m && u.src.charCodeAt(i) === 40) {
    for (i++; i < m && (t = u.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
      ;
    if (i >= m)
      return !1;
    for (l = i, s = u.md.helpers.parseLinkDestination(u.src, i, u.posMax), s.ok && (d = u.md.normalizeLink(s.str), u.md.validateLink(d) ? i = s.pos : d = ""), l = i; i < m && (t = u.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
      ;
    if (s = u.md.helpers.parseLinkTitle(u.src, i, u.posMax), i < m && l !== i && s.ok)
      for (a = s.str, i = s.pos; i < m && (t = u.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
        ;
    else
      a = "";
    if (i >= m || u.src.charCodeAt(i) !== 41)
      return u.pos = f, !1;
    i++;
  } else {
    if (typeof u.env.references > "u")
      return !1;
    if (i < m && u.src.charCodeAt(i) === 91 ? (l = i + 1, i = u.md.helpers.parseLinkLabel(u, i), i >= 0 ? r = u.src.slice(l, i++) : i = h + 1) : i = h + 1, r || (r = u.src.slice(b, h)), c = u.env.references[hu(r)], !c)
      return u.pos = f, !1;
    d = c.href, a = c.title;
  }
  if (!e) {
    n = u.src.slice(b, h);
    const D = [];
    u.md.inline.parse(
      n,
      u.md,
      u.env,
      D
    );
    const A = u.push("image", "img", 0), F = [["src", d], ["alt", ""]];
    A.attrs = F, A.children = D, A.content = n, a && F.push(["title", a]);
  }
  return u.pos = i, u.posMax = m, !0;
}
const Ot = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Nt = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Ht(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 60)
    return !1;
  const n = u.pos, r = u.posMax;
  for (; ; ) {
    if (++t >= r) return !1;
    const c = u.src.charCodeAt(t);
    if (c === 60) return !1;
    if (c === 62) break;
  }
  const i = u.src.slice(n + 1, t);
  if (Nt.test(i)) {
    const c = u.md.normalizeLink(i);
    if (!u.md.validateLink(c))
      return !1;
    if (!e) {
      const s = u.push("link_open", "a", 1);
      s.attrs = [["href", c]], s.markup = "autolink", s.info = "auto";
      const a = u.push("text", "", 0);
      a.content = u.md.normalizeLinkText(i);
      const l = u.push("link_close", "a", -1);
      l.markup = "autolink", l.info = "auto";
    }
    return u.pos += i.length + 2, !0;
  }
  if (Ot.test(i)) {
    const c = u.md.normalizeLink("mailto:" + i);
    if (!u.md.validateLink(c))
      return !1;
    if (!e) {
      const s = u.push("link_open", "a", 1);
      s.attrs = [["href", c]], s.markup = "autolink", s.info = "auto";
      const a = u.push("text", "", 0);
      a.content = u.md.normalizeLinkText(i);
      const l = u.push("link_close", "a", -1);
      l.markup = "autolink", l.info = "auto";
    }
    return u.pos += i.length + 2, !0;
  }
  return !1;
}
function Ut(u) {
  return /^<a[>\s]/i.test(u);
}
function Qt(u) {
  return /^<\/a\s*>/i.test(u);
}
function jt(u) {
  const e = u | 32;
  return e >= 97 && e <= 122;
}
function Wt(u, e) {
  if (!u.md.options.html)
    return !1;
  const t = u.posMax, n = u.pos;
  if (u.src.charCodeAt(n) !== 60 || n + 2 >= t)
    return !1;
  const r = u.src.charCodeAt(n + 1);
  if (r !== 33 && r !== 63 && r !== 47 && !jt(r))
    return !1;
  const i = u.src.slice(n).match(kt);
  if (!i)
    return !1;
  if (!e) {
    const c = u.push("html_inline", "", 0);
    c.content = i[0], Ut(c.content) && u.linkLevel++, Qt(c.content) && u.linkLevel--;
  }
  return u.pos += i[0].length, !0;
}
const Zt = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Gt = /^&([a-z][a-z0-9]{1,31});/i;
function Vt(u, e) {
  const t = u.pos, n = u.posMax;
  if (u.src.charCodeAt(t) !== 38 || t + 1 >= n) return !1;
  if (u.src.charCodeAt(t + 1) === 35) {
    const i = u.src.slice(t).match(Zt);
    if (i) {
      if (!e) {
        const c = i[1][0].toLowerCase() === "x" ? parseInt(i[1].slice(1), 16) : parseInt(i[1], 10), s = u.push("text_special", "", 0);
        s.content = Mu(c) ? lu(c) : lu(65533), s.markup = i[0], s.info = "entity";
      }
      return u.pos += i[0].length, !0;
    }
  } else {
    const i = u.src.slice(t).match(Gt);
    if (i) {
      const c = se(i[0]);
      if (c !== i[0]) {
        if (!e) {
          const s = u.push("text_special", "", 0);
          s.content = c, s.markup = i[0], s.info = "entity";
        }
        return u.pos += i[0].length, !0;
      }
    }
  }
  return !1;
}
function Yu(u) {
  const e = {}, t = u.length;
  if (!t) return;
  let n = 0, r = -2;
  const i = [];
  for (let c = 0; c < t; c++) {
    const s = u[c];
    if (i.push(0), (u[n].marker !== s.marker || r !== s.token - 1) && (n = c), r = s.token, s.length = s.length || 0, !s.close) continue;
    e.hasOwnProperty(s.marker) || (e[s.marker] = [-1, -1, -1, -1, -1, -1]);
    const a = e[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let l = n - i[n] - 1, d = l;
    for (; l > a; l -= i[l] + 1) {
      const f = u[l];
      if (f.marker === s.marker && f.open && f.end < 0) {
        let m = !1;
        if ((f.close || s.open) && (f.length + s.length) % 3 === 0 && (f.length % 3 !== 0 || s.length % 3 !== 0) && (m = !0), !m) {
          const b = l > 0 && !u[l - 1].open ? i[l - 1] + 1 : 0;
          i[c] = c - l + b, i[l] = b, s.open = !1, f.end = c, f.close = !1, d = -1, r = -2;
          break;
        }
      }
    }
    d !== -1 && (e[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = d);
  }
}
function Jt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Yu(u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Yu(e[n].delimiters);
}
function Xt(u) {
  let e, t, n = 0;
  const r = u.tokens, i = u.tokens.length;
  for (e = t = 0; e < i; e++)
    r[e].nesting < 0 && n--, r[e].level = n, r[e].nesting > 0 && n++, r[e].type === "text" && e + 1 < i && r[e + 1].type === "text" ? r[e + 1].content = r[e].content + r[e + 1].content : (e !== t && (r[t] = r[e]), t++);
  e !== t && (r.length = t);
}
const xu = [
  ["text", Ft],
  ["linkify", St],
  ["newline", Tt],
  ["escape", Mt],
  ["backticks", It],
  ["strikethrough", be.tokenize],
  ["emphasis", pe.tokenize],
  ["link", Lt],
  ["image", Pt],
  ["autolink", Ht],
  ["html_inline", Wt],
  ["entity", Vt]
], ku = [
  ["balance_pairs", Jt],
  ["strikethrough", be.postProcess],
  ["emphasis", pe.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", Xt]
];
function cu() {
  this.ruler = new z();
  for (let u = 0; u < xu.length; u++)
    this.ruler.push(xu[u][0], xu[u][1]);
  this.ruler2 = new z();
  for (let u = 0; u < ku.length; u++)
    this.ruler2.push(ku[u][0], ku[u][1]);
}
cu.prototype.skipToken = function(u) {
  const e = u.pos, t = this.ruler.getRules(""), n = t.length, r = u.md.options.maxNesting, i = u.cache;
  if (typeof i[e] < "u") {
    u.pos = i[e];
    return;
  }
  let c = !1;
  if (u.level < r) {
    for (let s = 0; s < n; s++)
      if (u.level++, c = t[s](u, !0), u.level--, c) {
        if (e >= u.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    u.pos = u.posMax;
  c || u.pos++, i[e] = u.pos;
};
cu.prototype.tokenize = function(u) {
  const e = this.ruler.getRules(""), t = e.length, n = u.posMax, r = u.md.options.maxNesting;
  for (; u.pos < n; ) {
    const i = u.pos;
    let c = !1;
    if (u.level < r) {
      for (let s = 0; s < t; s++)
        if (c = e[s](u, !1), c) {
          if (i >= u.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (c) {
      if (u.pos >= n)
        break;
      continue;
    }
    u.pending += u.src[u.pos++];
  }
  u.pending && u.pushPending();
};
cu.prototype.parse = function(u, e, t, n) {
  const r = new this.State(u, e, t, n);
  this.tokenize(r);
  const i = this.ruler2.getRules(""), c = i.length;
  for (let s = 0; s < c; s++)
    i[s](r);
};
cu.prototype.State = iu;
function Yt(u) {
  const e = {};
  u = u || {}, e.src_Any = te.source, e.src_Cc = ne.source, e.src_Z = ie.source, e.src_P = Su.source, e.src_ZPCc = [e.src_Z, e.src_P, e.src_Cc].join("|"), e.src_ZCc = [e.src_Z, e.src_Cc].join("|");
  const t = "[><｜]";
  return e.src_pseudo_letter = "(?:(?!" + t + "|" + e.src_ZPCc + ")" + e.src_Any + ")", e.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", e.src_auth = "(?:(?:(?!" + e.src_ZCc + "|[@/\\[\\]()]).)+@)?", e.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", e.src_host_terminator = "(?=$|" + t + "|" + e.src_ZPCc + ")(?!" + (u["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + e.src_ZPCc + "))", e.src_path = "(?:[/?#](?:(?!" + e.src_ZCc + "|" + t + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + e.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + e.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + e.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + e.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + e.src_ZCc + "|[']).)+\\'|\\'(?=" + e.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + e.src_ZCc + "|[.]|$)|" + (u["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + e.src_ZCc + "|$)|;(?!" + e.src_ZCc + "|$)|\\!+(?!" + e.src_ZCc + "|[!]|$)|\\?(?!" + e.src_ZCc + "|[?]|$))+|\\/)?", e.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', e.src_xn = "xn--[a-z0-9\\-]{1,59}", e.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + e.src_xn + "|" + e.src_pseudo_letter + "{1,63})", e.src_domain = "(?:" + e.src_xn + "|(?:" + e.src_pseudo_letter + ")|(?:" + e.src_pseudo_letter + "(?:-|" + e.src_pseudo_letter + "){0,61}" + e.src_pseudo_letter + "))", e.src_host = "(?:(?:(?:(?:" + e.src_domain + ")\\.)*" + e.src_domain + "))", e.tpl_host_fuzzy = "(?:" + e.src_ip4 + "|(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%)))", e.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%))", e.src_host_strict = e.src_host + e.src_host_terminator, e.tpl_host_fuzzy_strict = e.tpl_host_fuzzy + e.src_host_terminator, e.src_host_port_strict = e.src_host + e.src_port + e.src_host_terminator, e.tpl_host_port_fuzzy_strict = e.tpl_host_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_port_no_ip_fuzzy_strict = e.tpl_host_no_ip_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + e.src_ZPCc + "|>|$))", e.tpl_email_fuzzy = "(^|" + t + '|"|\\(|' + e.src_ZCc + ")(" + e.src_email_name + "@" + e.tpl_host_fuzzy_strict + ")", e.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_fuzzy_strict + e.src_path + ")", e.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_no_ip_fuzzy_strict + e.src_path + ")", e;
}
function wu(u) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    t && Object.keys(t).forEach(function(n) {
      u[n] = t[n];
    });
  }), u;
}
function pu(u) {
  return Object.prototype.toString.call(u);
}
function Kt(u) {
  return pu(u) === "[object String]";
}
function $t(u) {
  return pu(u) === "[object Object]";
}
function un(u) {
  return pu(u) === "[object RegExp]";
}
function Ku(u) {
  return pu(u) === "[object Function]";
}
function en(u) {
  return u.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const me = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function tn(u) {
  return Object.keys(u || {}).reduce(function(e, t) {
    return e || me.hasOwnProperty(t);
  }, !1);
}
const nn = {
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
}, rn = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", cn = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function sn(u) {
  u.__index__ = -1, u.__text_cache__ = "";
}
function an(u) {
  return function(e, t) {
    const n = e.slice(t);
    return u.test(n) ? n.match(u)[0].length : 0;
  };
}
function $u() {
  return function(u, e) {
    e.normalize(u);
  };
}
function du(u) {
  const e = u.re = Yt(u.__opts__), t = u.__tlds__.slice();
  u.onCompile(), u.__tlds_replaced__ || t.push(rn), t.push(e.src_xn), e.src_tlds = t.join("|");
  function n(s) {
    return s.replace("%TLDS%", e.src_tlds);
  }
  e.email_fuzzy = RegExp(n(e.tpl_email_fuzzy), "i"), e.link_fuzzy = RegExp(n(e.tpl_link_fuzzy), "i"), e.link_no_ip_fuzzy = RegExp(n(e.tpl_link_no_ip_fuzzy), "i"), e.host_fuzzy_test = RegExp(n(e.tpl_host_fuzzy_test), "i");
  const r = [];
  u.__compiled__ = {};
  function i(s, a) {
    throw new Error('(LinkifyIt) Invalid schema "' + s + '": ' + a);
  }
  Object.keys(u.__schemas__).forEach(function(s) {
    const a = u.__schemas__[s];
    if (a === null)
      return;
    const l = { validate: null, link: null };
    if (u.__compiled__[s] = l, $t(a)) {
      un(a.validate) ? l.validate = an(a.validate) : Ku(a.validate) ? l.validate = a.validate : i(s, a), Ku(a.normalize) ? l.normalize = a.normalize : a.normalize ? i(s, a) : l.normalize = $u();
      return;
    }
    if (Kt(a)) {
      r.push(s);
      return;
    }
    i(s, a);
  }), r.forEach(function(s) {
    u.__compiled__[u.__schemas__[s]] && (u.__compiled__[s].validate = u.__compiled__[u.__schemas__[s]].validate, u.__compiled__[s].normalize = u.__compiled__[u.__schemas__[s]].normalize);
  }), u.__compiled__[""] = { validate: null, normalize: $u() };
  const c = Object.keys(u.__compiled__).filter(function(s) {
    return s.length > 0 && u.__compiled__[s];
  }).map(en).join("|");
  u.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + c + ")", "i"), u.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + c + ")", "ig"), u.re.schema_at_start = RegExp("^" + u.re.schema_search.source, "i"), u.re.pretest = RegExp(
    "(" + u.re.schema_test.source + ")|(" + u.re.host_fuzzy_test.source + ")|@",
    "i"
  ), sn(u);
}
function on(u, e) {
  const t = u.__index__, n = u.__last_index__, r = u.__text_cache__.slice(t, n);
  this.schema = u.__schema__.toLowerCase(), this.index = t + e, this.lastIndex = n + e, this.raw = r, this.text = r, this.url = r;
}
function Au(u, e) {
  const t = new on(u, e);
  return u.__compiled__[t.schema].normalize(t, u), t;
}
function R(u, e) {
  if (!(this instanceof R))
    return new R(u, e);
  e || tn(u) && (e = u, u = {}), this.__opts__ = wu({}, me, e), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = wu({}, nn, u), this.__compiled__ = {}, this.__tlds__ = cn, this.__tlds_replaced__ = !1, this.re = {}, du(this);
}
R.prototype.add = function(e, t) {
  return this.__schemas__[e] = t, du(this), this;
};
R.prototype.set = function(e) {
  return this.__opts__ = wu(this.__opts__, e), this;
};
R.prototype.test = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length)
    return !1;
  let t, n, r, i, c, s, a, l, d;
  if (this.re.schema_test.test(e)) {
    for (a = this.re.schema_search, a.lastIndex = 0; (t = a.exec(e)) !== null; )
      if (i = this.testSchemaAt(e, t[2], a.lastIndex), i) {
        this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + i;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (l = e.search(this.re.host_fuzzy_test), l >= 0 && (this.__index__ < 0 || l < this.__index__) && (n = e.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (c = n.index + n[1].length, (this.__index__ < 0 || c < this.__index__) && (this.__schema__ = "", this.__index__ = c, this.__last_index__ = n.index + n[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (d = e.indexOf("@"), d >= 0 && (r = e.match(this.re.email_fuzzy)) !== null && (c = r.index + r[1].length, s = r.index + r[0].length, (this.__index__ < 0 || c < this.__index__ || c === this.__index__ && s > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = c, this.__last_index__ = s))), this.__index__ >= 0;
};
R.prototype.pretest = function(e) {
  return this.re.pretest.test(e);
};
R.prototype.testSchemaAt = function(e, t, n) {
  return this.__compiled__[t.toLowerCase()] ? this.__compiled__[t.toLowerCase()].validate(e, n, this) : 0;
};
R.prototype.match = function(e) {
  const t = [];
  let n = 0;
  this.__index__ >= 0 && this.__text_cache__ === e && (t.push(Au(this, n)), n = this.__last_index__);
  let r = n ? e.slice(n) : e;
  for (; this.test(r); )
    t.push(Au(this, n)), r = r.slice(this.__last_index__), n += this.__last_index__;
  return t.length ? t : null;
};
R.prototype.matchAtStart = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length) return null;
  const t = this.re.schema_at_start.exec(e);
  if (!t) return null;
  const n = this.testSchemaAt(e, t[2], t[0].length);
  return n ? (this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + n, Au(this, 0)) : null;
};
R.prototype.tlds = function(e, t) {
  return e = Array.isArray(e) ? e : [e], t ? (this.__tlds__ = this.__tlds__.concat(e).sort().filter(function(n, r, i) {
    return n !== i[r - 1];
  }).reverse(), du(this), this) : (this.__tlds__ = e.slice(), this.__tlds_replaced__ = !0, du(this), this);
};
R.prototype.normalize = function(e) {
  e.schema || (e.url = "http://" + e.url), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = "mailto:" + e.url);
};
R.prototype.onCompile = function() {
};
const X = 2147483647, N = 36, Bu = 1, nu = 26, ln = 38, dn = 700, ge = 72, _e = 128, xe = "-", fn = /^xn--/, hn = /[^\0-\x7F]/, bn = /[\x2E\u3002\uFF0E\uFF61]/g, pn = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, yu = N - Bu, H = Math.floor, Cu = String.fromCharCode;
function W(u) {
  throw new RangeError(pn[u]);
}
function mn(u, e) {
  const t = [];
  let n = u.length;
  for (; n--; )
    t[n] = e(u[n]);
  return t;
}
function ke(u, e) {
  const t = u.split("@");
  let n = "";
  t.length > 1 && (n = t[0] + "@", u = t[1]), u = u.replace(bn, ".");
  const r = u.split("."), i = mn(r, e).join(".");
  return n + i;
}
function ye(u) {
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
const gn = (u) => String.fromCodePoint(...u), _n = function(u) {
  return u >= 48 && u < 58 ? 26 + (u - 48) : u >= 65 && u < 91 ? u - 65 : u >= 97 && u < 123 ? u - 97 : N;
}, ue = function(u, e) {
  return u + 22 + 75 * (u < 26) - ((e != 0) << 5);
}, Ce = function(u, e, t) {
  let n = 0;
  for (u = t ? H(u / dn) : u >> 1, u += H(u / e); u > yu * nu >> 1; n += N)
    u = H(u / yu);
  return H(n + (yu + 1) * u / (u + ln));
}, De = function(u) {
  const e = [], t = u.length;
  let n = 0, r = _e, i = ge, c = u.lastIndexOf(xe);
  c < 0 && (c = 0);
  for (let s = 0; s < c; ++s)
    u.charCodeAt(s) >= 128 && W("not-basic"), e.push(u.charCodeAt(s));
  for (let s = c > 0 ? c + 1 : 0; s < t; ) {
    const a = n;
    for (let d = 1, f = N; ; f += N) {
      s >= t && W("invalid-input");
      const m = _n(u.charCodeAt(s++));
      m >= N && W("invalid-input"), m > H((X - n) / d) && W("overflow"), n += m * d;
      const b = f <= i ? Bu : f >= i + nu ? nu : f - i;
      if (m < b)
        break;
      const h = N - b;
      d > H(X / h) && W("overflow"), d *= h;
    }
    const l = e.length + 1;
    i = Ce(n - a, l, a == 0), H(n / l) > X - r && W("overflow"), r += H(n / l), n %= l, e.splice(n++, 0, r);
  }
  return String.fromCodePoint(...e);
}, Ee = function(u) {
  const e = [];
  u = ye(u);
  const t = u.length;
  let n = _e, r = 0, i = ge;
  for (const a of u)
    a < 128 && e.push(Cu(a));
  const c = e.length;
  let s = c;
  for (c && e.push(xe); s < t; ) {
    let a = X;
    for (const d of u)
      d >= n && d < a && (a = d);
    const l = s + 1;
    a - n > H((X - r) / l) && W("overflow"), r += (a - n) * l, n = a;
    for (const d of u)
      if (d < n && ++r > X && W("overflow"), d === n) {
        let f = r;
        for (let m = N; ; m += N) {
          const b = m <= i ? Bu : m >= i + nu ? nu : m - i;
          if (f < b)
            break;
          const h = f - b, D = N - b;
          e.push(
            Cu(ue(b + h % D, 0))
          ), f = H(h / D);
        }
        e.push(Cu(ue(f, 0))), i = Ce(r, l, s === c), r = 0, ++s;
      }
    ++r, ++n;
  }
  return e.join("");
}, xn = function(u) {
  return ke(u, function(e) {
    return fn.test(e) ? De(e.slice(4).toLowerCase()) : e;
  });
}, kn = function(u) {
  return ke(u, function(e) {
    return hn.test(e) ? "xn--" + Ee(e) : e;
  });
}, we = {
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
    decode: ye,
    encode: gn
  },
  decode: De,
  encode: Ee,
  toASCII: kn,
  toUnicode: xn
}, yn = {
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
}, Cn = {
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
}, Dn = {
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
}, En = {
  default: yn,
  zero: Cn,
  commonmark: Dn
}, wn = /^(vbscript|javascript|file|data):/, An = /^data:image\/(gif|png|jpeg|webp);/;
function Fn(u) {
  const e = u.trim().toLowerCase();
  return wn.test(e) ? An.test(e) : !0;
}
const Ae = ["http:", "https:", "mailto:"];
function vn(u) {
  const e = vu(u, !0);
  if (e.hostname && (!e.protocol || Ae.indexOf(e.protocol) >= 0))
    try {
      e.hostname = we.toASCII(e.hostname);
    } catch {
    }
  return ru(Fu(e));
}
function Sn(u) {
  const e = vu(u, !0);
  if (e.hostname && (!e.protocol || Ae.indexOf(e.protocol) >= 0))
    try {
      e.hostname = we.toUnicode(e.hostname);
    } catch {
    }
  return Y(Fu(e), Y.defaultChars + "%");
}
function P(u, e) {
  if (!(this instanceof P))
    return new P(u, e);
  e || Tu(u) || (e = u || {}, u = "default"), this.inline = new cu(), this.block = new bu(), this.core = new Iu(), this.renderer = new $(), this.linkify = new R(), this.validateLink = Fn, this.normalizeLink = vn, this.normalizeLinkText = Sn, this.utils = T0, this.helpers = fu({}, B0), this.options = {}, this.configure(u), e && this.set(e);
}
P.prototype.set = function(u) {
  return fu(this.options, u), this;
};
P.prototype.configure = function(u) {
  const e = this;
  if (Tu(u)) {
    const t = u;
    if (u = En[t], !u)
      throw new Error('Wrong `markdown-it` preset "' + t + '", check name');
  }
  if (!u)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return u.options && e.set(u.options), u.components && Object.keys(u.components).forEach(function(t) {
    u.components[t].rules && e[t].ruler.enableOnly(u.components[t].rules), u.components[t].rules2 && e[t].ruler2.enableOnly(u.components[t].rules2);
  }), this;
};
P.prototype.enable = function(u, e) {
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
P.prototype.disable = function(u, e) {
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
P.prototype.use = function(u) {
  const e = [this].concat(Array.prototype.slice.call(arguments, 1));
  return u.apply(u, e), this;
};
P.prototype.parse = function(u, e) {
  if (typeof u != "string")
    throw new Error("Input data should be a String");
  const t = new this.core.State(u, this, e);
  return this.core.process(t), t.tokens;
};
P.prototype.render = function(u, e) {
  return e = e || {}, this.renderer.render(this.parse(u, e), this.options, e);
};
P.prototype.parseInline = function(u, e) {
  const t = new this.core.State(u, this, e);
  return t.inlineMode = !0, this.core.process(t), t.tokens;
};
P.prototype.renderInline = function(u, e) {
  return e = e || {}, this.renderer.render(this.parseInline(u, e), this.options, e);
};
const Tn = new P({
  html: !1,
  breaks: !0,
  linkify: !0
}), Mn = (u) => u ? Tn.render(u) : "", In = (u) => u.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
var qn = o.from_html('<span class="chat-widget__thinking-pulse svelte-6zhkyr"></span>'), Bn = o.from_html('<details class="chat-widget__thinking svelte-6zhkyr"><summary class="chat-widget__thinking-summary svelte-6zhkyr"><div class="chat-widget__thinking-toggle svelte-6zhkyr"><svg class="chat-widget__thinking-chevron svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg> <span class="chat-widget__thinking-label svelte-6zhkyr"><svg class="chat-widget__thinking-icon svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg> Thinking <!></span></div></summary> <div class="chat-widget__thinking-content svelte-6zhkyr"><p class="chat-widget__thinking-text svelte-6zhkyr"> </p></div></details>');
function zn(u, e) {
  o.push(e, !0);
  var t = Bn(), n = o.child(t), r = o.child(n), i = o.sibling(o.child(r), 2), c = o.sibling(o.child(i), 2);
  {
    var s = (f) => {
      var m = qn();
      o.append(f, m);
    };
    o.if(c, (f) => {
      e.thinking.isStreaming && f(s);
    });
  }
  o.reset(i), o.reset(r), o.reset(n);
  var a = o.sibling(n, 2), l = o.child(a), d = o.child(l, !0);
  o.reset(l), o.reset(a), o.reset(t), o.template_effect(() => {
    t.open = e.thinking.isStreaming, o.set_text(d, e.thinking.content);
  }), o.append(u, t), o.pop();
}
var Rn = o.from_html('<div><div class="chat-widget__bubble-content svelte-1m4gqe"><!></div></div> <span> </span>', 1), Ln = o.from_html('<div><div class="chat-widget__message svelte-1m4gqe"><!> <!></div></div>');
function Pn(u, e) {
  o.push(e, !0);
  var t = Ln();
  let n;
  var r = o.child(t), i = o.child(r);
  {
    var c = (l) => {
      zn(l, {
        get thinking() {
          return e.message.thinking;
        }
      });
    };
    o.if(i, (l) => {
      e.showThinking && e.message.thinking && e.message.from === "assistant" && l(c);
    });
  }
  var s = o.sibling(i, 2);
  {
    var a = (l) => {
      var d = Rn(), f = o.first_child(d);
      let m;
      var b = o.child(f), h = o.child(b);
      o.html(h, () => Mn(e.message.text)), o.reset(b), o.reset(f);
      var D = o.sibling(f, 2);
      let A;
      var F = o.child(D, !0);
      o.reset(D), o.template_effect(
        (k) => {
          m = o.set_class(f, 1, "chat-widget__bubble svelte-1m4gqe", null, m, {
            "chat-widget__bubble--user": e.message.from === "user",
            "chat-widget__bubble--assistant": e.message.from === "assistant",
            "chat-widget__bubble--system": e.message.from === "system"
          }), A = o.set_class(D, 1, "chat-widget__timestamp svelte-1m4gqe", null, A, {
            "chat-widget__timestamp--user": e.message.from === "user"
          }), o.set_text(F, k);
        },
        [() => In(e.message.timestamp)]
      ), o.append(l, d);
    };
    o.if(s, (l) => {
      e.message.text && l(a);
    });
  }
  o.reset(r), o.reset(t), o.template_effect(() => n = o.set_class(t, 1, "chat-widget__message-row svelte-1m4gqe", null, n, {
    "chat-widget__message-row--user": e.message.from === "user",
    "chat-widget__message-row--assistant": e.message.from === "assistant",
    "chat-widget__message-row--system": e.message.from === "system"
  })), o.append(u, t), o.pop();
}
var On = o.from_html('<div class="chat-widget__typing-dots svelte-gu507e" aria-label="Loading" aria-live="polite"><div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 0ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 160ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 320ms"></div></div>');
function Nn(u) {
  var e = On();
  o.append(u, e);
}
var Hn = o.from_html("<!> <!>", 1);
function Un(u, e) {
  var t = Hn(), n = o.first_child(t);
  o.each(n, 17, () => e.messages, (c) => c.id, (c, s) => {
    Pn(c, {
      get message() {
        return o.get(s);
      },
      get showThinking() {
        return e.showThinking;
      }
    });
  });
  var r = o.sibling(n, 2);
  {
    var i = (c) => {
      Nn(c);
    };
    o.if(r, (c) => {
      e.isTyping && c(i);
    });
  }
  o.append(u, t);
}
var Qn = o.from_html('<button type="button"><span class="chat-widget__question-option-label svelte-11fq3uo"> </span> <span class="chat-widget__question-option-description svelte-11fq3uo"> </span></button>'), jn = o.from_html('<button type="button" class="chat-widget__question-submit svelte-11fq3uo">Submit selection</button>'), Wn = o.from_html('<div class="chat-widget__question-panel svelte-11fq3uo"><p class="chat-widget__question-text svelte-11fq3uo"> </p> <div class="chat-widget__question-options svelte-11fq3uo"><!> <div class="chat-widget__question-option chat-widget__question-option--custom svelte-11fq3uo"><span class="chat-widget__question-option-label svelte-11fq3uo">Type your own answer</span> <div class="chat-widget__custom-input-row svelte-11fq3uo"><input type="text" class="chat-widget__custom-input svelte-11fq3uo" placeholder="Your answer..."/> <button type="button" class="chat-widget__custom-submit svelte-11fq3uo">Send</button></div></div></div> <!></div>');
function Zn(u, e) {
  o.push(e, !0);
  let t = o.prop(e, "autoFocusFirst", 3, !1), n = o.state(o.proxy([])), r = o.state(""), i = o.state(void 0);
  const c = (g) => {
    var p;
    if (e.question.options.length === 0)
      return;
    const w = (g % e.question.options.length + e.question.options.length) % e.question.options.length;
    (p = o.get(n)[w]) == null || p.focus();
  }, s = (g, w, p) => {
    if (!g.isComposing) {
      if (g.key === "ArrowDown" || g.key === "ArrowRight") {
        g.preventDefault(), c(p + 1);
        return;
      }
      if (g.key === "ArrowUp" || g.key === "ArrowLeft") {
        g.preventDefault(), c(p - 1);
        return;
      }
      if (g.key === "Home") {
        g.preventDefault(), c(0);
        return;
      }
      if (g.key === "End") {
        g.preventDefault(), c(e.question.options.length - 1);
        return;
      }
      (g.key === "Enter" || g.key === " ") && (g.preventDefault(), e.onToggleAnswer(w));
    }
  }, a = () => {
    const g = o.get(r).trim();
    g && (e.onSubmitCustomAnswer(g), o.set(r, ""));
  }, l = (g) => {
    g.isComposing || g.key === "Enter" && (g.preventDefault(), a());
  };
  o.user_effect(() => {
    e.question, o.set(n, [], !0), o.set(r, "");
  }), o.user_effect(() => {
    var g;
    t() && (c(0), (g = e.onAutoFocusHandled) == null || g.call(e));
  });
  var d = Wn(), f = o.child(d), m = o.child(f, !0);
  o.reset(f);
  var b = o.sibling(f, 2), h = o.child(b);
  o.each(h, 19, () => e.question.options, (g, w) => `${g.label}-${w}`, (g, w, p) => {
    const _ = o.derived(() => Te(o.get(w)));
    var x = Qn();
    let y;
    x.__click = () => e.onToggleAnswer(o.get(_)), x.__keydown = (M) => s(M, o.get(_), o.get(p));
    var S = o.child(x), L = o.child(S, !0);
    o.reset(S);
    var v = o.sibling(S, 2), B = o.child(v, !0);
    o.reset(v), o.reset(x), o.bind_this(x, (M, j) => o.get(n)[j] = M, (M) => {
      var j;
      return (j = o.get(n)) == null ? void 0 : j[M];
    }, () => [o.get(p)]), o.template_effect(
      (M) => {
        y = o.set_class(x, 1, "chat-widget__question-option svelte-11fq3uo", null, y, M), o.set_text(L, o.get(w).label), o.set_text(B, o.get(w).description);
      },
      [
        () => ({
          "chat-widget__question-option--selected": e.selectedAnswers.includes(o.get(_))
        })
      ]
    ), o.append(g, x);
  });
  var D = o.sibling(h, 2), A = o.sibling(o.child(D), 2), F = o.child(A);
  o.remove_input_defaults(F), F.__keydown = l, o.bind_this(F, (g) => o.set(i, g), () => o.get(i));
  var k = o.sibling(F, 2);
  k.__click = a, o.reset(A), o.reset(D), o.reset(b);
  var E = o.sibling(b, 2);
  {
    var C = (g) => {
      var w = jn();
      w.__click = function(...p) {
        var _;
        (_ = e.onSubmitAnswers) == null || _.apply(this, p);
      }, o.template_effect(() => w.disabled = e.selectedAnswers.length === 0), o.append(g, w);
    };
    o.if(E, (g) => {
      e.question.allowMultiple && g(C);
    });
  }
  o.reset(d), o.template_effect(
    (g) => {
      o.set_text(m, e.question.text), k.disabled = g;
    },
    [() => !o.get(r).trim()]
  ), o.bind_value(F, () => o.get(r), (g) => o.set(r, g)), o.append(u, d), o.pop();
}
o.delegate(["click", "keydown"]);
var Gn = o.from_html('<div><!> <div class="chat-widget__messages svelte-3vislt"><!></div> <footer class="chat-widget__footer svelte-3vislt"><!></footer></div>');
function Kn(u, e) {
  o.push(e, !0);
  const t = {
    title: zu,
    placeholder: "Type a message",
    initialMessage: Du,
    showThinking: !0,
    adapter: void 0
  };
  let n = o.prop(e, "primary", 3, "#0B57D0"), r = o.prop(e, "secondary", 3, "#4D5F7A"), i = o.prop(e, "darkMode", 3, !1);
  const c = o.derived(() => e.config ?? t), s = o.derived(() => {
    var _;
    return ((_ = o.get(c)) == null ? void 0 : _.title) || zu;
  }), a = o.derived(() => `--chat-primary: ${n()}; --chat-secondary: ${r()};`), l = o.derived(() => {
    var _;
    return ((_ = o.get(c)) == null ? void 0 : _.showThinking) ?? !0;
  }), d = o.derived(() => {
    var _;
    return ((_ = o.get(c)) == null ? void 0 : _.placeholder) || "Type a message";
  });
  let f = o.state(void 0);
  const b = Ie({
    getConfig: () => o.get(c),
    getShowThinking: () => o.get(l),
    scrollToBottom: () => {
      o.get(f) && setTimeout(
        () => {
          o.get(f) && (o.get(f).scrollTop = o.get(f).scrollHeight);
        },
        50
      );
    }
  }), h = o.derived(() => b.state.isTyping || !!b.state.streamingMessageId);
  o.user_effect(() => {
    b.syncConfig();
  });
  var D = Gn();
  let A;
  D.__keydown = (_) => _.stopPropagation(), D.__keyup = (_) => _.stopPropagation();
  var F = o.child(D);
  ze(F, {
    get title() {
      return o.get(s);
    },
    get header() {
      return e.header;
    }
  });
  var k = o.sibling(F, 2), E = o.child(k);
  Un(E, {
    get messages() {
      return b.state.messages;
    },
    get showThinking() {
      return o.get(l);
    },
    get isTyping() {
      return o.get(h);
    }
  }), o.reset(k), o.bind_this(k, (_) => o.set(f, _), () => o.get(f));
  var C = o.sibling(k, 2), g = o.child(C);
  {
    var w = (_) => {
      Zn(_, {
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
    }, p = (_) => {
      {
        let x = o.derived(() => !!b.state.streamingMessageId), y = o.derived(() => b.getSlashCommands());
        Qe(_, {
          get draft() {
            return b.state.draft;
          },
          get placeholder() {
            return o.get(d);
          },
          get disabled() {
            return o.get(h);
          },
          get isStreaming() {
            return o.get(x);
          },
          get slashCommands() {
            return o.get(y);
          },
          get onDraftChange() {
            return b.setDraft;
          },
          get onSubmit() {
            return b.sendMessage;
          },
          get onCancel() {
            return b.cancelMessage;
          },
          onSlashCommand: (S) => b.executeSlashCommand(S.name)
        });
      }
    };
    o.if(g, (_) => {
      b.state.pendingQuestion ? _(w) : _(p, !1);
    });
  }
  o.reset(C), o.reset(D), o.template_effect(() => {
    A = o.set_class(D, 1, "chat-widget svelte-3vislt", null, A, { "chat-widget--dark": i() }), o.set_style(D, o.get(a));
  }), o.event("keypress", D, (_) => _.stopPropagation()), o.append(u, D), o.pop();
}
o.delegate(["keydown", "keyup"]);
export {
  Kn as ChatWidget,
  Du as DEFAULT_INITIAL_MESSAGE,
  zu as DEFAULT_TITLE,
  Xn as MockAdapter,
  Yn as WebSocketAdapter
};
