import "svelte/internal/disclose-version";
import * as e from "svelte/internal/client";
import { createOpencodeClient as ge } from "@opencode-ai/sdk/client";
var me = e.from_html('<h2 class="chat-widget__header-title svelte-3vislt"> </h2>'), pe = e.from_html('<span class="chat-widget__thinking-pulse svelte-3vislt"></span>'), ue = e.from_html('<span class="chat-widget__stream-caret chat-widget__stream-caret--secondary svelte-3vislt"></span>'), ve = e.from_html('<details class="chat-widget__thinking svelte-3vislt"><summary class="chat-widget__thinking-summary svelte-3vislt"><div class="chat-widget__thinking-toggle svelte-3vislt"><svg class="chat-widget__thinking-chevron svelte-3vislt" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" class="svelte-3vislt"></path></svg> <span class="chat-widget__thinking-label svelte-3vislt"><svg class="chat-widget__thinking-icon svelte-3vislt" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" class="svelte-3vislt"></path></svg> Thinking <!></span></div></summary> <div class="chat-widget__thinking-content svelte-3vislt"><p class="chat-widget__thinking-text svelte-3vislt"> <!></p></div></details>'), fe = e.from_html('<span class="chat-widget__stream-caret svelte-3vislt"></span>'), _e = e.from_html('<div><div><!> <div><p class="chat-widget__bubble-content svelte-3vislt"> <!></p></div> <span> </span></div></div>'), we = e.from_html('<div class="chat-widget__typing-row svelte-3vislt"><div class="chat-widget__typing-bubble svelte-3vislt"><div class="chat-widget__typing-dots svelte-3vislt"><div class="chat-widget__typing-dot svelte-3vislt" style="animation-delay: 0ms"></div> <div class="chat-widget__typing-dot svelte-3vislt" style="animation-delay: 150ms"></div> <div class="chat-widget__typing-dot svelte-3vislt" style="animation-delay: 300ms"></div></div></div></div>'), ye = e.from_html('<div><header class="chat-widget__header svelte-3vislt"><div class="chat-widget__header-content svelte-3vislt"><!></div></header> <div class="chat-widget__messages svelte-3vislt"><!> <!></div> <footer class="chat-widget__footer svelte-3vislt"><form class="chat-widget__composer svelte-3vislt"><div class="chat-widget__input-wrap svelte-3vislt"><input class="chat-widget__input svelte-3vislt"/></div> <button type="submit" class="chat-widget__send svelte-3vislt" title="Send message"><svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon svelte-3vislt" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" class="svelte-3vislt"></path></svg></button></form></footer></div>');
function Ce(P, s) {
  e.push(s, !0);
  const l = {
    title: "Audako Assistant",
    placeholder: "Type a message",
    initialMessage: "Welcome to Audako MCP Chat. How can I assist you today?",
    adapter: void 0
  };
  let h = e.prop(s, "primary", 3, "#0B57D0"), u = e.prop(s, "secondary", 3, "#4D5F7A"), w = e.prop(s, "darkMode", 3, !1);
  const d = e.derived(() => s.config ?? l), v = e.derived(() => {
    var a;
    return ((a = e.get(d)) == null ? void 0 : a.title) || "Audako Assistant";
  }), f = e.derived(() => `--chat-primary: ${h()}; --chat-secondary: ${u()};`);
  let t = e.state(e.proxy([])), m = e.state(""), p = e.state(!1), c = e.state(void 0), n = e.state(null);
  const _ = (...a) => {
    console.log("[chat-ui]", ...a);
  };
  e.user_effect(() => {
    var a, i, o, S, b, x, M, E;
    _("config resolved", {
      title: (a = e.get(d)) == null ? void 0 : a.title,
      hasAdapter: !!((i = e.get(d)) != null && i.adapter),
      adapterType: (b = (S = (o = e.get(d)) == null ? void 0 : o.adapter) == null ? void 0 : S.constructor) == null ? void 0 : b.name,
      hasInitialMessage: !!((x = e.get(d)) != null && x.initialMessage)
    }), (M = e.get(d)) != null && M.adapter && typeof e.get(d).adapter.init == "function" && (_("initializing adapter"), e.get(d).adapter.init().catch((r) => {
      console.error("Failed to initialize adapter:", r);
    })), (E = e.get(d)) != null && E.initialMessage && e.get(t).length === 0 ? e.set(
      t,
      [
        {
          id: "1",
          from: "system",
          text: e.get(d).initialMessage,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      !0
    ) : e.get(t).length === 0 && e.set(
      t,
      [
        {
          id: "1",
          from: "system",
          text: "Welcome to Audako MCP Chat. How can I assist you today?",
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      !0
    );
  });
  const I = () => {
    e.get(c) && setTimeout(
      () => {
        e.get(c) && (e.get(c).scrollTop = e.get(c).scrollHeight);
      },
      50
    );
  }, U = async () => {
    var b, x, M, E;
    if (_("sendMessage called", {
      draftLength: e.get(m).length,
      isDraftEmpty: !e.get(m).trim(),
      hasStreamingMessage: !!e.get(n),
      hasAdapter: !!((b = e.get(d)) != null && b.adapter)
    }), !e.get(m).trim() || e.get(n) || !((x = e.get(d)) != null && x.adapter)) {
      _("sendMessage aborted", {
        reason: {
          emptyDraft: !e.get(m).trim(),
          streamingInProgress: !!e.get(n),
          missingAdapter: !((M = e.get(d)) != null && M.adapter)
        }
      });
      return;
    }
    const a = {
      id: Date.now().toString(),
      from: "user",
      text: e.get(m).trim(),
      timestamp: /* @__PURE__ */ new Date()
    };
    e.set(t, [...e.get(t), a], !0), _("user message appended", {
      messageId: a.id,
      totalMessages: e.get(t).length
    });
    const i = e.get(m).trim();
    e.set(m, ""), I(), e.set(p, !0), await new Promise((r) => setTimeout(r, 300));
    const o = (Date.now() + 1).toString(), S = {
      id: o,
      from: "assistant",
      text: "",
      timestamp: /* @__PURE__ */ new Date(),
      isStreaming: !0
    };
    e.set(t, [...e.get(t), S], !0), e.set(p, !1), e.set(n, o, !0), _("assistant streaming message created", {
      messageId: o,
      historyLength: e.get(t).filter((r) => r.from !== "system").length,
      adapterType: (E = e.get(d).adapter.constructor) == null ? void 0 : E.name
    }), I();
    try {
      _("calling adapter.sendMessage"), await e.get(d).adapter.sendMessage(
        {
          message: i,
          conversationHistory: e.get(t).filter((r) => r.from !== "system")
        },
        {
          // onChunk callback
          onChunk: (r) => {
            _("adapter chunk received", { messageId: o, chunkLength: r.length });
            const g = e.get(t).findIndex((y) => y.id === o);
            g !== -1 && (e.get(t)[g] = { ...e.get(t)[g], text: r }, e.set(t, [...e.get(t)], !0)), I();
          },
          // onThinking callback
          onThinking: (r) => {
            _("adapter thinking chunk received", { messageId: o, chunkLength: r.length });
            const g = e.get(t).findIndex((y) => y.id === o);
            g !== -1 && (e.get(t)[g] = {
              ...e.get(t)[g],
              thinking: { content: r, isStreaming: !0 }
            }, e.set(t, [...e.get(t)], !0)), I();
          },
          // onComplete callback
          onComplete: () => {
            _("adapter stream completed", { messageId: o });
            const r = e.get(t).findIndex((g) => g.id === o);
            r !== -1 && (e.get(t)[r] = {
              ...e.get(t)[r],
              isStreaming: !1,
              thinking: e.get(t)[r].thinking ? {
                ...e.get(t)[r].thinking,
                isStreaming: !1
              } : void 0
            }, e.set(t, [...e.get(t)], !0)), e.set(n, null), I();
          },
          // onError callback
          onError: (r) => {
            _("adapter stream errored", { messageId: o, errorMessage: r.message }), console.error("Chat error:", r);
            const g = e.get(t).findIndex((y) => y.id === o);
            g !== -1 && (e.get(t)[g] = {
              ...e.get(t)[g],
              text: `Error: ${r.message}`,
              isStreaming: !1
            }, e.set(t, [...e.get(t)], !0)), e.set(n, null), I();
          }
        }
      ), _("adapter.sendMessage resolved", { messageId: o });
    } catch (r) {
      _("adapter.sendMessage threw", {
        messageId: o,
        errorMessage: r instanceof Error ? r.message : "Unknown error"
      }), console.error("Unexpected error:", r);
      const g = e.get(t).findIndex((y) => y.id === o);
      g !== -1 && (e.get(t)[g] = {
        ...e.get(t)[g],
        text: "Unexpected error occurred",
        isStreaming: !1
      }, e.set(t, [...e.get(t)], !0)), e.set(n, null);
    }
  }, D = (a) => a.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  var T = ye();
  let L;
  var q = e.child(T), N = e.child(q), $ = e.child(N);
  {
    var ee = (a) => {
      var i = e.comment(), o = e.first_child(i);
      e.snippet(o, () => s.header, () => e.get(v)), e.append(a, i);
    }, te = (a) => {
      var i = me(), o = e.child(i, !0);
      e.reset(i), e.template_effect(() => e.set_text(o, e.get(v))), e.append(a, i);
    };
    e.if($, (a) => {
      s.header ? a(ee) : a(te, !1);
    });
  }
  e.reset(N), e.reset(q);
  var F = e.sibling(q, 2), K = e.child(F);
  e.each(K, 17, () => e.get(t), (a) => a.id, (a, i) => {
    var o = _e();
    let S;
    var b = e.child(o);
    let x;
    var M = e.child(b);
    {
      var E = (k) => {
        var C = ve(), z = e.child(C), V = e.child(z), Y = e.sibling(e.child(V), 2), le = e.sibling(e.child(Y), 2);
        {
          var de = (A) => {
            var R = pe();
            e.append(A, R);
          };
          e.if(le, (A) => {
            e.get(i).thinking.isStreaming && A(de);
          });
        }
        e.reset(Y), e.reset(V), e.reset(z);
        var Q = e.sibling(z, 2), X = e.child(Q), Z = e.child(X), ce = e.sibling(Z);
        {
          var he = (A) => {
            var R = ue();
            e.append(A, R);
          };
          e.if(ce, (A) => {
            e.get(i).thinking.isStreaming && A(he);
          });
        }
        e.reset(X), e.reset(Q), e.reset(C), e.template_effect(() => {
          C.open = e.get(i).thinking.isStreaming, e.set_text(Z, `${e.get(i).thinking.content ?? ""} `);
        }), e.append(k, C);
      };
      e.if(M, (k) => {
        e.get(i).thinking && e.get(i).from === "assistant" && k(E);
      });
    }
    var r = e.sibling(M, 2);
    let g;
    var y = e.child(r), G = e.child(y), re = e.sibling(G);
    {
      var ne = (k) => {
        var C = fe();
        e.append(k, C);
      };
      e.if(re, (k) => {
        var C;
        e.get(i).isStreaming && !((C = e.get(i).thinking) != null && C.isStreaming) && k(ne);
      });
    }
    e.reset(y), e.reset(r);
    var O = e.sibling(r, 2);
    let J;
    var oe = e.child(O, !0);
    e.reset(O), e.reset(b), e.reset(o), e.template_effect(
      (k) => {
        S = e.set_class(o, 1, "chat-widget__message-row svelte-3vislt", null, S, {
          "chat-widget__message-row--user": e.get(i).from === "user",
          "chat-widget__message-row--assistant": e.get(i).from === "assistant",
          "chat-widget__message-row--system": e.get(i).from === "system"
        }), x = e.set_class(b, 1, "chat-widget__message svelte-3vislt", null, x, {
          "chat-widget__message--user": e.get(i).from === "user",
          "chat-widget__message--assistant": e.get(i).from === "assistant",
          "chat-widget__message--system": e.get(i).from === "system"
        }), g = e.set_class(r, 1, "chat-widget__bubble svelte-3vislt", null, g, {
          "chat-widget__bubble--user": e.get(i).from === "user",
          "chat-widget__bubble--assistant": e.get(i).from === "assistant",
          "chat-widget__bubble--system": e.get(i).from === "system"
        }), e.set_text(G, `${e.get(i).text ?? ""} `), J = e.set_class(O, 1, "chat-widget__timestamp svelte-3vislt", null, J, {
          "chat-widget__timestamp--user": e.get(i).from === "user",
          "chat-widget__timestamp--assistant": e.get(i).from === "assistant",
          "chat-widget__timestamp--system": e.get(i).from === "system"
        }), e.set_text(oe, k);
      },
      [() => D(e.get(i).timestamp)]
    ), e.append(a, o);
  });
  var se = e.sibling(K, 2);
  {
    var ie = (a) => {
      var i = we();
      e.append(a, i);
    };
    e.if(se, (a) => {
      e.get(p) && a(ie);
    });
  }
  e.reset(F), e.bind_this(F, (a) => e.set(c, a), () => e.get(c));
  var j = e.sibling(F, 2), B = e.child(j), H = e.child(B), W = e.child(H);
  e.remove_input_defaults(W), e.reset(H);
  var ae = e.sibling(H, 2);
  e.reset(B), e.reset(j), e.reset(T), e.template_effect(
    (a) => {
      var i;
      L = e.set_class(T, 1, "chat-widget svelte-3vislt", null, L, { "chat-widget--dark": w() }), e.set_style(T, e.get(f)), e.set_attribute(W, "placeholder", ((i = e.get(d)) == null ? void 0 : i.placeholder) || "Type a message"), W.disabled = e.get(p) || !!e.get(n), ae.disabled = a;
    },
    [
      () => !e.get(m).trim() || e.get(p) || !!e.get(n)
    ]
  ), e.event("submit", B, (a) => {
    a.preventDefault(), U();
  }), e.bind_value(W, () => e.get(m), (a) => e.set(m, a)), e.append(P, T), e.pop();
}
class Ie {
  constructor(s) {
    this.abortController = null, this.showThinking = (s == null ? void 0 : s.showThinking) ?? !1;
  }
  /**
   * Initialize the mock adapter
   * For MockAdapter, this is a no-op since there's no real connection to set up
   */
  async init() {
  }
  async sendMessage(s, l) {
    this.abortController = new AbortController();
    const h = [
      "I understand your question. Let me help you with that. First, we need to consider the context of your request. Then, I'll provide you with a detailed explanation that addresses all aspects of your query.",
      "That's an interesting point. Here's what I think about it. Based on the information provided, there are several factors we should analyze. Let me break this down into manageable parts for better understanding.",
      "I'd be happy to assist you with that. Based on what you've asked, I recommend taking a systematic approach. We can explore multiple solutions and find the one that best fits your needs.",
      "Great question! The answer depends on several factors, but generally speaking, the most effective approach would be to first understand the requirements. Then we can proceed with implementing the solution step by step.",
      "I can help you with that. Let me break it down for you step by step. We'll start with the fundamentals and gradually move to more advanced concepts to ensure you have a complete understanding."
    ], u = [
      "Let me analyze this question... The user is asking about a complex topic. I should break this down into clear, logical steps.",
      "Hmm, interesting query. I need to consider multiple angles here: technical feasibility, best practices, and practical application.",
      "First, I'll identify the core problem. Then I'll explore potential solutions and their trade-offs before providing a recommendation.",
      "Let's think through this systematically. What are the key requirements? What constraints do we have? What's the optimal approach?",
      "Breaking down the problem: 1) Understand the context, 2) Identify relevant factors, 3) Formulate a clear, actionable response."
    ];
    try {
      if (this.showThinking && l.onThinking) {
        const t = u[Math.floor(Math.random() * u.length)].split(" ");
        let m = "";
        for (let p = 0; p < t.length; p++) {
          if (this.abortController.signal.aborted)
            throw new Error("Request cancelled");
          m += (p > 0 ? " " : "") + t[p], l.onThinking(m), await new Promise((c) => setTimeout(c, 40 + Math.random() * 40));
        }
        await new Promise((p) => setTimeout(p, 200));
      }
      const d = h[Math.floor(Math.random() * h.length)].split(" ");
      let v = "";
      for (let f = 0; f < d.length; f++) {
        if (this.abortController.signal.aborted)
          throw new Error("Request cancelled");
        v += (f > 0 ? " " : "") + d[f], l.onChunk(v), await new Promise((t) => setTimeout(t, 20 + Math.random() * 60));
      }
      l.onComplete();
    } catch (w) {
      this.abortController.signal.aborted || l.onError(w instanceof Error ? w : new Error("Unknown error"));
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort();
  }
}
class xe {
  constructor(s = {}) {
    this.abortController = null, this.apiKey = s.apiKey || "", this.apiUrl = s.apiUrl || "https://api.openai.com/v1/chat/completions", this.model = s.model || "gpt-4", this.systemPrompt = s.systemPrompt || "You are a helpful assistant.";
  }
  /**
   * Initialize the OpenAI adapter
   * For OpenAIAdapter, this is a no-op since authentication happens per-request
   */
  async init() {
  }
  async sendMessage(s, l) {
    var h, u, w, d;
    this.abortController = new AbortController();
    try {
      const v = [
        { role: "system", content: this.systemPrompt }
      ];
      if (s.conversationHistory)
        for (const c of s.conversationHistory)
          c.from === "user" ? v.push({ role: "user", content: c.text }) : c.from === "assistant" && v.push({ role: "assistant", content: c.text });
      v.push({ role: "user", content: s.message });
      const f = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
        },
        body: JSON.stringify({
          model: this.model,
          messages: v,
          stream: !0
        }),
        signal: this.abortController.signal
      });
      if (!f.ok)
        throw new Error(`API error: ${f.status} ${f.statusText}`);
      const t = (h = f.body) == null ? void 0 : h.getReader();
      if (!t)
        throw new Error("Response body is not readable");
      const m = new TextDecoder();
      let p = "";
      for (; ; ) {
        const { done: c, value: n } = await t.read();
        if (c) break;
        const I = m.decode(n, { stream: !0 }).split(`
`).filter((U) => U.trim() !== "");
        for (const U of I)
          if (U.startsWith("data: ")) {
            const D = U.slice(6);
            if (D === "[DONE]")
              continue;
            try {
              const L = (d = (w = (u = JSON.parse(D).choices) == null ? void 0 : u[0]) == null ? void 0 : w.delta) == null ? void 0 : d.content;
              L && (p += L, l.onChunk(p));
            } catch {
              console.warn("Failed to parse SSE data:", D);
            }
          }
      }
      l.onComplete();
    } catch (v) {
      this.abortController.signal.aborted || l.onError(v instanceof Error ? v : new Error("Unknown error"));
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort();
  }
}
class Me {
  constructor(s = {}) {
    this.sessionId = null, this.client = null, this.abortController = null, this.eventStream = null, this.currentCallbacks = null, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.sessionId = s.sessionId || null, this.baseUrl = s.baseUrl || "http://localhost:4096", this.model = s.model, this.agent = s.agent, this.createSession = s.createSession ?? !0;
  }
  async ensureClient() {
    return this.client || (this.client = ge({
      baseUrl: this.baseUrl
    })), this.client;
  }
  /**
   * Initialize the OpenCode client and set up event listener
   * This can be called proactively to set up the connection before sending messages
   */
  async init() {
    const s = await this.ensureClient();
    if (!this.eventStream) {
      const l = await s.event.subscribe();
      this.eventStream = l.stream, this.startEventListener();
    }
  }
  async getAgents() {
    const l = await (await this.ensureClient()).app.agents();
    if (!l.data)
      throw new Error("Failed to fetch agents: no data returned");
    return l.data.map((h) => h.name);
  }
  /**
   * Start the background event listener
   */
  async startEventListener() {
    if (this.eventStream)
      try {
        for await (const s of this.eventStream)
          this.handleEvent(s);
      } catch (s) {
        console.error("Event stream error:", s), this.eventStream = null;
      }
  }
  /**
   * Handle incoming events from the stream
   */
  handleEvent(s) {
    var l, h, u, w, d, v, f, t, m, p;
    if (this.currentCallbacks && !((l = this.abortController) != null && l.signal.aborted)) {
      if (console.log("Received event:", s), s.type === "message.updated") {
        const c = (u = (h = s.properties) == null ? void 0 : h.info) == null ? void 0 : u.id, n = (d = (w = s.properties) == null ? void 0 : w.info) == null ? void 0 : d.role;
        n === "user" ? (this.currentUserMessageId = c, console.log("Tracking user message ID:", c)) : n === "assistant" && (this.currentAssistantMessageId = c, console.log("Tracking assistant message ID:", c)), ((f = (v = s.properties) == null ? void 0 : v.info) == null ? void 0 : f.finish) === "stop" && n === "assistant" && (console.log("Assistant message finished:", c), this.currentCallbacks.onComplete(), this.clearCurrentMessage());
      } else if (s.type === "message.part.updated") {
        const c = (m = (t = s.properties) == null ? void 0 : t.part) == null ? void 0 : m.messageID;
        if (c === this.currentAssistantMessageId && c !== this.currentUserMessageId) {
          console.log("Processing part update for assistant message:", c);
          const n = (p = s.properties) == null ? void 0 : p.part;
          (n == null ? void 0 : n.type) === "text" && n.text ? this.currentCallbacks.onChunk(n.text) : (n == null ? void 0 : n.type) === "thinking" && n.thinking && this.currentCallbacks.onThinking && this.currentCallbacks.onThinking(n.thinking);
        }
      }
    }
  }
  /**
   * Clear current message tracking
   */
  clearCurrentMessage() {
    this.currentCallbacks = null, this.currentAssistantMessageId = null, this.currentUserMessageId = null;
  }
  async ensureSession() {
    var l;
    if (console.log("Ensuring session..."), this.sessionId)
      return this.sessionId;
    if (!this.createSession)
      throw new Error("No session ID provided and createSession is false");
    const s = await this.ensureClient();
    try {
      const h = await s.session.create({
        body: {
          title: `Chat ${(/* @__PURE__ */ new Date()).toLocaleString()}`
        }
      });
      if (console.log("Session created:", h), !((l = h.data) != null && l.id))
        throw new Error("Failed to create session: no session ID returned");
      const u = h.data.id;
      return this.sessionId = u, u;
    } catch (h) {
      throw new Error(`Failed to create session: ${h instanceof Error ? h.message : "Unknown error"}`);
    }
  }
  async sendMessage(s, l) {
    this.abortController = new AbortController();
    try {
      const h = await this.ensureClient(), u = await this.ensureSession();
      this.eventStream || await this.init(), this.currentCallbacks = l;
      const w = [
        {
          type: "text",
          text: s.message
        }
      ];
      console.info("Sending prompt to session:", u, w, this.model, this.agent), await h.session.prompt({
        path: { id: u },
        body: {
          model: this.model,
          agent: this.agent,
          parts: w
        }
      }), console.log("Prompt sent successfully");
    } catch (h) {
      this.abortController.signal.aborted || l.onError(h instanceof Error ? h : new Error("Unknown error")), this.clearCurrentMessage();
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort(), this.clearCurrentMessage();
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
  setSessionId(s) {
    this.sessionId = s;
  }
  /**
   * Clear the current session (will create a new one on next message)
   */
  clearSession() {
    this.sessionId = null;
  }
}
export {
  Ce as ChatWidget,
  Ie as MockAdapter,
  xe as OpenAIAdapter,
  Me as OpenCodeAdapter
};
