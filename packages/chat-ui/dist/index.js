import "svelte/internal/disclose-version";
import * as l from "svelte/internal/client";
import "svelte/internal/flags/legacy";
import { createOpencodeClient as Ee } from "@opencode-ai/sdk/client";
const Ae = "Welcome to Audako MCP Chat. How can I assist you today?", Fe = (u) => ({
  text: u.trim(),
  attachments: []
}), Ju = (u = 0) => (Date.now() + u).toString(), we = (u, e = "1") => ({
  id: e,
  from: "system",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), ve = (u) => ({
  id: Ju(),
  from: "user",
  text: u,
  timestamp: /* @__PURE__ */ new Date()
}), Te = (u) => ({
  id: u,
  from: "assistant",
  text: "",
  timestamp: /* @__PURE__ */ new Date(),
  isStreaming: !0
}), Se = (u) => u.value ?? u.label, Ie = 300, Me = ({ getConfig: u, getShowThinking: e, scrollToBottom: t }) => {
  const n = l.proxy({
    messages: [],
    draft: "",
    isTyping: !1,
    streamingMessageId: null,
    pendingQuestion: null,
    selectedQuestionAnswers: [],
    shouldFocusQuestion: !1
  });
  let i = null, r = null, c = !1;
  const s = (...p) => {
    console.log("[chat-ui]", ...p);
  }, o = () => {
    n.pendingQuestion = null, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = !1, i = null;
  }, a = (p) => {
    const m = i;
    o(), m == null || m(p);
  }, f = (p, m = !1) => (i && i([]), n.pendingQuestion = p, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = m, new Promise((x) => {
    i = x;
  })), h = (p, m) => {
    const x = n.messages.findIndex((k) => k.id === p);
    x !== -1 && (n.messages[x] = m(n.messages[x]), n.messages = [...n.messages]);
  };
  return {
    state: n,
    syncConfig: () => {
      var m, x;
      const p = u();
      s("config resolved", {
        title: p == null ? void 0 : p.title,
        hasAdapter: !!(p != null && p.adapter),
        adapterType: (x = (m = p == null ? void 0 : p.adapter) == null ? void 0 : m.constructor) == null ? void 0 : x.name,
        hasInitialMessage: !!(p != null && p.initialMessage)
      }), p != null && p.adapter && typeof p.adapter.init == "function" && p.adapter !== r && (r = p.adapter, s("initializing adapter"), p.adapter.init().catch((k) => {
        console.error("Failed to initialize adapter:", k);
      })), c || (c = !0, n.messages = [
        we((p == null ? void 0 : p.initialMessage) ?? Ae)
      ]);
    },
    setDraft: (p) => {
      n.draft = p;
    },
    sendMessage: async () => {
      var A;
      const p = u(), m = Fe(n.draft);
      if (s("sendMessage called", {
        draftLength: n.draft.length,
        isDraftEmpty: !m.text,
        hasStreamingMessage: !!n.streamingMessageId,
        hasAdapter: !!(p != null && p.adapter),
        attachmentCount: m.attachments.length
      }), !m.text || n.streamingMessageId || !(p != null && p.adapter)) {
        s("sendMessage aborted", {
          reason: {
            emptyDraft: !m.text,
            streamingInProgress: !!n.streamingMessageId,
            missingAdapter: !(p != null && p.adapter)
          }
        });
        return;
      }
      const x = ve(m.text);
      n.messages = [...n.messages, x], s("user message appended", {
        messageId: x.id,
        totalMessages: n.messages.length
      }), n.draft = "", t(), n.isTyping = !0, await new Promise((y) => setTimeout(y, Ie));
      const k = Ju(1), E = Te(k);
      n.messages = [...n.messages, E], n.isTyping = !1, n.streamingMessageId = k, s("assistant streaming message created", {
        messageId: k,
        historyLength: n.messages.filter((y) => y.from !== "system").length,
        adapterType: (A = p.adapter.constructor) == null ? void 0 : A.name
      }), t();
      try {
        s("calling adapter.sendMessage"), await p.adapter.sendMessage(
          {
            message: m.text,
            conversationHistory: n.messages.filter((y) => y.from !== "system")
          },
          {
            onChunk: (y) => {
              s("adapter chunk received", { messageId: k, chunkLength: y.length }), h(k, (w) => ({ ...w, text: y })), t();
            },
            onThinking: (y) => {
              e() && (s("adapter thinking chunk received", { messageId: k, chunkLength: y.length }), h(k, (w) => ({ ...w, thinking: { content: y, isStreaming: !0 } })), t());
            },
            onQuestion: async (y) => {
              var H;
              s("adapter question received", {
                optionCount: ((H = y.options) == null ? void 0 : H.length) ?? 0,
                allowMultiple: !!y.allowMultiple
              });
              const w = typeof document < "u" ? document.activeElement : null, j = w instanceof HTMLElement && w.classList.contains("chat-widget__input");
              return f(y, j);
            },
            onComplete: () => {
              s("adapter stream completed", { messageId: k }), h(k, (y) => ({
                ...y,
                isStreaming: !1,
                thinking: e() && y.thinking ? { ...y.thinking, isStreaming: !1 } : void 0
              })), o(), n.streamingMessageId = null, t();
            },
            onError: (y) => {
              s("adapter stream errored", { messageId: k, errorMessage: y.message }), console.error("Chat error:", y), h(k, (w) => ({
                ...w,
                text: `Error: ${y.message}`,
                isStreaming: !1
              })), o(), n.streamingMessageId = null, t();
            }
          }
        ), s("adapter.sendMessage resolved", { messageId: k });
      } catch (y) {
        s("adapter.sendMessage threw", {
          messageId: k,
          errorMessage: y instanceof Error ? y.message : "Unknown error"
        }), console.error("Unexpected error:", y), h(k, (w) => ({
          ...w,
          text: "Unexpected error occurred",
          isStreaming: !1
        })), o(), n.streamingMessageId = null, t();
      }
    },
    toggleQuestionAnswer: (p) => {
      if (n.pendingQuestion) {
        if (!n.pendingQuestion.allowMultiple) {
          a([p]);
          return;
        }
        n.selectedQuestionAnswers.includes(p) ? n.selectedQuestionAnswers = n.selectedQuestionAnswers.filter((m) => m !== p) : n.selectedQuestionAnswers = [...n.selectedQuestionAnswers, p];
      }
    },
    submitQuestionAnswers: () => {
      var p;
      !((p = n.pendingQuestion) != null && p.allowMultiple) || n.selectedQuestionAnswers.length === 0 || a(n.selectedQuestionAnswers);
    },
    clearQuestionFocusRequest: () => {
      n.shouldFocusQuestion = !1;
    }
  };
};
var qe = l.from_html('<h2 class="chat-widget__header-title svelte-hbwy0v"> </h2>'), ze = l.from_html('<header class="chat-widget__header svelte-hbwy0v"><div class="chat-widget__header-content"><!></div></header>');
function Be(u, e) {
  var t = ze(), n = l.child(t), i = l.child(n);
  {
    var r = (s) => {
      var o = l.comment(), a = l.first_child(o);
      l.snippet(a, () => e.header, () => e.title), l.append(s, o);
    }, c = (s) => {
      var o = qe(), a = l.child(o, !0);
      l.reset(o), l.template_effect(() => l.set_text(a, e.title)), l.append(s, o);
    };
    l.if(i, (s) => {
      e.header ? s(r) : s(c, !1);
    });
  }
  l.reset(n), l.reset(t), l.append(u, t);
}
const Le = (u) => u.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), Iu = {};
function Re(u) {
  let e = Iu[u];
  if (e)
    return e;
  e = Iu[u] = [];
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
function G(u, e) {
  typeof e != "string" && (e = G.defaultChars);
  const t = Re(e);
  return u.replace(/(%[a-f0-9]{2})+/gi, function(n) {
    let i = "";
    for (let r = 0, c = n.length; r < c; r += 3) {
      const s = parseInt(n.slice(r + 1, r + 3), 16);
      if (s < 128) {
        i += t[s];
        continue;
      }
      if ((s & 224) === 192 && r + 3 < c) {
        const o = parseInt(n.slice(r + 4, r + 6), 16);
        if ((o & 192) === 128) {
          const a = s << 6 & 1984 | o & 63;
          a < 128 ? i += "��" : i += String.fromCharCode(a), r += 3;
          continue;
        }
      }
      if ((s & 240) === 224 && r + 6 < c) {
        const o = parseInt(n.slice(r + 4, r + 6), 16), a = parseInt(n.slice(r + 7, r + 9), 16);
        if ((o & 192) === 128 && (a & 192) === 128) {
          const f = s << 12 & 61440 | o << 6 & 4032 | a & 63;
          f < 2048 || f >= 55296 && f <= 57343 ? i += "���" : i += String.fromCharCode(f), r += 6;
          continue;
        }
      }
      if ((s & 248) === 240 && r + 9 < c) {
        const o = parseInt(n.slice(r + 4, r + 6), 16), a = parseInt(n.slice(r + 7, r + 9), 16), f = parseInt(n.slice(r + 10, r + 12), 16);
        if ((o & 192) === 128 && (a & 192) === 128 && (f & 192) === 128) {
          let h = s << 18 & 1835008 | o << 12 & 258048 | a << 6 & 4032 | f & 63;
          h < 65536 || h > 1114111 ? i += "����" : (h -= 65536, i += String.fromCharCode(55296 + (h >> 10), 56320 + (h & 1023))), r += 9;
          continue;
        }
      }
      i += "�";
    }
    return i;
  });
}
G.defaultChars = ";/?:@&=+$,#";
G.componentChars = "";
const Mu = {};
function Pe(u) {
  let e = Mu[u];
  if (e)
    return e;
  e = Mu[u] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    /^[0-9a-z]$/i.test(n) ? e.push(n) : e.push("%" + ("0" + t.toString(16).toUpperCase()).slice(-2));
  }
  for (let t = 0; t < u.length; t++)
    e[u.charCodeAt(t)] = u[t];
  return e;
}
function uu(u, e, t) {
  typeof e != "string" && (t = e, e = uu.defaultChars), typeof t > "u" && (t = !0);
  const n = Pe(e);
  let i = "";
  for (let r = 0, c = u.length; r < c; r++) {
    const s = u.charCodeAt(r);
    if (t && s === 37 && r + 2 < c && /^[0-9a-f]{2}$/i.test(u.slice(r + 1, r + 3))) {
      i += u.slice(r, r + 3), r += 2;
      continue;
    }
    if (s < 128) {
      i += n[s];
      continue;
    }
    if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && r + 1 < c) {
        const o = u.charCodeAt(r + 1);
        if (o >= 56320 && o <= 57343) {
          i += encodeURIComponent(u[r] + u[r + 1]), r++;
          continue;
        }
      }
      i += "%EF%BF%BD";
      continue;
    }
    i += encodeURIComponent(u[r]);
  }
  return i;
}
uu.defaultChars = ";/?:@&=+$,-_.!~*'()#";
uu.componentChars = "-_.!~*'()";
function Cu(u) {
  let e = "";
  return e += u.protocol || "", e += u.slashes ? "//" : "", e += u.auth ? u.auth + "@" : "", u.hostname && u.hostname.indexOf(":") !== -1 ? e += "[" + u.hostname + "]" : e += u.hostname || "", e += u.port ? ":" + u.port : "", e += u.pathname || "", e += u.search || "", e += u.hash || "", e;
}
function iu() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const Oe = /^([a-z0-9.+-]+:)/i, Ne = /:[0-9]*$/, Ue = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, je = ["<", ">", '"', "`", " ", "\r", `
`, "	"], He = ["{", "}", "|", "\\", "^", "`"].concat(je), Ze = ["'"].concat(He), qu = ["%", "/", "?", ";", "#"].concat(Ze), zu = ["/", "?", "#"], Qe = 255, Bu = /^[+a-z0-9A-Z_-]{0,63}$/, Ve = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Lu = {
  javascript: !0,
  "javascript:": !0
}, Ru = {
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
function Du(u, e) {
  if (u && u instanceof iu) return u;
  const t = new iu();
  return t.parse(u, e), t;
}
iu.prototype.parse = function(u, e) {
  let t, n, i, r = u;
  if (r = r.trim(), !e && u.split("#").length === 1) {
    const a = Ue.exec(r);
    if (a)
      return this.pathname = a[1], a[2] && (this.search = a[2]), this;
  }
  let c = Oe.exec(r);
  if (c && (c = c[0], t = c.toLowerCase(), this.protocol = c, r = r.substr(c.length)), (e || c || r.match(/^\/\/[^@\/]+@[^@\/]+/)) && (i = r.substr(0, 2) === "//", i && !(c && Lu[c]) && (r = r.substr(2), this.slashes = !0)), !Lu[c] && (i || c && !Ru[c])) {
    let a = -1;
    for (let b = 0; b < zu.length; b++)
      n = r.indexOf(zu[b]), n !== -1 && (a === -1 || n < a) && (a = n);
    let f, h;
    a === -1 ? h = r.lastIndexOf("@") : h = r.lastIndexOf("@", a), h !== -1 && (f = r.slice(0, h), r = r.slice(h + 1), this.auth = f), a = -1;
    for (let b = 0; b < qu.length; b++)
      n = r.indexOf(qu[b]), n !== -1 && (a === -1 || n < a) && (a = n);
    a === -1 && (a = r.length), r[a - 1] === ":" && a--;
    const g = r.slice(0, a);
    r = r.slice(a), this.parseHost(g), this.hostname = this.hostname || "";
    const d = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!d) {
      const b = this.hostname.split(/\./);
      for (let C = 0, _ = b.length; C < _; C++) {
        const D = b[C];
        if (D && !D.match(Bu)) {
          let p = "";
          for (let m = 0, x = D.length; m < x; m++)
            D.charCodeAt(m) > 127 ? p += "x" : p += D[m];
          if (!p.match(Bu)) {
            const m = b.slice(0, C), x = b.slice(C + 1), k = D.match(Ve);
            k && (m.push(k[1]), x.unshift(k[2])), x.length && (r = x.join(".") + r), this.hostname = m.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Qe && (this.hostname = ""), d && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const s = r.indexOf("#");
  s !== -1 && (this.hash = r.substr(s), r = r.slice(0, s));
  const o = r.indexOf("?");
  return o !== -1 && (this.search = r.substr(o), r = r.slice(0, o)), r && (this.pathname = r), Ru[t] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
iu.prototype.parseHost = function(u) {
  let e = Ne.exec(u);
  e && (e = e[0], e !== ":" && (this.port = e.substr(1)), u = u.substr(0, u.length - e.length)), u && (this.hostname = u);
};
const Ge = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: G,
  encode: uu,
  format: Cu,
  parse: Du
}, Symbol.toStringTag, { value: "Module" })), Ku = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Xu = /[\0-\x1F\x7F-\x9F]/, We = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Eu = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, Yu = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, $u = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Je = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: Ku,
  Cc: Xu,
  Cf: We,
  P: Eu,
  S: Yu,
  Z: $u
}, Symbol.toStringTag, { value: "Module" })), Ke = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((u) => u.charCodeAt(0))
), Xe = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((u) => u.charCodeAt(0))
);
var fu;
const Ye = /* @__PURE__ */ new Map([
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
]), $e = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (fu = String.fromCodePoint) !== null && fu !== void 0 ? fu : function(u) {
    let e = "";
    return u > 65535 && (u -= 65536, e += String.fromCharCode(u >>> 10 & 1023 | 55296), u = 56320 | u & 1023), e += String.fromCharCode(u), e;
  }
);
function u0(u) {
  var e;
  return u >= 55296 && u <= 57343 || u > 1114111 ? 65533 : (e = Ye.get(u)) !== null && e !== void 0 ? e : u;
}
var T;
(function(u) {
  u[u.NUM = 35] = "NUM", u[u.SEMI = 59] = "SEMI", u[u.EQUALS = 61] = "EQUALS", u[u.ZERO = 48] = "ZERO", u[u.NINE = 57] = "NINE", u[u.LOWER_A = 97] = "LOWER_A", u[u.LOWER_F = 102] = "LOWER_F", u[u.LOWER_X = 120] = "LOWER_X", u[u.LOWER_Z = 122] = "LOWER_Z", u[u.UPPER_A = 65] = "UPPER_A", u[u.UPPER_F = 70] = "UPPER_F", u[u.UPPER_Z = 90] = "UPPER_Z";
})(T || (T = {}));
const e0 = 32;
var N;
(function(u) {
  u[u.VALUE_LENGTH = 49152] = "VALUE_LENGTH", u[u.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", u[u.JUMP_TABLE = 127] = "JUMP_TABLE";
})(N || (N = {}));
function xu(u) {
  return u >= T.ZERO && u <= T.NINE;
}
function t0(u) {
  return u >= T.UPPER_A && u <= T.UPPER_F || u >= T.LOWER_A && u <= T.LOWER_F;
}
function n0(u) {
  return u >= T.UPPER_A && u <= T.UPPER_Z || u >= T.LOWER_A && u <= T.LOWER_Z || xu(u);
}
function r0(u) {
  return u === T.EQUALS || n0(u);
}
var v;
(function(u) {
  u[u.EntityStart = 0] = "EntityStart", u[u.NumericStart = 1] = "NumericStart", u[u.NumericDecimal = 2] = "NumericDecimal", u[u.NumericHex = 3] = "NumericHex", u[u.NamedEntity = 4] = "NamedEntity";
})(v || (v = {}));
var O;
(function(u) {
  u[u.Legacy = 0] = "Legacy", u[u.Strict = 1] = "Strict", u[u.Attribute = 2] = "Attribute";
})(O || (O = {}));
class i0 {
  constructor(e, t, n) {
    this.decodeTree = e, this.emitCodePoint = t, this.errors = n, this.state = v.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = O.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(e) {
    this.decodeMode = e, this.state = v.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
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
      case v.EntityStart:
        return e.charCodeAt(t) === T.NUM ? (this.state = v.NumericStart, this.consumed += 1, this.stateNumericStart(e, t + 1)) : (this.state = v.NamedEntity, this.stateNamedEntity(e, t));
      case v.NumericStart:
        return this.stateNumericStart(e, t);
      case v.NumericDecimal:
        return this.stateNumericDecimal(e, t);
      case v.NumericHex:
        return this.stateNumericHex(e, t);
      case v.NamedEntity:
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
    return t >= e.length ? -1 : (e.charCodeAt(t) | e0) === T.LOWER_X ? (this.state = v.NumericHex, this.consumed += 1, this.stateNumericHex(e, t + 1)) : (this.state = v.NumericDecimal, this.stateNumericDecimal(e, t));
  }
  addToNumericResult(e, t, n, i) {
    if (t !== n) {
      const r = n - t;
      this.result = this.result * Math.pow(i, r) + parseInt(e.substr(t, r), i), this.consumed += r;
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
      const i = e.charCodeAt(t);
      if (xu(i) || t0(i))
        t += 1;
      else
        return this.addToNumericResult(e, n, t, 16), this.emitNumericEntity(i, 3);
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
      const i = e.charCodeAt(t);
      if (xu(i))
        t += 1;
      else
        return this.addToNumericResult(e, n, t, 10), this.emitNumericEntity(i, 2);
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
    if (e === T.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === O.Strict)
      return 0;
    return this.emitCodePoint(u0(this.result), this.consumed), this.errors && (e !== T.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
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
    let i = n[this.treeIndex], r = (i & N.VALUE_LENGTH) >> 14;
    for (; t < e.length; t++, this.excess++) {
      const c = e.charCodeAt(t);
      if (this.treeIndex = s0(n, i, this.treeIndex + Math.max(1, r), c), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === O.Attribute && // We shouldn't have consumed any characters after the entity,
        (r === 0 || // And there should be no invalid characters.
        r0(c)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (i = n[this.treeIndex], r = (i & N.VALUE_LENGTH) >> 14, r !== 0) {
        if (c === T.SEMI)
          return this.emitNamedEntityData(this.treeIndex, r, this.consumed + this.excess);
        this.decodeMode !== O.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
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
    const { result: t, decodeTree: n } = this, i = (n[t] & N.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(t, i, this.consumed), (e = this.errors) === null || e === void 0 || e.missingSemicolonAfterCharacterReference(), this.consumed;
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
    const { decodeTree: i } = this;
    return this.emitCodePoint(t === 1 ? i[e] & ~N.VALUE_LENGTH : i[e + 1], n), t === 3 && this.emitCodePoint(i[e + 2], n), n;
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
      case v.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== O.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case v.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case v.NumericHex:
        return this.emitNumericEntity(0, 3);
      case v.NumericStart:
        return (e = this.errors) === null || e === void 0 || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case v.EntityStart:
        return 0;
    }
  }
}
function ue(u) {
  let e = "";
  const t = new i0(u, (n) => e += $e(n));
  return function(i, r) {
    let c = 0, s = 0;
    for (; (s = i.indexOf("&", s)) >= 0; ) {
      e += i.slice(c, s), t.startEntity(r);
      const a = t.write(
        i,
        // Skip the "&"
        s + 1
      );
      if (a < 0) {
        c = s + t.end();
        break;
      }
      c = s + a, s = a === 0 ? c + 1 : c;
    }
    const o = e + i.slice(c);
    return e = "", o;
  };
}
function s0(u, e, t, n) {
  const i = (e & N.BRANCH_LENGTH) >> 7, r = e & N.JUMP_TABLE;
  if (i === 0)
    return r !== 0 && n === r ? t : -1;
  if (r) {
    const o = n - r;
    return o < 0 || o >= i ? -1 : u[t + o] - 1;
  }
  let c = t, s = c + i - 1;
  for (; c <= s; ) {
    const o = c + s >>> 1, a = u[o];
    if (a < n)
      c = o + 1;
    else if (a > n)
      s = o - 1;
    else
      return u[o + i];
  }
  return -1;
}
const c0 = ue(Ke);
ue(Xe);
function ee(u, e = O.Legacy) {
  return c0(u, e);
}
function o0(u) {
  return Object.prototype.toString.call(u);
}
function Au(u) {
  return o0(u) === "[object String]";
}
const a0 = Object.prototype.hasOwnProperty;
function l0(u, e) {
  return a0.call(u, e);
}
function ou(u) {
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
function te(u, e, t) {
  return [].concat(u.slice(0, e), t, u.slice(e + 1));
}
function Fu(u) {
  return !(u >= 55296 && u <= 57343 || u >= 64976 && u <= 65007 || (u & 65535) === 65535 || (u & 65535) === 65534 || u >= 0 && u <= 8 || u === 11 || u >= 14 && u <= 31 || u >= 127 && u <= 159 || u > 1114111);
}
function su(u) {
  if (u > 65535) {
    u -= 65536;
    const e = 55296 + (u >> 10), t = 56320 + (u & 1023);
    return String.fromCharCode(e, t);
  }
  return String.fromCharCode(u);
}
const ne = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, d0 = /&([a-z#][a-z0-9]{1,31});/gi, f0 = new RegExp(ne.source + "|" + d0.source, "gi"), h0 = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function b0(u, e) {
  if (e.charCodeAt(0) === 35 && h0.test(e)) {
    const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Fu(n) ? su(n) : u;
  }
  const t = ee(u);
  return t !== u ? t : u;
}
function p0(u) {
  return u.indexOf("\\") < 0 ? u : u.replace(ne, "$1");
}
function W(u) {
  return u.indexOf("\\") < 0 && u.indexOf("&") < 0 ? u : u.replace(f0, function(e, t, n) {
    return t || b0(e, n);
  });
}
const g0 = /[&<>"]/, m0 = /[&<>"]/g, _0 = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function x0(u) {
  return _0[u];
}
function U(u) {
  return g0.test(u) ? u.replace(m0, x0) : u;
}
const k0 = /[.?*+^$[\]\\(){}|-]/g;
function y0(u) {
  return u.replace(k0, "\\$&");
}
function F(u) {
  switch (u) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function K(u) {
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
function X(u) {
  return Eu.test(u) || Yu.test(u);
}
function Y(u) {
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
function au(u) {
  return u = u.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (u = u.replace(/ẞ/g, "ß")), u.toLowerCase().toUpperCase();
}
const C0 = { mdurl: Ge, ucmicro: Je }, D0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: te,
  assign: ou,
  escapeHtml: U,
  escapeRE: y0,
  fromCodePoint: su,
  has: l0,
  isMdAsciiPunct: Y,
  isPunctChar: X,
  isSpace: F,
  isString: Au,
  isValidEntityCode: Fu,
  isWhiteSpace: K,
  lib: C0,
  normalizeReference: au,
  unescapeAll: W,
  unescapeMd: p0
}, Symbol.toStringTag, { value: "Module" }));
function E0(u, e, t) {
  let n, i, r, c;
  const s = u.posMax, o = u.pos;
  for (u.pos = e + 1, n = 1; u.pos < s; ) {
    if (r = u.src.charCodeAt(u.pos), r === 93 && (n--, n === 0)) {
      i = !0;
      break;
    }
    if (c = u.pos, u.md.inline.skipToken(u), r === 91) {
      if (c === u.pos - 1)
        n++;
      else if (t)
        return u.pos = o, -1;
    }
  }
  let a = -1;
  return i && (a = u.pos), u.pos = o, a;
}
function A0(u, e, t) {
  let n, i = e;
  const r = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (u.charCodeAt(i) === 60) {
    for (i++; i < t; ) {
      if (n = u.charCodeAt(i), n === 10 || n === 60)
        return r;
      if (n === 62)
        return r.pos = i + 1, r.str = W(u.slice(e + 1, i)), r.ok = !0, r;
      if (n === 92 && i + 1 < t) {
        i += 2;
        continue;
      }
      i++;
    }
    return r;
  }
  let c = 0;
  for (; i < t && (n = u.charCodeAt(i), !(n === 32 || n < 32 || n === 127)); ) {
    if (n === 92 && i + 1 < t) {
      if (u.charCodeAt(i + 1) === 32)
        break;
      i += 2;
      continue;
    }
    if (n === 40 && (c++, c > 32))
      return r;
    if (n === 41) {
      if (c === 0)
        break;
      c--;
    }
    i++;
  }
  return e === i || c !== 0 || (r.str = W(u.slice(e, i)), r.pos = i, r.ok = !0), r;
}
function F0(u, e, t, n) {
  let i, r = e;
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
    if (r >= t)
      return c;
    let s = u.charCodeAt(r);
    if (s !== 34 && s !== 39 && s !== 40)
      return c;
    e++, r++, s === 40 && (s = 41), c.marker = s;
  }
  for (; r < t; ) {
    if (i = u.charCodeAt(r), i === c.marker)
      return c.pos = r + 1, c.str += W(u.slice(e, r)), c.ok = !0, c;
    if (i === 40 && c.marker === 41)
      return c;
    i === 92 && r + 1 < t && r++, r++;
  }
  return c.can_continue = !0, c.str += W(u.slice(e, r)), c;
}
const w0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: A0,
  parseLinkLabel: E0,
  parseLinkTitle: F0
}, Symbol.toStringTag, { value: "Module" })), L = {};
L.code_inline = function(u, e, t, n, i) {
  const r = u[e];
  return "<code" + i.renderAttrs(r) + ">" + U(r.content) + "</code>";
};
L.code_block = function(u, e, t, n, i) {
  const r = u[e];
  return "<pre" + i.renderAttrs(r) + "><code>" + U(u[e].content) + `</code></pre>
`;
};
L.fence = function(u, e, t, n, i) {
  const r = u[e], c = r.info ? W(r.info).trim() : "";
  let s = "", o = "";
  if (c) {
    const f = c.split(/(\s+)/g);
    s = f[0], o = f.slice(2).join("");
  }
  let a;
  if (t.highlight ? a = t.highlight(r.content, s, o) || U(r.content) : a = U(r.content), a.indexOf("<pre") === 0)
    return a + `
`;
  if (c) {
    const f = r.attrIndex("class"), h = r.attrs ? r.attrs.slice() : [];
    f < 0 ? h.push(["class", t.langPrefix + s]) : (h[f] = h[f].slice(), h[f][1] += " " + t.langPrefix + s);
    const g = {
      attrs: h
    };
    return `<pre><code${i.renderAttrs(g)}>${a}</code></pre>
`;
  }
  return `<pre><code${i.renderAttrs(r)}>${a}</code></pre>
`;
};
L.image = function(u, e, t, n, i) {
  const r = u[e];
  return r.attrs[r.attrIndex("alt")][1] = i.renderInlineAsText(r.children, t, n), i.renderToken(u, e, t);
};
L.hardbreak = function(u, e, t) {
  return t.xhtmlOut ? `<br />
` : `<br>
`;
};
L.softbreak = function(u, e, t) {
  return t.breaks ? t.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
L.text = function(u, e) {
  return U(u[e].content);
};
L.html_block = function(u, e) {
  return u[e].content;
};
L.html_inline = function(u, e) {
  return u[e].content;
};
function J() {
  this.rules = ou({}, L);
}
J.prototype.renderAttrs = function(e) {
  let t, n, i;
  if (!e.attrs)
    return "";
  for (i = "", t = 0, n = e.attrs.length; t < n; t++)
    i += " " + U(e.attrs[t][0]) + '="' + U(e.attrs[t][1]) + '"';
  return i;
};
J.prototype.renderToken = function(e, t, n) {
  const i = e[t];
  let r = "";
  if (i.hidden)
    return "";
  i.block && i.nesting !== -1 && t && e[t - 1].hidden && (r += `
`), r += (i.nesting === -1 ? "</" : "<") + i.tag, r += this.renderAttrs(i), i.nesting === 0 && n.xhtmlOut && (r += " /");
  let c = !1;
  if (i.block && (c = !0, i.nesting === 1 && t + 1 < e.length)) {
    const s = e[t + 1];
    (s.type === "inline" || s.hidden || s.nesting === -1 && s.tag === i.tag) && (c = !1);
  }
  return r += c ? `>
` : ">", r;
};
J.prototype.renderInline = function(u, e, t) {
  let n = "";
  const i = this.rules;
  for (let r = 0, c = u.length; r < c; r++) {
    const s = u[r].type;
    typeof i[s] < "u" ? n += i[s](u, r, e, t, this) : n += this.renderToken(u, r, e);
  }
  return n;
};
J.prototype.renderInlineAsText = function(u, e, t) {
  let n = "";
  for (let i = 0, r = u.length; i < r; i++)
    switch (u[i].type) {
      case "text":
        n += u[i].content;
        break;
      case "image":
        n += this.renderInlineAsText(u[i].children, e, t);
        break;
      case "html_inline":
      case "html_block":
        n += u[i].content;
        break;
      case "softbreak":
      case "hardbreak":
        n += `
`;
        break;
    }
  return n;
};
J.prototype.render = function(u, e, t) {
  let n = "";
  const i = this.rules;
  for (let r = 0, c = u.length; r < c; r++) {
    const s = u[r].type;
    s === "inline" ? n += this.renderInline(u[r].children, e, t) : typeof i[s] < "u" ? n += i[s](u, r, e, t, this) : n += this.renderToken(u, r, e, t);
  }
  return n;
};
function S() {
  this.__rules__ = [], this.__cache__ = null;
}
S.prototype.__find__ = function(u) {
  for (let e = 0; e < this.__rules__.length; e++)
    if (this.__rules__[e].name === u)
      return e;
  return -1;
};
S.prototype.__compile__ = function() {
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
S.prototype.at = function(u, e, t) {
  const n = this.__find__(u), i = t || {};
  if (n === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__[n].fn = e, this.__rules__[n].alt = i.alt || [], this.__cache__ = null;
};
S.prototype.before = function(u, e, t, n) {
  const i = this.__find__(u), r = n || {};
  if (i === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__.splice(i, 0, {
    name: e,
    enabled: !0,
    fn: t,
    alt: r.alt || []
  }), this.__cache__ = null;
};
S.prototype.after = function(u, e, t, n) {
  const i = this.__find__(u), r = n || {};
  if (i === -1)
    throw new Error("Parser rule not found: " + u);
  this.__rules__.splice(i + 1, 0, {
    name: e,
    enabled: !0,
    fn: t,
    alt: r.alt || []
  }), this.__cache__ = null;
};
S.prototype.push = function(u, e, t) {
  const n = t || {};
  this.__rules__.push({
    name: u,
    enabled: !0,
    fn: e,
    alt: n.alt || []
  }), this.__cache__ = null;
};
S.prototype.enable = function(u, e) {
  Array.isArray(u) || (u = [u]);
  const t = [];
  return u.forEach(function(n) {
    const i = this.__find__(n);
    if (i < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[i].enabled = !0, t.push(n);
  }, this), this.__cache__ = null, t;
};
S.prototype.enableOnly = function(u, e) {
  Array.isArray(u) || (u = [u]), this.__rules__.forEach(function(t) {
    t.enabled = !1;
  }), this.enable(u, e);
};
S.prototype.disable = function(u, e) {
  Array.isArray(u) || (u = [u]);
  const t = [];
  return u.forEach(function(n) {
    const i = this.__find__(n);
    if (i < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[i].enabled = !1, t.push(n);
  }, this), this.__cache__ = null, t;
};
S.prototype.getRules = function(u) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[u] || [];
};
function q(u, e, t) {
  this.type = u, this.tag = e, this.attrs = null, this.map = null, this.nesting = t, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
q.prototype.attrIndex = function(e) {
  if (!this.attrs)
    return -1;
  const t = this.attrs;
  for (let n = 0, i = t.length; n < i; n++)
    if (t[n][0] === e)
      return n;
  return -1;
};
q.prototype.attrPush = function(e) {
  this.attrs ? this.attrs.push(e) : this.attrs = [e];
};
q.prototype.attrSet = function(e, t) {
  const n = this.attrIndex(e), i = [e, t];
  n < 0 ? this.attrPush(i) : this.attrs[n] = i;
};
q.prototype.attrGet = function(e) {
  const t = this.attrIndex(e);
  let n = null;
  return t >= 0 && (n = this.attrs[t][1]), n;
};
q.prototype.attrJoin = function(e, t) {
  const n = this.attrIndex(e);
  n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = this.attrs[n][1] + " " + t;
};
function re(u, e, t) {
  this.src = u, this.env = t, this.tokens = [], this.inlineMode = !1, this.md = e;
}
re.prototype.Token = q;
const v0 = /\r\n?|\n/g, T0 = /\0/g;
function S0(u) {
  let e;
  e = u.src.replace(v0, `
`), e = e.replace(T0, "�"), u.src = e;
}
function I0(u) {
  let e;
  u.inlineMode ? (e = new u.Token("inline", "", 0), e.content = u.src, e.map = [0, 1], e.children = [], u.tokens.push(e)) : u.md.block.parse(u.src, u.md, u.env, u.tokens);
}
function M0(u) {
  const e = u.tokens;
  for (let t = 0, n = e.length; t < n; t++) {
    const i = e[t];
    i.type === "inline" && u.md.inline.parse(i.content, u.md, u.env, i.children);
  }
}
function q0(u) {
  return /^<a[>\s]/i.test(u);
}
function z0(u) {
  return /^<\/a\s*>/i.test(u);
}
function B0(u) {
  const e = u.tokens;
  if (u.md.options.linkify)
    for (let t = 0, n = e.length; t < n; t++) {
      if (e[t].type !== "inline" || !u.md.linkify.pretest(e[t].content))
        continue;
      let i = e[t].children, r = 0;
      for (let c = i.length - 1; c >= 0; c--) {
        const s = i[c];
        if (s.type === "link_close") {
          for (c--; i[c].level !== s.level && i[c].type !== "link_open"; )
            c--;
          continue;
        }
        if (s.type === "html_inline" && (q0(s.content) && r > 0 && r--, z0(s.content) && r++), !(r > 0) && s.type === "text" && u.md.linkify.test(s.content)) {
          const o = s.content;
          let a = u.md.linkify.match(o);
          const f = [];
          let h = s.level, g = 0;
          a.length > 0 && a[0].index === 0 && c > 0 && i[c - 1].type === "text_special" && (a = a.slice(1));
          for (let d = 0; d < a.length; d++) {
            const b = a[d].url, C = u.md.normalizeLink(b);
            if (!u.md.validateLink(C))
              continue;
            let _ = a[d].text;
            a[d].schema ? a[d].schema === "mailto:" && !/^mailto:/i.test(_) ? _ = u.md.normalizeLinkText("mailto:" + _).replace(/^mailto:/, "") : _ = u.md.normalizeLinkText(_) : _ = u.md.normalizeLinkText("http://" + _).replace(/^http:\/\//, "");
            const D = a[d].index;
            if (D > g) {
              const k = new u.Token("text", "", 0);
              k.content = o.slice(g, D), k.level = h, f.push(k);
            }
            const p = new u.Token("link_open", "a", 1);
            p.attrs = [["href", C]], p.level = h++, p.markup = "linkify", p.info = "auto", f.push(p);
            const m = new u.Token("text", "", 0);
            m.content = _, m.level = h, f.push(m);
            const x = new u.Token("link_close", "a", -1);
            x.level = --h, x.markup = "linkify", x.info = "auto", f.push(x), g = a[d].lastIndex;
          }
          if (g < o.length) {
            const d = new u.Token("text", "", 0);
            d.content = o.slice(g), d.level = h, f.push(d);
          }
          e[t].children = i = te(i, c, f);
        }
      }
    }
}
const ie = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, L0 = /\((c|tm|r)\)/i, R0 = /\((c|tm|r)\)/ig, P0 = {
  c: "©",
  r: "®",
  tm: "™"
};
function O0(u, e) {
  return P0[e.toLowerCase()];
}
function N0(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && (n.content = n.content.replace(R0, O0)), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function U0(u) {
  let e = 0;
  for (let t = u.length - 1; t >= 0; t--) {
    const n = u[t];
    n.type === "text" && !e && ie.test(n.content) && (n.content = n.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), n.type === "link_open" && n.info === "auto" && e--, n.type === "link_close" && n.info === "auto" && e++;
  }
}
function j0(u) {
  let e;
  if (u.md.options.typographer)
    for (e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type === "inline" && (L0.test(u.tokens[e].content) && N0(u.tokens[e].children), ie.test(u.tokens[e].content) && U0(u.tokens[e].children));
}
const H0 = /['"]/, Pu = /['"]/g, Ou = "’";
function nu(u, e, t) {
  return u.slice(0, e) + t + u.slice(e + 1);
}
function Z0(u, e) {
  let t;
  const n = [];
  for (let i = 0; i < u.length; i++) {
    const r = u[i], c = u[i].level;
    for (t = n.length - 1; t >= 0 && !(n[t].level <= c); t--)
      ;
    if (n.length = t + 1, r.type !== "text")
      continue;
    let s = r.content, o = 0, a = s.length;
    u:
      for (; o < a; ) {
        Pu.lastIndex = o;
        const f = Pu.exec(s);
        if (!f)
          break;
        let h = !0, g = !0;
        o = f.index + 1;
        const d = f[0] === "'";
        let b = 32;
        if (f.index - 1 >= 0)
          b = s.charCodeAt(f.index - 1);
        else
          for (t = i - 1; t >= 0 && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t--)
            if (u[t].content) {
              b = u[t].content.charCodeAt(u[t].content.length - 1);
              break;
            }
        let C = 32;
        if (o < a)
          C = s.charCodeAt(o);
        else
          for (t = i + 1; t < u.length && !(u[t].type === "softbreak" || u[t].type === "hardbreak"); t++)
            if (u[t].content) {
              C = u[t].content.charCodeAt(0);
              break;
            }
        const _ = Y(b) || X(String.fromCharCode(b)), D = Y(C) || X(String.fromCharCode(C)), p = K(b), m = K(C);
        if (m ? h = !1 : D && (p || _ || (h = !1)), p ? g = !1 : _ && (m || D || (g = !1)), C === 34 && f[0] === '"' && b >= 48 && b <= 57 && (g = h = !1), h && g && (h = _, g = D), !h && !g) {
          d && (r.content = nu(r.content, f.index, Ou));
          continue;
        }
        if (g)
          for (t = n.length - 1; t >= 0; t--) {
            let x = n[t];
            if (n[t].level < c)
              break;
            if (x.single === d && n[t].level === c) {
              x = n[t];
              let k, E;
              d ? (k = e.md.options.quotes[2], E = e.md.options.quotes[3]) : (k = e.md.options.quotes[0], E = e.md.options.quotes[1]), r.content = nu(r.content, f.index, E), u[x.token].content = nu(
                u[x.token].content,
                x.pos,
                k
              ), o += E.length - 1, x.token === i && (o += k.length - 1), s = r.content, a = s.length, n.length = t;
              continue u;
            }
          }
        h ? n.push({
          token: i,
          pos: f.index,
          single: d,
          level: c
        }) : g && d && (r.content = nu(r.content, f.index, Ou));
      }
  }
}
function Q0(u) {
  if (u.md.options.typographer)
    for (let e = u.tokens.length - 1; e >= 0; e--)
      u.tokens[e].type !== "inline" || !H0.test(u.tokens[e].content) || Z0(u.tokens[e].children, u);
}
function V0(u) {
  let e, t;
  const n = u.tokens, i = n.length;
  for (let r = 0; r < i; r++) {
    if (n[r].type !== "inline") continue;
    const c = n[r].children, s = c.length;
    for (e = 0; e < s; e++)
      c[e].type === "text_special" && (c[e].type = "text");
    for (e = t = 0; e < s; e++)
      c[e].type === "text" && e + 1 < s && c[e + 1].type === "text" ? c[e + 1].content = c[e].content + c[e + 1].content : (e !== t && (c[t] = c[e]), t++);
    e !== t && (c.length = t);
  }
}
const hu = [
  ["normalize", S0],
  ["block", I0],
  ["inline", M0],
  ["linkify", B0],
  ["replacements", j0],
  ["smartquotes", Q0],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", V0]
];
function wu() {
  this.ruler = new S();
  for (let u = 0; u < hu.length; u++)
    this.ruler.push(hu[u][0], hu[u][1]);
}
wu.prototype.process = function(u) {
  const e = this.ruler.getRules("");
  for (let t = 0, n = e.length; t < n; t++)
    e[t](u);
};
wu.prototype.State = re;
function R(u, e, t, n) {
  this.src = u, this.md = e, this.env = t, this.tokens = n, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const i = this.src;
  for (let r = 0, c = 0, s = 0, o = 0, a = i.length, f = !1; c < a; c++) {
    const h = i.charCodeAt(c);
    if (!f)
      if (F(h)) {
        s++, h === 9 ? o += 4 - o % 4 : o++;
        continue;
      } else
        f = !0;
    (h === 10 || c === a - 1) && (h !== 10 && c++, this.bMarks.push(r), this.eMarks.push(c), this.tShift.push(s), this.sCount.push(o), this.bsCount.push(0), f = !1, s = 0, o = 0, r = c + 1);
  }
  this.bMarks.push(i.length), this.eMarks.push(i.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
R.prototype.push = function(u, e, t) {
  const n = new q(u, e, t);
  return n.block = !0, t < 0 && this.level--, n.level = this.level, t > 0 && this.level++, this.tokens.push(n), n;
};
R.prototype.isEmpty = function(e) {
  return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
};
R.prototype.skipEmptyLines = function(e) {
  for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++)
    ;
  return e;
};
R.prototype.skipSpaces = function(e) {
  for (let t = this.src.length; e < t; e++) {
    const n = this.src.charCodeAt(e);
    if (!F(n))
      break;
  }
  return e;
};
R.prototype.skipSpacesBack = function(e, t) {
  if (e <= t)
    return e;
  for (; e > t; )
    if (!F(this.src.charCodeAt(--e)))
      return e + 1;
  return e;
};
R.prototype.skipChars = function(e, t) {
  for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++)
    ;
  return e;
};
R.prototype.skipCharsBack = function(e, t, n) {
  if (e <= n)
    return e;
  for (; e > n; )
    if (t !== this.src.charCodeAt(--e))
      return e + 1;
  return e;
};
R.prototype.getLines = function(e, t, n, i) {
  if (e >= t)
    return "";
  const r = new Array(t - e);
  for (let c = 0, s = e; s < t; s++, c++) {
    let o = 0;
    const a = this.bMarks[s];
    let f = a, h;
    for (s + 1 < t || i ? h = this.eMarks[s] + 1 : h = this.eMarks[s]; f < h && o < n; ) {
      const g = this.src.charCodeAt(f);
      if (F(g))
        g === 9 ? o += 4 - (o + this.bsCount[s]) % 4 : o++;
      else if (f - a < this.tShift[s])
        o++;
      else
        break;
      f++;
    }
    o > n ? r[c] = new Array(o - n + 1).join(" ") + this.src.slice(f, h) : r[c] = this.src.slice(f, h);
  }
  return r.join("");
};
R.prototype.Token = q;
const G0 = 65536;
function bu(u, e) {
  const t = u.bMarks[e] + u.tShift[e], n = u.eMarks[e];
  return u.src.slice(t, n);
}
function Nu(u) {
  const e = [], t = u.length;
  let n = 0, i = u.charCodeAt(n), r = !1, c = 0, s = "";
  for (; n < t; )
    i === 124 && (r ? (s += u.substring(c, n - 1), c = n) : (e.push(s + u.substring(c, n)), s = "", c = n + 1)), r = i === 92, n++, i = u.charCodeAt(n);
  return e.push(s + u.substring(c)), e;
}
function W0(u, e, t, n) {
  if (e + 2 > t)
    return !1;
  let i = e + 1;
  if (u.sCount[i] < u.blkIndent || u.sCount[i] - u.blkIndent >= 4)
    return !1;
  let r = u.bMarks[i] + u.tShift[i];
  if (r >= u.eMarks[i])
    return !1;
  const c = u.src.charCodeAt(r++);
  if (c !== 124 && c !== 45 && c !== 58 || r >= u.eMarks[i])
    return !1;
  const s = u.src.charCodeAt(r++);
  if (s !== 124 && s !== 45 && s !== 58 && !F(s) || c === 45 && F(s))
    return !1;
  for (; r < u.eMarks[i]; ) {
    const x = u.src.charCodeAt(r);
    if (x !== 124 && x !== 45 && x !== 58 && !F(x))
      return !1;
    r++;
  }
  let o = bu(u, e + 1), a = o.split("|");
  const f = [];
  for (let x = 0; x < a.length; x++) {
    const k = a[x].trim();
    if (!k) {
      if (x === 0 || x === a.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(k))
      return !1;
    k.charCodeAt(k.length - 1) === 58 ? f.push(k.charCodeAt(0) === 58 ? "center" : "right") : k.charCodeAt(0) === 58 ? f.push("left") : f.push("");
  }
  if (o = bu(u, e).trim(), o.indexOf("|") === -1 || u.sCount[e] - u.blkIndent >= 4)
    return !1;
  a = Nu(o), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop();
  const h = a.length;
  if (h === 0 || h !== f.length)
    return !1;
  if (n)
    return !0;
  const g = u.parentType;
  u.parentType = "table";
  const d = u.md.block.ruler.getRules("blockquote"), b = u.push("table_open", "table", 1), C = [e, 0];
  b.map = C;
  const _ = u.push("thead_open", "thead", 1);
  _.map = [e, e + 1];
  const D = u.push("tr_open", "tr", 1);
  D.map = [e, e + 1];
  for (let x = 0; x < a.length; x++) {
    const k = u.push("th_open", "th", 1);
    f[x] && (k.attrs = [["style", "text-align:" + f[x]]]);
    const E = u.push("inline", "", 0);
    E.content = a[x].trim(), E.children = [], u.push("th_close", "th", -1);
  }
  u.push("tr_close", "tr", -1), u.push("thead_close", "thead", -1);
  let p, m = 0;
  for (i = e + 2; i < t && !(u.sCount[i] < u.blkIndent); i++) {
    let x = !1;
    for (let E = 0, A = d.length; E < A; E++)
      if (d[E](u, i, t, !0)) {
        x = !0;
        break;
      }
    if (x || (o = bu(u, i).trim(), !o) || u.sCount[i] - u.blkIndent >= 4 || (a = Nu(o), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop(), m += h - a.length, m > G0))
      break;
    if (i === e + 2) {
      const E = u.push("tbody_open", "tbody", 1);
      E.map = p = [e + 2, 0];
    }
    const k = u.push("tr_open", "tr", 1);
    k.map = [i, i + 1];
    for (let E = 0; E < h; E++) {
      const A = u.push("td_open", "td", 1);
      f[E] && (A.attrs = [["style", "text-align:" + f[E]]]);
      const y = u.push("inline", "", 0);
      y.content = a[E] ? a[E].trim() : "", y.children = [], u.push("td_close", "td", -1);
    }
    u.push("tr_close", "tr", -1);
  }
  return p && (u.push("tbody_close", "tbody", -1), p[1] = i), u.push("table_close", "table", -1), C[1] = i, u.parentType = g, u.line = i, !0;
}
function J0(u, e, t) {
  if (u.sCount[e] - u.blkIndent < 4)
    return !1;
  let n = e + 1, i = n;
  for (; n < t; ) {
    if (u.isEmpty(n)) {
      n++;
      continue;
    }
    if (u.sCount[n] - u.blkIndent >= 4) {
      n++, i = n;
      continue;
    }
    break;
  }
  u.line = i;
  const r = u.push("code_block", "code", 0);
  return r.content = u.getLines(e, i, 4 + u.blkIndent, !1) + `
`, r.map = [e, u.line], !0;
}
function K0(u, e, t, n) {
  let i = u.bMarks[e] + u.tShift[e], r = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || i + 3 > r)
    return !1;
  const c = u.src.charCodeAt(i);
  if (c !== 126 && c !== 96)
    return !1;
  let s = i;
  i = u.skipChars(i, c);
  let o = i - s;
  if (o < 3)
    return !1;
  const a = u.src.slice(s, i), f = u.src.slice(i, r);
  if (c === 96 && f.indexOf(String.fromCharCode(c)) >= 0)
    return !1;
  if (n)
    return !0;
  let h = e, g = !1;
  for (; h++, !(h >= t || (i = s = u.bMarks[h] + u.tShift[h], r = u.eMarks[h], i < r && u.sCount[h] < u.blkIndent)); )
    if (u.src.charCodeAt(i) === c && !(u.sCount[h] - u.blkIndent >= 4) && (i = u.skipChars(i, c), !(i - s < o) && (i = u.skipSpaces(i), !(i < r)))) {
      g = !0;
      break;
    }
  o = u.sCount[e], u.line = h + (g ? 1 : 0);
  const d = u.push("fence", "code", 0);
  return d.info = f, d.content = u.getLines(e + 1, h, o, !0), d.markup = a, d.map = [e, u.line], !0;
}
function X0(u, e, t, n) {
  let i = u.bMarks[e] + u.tShift[e], r = u.eMarks[e];
  const c = u.lineMax;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(i) !== 62)
    return !1;
  if (n)
    return !0;
  const s = [], o = [], a = [], f = [], h = u.md.block.ruler.getRules("blockquote"), g = u.parentType;
  u.parentType = "blockquote";
  let d = !1, b;
  for (b = e; b < t; b++) {
    const m = u.sCount[b] < u.blkIndent;
    if (i = u.bMarks[b] + u.tShift[b], r = u.eMarks[b], i >= r)
      break;
    if (u.src.charCodeAt(i++) === 62 && !m) {
      let k = u.sCount[b] + 1, E, A;
      u.src.charCodeAt(i) === 32 ? (i++, k++, A = !1, E = !0) : u.src.charCodeAt(i) === 9 ? (E = !0, (u.bsCount[b] + k) % 4 === 3 ? (i++, k++, A = !1) : A = !0) : E = !1;
      let y = k;
      for (s.push(u.bMarks[b]), u.bMarks[b] = i; i < r; ) {
        const w = u.src.charCodeAt(i);
        if (F(w))
          w === 9 ? y += 4 - (y + u.bsCount[b] + (A ? 1 : 0)) % 4 : y++;
        else
          break;
        i++;
      }
      d = i >= r, o.push(u.bsCount[b]), u.bsCount[b] = u.sCount[b] + 1 + (E ? 1 : 0), a.push(u.sCount[b]), u.sCount[b] = y - k, f.push(u.tShift[b]), u.tShift[b] = i - u.bMarks[b];
      continue;
    }
    if (d)
      break;
    let x = !1;
    for (let k = 0, E = h.length; k < E; k++)
      if (h[k](u, b, t, !0)) {
        x = !0;
        break;
      }
    if (x) {
      u.lineMax = b, u.blkIndent !== 0 && (s.push(u.bMarks[b]), o.push(u.bsCount[b]), f.push(u.tShift[b]), a.push(u.sCount[b]), u.sCount[b] -= u.blkIndent);
      break;
    }
    s.push(u.bMarks[b]), o.push(u.bsCount[b]), f.push(u.tShift[b]), a.push(u.sCount[b]), u.sCount[b] = -1;
  }
  const C = u.blkIndent;
  u.blkIndent = 0;
  const _ = u.push("blockquote_open", "blockquote", 1);
  _.markup = ">";
  const D = [e, 0];
  _.map = D, u.md.block.tokenize(u, e, b);
  const p = u.push("blockquote_close", "blockquote", -1);
  p.markup = ">", u.lineMax = c, u.parentType = g, D[1] = u.line;
  for (let m = 0; m < f.length; m++)
    u.bMarks[m + e] = s[m], u.tShift[m + e] = f[m], u.sCount[m + e] = a[m], u.bsCount[m + e] = o[m];
  return u.blkIndent = C, !0;
}
function Y0(u, e, t, n) {
  const i = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let r = u.bMarks[e] + u.tShift[e];
  const c = u.src.charCodeAt(r++);
  if (c !== 42 && c !== 45 && c !== 95)
    return !1;
  let s = 1;
  for (; r < i; ) {
    const a = u.src.charCodeAt(r++);
    if (a !== c && !F(a))
      return !1;
    a === c && s++;
  }
  if (s < 3)
    return !1;
  if (n)
    return !0;
  u.line = e + 1;
  const o = u.push("hr", "hr", 0);
  return o.map = [e, u.line], o.markup = Array(s + 1).join(String.fromCharCode(c)), !0;
}
function Uu(u, e) {
  const t = u.eMarks[e];
  let n = u.bMarks[e] + u.tShift[e];
  const i = u.src.charCodeAt(n++);
  if (i !== 42 && i !== 45 && i !== 43)
    return -1;
  if (n < t) {
    const r = u.src.charCodeAt(n);
    if (!F(r))
      return -1;
  }
  return n;
}
function ju(u, e) {
  const t = u.bMarks[e] + u.tShift[e], n = u.eMarks[e];
  let i = t;
  if (i + 1 >= n)
    return -1;
  let r = u.src.charCodeAt(i++);
  if (r < 48 || r > 57)
    return -1;
  for (; ; ) {
    if (i >= n)
      return -1;
    if (r = u.src.charCodeAt(i++), r >= 48 && r <= 57) {
      if (i - t >= 10)
        return -1;
      continue;
    }
    if (r === 41 || r === 46)
      break;
    return -1;
  }
  return i < n && (r = u.src.charCodeAt(i), !F(r)) ? -1 : i;
}
function $0(u, e) {
  const t = u.level + 2;
  for (let n = e + 2, i = u.tokens.length - 2; n < i; n++)
    u.tokens[n].level === t && u.tokens[n].type === "paragraph_open" && (u.tokens[n + 2].hidden = !0, u.tokens[n].hidden = !0, n += 2);
}
function ut(u, e, t, n) {
  let i, r, c, s, o = e, a = !0;
  if (u.sCount[o] - u.blkIndent >= 4 || u.listIndent >= 0 && u.sCount[o] - u.listIndent >= 4 && u.sCount[o] < u.blkIndent)
    return !1;
  let f = !1;
  n && u.parentType === "paragraph" && u.sCount[o] >= u.blkIndent && (f = !0);
  let h, g, d;
  if ((d = ju(u, o)) >= 0) {
    if (h = !0, c = u.bMarks[o] + u.tShift[o], g = Number(u.src.slice(c, d - 1)), f && g !== 1) return !1;
  } else if ((d = Uu(u, o)) >= 0)
    h = !1;
  else
    return !1;
  if (f && u.skipSpaces(d) >= u.eMarks[o])
    return !1;
  if (n)
    return !0;
  const b = u.src.charCodeAt(d - 1), C = u.tokens.length;
  h ? (s = u.push("ordered_list_open", "ol", 1), g !== 1 && (s.attrs = [["start", g]])) : s = u.push("bullet_list_open", "ul", 1);
  const _ = [o, 0];
  s.map = _, s.markup = String.fromCharCode(b);
  let D = !1;
  const p = u.md.block.ruler.getRules("list"), m = u.parentType;
  for (u.parentType = "list"; o < t; ) {
    r = d, i = u.eMarks[o];
    const x = u.sCount[o] + d - (u.bMarks[o] + u.tShift[o]);
    let k = x;
    for (; r < i; ) {
      const Z = u.src.charCodeAt(r);
      if (Z === 9)
        k += 4 - (k + u.bsCount[o]) % 4;
      else if (Z === 32)
        k++;
      else
        break;
      r++;
    }
    const E = r;
    let A;
    E >= i ? A = 1 : A = k - x, A > 4 && (A = 1);
    const y = x + A;
    s = u.push("list_item_open", "li", 1), s.markup = String.fromCharCode(b);
    const w = [o, 0];
    s.map = w, h && (s.info = u.src.slice(c, d - 1));
    const j = u.tight, H = u.tShift[o], ye = u.sCount[o], Ce = u.listIndent;
    if (u.listIndent = u.blkIndent, u.blkIndent = y, u.tight = !0, u.tShift[o] = E - u.bMarks[o], u.sCount[o] = k, E >= i && u.isEmpty(o + 1) ? u.line = Math.min(u.line + 2, t) : u.md.block.tokenize(u, o, t, !0), (!u.tight || D) && (a = !1), D = u.line - o > 1 && u.isEmpty(u.line - 1), u.blkIndent = u.listIndent, u.listIndent = Ce, u.tShift[o] = H, u.sCount[o] = ye, u.tight = j, s = u.push("list_item_close", "li", -1), s.markup = String.fromCharCode(b), o = u.line, w[1] = o, o >= t || u.sCount[o] < u.blkIndent || u.sCount[o] - u.blkIndent >= 4)
      break;
    let Su = !1;
    for (let Z = 0, De = p.length; Z < De; Z++)
      if (p[Z](u, o, t, !0)) {
        Su = !0;
        break;
      }
    if (Su)
      break;
    if (h) {
      if (d = ju(u, o), d < 0)
        break;
      c = u.bMarks[o] + u.tShift[o];
    } else if (d = Uu(u, o), d < 0)
      break;
    if (b !== u.src.charCodeAt(d - 1))
      break;
  }
  return h ? s = u.push("ordered_list_close", "ol", -1) : s = u.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(b), _[1] = o, u.line = o, u.parentType = m, a && $0(u, C), !0;
}
function et(u, e, t, n) {
  let i = u.bMarks[e] + u.tShift[e], r = u.eMarks[e], c = e + 1;
  if (u.sCount[e] - u.blkIndent >= 4 || u.src.charCodeAt(i) !== 91)
    return !1;
  function s(p) {
    const m = u.lineMax;
    if (p >= m || u.isEmpty(p))
      return null;
    let x = !1;
    if (u.sCount[p] - u.blkIndent > 3 && (x = !0), u.sCount[p] < 0 && (x = !0), !x) {
      const A = u.md.block.ruler.getRules("reference"), y = u.parentType;
      u.parentType = "reference";
      let w = !1;
      for (let j = 0, H = A.length; j < H; j++)
        if (A[j](u, p, m, !0)) {
          w = !0;
          break;
        }
      if (u.parentType = y, w)
        return null;
    }
    const k = u.bMarks[p] + u.tShift[p], E = u.eMarks[p];
    return u.src.slice(k, E + 1);
  }
  let o = u.src.slice(i, r + 1);
  r = o.length;
  let a = -1;
  for (i = 1; i < r; i++) {
    const p = o.charCodeAt(i);
    if (p === 91)
      return !1;
    if (p === 93) {
      a = i;
      break;
    } else if (p === 10) {
      const m = s(c);
      m !== null && (o += m, r = o.length, c++);
    } else if (p === 92 && (i++, i < r && o.charCodeAt(i) === 10)) {
      const m = s(c);
      m !== null && (o += m, r = o.length, c++);
    }
  }
  if (a < 0 || o.charCodeAt(a + 1) !== 58)
    return !1;
  for (i = a + 2; i < r; i++) {
    const p = o.charCodeAt(i);
    if (p === 10) {
      const m = s(c);
      m !== null && (o += m, r = o.length, c++);
    } else if (!F(p)) break;
  }
  const f = u.md.helpers.parseLinkDestination(o, i, r);
  if (!f.ok)
    return !1;
  const h = u.md.normalizeLink(f.str);
  if (!u.md.validateLink(h))
    return !1;
  i = f.pos;
  const g = i, d = c, b = i;
  for (; i < r; i++) {
    const p = o.charCodeAt(i);
    if (p === 10) {
      const m = s(c);
      m !== null && (o += m, r = o.length, c++);
    } else if (!F(p)) break;
  }
  let C = u.md.helpers.parseLinkTitle(o, i, r);
  for (; C.can_continue; ) {
    const p = s(c);
    if (p === null) break;
    o += p, i = r, r = o.length, c++, C = u.md.helpers.parseLinkTitle(o, i, r, C);
  }
  let _;
  for (i < r && b !== i && C.ok ? (_ = C.str, i = C.pos) : (_ = "", i = g, c = d); i < r; ) {
    const p = o.charCodeAt(i);
    if (!F(p))
      break;
    i++;
  }
  if (i < r && o.charCodeAt(i) !== 10 && _)
    for (_ = "", i = g, c = d; i < r; ) {
      const p = o.charCodeAt(i);
      if (!F(p))
        break;
      i++;
    }
  if (i < r && o.charCodeAt(i) !== 10)
    return !1;
  const D = au(o.slice(1, a));
  return D ? (n || (typeof u.env.references > "u" && (u.env.references = {}), typeof u.env.references[D] > "u" && (u.env.references[D] = { title: _, href: h }), u.line = c), !0) : !1;
}
const tt = [
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
], nt = "[a-zA-Z_:][a-zA-Z0-9:._-]*", rt = "[^\"'=<>`\\x00-\\x20]+", it = "'[^']*'", st = '"[^"]*"', ct = "(?:" + rt + "|" + it + "|" + st + ")", ot = "(?:\\s+" + nt + "(?:\\s*=\\s*" + ct + ")?)", se = "<[A-Za-z][A-Za-z0-9\\-]*" + ot + "*\\s*\\/?>", ce = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", at = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", lt = "<[?][\\s\\S]*?[?]>", dt = "<![A-Za-z][^>]*>", ft = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", ht = new RegExp("^(?:" + se + "|" + ce + "|" + at + "|" + lt + "|" + dt + "|" + ft + ")"), bt = new RegExp("^(?:" + se + "|" + ce + ")"), Q = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + tt.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(bt.source + "\\s*$"), /^$/, !1]
];
function pt(u, e, t, n) {
  let i = u.bMarks[e] + u.tShift[e], r = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4 || !u.md.options.html || u.src.charCodeAt(i) !== 60)
    return !1;
  let c = u.src.slice(i, r), s = 0;
  for (; s < Q.length && !Q[s][0].test(c); s++)
    ;
  if (s === Q.length)
    return !1;
  if (n)
    return Q[s][2];
  let o = e + 1;
  if (!Q[s][1].test(c)) {
    for (; o < t && !(u.sCount[o] < u.blkIndent); o++)
      if (i = u.bMarks[o] + u.tShift[o], r = u.eMarks[o], c = u.src.slice(i, r), Q[s][1].test(c)) {
        c.length !== 0 && o++;
        break;
      }
  }
  u.line = o;
  const a = u.push("html_block", "", 0);
  return a.map = [e, o], a.content = u.getLines(e, o, u.blkIndent, !0), !0;
}
function gt(u, e, t, n) {
  let i = u.bMarks[e] + u.tShift[e], r = u.eMarks[e];
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  let c = u.src.charCodeAt(i);
  if (c !== 35 || i >= r)
    return !1;
  let s = 1;
  for (c = u.src.charCodeAt(++i); c === 35 && i < r && s <= 6; )
    s++, c = u.src.charCodeAt(++i);
  if (s > 6 || i < r && !F(c))
    return !1;
  if (n)
    return !0;
  r = u.skipSpacesBack(r, i);
  const o = u.skipCharsBack(r, 35, i);
  o > i && F(u.src.charCodeAt(o - 1)) && (r = o), u.line = e + 1;
  const a = u.push("heading_open", "h" + String(s), 1);
  a.markup = "########".slice(0, s), a.map = [e, u.line];
  const f = u.push("inline", "", 0);
  f.content = u.src.slice(i, r).trim(), f.map = [e, u.line], f.children = [];
  const h = u.push("heading_close", "h" + String(s), -1);
  return h.markup = "########".slice(0, s), !0;
}
function mt(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph");
  if (u.sCount[e] - u.blkIndent >= 4)
    return !1;
  const i = u.parentType;
  u.parentType = "paragraph";
  let r = 0, c, s = e + 1;
  for (; s < t && !u.isEmpty(s); s++) {
    if (u.sCount[s] - u.blkIndent > 3)
      continue;
    if (u.sCount[s] >= u.blkIndent) {
      let d = u.bMarks[s] + u.tShift[s];
      const b = u.eMarks[s];
      if (d < b && (c = u.src.charCodeAt(d), (c === 45 || c === 61) && (d = u.skipChars(d, c), d = u.skipSpaces(d), d >= b))) {
        r = c === 61 ? 1 : 2;
        break;
      }
    }
    if (u.sCount[s] < 0)
      continue;
    let g = !1;
    for (let d = 0, b = n.length; d < b; d++)
      if (n[d](u, s, t, !0)) {
        g = !0;
        break;
      }
    if (g)
      break;
  }
  if (!r)
    return !1;
  const o = u.getLines(e, s, u.blkIndent, !1).trim();
  u.line = s + 1;
  const a = u.push("heading_open", "h" + String(r), 1);
  a.markup = String.fromCharCode(c), a.map = [e, u.line];
  const f = u.push("inline", "", 0);
  f.content = o, f.map = [e, u.line - 1], f.children = [];
  const h = u.push("heading_close", "h" + String(r), -1);
  return h.markup = String.fromCharCode(c), u.parentType = i, !0;
}
function _t(u, e, t) {
  const n = u.md.block.ruler.getRules("paragraph"), i = u.parentType;
  let r = e + 1;
  for (u.parentType = "paragraph"; r < t && !u.isEmpty(r); r++) {
    if (u.sCount[r] - u.blkIndent > 3 || u.sCount[r] < 0)
      continue;
    let a = !1;
    for (let f = 0, h = n.length; f < h; f++)
      if (n[f](u, r, t, !0)) {
        a = !0;
        break;
      }
    if (a)
      break;
  }
  const c = u.getLines(e, r, u.blkIndent, !1).trim();
  u.line = r;
  const s = u.push("paragraph_open", "p", 1);
  s.map = [e, u.line];
  const o = u.push("inline", "", 0);
  return o.content = c, o.map = [e, u.line], o.children = [], u.push("paragraph_close", "p", -1), u.parentType = i, !0;
}
const ru = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", W0, ["paragraph", "reference"]],
  ["code", J0],
  ["fence", K0, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", X0, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", Y0, ["paragraph", "reference", "blockquote", "list"]],
  ["list", ut, ["paragraph", "reference", "blockquote"]],
  ["reference", et],
  ["html_block", pt, ["paragraph", "reference", "blockquote"]],
  ["heading", gt, ["paragraph", "reference", "blockquote"]],
  ["lheading", mt],
  ["paragraph", _t]
];
function lu() {
  this.ruler = new S();
  for (let u = 0; u < ru.length; u++)
    this.ruler.push(ru[u][0], ru[u][1], { alt: (ru[u][2] || []).slice() });
}
lu.prototype.tokenize = function(u, e, t) {
  const n = this.ruler.getRules(""), i = n.length, r = u.md.options.maxNesting;
  let c = e, s = !1;
  for (; c < t && (u.line = c = u.skipEmptyLines(c), !(c >= t || u.sCount[c] < u.blkIndent)); ) {
    if (u.level >= r) {
      u.line = t;
      break;
    }
    const o = u.line;
    let a = !1;
    for (let f = 0; f < i; f++)
      if (a = n[f](u, c, t, !1), a) {
        if (o >= u.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!a) throw new Error("none of the block rules matched");
    u.tight = !s, u.isEmpty(u.line - 1) && (s = !0), c = u.line, c < t && u.isEmpty(c) && (s = !0, c++, u.line = c);
  }
};
lu.prototype.parse = function(u, e, t, n) {
  if (!u)
    return;
  const i = new this.State(u, e, t, n);
  this.tokenize(i, i.line, i.lineMax);
};
lu.prototype.State = R;
function eu(u, e, t, n) {
  this.src = u, this.env = t, this.md = e, this.tokens = n, this.tokens_meta = Array(n.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
eu.prototype.pushPending = function() {
  const u = new q("text", "", 0);
  return u.content = this.pending, u.level = this.pendingLevel, this.tokens.push(u), this.pending = "", u;
};
eu.prototype.push = function(u, e, t) {
  this.pending && this.pushPending();
  const n = new q(u, e, t);
  let i = null;
  return t < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, t > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], i = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(i), n;
};
eu.prototype.scanDelims = function(u, e) {
  const t = this.posMax, n = this.src.charCodeAt(u), i = u > 0 ? this.src.charCodeAt(u - 1) : 32;
  let r = u;
  for (; r < t && this.src.charCodeAt(r) === n; )
    r++;
  const c = r - u, s = r < t ? this.src.charCodeAt(r) : 32, o = Y(i) || X(String.fromCharCode(i)), a = Y(s) || X(String.fromCharCode(s)), f = K(i), h = K(s), g = !h && (!a || f || o), d = !f && (!o || h || a);
  return { can_open: g && (e || !d || o), can_close: d && (e || !g || a), length: c };
};
eu.prototype.Token = q;
function xt(u) {
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
function kt(u, e) {
  let t = u.pos;
  for (; t < u.posMax && !xt(u.src.charCodeAt(t)); )
    t++;
  return t === u.pos ? !1 : (e || (u.pending += u.src.slice(u.pos, t)), u.pos = t, !0);
}
const yt = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function Ct(u, e) {
  if (!u.md.options.linkify || u.linkLevel > 0) return !1;
  const t = u.pos, n = u.posMax;
  if (t + 3 > n || u.src.charCodeAt(t) !== 58 || u.src.charCodeAt(t + 1) !== 47 || u.src.charCodeAt(t + 2) !== 47) return !1;
  const i = u.pending.match(yt);
  if (!i) return !1;
  const r = i[1], c = u.md.linkify.matchAtStart(u.src.slice(t - r.length));
  if (!c) return !1;
  let s = c.url;
  if (s.length <= r.length) return !1;
  let o = s.length;
  for (; o > 0 && s.charCodeAt(o - 1) === 42; )
    o--;
  o !== s.length && (s = s.slice(0, o));
  const a = u.md.normalizeLink(s);
  if (!u.md.validateLink(a)) return !1;
  if (!e) {
    u.pending = u.pending.slice(0, -r.length);
    const f = u.push("link_open", "a", 1);
    f.attrs = [["href", a]], f.markup = "linkify", f.info = "auto";
    const h = u.push("text", "", 0);
    h.content = u.md.normalizeLinkText(s);
    const g = u.push("link_close", "a", -1);
    g.markup = "linkify", g.info = "auto";
  }
  return u.pos += s.length - r.length, !0;
}
function Dt(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 10)
    return !1;
  const n = u.pending.length - 1, i = u.posMax;
  if (!e)
    if (n >= 0 && u.pending.charCodeAt(n) === 32)
      if (n >= 1 && u.pending.charCodeAt(n - 1) === 32) {
        let r = n - 1;
        for (; r >= 1 && u.pending.charCodeAt(r - 1) === 32; ) r--;
        u.pending = u.pending.slice(0, r), u.push("hardbreak", "br", 0);
      } else
        u.pending = u.pending.slice(0, -1), u.push("softbreak", "br", 0);
    else
      u.push("softbreak", "br", 0);
  for (t++; t < i && F(u.src.charCodeAt(t)); )
    t++;
  return u.pos = t, !0;
}
const vu = [];
for (let u = 0; u < 256; u++)
  vu.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(u) {
  vu[u.charCodeAt(0)] = 1;
});
function Et(u, e) {
  let t = u.pos;
  const n = u.posMax;
  if (u.src.charCodeAt(t) !== 92 || (t++, t >= n)) return !1;
  let i = u.src.charCodeAt(t);
  if (i === 10) {
    for (e || u.push("hardbreak", "br", 0), t++; t < n && (i = u.src.charCodeAt(t), !!F(i)); )
      t++;
    return u.pos = t, !0;
  }
  let r = u.src[t];
  if (i >= 55296 && i <= 56319 && t + 1 < n) {
    const s = u.src.charCodeAt(t + 1);
    s >= 56320 && s <= 57343 && (r += u.src[t + 1], t++);
  }
  const c = "\\" + r;
  if (!e) {
    const s = u.push("text_special", "", 0);
    i < 256 && vu[i] !== 0 ? s.content = r : s.content = c, s.markup = c, s.info = "escape";
  }
  return u.pos = t + 1, !0;
}
function At(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 96)
    return !1;
  const i = t;
  t++;
  const r = u.posMax;
  for (; t < r && u.src.charCodeAt(t) === 96; )
    t++;
  const c = u.src.slice(i, t), s = c.length;
  if (u.backticksScanned && (u.backticks[s] || 0) <= i)
    return e || (u.pending += c), u.pos += s, !0;
  let o = t, a;
  for (; (a = u.src.indexOf("`", o)) !== -1; ) {
    for (o = a + 1; o < r && u.src.charCodeAt(o) === 96; )
      o++;
    const f = o - a;
    if (f === s) {
      if (!e) {
        const h = u.push("code_inline", "code", 0);
        h.markup = c, h.content = u.src.slice(t, a).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return u.pos = o, !0;
    }
    u.backticks[f] = a;
  }
  return u.backticksScanned = !0, e || (u.pending += c), u.pos += s, !0;
}
function Ft(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 126)
    return !1;
  const i = u.scanDelims(u.pos, !0);
  let r = i.length;
  const c = String.fromCharCode(n);
  if (r < 2)
    return !1;
  let s;
  r % 2 && (s = u.push("text", "", 0), s.content = c, r--);
  for (let o = 0; o < r; o += 2)
    s = u.push("text", "", 0), s.content = c + c, u.delimiters.push({
      marker: n,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: u.tokens.length - 1,
      end: -1,
      open: i.can_open,
      close: i.can_close
    });
  return u.pos += i.length, !0;
}
function Hu(u, e) {
  let t;
  const n = [], i = e.length;
  for (let r = 0; r < i; r++) {
    const c = e[r];
    if (c.marker !== 126 || c.end === -1)
      continue;
    const s = e[c.end];
    t = u.tokens[c.token], t.type = "s_open", t.tag = "s", t.nesting = 1, t.markup = "~~", t.content = "", t = u.tokens[s.token], t.type = "s_close", t.tag = "s", t.nesting = -1, t.markup = "~~", t.content = "", u.tokens[s.token - 1].type === "text" && u.tokens[s.token - 1].content === "~" && n.push(s.token - 1);
  }
  for (; n.length; ) {
    const r = n.pop();
    let c = r + 1;
    for (; c < u.tokens.length && u.tokens[c].type === "s_close"; )
      c++;
    c--, r !== c && (t = u.tokens[c], u.tokens[c] = u.tokens[r], u.tokens[r] = t);
  }
}
function wt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Hu(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Hu(u, e[n].delimiters);
}
const oe = {
  tokenize: Ft,
  postProcess: wt
};
function vt(u, e) {
  const t = u.pos, n = u.src.charCodeAt(t);
  if (e || n !== 95 && n !== 42)
    return !1;
  const i = u.scanDelims(u.pos, n === 42);
  for (let r = 0; r < i.length; r++) {
    const c = u.push("text", "", 0);
    c.content = String.fromCharCode(n), u.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: n,
      // Total length of these series of delimiters.
      //
      length: i.length,
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
      open: i.can_open,
      close: i.can_close
    });
  }
  return u.pos += i.length, !0;
}
function Zu(u, e) {
  const t = e.length;
  for (let n = t - 1; n >= 0; n--) {
    const i = e[n];
    if (i.marker !== 95 && i.marker !== 42 || i.end === -1)
      continue;
    const r = e[i.end], c = n > 0 && e[n - 1].end === i.end + 1 && // check that first two markers match and adjacent
    e[n - 1].marker === i.marker && e[n - 1].token === i.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    e[i.end + 1].token === r.token + 1, s = String.fromCharCode(i.marker), o = u.tokens[i.token];
    o.type = c ? "strong_open" : "em_open", o.tag = c ? "strong" : "em", o.nesting = 1, o.markup = c ? s + s : s, o.content = "";
    const a = u.tokens[r.token];
    a.type = c ? "strong_close" : "em_close", a.tag = c ? "strong" : "em", a.nesting = -1, a.markup = c ? s + s : s, a.content = "", c && (u.tokens[e[n - 1].token].content = "", u.tokens[e[i.end + 1].token].content = "", n--);
  }
}
function Tt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Zu(u, u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Zu(u, e[n].delimiters);
}
const ae = {
  tokenize: vt,
  postProcess: Tt
};
function St(u, e) {
  let t, n, i, r, c = "", s = "", o = u.pos, a = !0;
  if (u.src.charCodeAt(u.pos) !== 91)
    return !1;
  const f = u.pos, h = u.posMax, g = u.pos + 1, d = u.md.helpers.parseLinkLabel(u, u.pos, !0);
  if (d < 0)
    return !1;
  let b = d + 1;
  if (b < h && u.src.charCodeAt(b) === 40) {
    for (a = !1, b++; b < h && (t = u.src.charCodeAt(b), !(!F(t) && t !== 10)); b++)
      ;
    if (b >= h)
      return !1;
    if (o = b, i = u.md.helpers.parseLinkDestination(u.src, b, u.posMax), i.ok) {
      for (c = u.md.normalizeLink(i.str), u.md.validateLink(c) ? b = i.pos : c = "", o = b; b < h && (t = u.src.charCodeAt(b), !(!F(t) && t !== 10)); b++)
        ;
      if (i = u.md.helpers.parseLinkTitle(u.src, b, u.posMax), b < h && o !== b && i.ok)
        for (s = i.str, b = i.pos; b < h && (t = u.src.charCodeAt(b), !(!F(t) && t !== 10)); b++)
          ;
    }
    (b >= h || u.src.charCodeAt(b) !== 41) && (a = !0), b++;
  }
  if (a) {
    if (typeof u.env.references > "u")
      return !1;
    if (b < h && u.src.charCodeAt(b) === 91 ? (o = b + 1, b = u.md.helpers.parseLinkLabel(u, b), b >= 0 ? n = u.src.slice(o, b++) : b = d + 1) : b = d + 1, n || (n = u.src.slice(g, d)), r = u.env.references[au(n)], !r)
      return u.pos = f, !1;
    c = r.href, s = r.title;
  }
  if (!e) {
    u.pos = g, u.posMax = d;
    const C = u.push("link_open", "a", 1), _ = [["href", c]];
    C.attrs = _, s && _.push(["title", s]), u.linkLevel++, u.md.inline.tokenize(u), u.linkLevel--, u.push("link_close", "a", -1);
  }
  return u.pos = b, u.posMax = h, !0;
}
function It(u, e) {
  let t, n, i, r, c, s, o, a, f = "";
  const h = u.pos, g = u.posMax;
  if (u.src.charCodeAt(u.pos) !== 33 || u.src.charCodeAt(u.pos + 1) !== 91)
    return !1;
  const d = u.pos + 2, b = u.md.helpers.parseLinkLabel(u, u.pos + 1, !1);
  if (b < 0)
    return !1;
  if (r = b + 1, r < g && u.src.charCodeAt(r) === 40) {
    for (r++; r < g && (t = u.src.charCodeAt(r), !(!F(t) && t !== 10)); r++)
      ;
    if (r >= g)
      return !1;
    for (a = r, s = u.md.helpers.parseLinkDestination(u.src, r, u.posMax), s.ok && (f = u.md.normalizeLink(s.str), u.md.validateLink(f) ? r = s.pos : f = ""), a = r; r < g && (t = u.src.charCodeAt(r), !(!F(t) && t !== 10)); r++)
      ;
    if (s = u.md.helpers.parseLinkTitle(u.src, r, u.posMax), r < g && a !== r && s.ok)
      for (o = s.str, r = s.pos; r < g && (t = u.src.charCodeAt(r), !(!F(t) && t !== 10)); r++)
        ;
    else
      o = "";
    if (r >= g || u.src.charCodeAt(r) !== 41)
      return u.pos = h, !1;
    r++;
  } else {
    if (typeof u.env.references > "u")
      return !1;
    if (r < g && u.src.charCodeAt(r) === 91 ? (a = r + 1, r = u.md.helpers.parseLinkLabel(u, r), r >= 0 ? i = u.src.slice(a, r++) : r = b + 1) : r = b + 1, i || (i = u.src.slice(d, b)), c = u.env.references[au(i)], !c)
      return u.pos = h, !1;
    f = c.href, o = c.title;
  }
  if (!e) {
    n = u.src.slice(d, b);
    const C = [];
    u.md.inline.parse(
      n,
      u.md,
      u.env,
      C
    );
    const _ = u.push("image", "img", 0), D = [["src", f], ["alt", ""]];
    _.attrs = D, _.children = C, _.content = n, o && D.push(["title", o]);
  }
  return u.pos = r, u.posMax = g, !0;
}
const Mt = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, qt = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function zt(u, e) {
  let t = u.pos;
  if (u.src.charCodeAt(t) !== 60)
    return !1;
  const n = u.pos, i = u.posMax;
  for (; ; ) {
    if (++t >= i) return !1;
    const c = u.src.charCodeAt(t);
    if (c === 60) return !1;
    if (c === 62) break;
  }
  const r = u.src.slice(n + 1, t);
  if (qt.test(r)) {
    const c = u.md.normalizeLink(r);
    if (!u.md.validateLink(c))
      return !1;
    if (!e) {
      const s = u.push("link_open", "a", 1);
      s.attrs = [["href", c]], s.markup = "autolink", s.info = "auto";
      const o = u.push("text", "", 0);
      o.content = u.md.normalizeLinkText(r);
      const a = u.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return u.pos += r.length + 2, !0;
  }
  if (Mt.test(r)) {
    const c = u.md.normalizeLink("mailto:" + r);
    if (!u.md.validateLink(c))
      return !1;
    if (!e) {
      const s = u.push("link_open", "a", 1);
      s.attrs = [["href", c]], s.markup = "autolink", s.info = "auto";
      const o = u.push("text", "", 0);
      o.content = u.md.normalizeLinkText(r);
      const a = u.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return u.pos += r.length + 2, !0;
  }
  return !1;
}
function Bt(u) {
  return /^<a[>\s]/i.test(u);
}
function Lt(u) {
  return /^<\/a\s*>/i.test(u);
}
function Rt(u) {
  const e = u | 32;
  return e >= 97 && e <= 122;
}
function Pt(u, e) {
  if (!u.md.options.html)
    return !1;
  const t = u.posMax, n = u.pos;
  if (u.src.charCodeAt(n) !== 60 || n + 2 >= t)
    return !1;
  const i = u.src.charCodeAt(n + 1);
  if (i !== 33 && i !== 63 && i !== 47 && !Rt(i))
    return !1;
  const r = u.src.slice(n).match(ht);
  if (!r)
    return !1;
  if (!e) {
    const c = u.push("html_inline", "", 0);
    c.content = r[0], Bt(c.content) && u.linkLevel++, Lt(c.content) && u.linkLevel--;
  }
  return u.pos += r[0].length, !0;
}
const Ot = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Nt = /^&([a-z][a-z0-9]{1,31});/i;
function Ut(u, e) {
  const t = u.pos, n = u.posMax;
  if (u.src.charCodeAt(t) !== 38 || t + 1 >= n) return !1;
  if (u.src.charCodeAt(t + 1) === 35) {
    const r = u.src.slice(t).match(Ot);
    if (r) {
      if (!e) {
        const c = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), s = u.push("text_special", "", 0);
        s.content = Fu(c) ? su(c) : su(65533), s.markup = r[0], s.info = "entity";
      }
      return u.pos += r[0].length, !0;
    }
  } else {
    const r = u.src.slice(t).match(Nt);
    if (r) {
      const c = ee(r[0]);
      if (c !== r[0]) {
        if (!e) {
          const s = u.push("text_special", "", 0);
          s.content = c, s.markup = r[0], s.info = "entity";
        }
        return u.pos += r[0].length, !0;
      }
    }
  }
  return !1;
}
function Qu(u) {
  const e = {}, t = u.length;
  if (!t) return;
  let n = 0, i = -2;
  const r = [];
  for (let c = 0; c < t; c++) {
    const s = u[c];
    if (r.push(0), (u[n].marker !== s.marker || i !== s.token - 1) && (n = c), i = s.token, s.length = s.length || 0, !s.close) continue;
    e.hasOwnProperty(s.marker) || (e[s.marker] = [-1, -1, -1, -1, -1, -1]);
    const o = e[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let a = n - r[n] - 1, f = a;
    for (; a > o; a -= r[a] + 1) {
      const h = u[a];
      if (h.marker === s.marker && h.open && h.end < 0) {
        let g = !1;
        if ((h.close || s.open) && (h.length + s.length) % 3 === 0 && (h.length % 3 !== 0 || s.length % 3 !== 0) && (g = !0), !g) {
          const d = a > 0 && !u[a - 1].open ? r[a - 1] + 1 : 0;
          r[c] = c - a + d, r[a] = d, s.open = !1, h.end = c, h.close = !1, f = -1, i = -2;
          break;
        }
      }
    }
    f !== -1 && (e[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = f);
  }
}
function jt(u) {
  const e = u.tokens_meta, t = u.tokens_meta.length;
  Qu(u.delimiters);
  for (let n = 0; n < t; n++)
    e[n] && e[n].delimiters && Qu(e[n].delimiters);
}
function Ht(u) {
  let e, t, n = 0;
  const i = u.tokens, r = u.tokens.length;
  for (e = t = 0; e < r; e++)
    i[e].nesting < 0 && n--, i[e].level = n, i[e].nesting > 0 && n++, i[e].type === "text" && e + 1 < r && i[e + 1].type === "text" ? i[e + 1].content = i[e].content + i[e + 1].content : (e !== t && (i[t] = i[e]), t++);
  e !== t && (i.length = t);
}
const pu = [
  ["text", kt],
  ["linkify", Ct],
  ["newline", Dt],
  ["escape", Et],
  ["backticks", At],
  ["strikethrough", oe.tokenize],
  ["emphasis", ae.tokenize],
  ["link", St],
  ["image", It],
  ["autolink", zt],
  ["html_inline", Pt],
  ["entity", Ut]
], gu = [
  ["balance_pairs", jt],
  ["strikethrough", oe.postProcess],
  ["emphasis", ae.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", Ht]
];
function tu() {
  this.ruler = new S();
  for (let u = 0; u < pu.length; u++)
    this.ruler.push(pu[u][0], pu[u][1]);
  this.ruler2 = new S();
  for (let u = 0; u < gu.length; u++)
    this.ruler2.push(gu[u][0], gu[u][1]);
}
tu.prototype.skipToken = function(u) {
  const e = u.pos, t = this.ruler.getRules(""), n = t.length, i = u.md.options.maxNesting, r = u.cache;
  if (typeof r[e] < "u") {
    u.pos = r[e];
    return;
  }
  let c = !1;
  if (u.level < i) {
    for (let s = 0; s < n; s++)
      if (u.level++, c = t[s](u, !0), u.level--, c) {
        if (e >= u.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    u.pos = u.posMax;
  c || u.pos++, r[e] = u.pos;
};
tu.prototype.tokenize = function(u) {
  const e = this.ruler.getRules(""), t = e.length, n = u.posMax, i = u.md.options.maxNesting;
  for (; u.pos < n; ) {
    const r = u.pos;
    let c = !1;
    if (u.level < i) {
      for (let s = 0; s < t; s++)
        if (c = e[s](u, !1), c) {
          if (r >= u.pos)
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
tu.prototype.parse = function(u, e, t, n) {
  const i = new this.State(u, e, t, n);
  this.tokenize(i);
  const r = this.ruler2.getRules(""), c = r.length;
  for (let s = 0; s < c; s++)
    r[s](i);
};
tu.prototype.State = eu;
function Zt(u) {
  const e = {};
  u = u || {}, e.src_Any = Ku.source, e.src_Cc = Xu.source, e.src_Z = $u.source, e.src_P = Eu.source, e.src_ZPCc = [e.src_Z, e.src_P, e.src_Cc].join("|"), e.src_ZCc = [e.src_Z, e.src_Cc].join("|");
  const t = "[><｜]";
  return e.src_pseudo_letter = "(?:(?!" + t + "|" + e.src_ZPCc + ")" + e.src_Any + ")", e.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", e.src_auth = "(?:(?:(?!" + e.src_ZCc + "|[@/\\[\\]()]).)+@)?", e.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", e.src_host_terminator = "(?=$|" + t + "|" + e.src_ZPCc + ")(?!" + (u["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + e.src_ZPCc + "))", e.src_path = "(?:[/?#](?:(?!" + e.src_ZCc + "|" + t + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + e.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + e.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + e.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + e.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + e.src_ZCc + "|[']).)+\\'|\\'(?=" + e.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + e.src_ZCc + "|[.]|$)|" + (u["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + e.src_ZCc + "|$)|;(?!" + e.src_ZCc + "|$)|\\!+(?!" + e.src_ZCc + "|[!]|$)|\\?(?!" + e.src_ZCc + "|[?]|$))+|\\/)?", e.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', e.src_xn = "xn--[a-z0-9\\-]{1,59}", e.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + e.src_xn + "|" + e.src_pseudo_letter + "{1,63})", e.src_domain = "(?:" + e.src_xn + "|(?:" + e.src_pseudo_letter + ")|(?:" + e.src_pseudo_letter + "(?:-|" + e.src_pseudo_letter + "){0,61}" + e.src_pseudo_letter + "))", e.src_host = "(?:(?:(?:(?:" + e.src_domain + ")\\.)*" + e.src_domain + "))", e.tpl_host_fuzzy = "(?:" + e.src_ip4 + "|(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%)))", e.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + e.src_domain + ")\\.)+(?:%TLDS%))", e.src_host_strict = e.src_host + e.src_host_terminator, e.tpl_host_fuzzy_strict = e.tpl_host_fuzzy + e.src_host_terminator, e.src_host_port_strict = e.src_host + e.src_port + e.src_host_terminator, e.tpl_host_port_fuzzy_strict = e.tpl_host_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_port_no_ip_fuzzy_strict = e.tpl_host_no_ip_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + e.src_ZPCc + "|>|$))", e.tpl_email_fuzzy = "(^|" + t + '|"|\\(|' + e.src_ZCc + ")(" + e.src_email_name + "@" + e.tpl_host_fuzzy_strict + ")", e.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_fuzzy_strict + e.src_path + ")", e.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + e.src_ZPCc + "))((?![$+<=>^`|｜])" + e.tpl_host_port_no_ip_fuzzy_strict + e.src_path + ")", e;
}
function ku(u) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    t && Object.keys(t).forEach(function(n) {
      u[n] = t[n];
    });
  }), u;
}
function du(u) {
  return Object.prototype.toString.call(u);
}
function Qt(u) {
  return du(u) === "[object String]";
}
function Vt(u) {
  return du(u) === "[object Object]";
}
function Gt(u) {
  return du(u) === "[object RegExp]";
}
function Vu(u) {
  return du(u) === "[object Function]";
}
function Wt(u) {
  return u.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const le = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function Jt(u) {
  return Object.keys(u || {}).reduce(function(e, t) {
    return e || le.hasOwnProperty(t);
  }, !1);
}
const Kt = {
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
}, Xt = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", Yt = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function $t(u) {
  u.__index__ = -1, u.__text_cache__ = "";
}
function un(u) {
  return function(e, t) {
    const n = e.slice(t);
    return u.test(n) ? n.match(u)[0].length : 0;
  };
}
function Gu() {
  return function(u, e) {
    e.normalize(u);
  };
}
function cu(u) {
  const e = u.re = Zt(u.__opts__), t = u.__tlds__.slice();
  u.onCompile(), u.__tlds_replaced__ || t.push(Xt), t.push(e.src_xn), e.src_tlds = t.join("|");
  function n(s) {
    return s.replace("%TLDS%", e.src_tlds);
  }
  e.email_fuzzy = RegExp(n(e.tpl_email_fuzzy), "i"), e.link_fuzzy = RegExp(n(e.tpl_link_fuzzy), "i"), e.link_no_ip_fuzzy = RegExp(n(e.tpl_link_no_ip_fuzzy), "i"), e.host_fuzzy_test = RegExp(n(e.tpl_host_fuzzy_test), "i");
  const i = [];
  u.__compiled__ = {};
  function r(s, o) {
    throw new Error('(LinkifyIt) Invalid schema "' + s + '": ' + o);
  }
  Object.keys(u.__schemas__).forEach(function(s) {
    const o = u.__schemas__[s];
    if (o === null)
      return;
    const a = { validate: null, link: null };
    if (u.__compiled__[s] = a, Vt(o)) {
      Gt(o.validate) ? a.validate = un(o.validate) : Vu(o.validate) ? a.validate = o.validate : r(s, o), Vu(o.normalize) ? a.normalize = o.normalize : o.normalize ? r(s, o) : a.normalize = Gu();
      return;
    }
    if (Qt(o)) {
      i.push(s);
      return;
    }
    r(s, o);
  }), i.forEach(function(s) {
    u.__compiled__[u.__schemas__[s]] && (u.__compiled__[s].validate = u.__compiled__[u.__schemas__[s]].validate, u.__compiled__[s].normalize = u.__compiled__[u.__schemas__[s]].normalize);
  }), u.__compiled__[""] = { validate: null, normalize: Gu() };
  const c = Object.keys(u.__compiled__).filter(function(s) {
    return s.length > 0 && u.__compiled__[s];
  }).map(Wt).join("|");
  u.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + c + ")", "i"), u.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + e.src_ZPCc + "))(" + c + ")", "ig"), u.re.schema_at_start = RegExp("^" + u.re.schema_search.source, "i"), u.re.pretest = RegExp(
    "(" + u.re.schema_test.source + ")|(" + u.re.host_fuzzy_test.source + ")|@",
    "i"
  ), $t(u);
}
function en(u, e) {
  const t = u.__index__, n = u.__last_index__, i = u.__text_cache__.slice(t, n);
  this.schema = u.__schema__.toLowerCase(), this.index = t + e, this.lastIndex = n + e, this.raw = i, this.text = i, this.url = i;
}
function yu(u, e) {
  const t = new en(u, e);
  return u.__compiled__[t.schema].normalize(t, u), t;
}
function I(u, e) {
  if (!(this instanceof I))
    return new I(u, e);
  e || Jt(u) && (e = u, u = {}), this.__opts__ = ku({}, le, e), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = ku({}, Kt, u), this.__compiled__ = {}, this.__tlds__ = Yt, this.__tlds_replaced__ = !1, this.re = {}, cu(this);
}
I.prototype.add = function(e, t) {
  return this.__schemas__[e] = t, cu(this), this;
};
I.prototype.set = function(e) {
  return this.__opts__ = ku(this.__opts__, e), this;
};
I.prototype.test = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length)
    return !1;
  let t, n, i, r, c, s, o, a, f;
  if (this.re.schema_test.test(e)) {
    for (o = this.re.schema_search, o.lastIndex = 0; (t = o.exec(e)) !== null; )
      if (r = this.testSchemaAt(e, t[2], o.lastIndex), r) {
        this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + r;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (a = e.search(this.re.host_fuzzy_test), a >= 0 && (this.__index__ < 0 || a < this.__index__) && (n = e.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (c = n.index + n[1].length, (this.__index__ < 0 || c < this.__index__) && (this.__schema__ = "", this.__index__ = c, this.__last_index__ = n.index + n[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (f = e.indexOf("@"), f >= 0 && (i = e.match(this.re.email_fuzzy)) !== null && (c = i.index + i[1].length, s = i.index + i[0].length, (this.__index__ < 0 || c < this.__index__ || c === this.__index__ && s > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = c, this.__last_index__ = s))), this.__index__ >= 0;
};
I.prototype.pretest = function(e) {
  return this.re.pretest.test(e);
};
I.prototype.testSchemaAt = function(e, t, n) {
  return this.__compiled__[t.toLowerCase()] ? this.__compiled__[t.toLowerCase()].validate(e, n, this) : 0;
};
I.prototype.match = function(e) {
  const t = [];
  let n = 0;
  this.__index__ >= 0 && this.__text_cache__ === e && (t.push(yu(this, n)), n = this.__last_index__);
  let i = n ? e.slice(n) : e;
  for (; this.test(i); )
    t.push(yu(this, n)), i = i.slice(this.__last_index__), n += this.__last_index__;
  return t.length ? t : null;
};
I.prototype.matchAtStart = function(e) {
  if (this.__text_cache__ = e, this.__index__ = -1, !e.length) return null;
  const t = this.re.schema_at_start.exec(e);
  if (!t) return null;
  const n = this.testSchemaAt(e, t[2], t[0].length);
  return n ? (this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + n, yu(this, 0)) : null;
};
I.prototype.tlds = function(e, t) {
  return e = Array.isArray(e) ? e : [e], t ? (this.__tlds__ = this.__tlds__.concat(e).sort().filter(function(n, i, r) {
    return n !== r[i - 1];
  }).reverse(), cu(this), this) : (this.__tlds__ = e.slice(), this.__tlds_replaced__ = !0, cu(this), this);
};
I.prototype.normalize = function(e) {
  e.schema || (e.url = "http://" + e.url), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = "mailto:" + e.url);
};
I.prototype.onCompile = function() {
};
const V = 2147483647, z = 36, Tu = 1, $ = 26, tn = 38, nn = 700, de = 72, fe = 128, he = "-", rn = /^xn--/, sn = /[^\0-\x7F]/, cn = /[\x2E\u3002\uFF0E\uFF61]/g, on = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, mu = z - Tu, B = Math.floor, _u = String.fromCharCode;
function P(u) {
  throw new RangeError(on[u]);
}
function an(u, e) {
  const t = [];
  let n = u.length;
  for (; n--; )
    t[n] = e(u[n]);
  return t;
}
function be(u, e) {
  const t = u.split("@");
  let n = "";
  t.length > 1 && (n = t[0] + "@", u = t[1]), u = u.replace(cn, ".");
  const i = u.split("."), r = an(i, e).join(".");
  return n + r;
}
function pe(u) {
  const e = [];
  let t = 0;
  const n = u.length;
  for (; t < n; ) {
    const i = u.charCodeAt(t++);
    if (i >= 55296 && i <= 56319 && t < n) {
      const r = u.charCodeAt(t++);
      (r & 64512) == 56320 ? e.push(((i & 1023) << 10) + (r & 1023) + 65536) : (e.push(i), t--);
    } else
      e.push(i);
  }
  return e;
}
const ln = (u) => String.fromCodePoint(...u), dn = function(u) {
  return u >= 48 && u < 58 ? 26 + (u - 48) : u >= 65 && u < 91 ? u - 65 : u >= 97 && u < 123 ? u - 97 : z;
}, Wu = function(u, e) {
  return u + 22 + 75 * (u < 26) - ((e != 0) << 5);
}, ge = function(u, e, t) {
  let n = 0;
  for (u = t ? B(u / nn) : u >> 1, u += B(u / e); u > mu * $ >> 1; n += z)
    u = B(u / mu);
  return B(n + (mu + 1) * u / (u + tn));
}, me = function(u) {
  const e = [], t = u.length;
  let n = 0, i = fe, r = de, c = u.lastIndexOf(he);
  c < 0 && (c = 0);
  for (let s = 0; s < c; ++s)
    u.charCodeAt(s) >= 128 && P("not-basic"), e.push(u.charCodeAt(s));
  for (let s = c > 0 ? c + 1 : 0; s < t; ) {
    const o = n;
    for (let f = 1, h = z; ; h += z) {
      s >= t && P("invalid-input");
      const g = dn(u.charCodeAt(s++));
      g >= z && P("invalid-input"), g > B((V - n) / f) && P("overflow"), n += g * f;
      const d = h <= r ? Tu : h >= r + $ ? $ : h - r;
      if (g < d)
        break;
      const b = z - d;
      f > B(V / b) && P("overflow"), f *= b;
    }
    const a = e.length + 1;
    r = ge(n - o, a, o == 0), B(n / a) > V - i && P("overflow"), i += B(n / a), n %= a, e.splice(n++, 0, i);
  }
  return String.fromCodePoint(...e);
}, _e = function(u) {
  const e = [];
  u = pe(u);
  const t = u.length;
  let n = fe, i = 0, r = de;
  for (const o of u)
    o < 128 && e.push(_u(o));
  const c = e.length;
  let s = c;
  for (c && e.push(he); s < t; ) {
    let o = V;
    for (const f of u)
      f >= n && f < o && (o = f);
    const a = s + 1;
    o - n > B((V - i) / a) && P("overflow"), i += (o - n) * a, n = o;
    for (const f of u)
      if (f < n && ++i > V && P("overflow"), f === n) {
        let h = i;
        for (let g = z; ; g += z) {
          const d = g <= r ? Tu : g >= r + $ ? $ : g - r;
          if (h < d)
            break;
          const b = h - d, C = z - d;
          e.push(
            _u(Wu(d + b % C, 0))
          ), h = B(b / C);
        }
        e.push(_u(Wu(h, 0))), r = ge(i, a, s === c), i = 0, ++s;
      }
    ++i, ++n;
  }
  return e.join("");
}, fn = function(u) {
  return be(u, function(e) {
    return rn.test(e) ? me(e.slice(4).toLowerCase()) : e;
  });
}, hn = function(u) {
  return be(u, function(e) {
    return sn.test(e) ? "xn--" + _e(e) : e;
  });
}, xe = {
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
    decode: pe,
    encode: ln
  },
  decode: me,
  encode: _e,
  toASCII: hn,
  toUnicode: fn
}, bn = {
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
}, pn = {
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
}, gn = {
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
}, mn = {
  default: bn,
  zero: pn,
  commonmark: gn
}, _n = /^(vbscript|javascript|file|data):/, xn = /^data:image\/(gif|png|jpeg|webp);/;
function kn(u) {
  const e = u.trim().toLowerCase();
  return _n.test(e) ? xn.test(e) : !0;
}
const ke = ["http:", "https:", "mailto:"];
function yn(u) {
  const e = Du(u, !0);
  if (e.hostname && (!e.protocol || ke.indexOf(e.protocol) >= 0))
    try {
      e.hostname = xe.toASCII(e.hostname);
    } catch {
    }
  return uu(Cu(e));
}
function Cn(u) {
  const e = Du(u, !0);
  if (e.hostname && (!e.protocol || ke.indexOf(e.protocol) >= 0))
    try {
      e.hostname = xe.toUnicode(e.hostname);
    } catch {
    }
  return G(Cu(e), G.defaultChars + "%");
}
function M(u, e) {
  if (!(this instanceof M))
    return new M(u, e);
  e || Au(u) || (e = u || {}, u = "default"), this.inline = new tu(), this.block = new lu(), this.core = new wu(), this.renderer = new J(), this.linkify = new I(), this.validateLink = kn, this.normalizeLink = yn, this.normalizeLinkText = Cn, this.utils = D0, this.helpers = ou({}, w0), this.options = {}, this.configure(u), e && this.set(e);
}
M.prototype.set = function(u) {
  return ou(this.options, u), this;
};
M.prototype.configure = function(u) {
  const e = this;
  if (Au(u)) {
    const t = u;
    if (u = mn[t], !u)
      throw new Error('Wrong `markdown-it` preset "' + t + '", check name');
  }
  if (!u)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return u.options && e.set(u.options), u.components && Object.keys(u.components).forEach(function(t) {
    u.components[t].rules && e[t].ruler.enableOnly(u.components[t].rules), u.components[t].rules2 && e[t].ruler2.enableOnly(u.components[t].rules2);
  }), this;
};
M.prototype.enable = function(u, e) {
  let t = [];
  Array.isArray(u) || (u = [u]), ["core", "block", "inline"].forEach(function(i) {
    t = t.concat(this[i].ruler.enable(u, !0));
  }, this), t = t.concat(this.inline.ruler2.enable(u, !0));
  const n = u.filter(function(i) {
    return t.indexOf(i) < 0;
  });
  if (n.length && !e)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + n);
  return this;
};
M.prototype.disable = function(u, e) {
  let t = [];
  Array.isArray(u) || (u = [u]), ["core", "block", "inline"].forEach(function(i) {
    t = t.concat(this[i].ruler.disable(u, !0));
  }, this), t = t.concat(this.inline.ruler2.disable(u, !0));
  const n = u.filter(function(i) {
    return t.indexOf(i) < 0;
  });
  if (n.length && !e)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + n);
  return this;
};
M.prototype.use = function(u) {
  const e = [this].concat(Array.prototype.slice.call(arguments, 1));
  return u.apply(u, e), this;
};
M.prototype.parse = function(u, e) {
  if (typeof u != "string")
    throw new Error("Input data should be a String");
  const t = new this.core.State(u, this, e);
  return this.core.process(t), t.tokens;
};
M.prototype.render = function(u, e) {
  return e = e || {}, this.renderer.render(this.parse(u, e), this.options, e);
};
M.prototype.parseInline = function(u, e) {
  const t = new this.core.State(u, this, e);
  return t.inlineMode = !0, this.core.process(t), t.tokens;
};
M.prototype.renderInline = function(u, e) {
  return e = e || {}, this.renderer.render(this.parseInline(u, e), this.options, e);
};
const Dn = new M({
  html: !1,
  breaks: !0,
  linkify: !0
}), En = (u) => u ? Dn.render(u) : "";
var An = l.from_html('<span class="chat-widget__thinking-pulse svelte-6zhkyr"></span>'), Fn = l.from_html('<span class="chat-widget__stream-caret chat-widget__stream-caret--secondary svelte-6zhkyr"></span>'), wn = l.from_html('<details class="chat-widget__thinking svelte-6zhkyr"><summary class="chat-widget__thinking-summary svelte-6zhkyr"><div class="chat-widget__thinking-toggle svelte-6zhkyr"><svg class="chat-widget__thinking-chevron svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" class="svelte-6zhkyr"></path></svg> <span class="chat-widget__thinking-label svelte-6zhkyr"><svg class="chat-widget__thinking-icon svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" class="svelte-6zhkyr"></path></svg> Thinking <!></span></div></summary> <div class="chat-widget__thinking-content svelte-6zhkyr"><p class="chat-widget__thinking-text svelte-6zhkyr"> <!></p></div></details>');
function vn(u, e) {
  l.push(e, !0);
  var t = wn(), n = l.child(t), i = l.child(n), r = l.sibling(l.child(i), 2), c = l.sibling(l.child(r), 2);
  {
    var s = (d) => {
      var b = An();
      l.append(d, b);
    };
    l.if(c, (d) => {
      e.thinking.isStreaming && d(s);
    });
  }
  l.reset(r), l.reset(i), l.reset(n);
  var o = l.sibling(n, 2), a = l.child(o), f = l.child(a), h = l.sibling(f);
  {
    var g = (d) => {
      var b = Fn();
      l.append(d, b);
    };
    l.if(h, (d) => {
      e.thinking.isStreaming && d(g);
    });
  }
  l.reset(a), l.reset(o), l.reset(t), l.template_effect(() => {
    t.open = e.thinking.isStreaming, l.set_text(f, `${e.thinking.content ?? ""} `);
  }), l.append(u, t), l.pop();
}
var Tn = l.from_html('<span class="chat-widget__stream-caret svelte-1m4gqe"></span>'), Sn = l.from_html('<div><div><!> <div><div class="chat-widget__bubble-content svelte-1m4gqe"><!> <!></div></div> <span> </span></div></div>');
function In(u, e) {
  l.push(e, !0);
  var t = Sn();
  let n;
  var i = l.child(t);
  let r;
  var c = l.child(i);
  {
    var s = (D) => {
      vn(D, {
        get thinking() {
          return e.message.thinking;
        }
      });
    };
    l.if(c, (D) => {
      e.showThinking && e.message.thinking && e.message.from === "assistant" && D(s);
    });
  }
  var o = l.sibling(c, 2);
  let a;
  var f = l.child(o), h = l.child(f);
  l.html(h, () => En(e.message.text));
  var g = l.sibling(h, 2);
  {
    var d = (D) => {
      var p = Tn();
      l.append(D, p);
    };
    l.if(g, (D) => {
      var p;
      e.message.isStreaming && !(e.showThinking && ((p = e.message.thinking) != null && p.isStreaming)) && D(d);
    });
  }
  l.reset(f), l.reset(o);
  var b = l.sibling(o, 2);
  let C;
  var _ = l.child(b, !0);
  l.reset(b), l.reset(i), l.reset(t), l.template_effect(
    (D) => {
      n = l.set_class(t, 1, "chat-widget__message-row svelte-1m4gqe", null, n, {
        "chat-widget__message-row--user": e.message.from === "user",
        "chat-widget__message-row--assistant": e.message.from === "assistant",
        "chat-widget__message-row--system": e.message.from === "system"
      }), r = l.set_class(i, 1, "chat-widget__message svelte-1m4gqe", null, r, {
        "chat-widget__message--user": e.message.from === "user",
        "chat-widget__message--assistant": e.message.from === "assistant",
        "chat-widget__message--system": e.message.from === "system"
      }), a = l.set_class(o, 1, "chat-widget__bubble svelte-1m4gqe", null, a, {
        "chat-widget__bubble--user": e.message.from === "user",
        "chat-widget__bubble--assistant": e.message.from === "assistant",
        "chat-widget__bubble--system": e.message.from === "system"
      }), C = l.set_class(b, 1, "chat-widget__timestamp svelte-1m4gqe", null, C, {
        "chat-widget__timestamp--user": e.message.from === "user",
        "chat-widget__timestamp--assistant": e.message.from === "assistant",
        "chat-widget__timestamp--system": e.message.from === "system"
      }), l.set_text(_, D);
    },
    [() => Le(e.message.timestamp)]
  ), l.append(u, t), l.pop();
}
var Mn = l.from_html('<div class="chat-widget__typing-row svelte-gu507e"><div class="chat-widget__typing-bubble svelte-gu507e"><div class="chat-widget__typing-dots svelte-gu507e"><div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 0ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 150ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 300ms"></div></div></div></div>');
function qn(u) {
  var e = Mn();
  l.append(u, e);
}
var zn = l.from_html("<!> <!>", 1);
function Bn(u, e) {
  var t = zn(), n = l.first_child(t);
  l.each(n, 17, () => e.messages, (c) => c.id, (c, s) => {
    In(c, {
      get message() {
        return l.get(s);
      },
      get showThinking() {
        return e.showThinking;
      }
    });
  });
  var i = l.sibling(n, 2);
  {
    var r = (c) => {
      qn(c);
    };
    l.if(i, (c) => {
      e.isTyping && c(r);
    });
  }
  l.append(u, t);
}
var Ln = l.from_html('<span class="chat-widget__question-option-description svelte-11fq3uo"> </span>'), Rn = l.from_html('<button type="button"><span class="chat-widget__question-option-label svelte-11fq3uo"> </span> <!></button>'), Pn = l.from_html('<button type="button" class="chat-widget__question-submit svelte-11fq3uo">Submit selection</button>'), On = l.from_html('<div class="chat-widget__question-panel svelte-11fq3uo"><p class="chat-widget__question-text svelte-11fq3uo"> </p> <div class="chat-widget__question-options svelte-11fq3uo"></div> <!></div>');
function Nn(u, e) {
  l.push(e, !0);
  let t = l.prop(e, "autoFocusFirst", 3, !1), n = l.state(l.proxy([]));
  const i = (g) => {
    var b;
    if (e.question.options.length === 0)
      return;
    const d = (g % e.question.options.length + e.question.options.length) % e.question.options.length;
    (b = l.get(n)[d]) == null || b.focus();
  }, r = (g, d, b) => {
    if (!g.isComposing) {
      if (g.key === "ArrowDown" || g.key === "ArrowRight") {
        g.preventDefault(), i(b + 1);
        return;
      }
      if (g.key === "ArrowUp" || g.key === "ArrowLeft") {
        g.preventDefault(), i(b - 1);
        return;
      }
      if (g.key === "Home") {
        g.preventDefault(), i(0);
        return;
      }
      if (g.key === "End") {
        g.preventDefault(), i(e.question.options.length - 1);
        return;
      }
      (g.key === "Enter" || g.key === " ") && (g.preventDefault(), e.onToggleAnswer(d));
    }
  };
  l.user_effect(() => {
    e.question, l.set(n, [], !0);
  }), l.user_effect(() => {
    var g;
    t() && (i(0), (g = e.onAutoFocusHandled) == null || g.call(e));
  });
  var c = On(), s = l.child(c), o = l.child(s, !0);
  l.reset(s);
  var a = l.sibling(s, 2);
  l.each(a, 23, () => e.question.options, (g, d) => `${g.value ?? g.label}-${d}`, (g, d, b) => {
    const C = l.derived(() => Se(l.get(d)));
    var _ = Rn();
    let D;
    _.__click = () => e.onToggleAnswer(l.get(C)), _.__keydown = (E) => r(E, l.get(C), l.get(b));
    var p = l.child(_), m = l.child(p, !0);
    l.reset(p);
    var x = l.sibling(p, 2);
    {
      var k = (E) => {
        var A = Ln(), y = l.child(A, !0);
        l.reset(A), l.template_effect(() => l.set_text(y, l.get(d).description)), l.append(E, A);
      };
      l.if(x, (E) => {
        l.get(d).description && E(k);
      });
    }
    l.reset(_), l.bind_this(_, (E, A) => l.get(n)[A] = E, (E) => {
      var A;
      return (A = l.get(n)) == null ? void 0 : A[E];
    }, () => [l.get(b)]), l.template_effect(
      (E) => {
        D = l.set_class(_, 1, "chat-widget__question-option svelte-11fq3uo", null, D, E), l.set_text(m, l.get(d).label);
      },
      [
        () => ({
          "chat-widget__question-option--selected": e.selectedAnswers.includes(l.get(C))
        })
      ]
    ), l.append(g, _);
  }), l.reset(a);
  var f = l.sibling(a, 2);
  {
    var h = (g) => {
      var d = Pn();
      d.__click = function(...b) {
        var C;
        (C = e.onSubmitAnswers) == null || C.apply(this, b);
      }, l.template_effect(() => d.disabled = e.selectedAnswers.length === 0), l.append(g, d);
    };
    l.if(f, (g) => {
      e.question.allowMultiple && g(h);
    });
  }
  l.reset(c), l.template_effect(() => l.set_text(o, e.question.text)), l.append(u, c), l.pop();
}
l.delegate(["click", "keydown"]);
var Un = l.from_html('<form class="chat-widget__composer svelte-1m0eido"><div class="chat-widget__input-wrap svelte-1m0eido"><textarea class="chat-widget__input svelte-1m0eido" rows="1"></textarea></div> <button type="submit" class="chat-widget__send svelte-1m0eido" title="Send message"><svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon svelte-1m0eido" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button></form>');
function jn(u, e) {
  l.push(e, !0);
  const t = 160;
  let n = l.state(void 0);
  const i = l.derived(() => !e.draft.trim() || e.disabled), r = (d = l.get(n)) => {
    if (!d)
      return;
    d.style.height = "auto";
    const b = Math.min(d.scrollHeight, t);
    d.style.height = `${b}px`, d.style.overflowY = d.scrollHeight > t ? "auto" : "hidden";
  }, c = (d) => {
    d.preventDefault(), !l.get(i) && e.onSubmit();
  }, s = (d) => {
    d.isComposing || d.key !== "Enter" || d.shiftKey || (d.preventDefault(), !l.get(i) && e.onSubmit());
  }, o = (d) => {
    const b = d.currentTarget;
    e.onDraftChange(b.value), r(b);
  };
  l.user_effect(() => {
    e.draft, r();
  });
  var a = Un(), f = l.child(a), h = l.child(f);
  l.remove_textarea_child(h), h.__input = o, h.__keydown = s, l.bind_this(h, (d) => l.set(n, d), () => l.get(n)), l.reset(f);
  var g = l.sibling(f, 2);
  l.reset(a), l.template_effect(() => {
    l.set_attribute(h, "placeholder", e.placeholder), l.set_value(h, e.draft), h.disabled = e.disabled, g.disabled = l.get(i);
  }), l.event("submit", a, c), l.append(u, a), l.pop();
}
l.delegate(["input", "keydown"]);
var Hn = l.from_html('<div><!> <div class="chat-widget__messages svelte-3vislt"><!></div> <footer class="chat-widget__footer svelte-3vislt"><!></footer></div>');
function Gn(u, e) {
  l.push(e, !0);
  const t = {
    title: "Audako Assistant",
    placeholder: "Type a message",
    initialMessage: "Welcome to Audako MCP Chat. How can I assist you today?",
    showThinking: !0,
    adapter: void 0
  };
  let n = l.prop(e, "primary", 3, "#0B57D0"), i = l.prop(e, "secondary", 3, "#4D5F7A"), r = l.prop(e, "darkMode", 3, !1);
  const c = l.derived(() => e.config ?? t), s = l.derived(() => {
    var y;
    return ((y = l.get(c)) == null ? void 0 : y.title) || "Audako Assistant";
  }), o = l.derived(() => `--chat-primary: ${n()}; --chat-secondary: ${i()};`), a = l.derived(() => {
    var y;
    return ((y = l.get(c)) == null ? void 0 : y.showThinking) ?? !0;
  }), f = l.derived(() => {
    var y;
    return ((y = l.get(c)) == null ? void 0 : y.placeholder) || "Type a message";
  });
  let h = l.state(void 0);
  const d = Me({
    getConfig: () => l.get(c),
    getShowThinking: () => l.get(a),
    scrollToBottom: () => {
      l.get(h) && setTimeout(
        () => {
          l.get(h) && (l.get(h).scrollTop = l.get(h).scrollHeight);
        },
        50
      );
    }
  }), b = l.derived(() => d.state.isTyping || !!d.state.streamingMessageId);
  l.user_effect(() => {
    d.syncConfig();
  });
  var C = Hn();
  let _;
  C.__keydown = (y) => y.stopPropagation(), C.__keyup = (y) => y.stopPropagation();
  var D = l.child(C);
  Be(D, {
    get title() {
      return l.get(s);
    },
    get header() {
      return e.header;
    }
  });
  var p = l.sibling(D, 2), m = l.child(p);
  Bn(m, {
    get messages() {
      return d.state.messages;
    },
    get showThinking() {
      return l.get(a);
    },
    get isTyping() {
      return d.state.isTyping;
    }
  }), l.reset(p), l.bind_this(p, (y) => l.set(h, y), () => l.get(h));
  var x = l.sibling(p, 2), k = l.child(x);
  {
    var E = (y) => {
      Nn(y, {
        get question() {
          return d.state.pendingQuestion;
        },
        get selectedAnswers() {
          return d.state.selectedQuestionAnswers;
        },
        get autoFocusFirst() {
          return d.state.shouldFocusQuestion;
        },
        get onToggleAnswer() {
          return d.toggleQuestionAnswer;
        },
        get onSubmitAnswers() {
          return d.submitQuestionAnswers;
        },
        get onAutoFocusHandled() {
          return d.clearQuestionFocusRequest;
        }
      });
    }, A = (y) => {
      jn(y, {
        get draft() {
          return d.state.draft;
        },
        get placeholder() {
          return l.get(f);
        },
        get disabled() {
          return l.get(b);
        },
        get onDraftChange() {
          return d.setDraft;
        },
        get onSubmit() {
          return d.sendMessage;
        }
      });
    };
    l.if(k, (y) => {
      d.state.pendingQuestion ? y(E) : y(A, !1);
    });
  }
  l.reset(x), l.reset(C), l.template_effect(() => {
    _ = l.set_class(C, 1, "chat-widget svelte-3vislt", null, _, { "chat-widget--dark": r() }), l.set_style(C, l.get(o));
  }), l.event("keypress", C, (y) => y.stopPropagation()), l.append(u, C), l.pop();
}
l.delegate(["keydown", "keyup"]);
class Wn {
  constructor(e) {
    this.abortController = null, this.showThinking = (e == null ? void 0 : e.showThinking) ?? !1, this.showQuestion = (e == null ? void 0 : e.showQuestion) ?? !1;
  }
  /**
   * Initialize the mock adapter
   * For MockAdapter, this is a no-op since there's no real connection to set up
   */
  async init() {
  }
  async sendMessage(e, t) {
    this.abortController = new AbortController();
    const n = [
      "I understand your question. Let me help you with that. First, we need to consider the context of your request. Then, I'll provide you with a detailed explanation that addresses all aspects of your query.",
      "That's an interesting point. Here's what I think about it. Based on the information provided, there are several factors we should analyze. Let me break this down into manageable parts for better understanding.",
      "I'd be happy to assist you with that. Based on what you've asked, I recommend taking a systematic approach. We can explore multiple solutions and find the one that best fits your needs.",
      "Great question! The answer depends on several factors, but generally speaking, the most effective approach would be to first understand the requirements. Then we can proceed with implementing the solution step by step.",
      "I can help you with that. Let me break it down for you step by step. We'll start with the fundamentals and gradually move to more advanced concepts to ensure you have a complete understanding."
    ], i = [
      "Let me analyze this question... The user is asking about a complex topic. I should break this down into clear, logical steps.",
      "Hmm, interesting query. I need to consider multiple angles here: technical feasibility, best practices, and practical application.",
      "First, I'll identify the core problem. Then I'll explore potential solutions and their trade-offs before providing a recommendation.",
      "Let's think through this systematically. What are the key requirements? What constraints do we have? What's the optimal approach?",
      "Breaking down the problem: 1) Understand the context, 2) Identify relevant factors, 3) Formulate a clear, actionable response."
    ];
    try {
      if (this.showThinking && t.onThinking) {
        const h = i[Math.floor(Math.random() * i.length)].split(" ");
        let g = "";
        for (let d = 0; d < h.length; d++) {
          if (this.abortController.signal.aborted)
            throw new Error("Request cancelled");
          g += (d > 0 ? " " : "") + h[d], t.onThinking(g), await new Promise((b) => setTimeout(b, 40 + Math.random() * 40));
        }
        await new Promise((d) => setTimeout(d, 200));
      }
      let r = "";
      this.showQuestion && t.onQuestion && (r = ((await t.onQuestion({
        text: "Which response style should I use?",
        options: [
          {
            label: "Concise",
            value: "concise",
            description: "Short and direct response"
          },
          {
            label: "Detailed",
            value: "detailed",
            description: "More context and explanation"
          }
        ]
      }))[0] || "concise") === "detailed" ? "Great, I will provide a detailed answer. " : "Great, I will keep it concise. ");
      const c = n[Math.floor(Math.random() * n.length)], o = (r + c).split(" ");
      let a = "";
      for (let f = 0; f < o.length; f++) {
        if (this.abortController.signal.aborted)
          throw new Error("Request cancelled");
        a += (f > 0 ? " " : "") + o[f], t.onChunk(a), await new Promise((h) => setTimeout(h, 20 + Math.random() * 60));
      }
      t.onComplete();
    } catch (r) {
      this.abortController.signal.aborted || t.onError(r instanceof Error ? r : new Error("Unknown error"));
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort();
  }
}
class Jn {
  constructor(e = {}) {
    this.sessionId = null, this.client = null, this.abortController = null, this.eventStream = null, this.initPromise = null, this.currentCallbacks = null, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.currentText = "", this.currentReasoning = "", this.currentToolThinking = "", this.toolThinkingEntryKeys = /* @__PURE__ */ new Set(), this.lastEmittedThinking = "", this.activeMessageLog = [], this.lastMessageLog = [], this.combinedMessageLog = [], this.sessionId = e.sessionId || null, this.baseUrl = e.baseUrl || "http://localhost:4096", this.model = e.model, this.agent = e.agent, this.createSession = e.createSession ?? !0, this.logCombinedEvents = e.logCombinedEvents ?? !0;
  }
  async ensureClient() {
    return this.client || (this.client = Ee({
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
    var d, b, C;
    const i = (d = e == null ? void 0 : e.properties) == null ? void 0 : d.info, r = (b = e == null ? void 0 : e.properties) == null ? void 0 : b.part, c = typeof (e == null ? void 0 : e.type) == "string" ? e.type : "unknown", s = typeof (i == null ? void 0 : i.id) == "string" ? i.id : typeof (r == null ? void 0 : r.messageID) == "string" ? r.messageID : void 0, o = typeof (i == null ? void 0 : i.sessionID) == "string" ? i.sessionID : typeof (r == null ? void 0 : r.sessionID) == "string" ? r.sessionID : void 0, a = typeof (i == null ? void 0 : i.role) == "string" ? i.role : void 0, f = typeof (r == null ? void 0 : r.type) == "string" ? r.type : void 0, h = typeof ((C = e == null ? void 0 : e.properties) == null ? void 0 : C.delta) == "string" ? e.properties.delta : void 0, g = typeof (r == null ? void 0 : r.text) == "string" ? r.text : typeof (r == null ? void 0 : r.thinking) == "string" ? r.thinking : void 0;
    this.appendCombinedLog({
      category: "event",
      type: c,
      sessionId: o,
      messageId: s,
      role: a,
      partType: f,
      delta: h,
      text: g,
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
    var t, n, i, r, c, s, o, a, f, h, g, d, b, C;
    if (this.currentCallbacks) {
      if ((t = this.abortController) != null && t.signal.aborted) {
        this.recordEvent(e, !0, "request-aborted");
        return;
      }
      if (console.log("Received event:", e), e.type === "message.updated") {
        const _ = (i = (n = e.properties) == null ? void 0 : n.info) == null ? void 0 : i.id, D = (c = (r = e.properties) == null ? void 0 : r.info) == null ? void 0 : c.role, p = (o = (s = e.properties) == null ? void 0 : s.info) == null ? void 0 : o.sessionID;
        if (this.sessionId && p && p !== this.sessionId) {
          this.recordEvent(e, !0, "session-mismatch");
          return;
        }
        this.recordEvent(e), D === "user" ? (this.currentUserMessageId = _, console.log("Tracking user message ID:", _)) : D === "assistant" && (this.currentAssistantMessageId = _, console.log("Tracking assistant message ID:", _));
        const m = (f = (a = e.properties) == null ? void 0 : a.info) == null ? void 0 : f.finish, x = !!((d = (g = (h = e.properties) == null ? void 0 : h.info) == null ? void 0 : g.time) != null && d.completed);
        (m === "stop" || x && m !== "tool-calls") && D === "assistant" && _ === this.currentAssistantMessageId && (console.log("Assistant message finished:", _), this.currentCallbacks.onComplete(), this.clearCurrentMessage("completed"));
      } else if (e.type === "message.part.updated") {
        const _ = (b = e.properties) == null ? void 0 : b.part, D = _ == null ? void 0 : _.messageID, p = _ == null ? void 0 : _.sessionID, m = typeof ((C = e.properties) == null ? void 0 : C.delta) == "string" ? e.properties.delta : "";
        if (!_) {
          this.recordEvent(e, !0, "missing-part");
          return;
        }
        if (this.sessionId && p && p !== this.sessionId) {
          this.recordEvent(e, !0, "session-mismatch");
          return;
        }
        if (!this.currentAssistantMessageId && D && D !== this.currentUserMessageId && (this.currentAssistantMessageId = D), D === this.currentAssistantMessageId && D !== this.currentUserMessageId) {
          if (this.recordEvent(e), console.log("Processing part update for assistant message:", D), _.type === "text")
            this.currentText = this.resolveAccumulatedContent(_.text, m, this.currentText), this.currentCallbacks.onChunk(this.currentText);
          else if (_.type === "reasoning" || _.type === "thinking") {
            const x = typeof _.text == "string" ? _.text : typeof _.thinking == "string" ? _.thinking : "";
            this.currentReasoning = this.resolveAccumulatedContent(x, m, this.currentReasoning), this.emitThinkingUpdate();
          } else if (_.type === "tool") {
            const x = this.buildToolThinkingEntry(_);
            x && (this.currentToolThinking = this.currentToolThinking ? `${this.currentToolThinking}

${x}` : x, this.emitThinkingUpdate());
          }
        } else
          this.recordEvent(e, !0, "not-assistant-message");
      } else
        this.recordEvent(e, !0, "unsupported-event-type");
    }
  }
  resolveAccumulatedContent(e, t, n) {
    const i = typeof e == "string" ? e : "";
    if (i) {
      if (i.length >= n.length)
        return i;
      if (n.startsWith(i))
        return n;
    }
    const r = t || i;
    return !r || n.endsWith(r) ? n : n + r;
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
    const t = typeof (e == null ? void 0 : e.tool) == "string" ? e.tool : "unknown-tool", n = typeof (e == null ? void 0 : e.callID) == "string" ? e.callID : void 0, i = typeof (e == null ? void 0 : e.id) == "string" ? e.id : `${t}:${n ?? "n/a"}`, r = (e == null ? void 0 : e.state) ?? {}, c = typeof (r == null ? void 0 : r.status) == "string" ? r.status : "unknown", s = this.stringifyToolValue(r == null ? void 0 : r.output), o = `${i}|${c}|${s}`;
    if (this.toolThinkingEntryKeys.has(o))
      return null;
    this.toolThinkingEntryKeys.add(o);
    const a = `[tool ${c}] ${t}${n ? ` (${n})` : ""}`;
    if (c === "completed")
      return s ? `${a}
${this.formatToolOutput(s)}` : `${a}
(no output)`;
    if (c === "error" || c === "failed") {
      const f = this.stringifyToolValue((r == null ? void 0 : r.error) || (r == null ? void 0 : r.output) || (r == null ? void 0 : r.raw));
      return f ? `${a}
${this.formatToolOutput(f)}` : a;
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
      const i = n.data.id;
      return this.sessionId = i, i;
    } catch (n) {
      throw new Error(`Failed to create session: ${n instanceof Error ? n.message : "Unknown error"}`);
    }
  }
  async sendMessage(e, t) {
    var n;
    this.abortController = new AbortController(), this.startCombinedLog(e);
    try {
      const i = await this.ensureClient(), r = await this.ensureSession();
      this.appendCombinedLog({
        category: "state",
        type: "session.ready",
        sessionId: r,
        payload: {
          model: this.model,
          agent: this.agent
        }
      }), this.eventStream || await this.init(), this.currentCallbacks = t, this.currentAssistantMessageId = null, this.currentUserMessageId = null, this.currentText = "", this.currentReasoning = "", this.currentToolThinking = "", this.toolThinkingEntryKeys = /* @__PURE__ */ new Set(), this.lastEmittedThinking = "";
      const c = [
        {
          type: "text",
          text: e.message
        }
      ];
      console.info("Sending prompt to session:", r, c, this.model, this.agent), this.appendCombinedLog({
        category: "request",
        type: "session.prompt",
        sessionId: r,
        payload: {
          model: this.model,
          agent: this.agent,
          parts: c
        }
      }), await i.session.prompt({
        path: { id: r },
        body: {
          model: this.model,
          agent: this.agent,
          parts: c
        }
      }), console.log("Prompt sent successfully"), this.appendCombinedLog({
        category: "state",
        type: "session.prompt.sent",
        sessionId: r
      });
    } catch (i) {
      const r = ((n = this.abortController) == null ? void 0 : n.signal.aborted) ?? !1;
      r || t.onError(i instanceof Error ? i : new Error("Unknown error")), this.clearCurrentMessage(r ? "cancelled" : "error");
    } finally {
      this.abortController = null;
    }
  }
  cancel() {
    this.abortController && this.abortController.abort(), this.clearCurrentMessage("cancelled");
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
export {
  Gn as ChatWidget,
  Wn as MockAdapter,
  Jn as OpenCodeAdapter
};
