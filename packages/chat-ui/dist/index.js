import "svelte/internal/disclose-version";
import * as a from "svelte/internal/client";
import "@mariozechner/pi-web-ui";
import "svelte/internal/flags/legacy";
class Hi {
  constructor(u) {
    this.abortController = null, this.publicQuestionHandler = null, this.showThinking = (u == null ? void 0 : u.showThinking) ?? !1, this.showQuestionPrompt = (u == null ? void 0 : u.showQuestion) ?? !1;
  }
  /**
   * Initialize the mock adapter
   * For MockAdapter, this is a no-op since there's no real connection to set up
   */
  async init() {
  }
  setPublicQuestionHandler(u) {
    this.publicQuestionHandler = u;
  }
  async showQuestion(u, t) {
    if (!this.publicQuestionHandler)
      throw new Error(
        "No question handler is registered. Mount ChatWidget with this adapter first."
      );
    return this.publicQuestionHandler(u, t);
  }
  async sendMessage(u, t) {
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
        const d = r[Math.floor(Math.random() * r.length)].split(" ");
        let _ = "";
        for (let p = 0; p < d.length; p++) {
          if (this.abortController.signal.aborted)
            throw new Error("Request cancelled");
          _ += (p > 0 ? " " : "") + d[p], t.onThinking(_), await new Promise((h) => setTimeout(h, 40 + Math.random() * 40));
        }
        await new Promise((p) => setTimeout(p, 200));
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
      let l = "";
      for (let f = 0; f < c.length; f++) {
        if (this.abortController.signal.aborted)
          throw new Error("Request cancelled");
        l += (f > 0 ? " " : "") + c[f], t.onChunk(l), await new Promise((d) => setTimeout(d, 20 + Math.random() * 60));
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
const Z = /* @__PURE__ */ Object.create(null);
Z.open = "0";
Z.close = "1";
Z.ping = "2";
Z.pong = "3";
Z.message = "4";
Z.upgrade = "5";
Z.noop = "6";
const ye = /* @__PURE__ */ Object.create(null);
Object.keys(Z).forEach((e) => {
  ye[Z[e]] = e;
});
const je = { type: "error", data: "parser error" }, Pu = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Nu = typeof ArrayBuffer == "function", zu = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, uu = ({ type: e, data: u }, t, n) => Pu && u instanceof Blob ? t ? n(u) : pu(u, n) : Nu && (u instanceof ArrayBuffer || zu(u)) ? t ? n(u) : pu(new Blob([u]), n) : n(Z[e] + (u || "")), pu = (e, u) => {
  const t = new FileReader();
  return t.onload = function() {
    const n = t.result.split(",")[1];
    u("b" + (n || ""));
  }, t.readAsDataURL(e);
};
function bu(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Me;
function At(e, u) {
  if (Pu && e.data instanceof Blob)
    return e.data.arrayBuffer().then(bu).then(u);
  if (Nu && (e.data instanceof ArrayBuffer || zu(e.data)))
    return u(bu(e.data));
  uu(e, !1, (t) => {
    Me || (Me = new TextEncoder()), u(Me.encode(t));
  });
}
const mu = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", ae = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < mu.length; e++)
  ae[mu.charCodeAt(e)] = e;
const Dt = (e) => {
  let u = e.length * 0.75, t = e.length, n, r = 0, i, s, o, c;
  e[e.length - 1] === "=" && (u--, e[e.length - 2] === "=" && u--);
  const l = new ArrayBuffer(u), f = new Uint8Array(l);
  for (n = 0; n < t; n += 4)
    i = ae[e.charCodeAt(n)], s = ae[e.charCodeAt(n + 1)], o = ae[e.charCodeAt(n + 2)], c = ae[e.charCodeAt(n + 3)], f[r++] = i << 2 | s >> 4, f[r++] = (s & 15) << 4 | o >> 2, f[r++] = (o & 3) << 6 | c & 63;
  return l;
}, vt = typeof ArrayBuffer == "function", tu = (e, u) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Uu(e, u)
    };
  const t = e.charAt(0);
  return t === "b" ? {
    type: "message",
    data: Ft(e.substring(1), u)
  } : ye[t] ? e.length > 1 ? {
    type: ye[t],
    data: e.substring(1)
  } : {
    type: ye[t]
  } : je;
}, Ft = (e, u) => {
  if (vt) {
    const t = Dt(e);
    return Uu(t, u);
  } else
    return { base64: !0, data: e };
}, Uu = (e, u) => {
  switch (u) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, Hu = "", St = (e, u) => {
  const t = e.length, n = new Array(t);
  let r = 0;
  e.forEach((i, s) => {
    uu(i, !1, (o) => {
      n[s] = o, ++r === t && u(n.join(Hu));
    });
  });
}, Tt = (e, u) => {
  const t = e.split(Hu), n = [];
  for (let r = 0; r < t.length; r++) {
    const i = tu(t[r], u);
    if (n.push(i), i.type === "error")
      break;
  }
  return n;
};
function Bt() {
  return new TransformStream({
    transform(e, u) {
      At(e, (t) => {
        const n = t.length;
        let r;
        if (n < 126)
          r = new Uint8Array(1), new DataView(r.buffer).setUint8(0, n);
        else if (n < 65536) {
          r = new Uint8Array(3);
          const i = new DataView(r.buffer);
          i.setUint8(0, 126), i.setUint16(1, n);
        } else {
          r = new Uint8Array(9);
          const i = new DataView(r.buffer);
          i.setUint8(0, 127), i.setBigUint64(1, BigInt(n));
        }
        e.data && typeof e.data != "string" && (r[0] |= 128), u.enqueue(r), u.enqueue(t);
      });
    }
  });
}
let Oe;
function _e(e) {
  return e.reduce((u, t) => u + t.length, 0);
}
function ge(e, u) {
  if (e[0].length === u)
    return e.shift();
  const t = new Uint8Array(u);
  let n = 0;
  for (let r = 0; r < u; r++)
    t[r] = e[0][n++], n === e[0].length && (e.shift(), n = 0);
  return e.length && n < e[0].length && (e[0] = e[0].slice(n)), t;
}
function Rt(e, u) {
  Oe || (Oe = new TextDecoder());
  const t = [];
  let n = 0, r = -1, i = !1;
  return new TransformStream({
    transform(s, o) {
      for (t.push(s); ; ) {
        if (n === 0) {
          if (_e(t) < 1)
            break;
          const c = ge(t, 1);
          i = (c[0] & 128) === 128, r = c[0] & 127, r < 126 ? n = 3 : r === 126 ? n = 1 : n = 2;
        } else if (n === 1) {
          if (_e(t) < 2)
            break;
          const c = ge(t, 2);
          r = new DataView(c.buffer, c.byteOffset, c.length).getUint16(0), n = 3;
        } else if (n === 2) {
          if (_e(t) < 8)
            break;
          const c = ge(t, 8), l = new DataView(c.buffer, c.byteOffset, c.length), f = l.getUint32(0);
          if (f > Math.pow(2, 21) - 1) {
            o.enqueue(je);
            break;
          }
          r = f * Math.pow(2, 32) + l.getUint32(4), n = 3;
        } else {
          if (_e(t) < r)
            break;
          const c = ge(t, r);
          o.enqueue(tu(i ? c : Oe.decode(c), u)), n = 0;
        }
        if (r === 0 || r > e) {
          o.enqueue(je);
          break;
        }
      }
    }
  });
}
const Qu = 4;
function R(e) {
  if (e) return qt(e);
}
function qt(e) {
  for (var u in R.prototype)
    e[u] = R.prototype[u];
  return e;
}
R.prototype.on = R.prototype.addEventListener = function(e, u) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(u), this;
};
R.prototype.once = function(e, u) {
  function t() {
    this.off(e, t), u.apply(this, arguments);
  }
  return t.fn = u, this.on(e, t), this;
};
R.prototype.off = R.prototype.removeListener = R.prototype.removeAllListeners = R.prototype.removeEventListener = function(e, u) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var t = this._callbacks["$" + e];
  if (!t) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + e], this;
  for (var n, r = 0; r < t.length; r++)
    if (n = t[r], n === u || n.fn === u) {
      t.splice(r, 1);
      break;
    }
  return t.length === 0 && delete this._callbacks["$" + e], this;
};
R.prototype.emit = function(e) {
  this._callbacks = this._callbacks || {};
  for (var u = new Array(arguments.length - 1), t = this._callbacks["$" + e], n = 1; n < arguments.length; n++)
    u[n - 1] = arguments[n];
  if (t) {
    t = t.slice(0);
    for (var n = 0, r = t.length; n < r; ++n)
      t[n].apply(this, u);
  }
  return this;
};
R.prototype.emitReserved = R.prototype.emit;
R.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
R.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const Se = typeof Promise == "function" && typeof Promise.resolve == "function" ? (u) => Promise.resolve().then(u) : (u, t) => t(u, 0), N = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), It = "arraybuffer";
function Vu(e, ...u) {
  return u.reduce((t, n) => (e.hasOwnProperty(n) && (t[n] = e[n]), t), {});
}
const Mt = N.setTimeout, Ot = N.clearTimeout;
function Te(e, u) {
  u.useNativeTimers ? (e.setTimeoutFn = Mt.bind(N), e.clearTimeoutFn = Ot.bind(N)) : (e.setTimeoutFn = N.setTimeout.bind(N), e.clearTimeoutFn = N.clearTimeout.bind(N));
}
const Lt = 1.33;
function Pt(e) {
  return typeof e == "string" ? Nt(e) : Math.ceil((e.byteLength || e.size) * Lt);
}
function Nt(e) {
  let u = 0, t = 0;
  for (let n = 0, r = e.length; n < r; n++)
    u = e.charCodeAt(n), u < 128 ? t += 1 : u < 2048 ? t += 2 : u < 55296 || u >= 57344 ? t += 3 : (n++, t += 4);
  return t;
}
function ju() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function zt(e) {
  let u = "";
  for (let t in e)
    e.hasOwnProperty(t) && (u.length && (u += "&"), u += encodeURIComponent(t) + "=" + encodeURIComponent(e[t]));
  return u;
}
function Ut(e) {
  let u = {}, t = e.split("&");
  for (let n = 0, r = t.length; n < r; n++) {
    let i = t[n].split("=");
    u[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
  }
  return u;
}
class Ht extends Error {
  constructor(u, t, n) {
    super(u), this.description = t, this.context = n, this.type = "TransportError";
  }
}
class nu extends R {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(u) {
    super(), this.writable = !1, Te(this, u), this.opts = u, this.query = u.query, this.socket = u.socket, this.supportsBinary = !u.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(u, t, n) {
    return super.emitReserved("error", new Ht(u, t, n)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(u) {
    this.readyState === "open" && this.write(u);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(u) {
    const t = tu(u, this.socket.binaryType);
    this.onPacket(t);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(u) {
    super.emitReserved("packet", u);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(u) {
    this.readyState = "closed", super.emitReserved("close", u);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(u) {
  }
  createUri(u, t = {}) {
    return u + "://" + this._hostname() + this._port() + this.opts.path + this._query(t);
  }
  _hostname() {
    const u = this.opts.hostname;
    return u.indexOf(":") === -1 ? u : "[" + u + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(u) {
    const t = zt(u);
    return t.length ? "?" + t : "";
  }
}
class Qt extends nu {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(u) {
    this.readyState = "pausing";
    const t = () => {
      this.readyState = "paused", u();
    };
    if (this._polling || !this.writable) {
      let n = 0;
      this._polling && (n++, this.once("pollComplete", function() {
        --n || t();
      })), this.writable || (n++, this.once("drain", function() {
        --n || t();
      }));
    } else
      t();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(u) {
    const t = (n) => {
      if (this.readyState === "opening" && n.type === "open" && this.onOpen(), n.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(n);
    };
    Tt(u, this.socket.binaryType).forEach(t), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const u = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? u() : this.once("open", u);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(u) {
    this.writable = !1, St(u, (t) => {
      this.doWrite(t, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const u = this.opts.secure ? "https" : "http", t = this.query || {};
    return this.opts.timestampRequests !== !1 && (t[this.opts.timestampParam] = ju()), !this.supportsBinary && !t.sid && (t.b64 = 1), this.createUri(u, t);
  }
}
let Zu = !1;
try {
  Zu = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Vt = Zu;
function jt() {
}
class Zt extends Qt {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(u) {
    if (super(u), typeof location < "u") {
      const t = location.protocol === "https:";
      let n = location.port;
      n || (n = t ? "443" : "80"), this.xd = typeof location < "u" && u.hostname !== location.hostname || n !== u.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(u, t) {
    const n = this.request({
      method: "POST",
      data: u
    });
    n.on("success", t), n.on("error", (r, i) => {
      this.onError("xhr post error", r, i);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const u = this.request();
    u.on("data", this.onData.bind(this)), u.on("error", (t, n) => {
      this.onError("xhr poll error", t, n);
    }), this.pollXhr = u;
  }
}
class j extends R {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(u, t, n) {
    super(), this.createRequest = u, Te(this, n), this._opts = n, this._method = n.method || "GET", this._uri = t, this._data = n.data !== void 0 ? n.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var u;
    const t = Vu(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    t.xdomain = !!this._opts.xd;
    const n = this._xhr = this.createRequest(t);
    try {
      n.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          n.setDisableHeaderCheck && n.setDisableHeaderCheck(!0);
          for (let r in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(r) && n.setRequestHeader(r, this._opts.extraHeaders[r]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          n.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        n.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (u = this._opts.cookieJar) === null || u === void 0 || u.addCookies(n), "withCredentials" in n && (n.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (n.timeout = this._opts.requestTimeout), n.onreadystatechange = () => {
        var r;
        n.readyState === 3 && ((r = this._opts.cookieJar) === null || r === void 0 || r.parseCookies(
          // @ts-ignore
          n.getResponseHeader("set-cookie")
        )), n.readyState === 4 && (n.status === 200 || n.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof n.status == "number" ? n.status : 0);
        }, 0));
      }, n.send(this._data);
    } catch (r) {
      this.setTimeoutFn(() => {
        this._onError(r);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = j.requestsCount++, j.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(u) {
    this.emitReserved("error", u, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(u) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = jt, u)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete j.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const u = this._xhr.responseText;
    u !== null && (this.emitReserved("data", u), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
j.requestsCount = 0;
j.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", _u);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in N ? "pagehide" : "unload";
    addEventListener(e, _u, !1);
  }
}
function _u() {
  for (let e in j.requests)
    j.requests.hasOwnProperty(e) && j.requests[e].abort();
}
const Wt = function() {
  const e = Wu({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Gt extends Zt {
  constructor(u) {
    super(u);
    const t = u && u.forceBase64;
    this.supportsBinary = Wt && !t;
  }
  request(u = {}) {
    return Object.assign(u, { xd: this.xd }, this.opts), new j(Wu, this.uri(), u);
  }
}
function Wu(e) {
  const u = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!u || Vt))
      return new XMLHttpRequest();
  } catch {
  }
  if (!u)
    try {
      return new N[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const Gu = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Kt extends nu {
  get name() {
    return "websocket";
  }
  doOpen() {
    const u = this.uri(), t = this.opts.protocols, n = Gu ? {} : Vu(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (n.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(u, t, n);
    } catch (r) {
      return this.emitReserved("error", r);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (u) => this.onClose({
      description: "websocket connection closed",
      context: u
    }), this.ws.onmessage = (u) => this.onData(u.data), this.ws.onerror = (u) => this.onError("websocket error", u);
  }
  write(u) {
    this.writable = !1;
    for (let t = 0; t < u.length; t++) {
      const n = u[t], r = t === u.length - 1;
      uu(n, this.supportsBinary, (i) => {
        try {
          this.doWrite(n, i);
        } catch {
        }
        r && Se(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const u = this.opts.secure ? "wss" : "ws", t = this.query || {};
    return this.opts.timestampRequests && (t[this.opts.timestampParam] = ju()), this.supportsBinary || (t.b64 = 1), this.createUri(u, t);
  }
}
const Le = N.WebSocket || N.MozWebSocket;
class Jt extends Kt {
  createSocket(u, t, n) {
    return Gu ? new Le(u, t, n) : t ? new Le(u, t) : new Le(u);
  }
  doWrite(u, t) {
    this.ws.send(t);
  }
}
class Yt extends nu {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (u) {
      return this.emitReserved("error", u);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((u) => {
      this.onError("webtransport error", u);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((u) => {
        const t = Rt(Number.MAX_SAFE_INTEGER, this.socket.binaryType), n = u.readable.pipeThrough(t).getReader(), r = Bt();
        r.readable.pipeTo(u.writable), this._writer = r.writable.getWriter();
        const i = () => {
          n.read().then(({ done: o, value: c }) => {
            o || (this.onPacket(c), i());
          }).catch((o) => {
          });
        };
        i();
        const s = { type: "open" };
        this.query.sid && (s.data = `{"sid":"${this.query.sid}"}`), this._writer.write(s).then(() => this.onOpen());
      });
    });
  }
  write(u) {
    this.writable = !1;
    for (let t = 0; t < u.length; t++) {
      const n = u[t], r = t === u.length - 1;
      this._writer.write(n).then(() => {
        r && Se(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var u;
    (u = this._transport) === null || u === void 0 || u.close();
  }
}
const Xt = {
  websocket: Jt,
  webtransport: Yt,
  polling: Gt
}, $t = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, en = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function Ze(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const u = e, t = e.indexOf("["), n = e.indexOf("]");
  t != -1 && n != -1 && (e = e.substring(0, t) + e.substring(t, n).replace(/:/g, ";") + e.substring(n, e.length));
  let r = $t.exec(e || ""), i = {}, s = 14;
  for (; s--; )
    i[en[s]] = r[s] || "";
  return t != -1 && n != -1 && (i.source = u, i.host = i.host.substring(1, i.host.length - 1).replace(/;/g, ":"), i.authority = i.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), i.ipv6uri = !0), i.pathNames = un(i, i.path), i.queryKey = tn(i, i.query), i;
}
function un(e, u) {
  const t = /\/{2,9}/g, n = u.replace(t, "/").split("/");
  return (u.slice(0, 1) == "/" || u.length === 0) && n.splice(0, 1), u.slice(-1) == "/" && n.splice(n.length - 1, 1), n;
}
function tn(e, u) {
  const t = {};
  return u.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(n, r, i) {
    r && (t[r] = i);
  }), t;
}
const We = typeof addEventListener == "function" && typeof removeEventListener == "function", Ce = [];
We && addEventListener("offline", () => {
  Ce.forEach((e) => e());
}, !1);
class ee extends R {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(u, t) {
    if (super(), this.binaryType = It, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, u && typeof u == "object" && (t = u, u = null), u) {
      const n = Ze(u);
      t.hostname = n.host, t.secure = n.protocol === "https" || n.protocol === "wss", t.port = n.port, n.query && (t.query = n.query);
    } else t.host && (t.hostname = Ze(t.host).host);
    Te(this, t), this.secure = t.secure != null ? t.secure : typeof location < "u" && location.protocol === "https:", t.hostname && !t.port && (t.port = this.secure ? "443" : "80"), this.hostname = t.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = t.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, t.transports.forEach((n) => {
      const r = n.prototype.name;
      this.transports.push(r), this._transportsByName[r] = n;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, t), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = Ut(this.opts.query)), We && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, Ce.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(u) {
    const t = Object.assign({}, this.opts.query);
    t.EIO = Qu, t.transport = u, this.id && (t.sid = this.id);
    const n = Object.assign({}, this.opts, {
      query: t,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[u]);
    return new this._transportsByName[u](n);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const u = this.opts.rememberUpgrade && ee.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const t = this.createTransport(u);
    t.open(), this.setTransport(t);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(u) {
    this.transport && this.transport.removeAllListeners(), this.transport = u, u.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (t) => this._onClose("transport close", t));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", ee.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(u) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", u), this.emitReserved("heartbeat"), u.type) {
        case "open":
          this.onHandshake(JSON.parse(u.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const t = new Error("server error");
          t.code = u.data, this._onError(t);
          break;
        case "message":
          this.emitReserved("data", u.data), this.emitReserved("message", u.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(u) {
    this.emitReserved("handshake", u), this.id = u.sid, this.transport.query.sid = u.sid, this._pingInterval = u.pingInterval, this._pingTimeout = u.pingTimeout, this._maxPayload = u.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const u = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + u, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, u), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const u = this._getWritablePackets();
      this.transport.send(u), this._prevBufferLen = u.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let t = 1;
    for (let n = 0; n < this.writeBuffer.length; n++) {
      const r = this.writeBuffer[n].data;
      if (r && (t += Pt(r)), n > 0 && t > this._maxPayload)
        return this.writeBuffer.slice(0, n);
      t += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const u = Date.now() > this._pingTimeoutTime;
    return u && (this._pingTimeoutTime = 0, Se(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), u;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(u, t, n) {
    return this._sendPacket("message", u, t, n), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(u, t, n) {
    return this._sendPacket("message", u, t, n), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(u, t, n, r) {
    if (typeof t == "function" && (r = t, t = void 0), typeof n == "function" && (r = n, n = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    n = n || {}, n.compress = n.compress !== !1;
    const i = {
      type: u,
      data: t,
      options: n
    };
    this.emitReserved("packetCreate", i), this.writeBuffer.push(i), r && this.once("flush", r), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const u = () => {
      this._onClose("forced close"), this.transport.close();
    }, t = () => {
      this.off("upgrade", t), this.off("upgradeError", t), u();
    }, n = () => {
      this.once("upgrade", t), this.once("upgradeError", t);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? n() : u();
    }) : this.upgrading ? n() : u()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(u) {
    if (ee.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", u), this._onClose("transport error", u);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(u, t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), We && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const n = Ce.indexOf(this._offlineEventListener);
        n !== -1 && Ce.splice(n, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", u, t), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
ee.protocol = Qu;
class nn extends ee {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let u = 0; u < this._upgrades.length; u++)
        this._probe(this._upgrades[u]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(u) {
    let t = this.createTransport(u), n = !1;
    ee.priorWebsocketSuccess = !1;
    const r = () => {
      n || (t.send([{ type: "ping", data: "probe" }]), t.once("packet", (d) => {
        if (!n)
          if (d.type === "pong" && d.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", t), !t)
              return;
            ee.priorWebsocketSuccess = t.name === "websocket", this.transport.pause(() => {
              n || this.readyState !== "closed" && (f(), this.setTransport(t), t.send([{ type: "upgrade" }]), this.emitReserved("upgrade", t), t = null, this.upgrading = !1, this.flush());
            });
          } else {
            const _ = new Error("probe error");
            _.transport = t.name, this.emitReserved("upgradeError", _);
          }
      }));
    };
    function i() {
      n || (n = !0, f(), t.close(), t = null);
    }
    const s = (d) => {
      const _ = new Error("probe error: " + d);
      _.transport = t.name, i(), this.emitReserved("upgradeError", _);
    };
    function o() {
      s("transport closed");
    }
    function c() {
      s("socket closed");
    }
    function l(d) {
      t && d.name !== t.name && i();
    }
    const f = () => {
      t.removeListener("open", r), t.removeListener("error", s), t.removeListener("close", o), this.off("close", c), this.off("upgrading", l);
    };
    t.once("open", r), t.once("error", s), t.once("close", o), this.once("close", c), this.once("upgrading", l), this._upgrades.indexOf("webtransport") !== -1 && u !== "webtransport" ? this.setTimeoutFn(() => {
      n || t.open();
    }, 200) : t.open();
  }
  onHandshake(u) {
    this._upgrades = this._filterUpgrades(u.upgrades), super.onHandshake(u);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(u) {
    const t = [];
    for (let n = 0; n < u.length; n++)
      ~this.transports.indexOf(u[n]) && t.push(u[n]);
    return t;
  }
}
let rn = class extends nn {
  constructor(u, t = {}) {
    const n = typeof u == "object" ? u : t;
    (!n.transports || n.transports && typeof n.transports[0] == "string") && (n.transports = (n.transports || ["polling", "websocket", "webtransport"]).map((r) => Xt[r]).filter((r) => !!r)), super(u, n);
  }
};
function sn(e, u = "", t) {
  let n = e;
  t = t || typeof location < "u" && location, e == null && (e = t.protocol + "//" + t.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = t.protocol + e : e = t.host + e), /^(https?|wss?):\/\//.test(e) || (typeof t < "u" ? e = t.protocol + "//" + e : e = "https://" + e), n = Ze(e)), n.port || (/^(http|ws)$/.test(n.protocol) ? n.port = "80" : /^(http|ws)s$/.test(n.protocol) && (n.port = "443")), n.path = n.path || "/";
  const i = n.host.indexOf(":") !== -1 ? "[" + n.host + "]" : n.host;
  return n.id = n.protocol + "://" + i + ":" + n.port + u, n.href = n.protocol + "://" + i + (t && t.port === n.port ? "" : ":" + n.port), n;
}
const on = typeof ArrayBuffer == "function", cn = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Ku = Object.prototype.toString, an = typeof Blob == "function" || typeof Blob < "u" && Ku.call(Blob) === "[object BlobConstructor]", ln = typeof File == "function" || typeof File < "u" && Ku.call(File) === "[object FileConstructor]";
function ru(e) {
  return on && (e instanceof ArrayBuffer || cn(e)) || an && e instanceof Blob || ln && e instanceof File;
}
function Ee(e, u) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let t = 0, n = e.length; t < n; t++)
      if (Ee(e[t]))
        return !0;
    return !1;
  }
  if (ru(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Ee(e.toJSON(), !0);
  for (const t in e)
    if (Object.prototype.hasOwnProperty.call(e, t) && Ee(e[t]))
      return !0;
  return !1;
}
function fn(e) {
  const u = [], t = e.data, n = e;
  return n.data = Ge(t, u), n.attachments = u.length, { packet: n, buffers: u };
}
function Ge(e, u) {
  if (!e)
    return e;
  if (ru(e)) {
    const t = { _placeholder: !0, num: u.length };
    return u.push(e), t;
  } else if (Array.isArray(e)) {
    const t = new Array(e.length);
    for (let n = 0; n < e.length; n++)
      t[n] = Ge(e[n], u);
    return t;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const t = {};
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (t[n] = Ge(e[n], u));
    return t;
  }
  return e;
}
function dn(e, u) {
  return e.data = Ke(e.data, u), delete e.attachments, e;
}
function Ke(e, u) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < u.length)
      return u[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let t = 0; t < e.length; t++)
      e[t] = Ke(e[t], u);
  else if (typeof e == "object")
    for (const t in e)
      Object.prototype.hasOwnProperty.call(e, t) && (e[t] = Ke(e[t], u));
  return e;
}
const Ju = [
  "connect",
  // used on the client side
  "connect_error",
  // used on the client side
  "disconnect",
  // used on both sides
  "disconnecting",
  // used on the server side
  "newListener",
  // used by the Node.js EventEmitter
  "removeListener"
  // used by the Node.js EventEmitter
], hn = 5;
var v;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(v || (v = {}));
class pn {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(u) {
    this.replacer = u;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(u) {
    return (u.type === v.EVENT || u.type === v.ACK) && Ee(u) ? this.encodeAsBinary({
      type: u.type === v.EVENT ? v.BINARY_EVENT : v.BINARY_ACK,
      nsp: u.nsp,
      data: u.data,
      id: u.id
    }) : [this.encodeAsString(u)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(u) {
    let t = "" + u.type;
    return (u.type === v.BINARY_EVENT || u.type === v.BINARY_ACK) && (t += u.attachments + "-"), u.nsp && u.nsp !== "/" && (t += u.nsp + ","), u.id != null && (t += u.id), u.data != null && (t += JSON.stringify(u.data, this.replacer)), t;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(u) {
    const t = fn(u), n = this.encodeAsString(t.packet), r = t.buffers;
    return r.unshift(n), r;
  }
}
class iu extends R {
  /**
   * Decoder constructor
   */
  constructor(u) {
    super(), this.opts = Object.assign({
      reviver: void 0,
      maxAttachments: 10
    }, typeof u == "function" ? { reviver: u } : u);
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(u) {
    let t;
    if (typeof u == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      t = this.decodeString(u);
      const n = t.type === v.BINARY_EVENT;
      n || t.type === v.BINARY_ACK ? (t.type = n ? v.EVENT : v.ACK, this.reconstructor = new bn(t), t.attachments === 0 && super.emitReserved("decoded", t)) : super.emitReserved("decoded", t);
    } else if (ru(u) || u.base64)
      if (this.reconstructor)
        t = this.reconstructor.takeBinaryData(u), t && (this.reconstructor = null, super.emitReserved("decoded", t));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + u);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(u) {
    let t = 0;
    const n = {
      type: Number(u.charAt(0))
    };
    if (v[n.type] === void 0)
      throw new Error("unknown packet type " + n.type);
    if (n.type === v.BINARY_EVENT || n.type === v.BINARY_ACK) {
      const i = t + 1;
      for (; u.charAt(++t) !== "-" && t != u.length; )
        ;
      const s = u.substring(i, t);
      if (s != Number(s) || u.charAt(t) !== "-")
        throw new Error("Illegal attachments");
      const o = Number(s);
      if (!Yu(o) || o < 0)
        throw new Error("Illegal attachments");
      if (o > this.opts.maxAttachments)
        throw new Error("too many attachments");
      n.attachments = o;
    }
    if (u.charAt(t + 1) === "/") {
      const i = t + 1;
      for (; ++t && !(u.charAt(t) === "," || t === u.length); )
        ;
      n.nsp = u.substring(i, t);
    } else
      n.nsp = "/";
    const r = u.charAt(t + 1);
    if (r !== "" && Number(r) == r) {
      const i = t + 1;
      for (; ++t; ) {
        const s = u.charAt(t);
        if (s == null || Number(s) != s) {
          --t;
          break;
        }
        if (t === u.length)
          break;
      }
      n.id = Number(u.substring(i, t + 1));
    }
    if (u.charAt(++t)) {
      const i = this.tryParse(u.substr(t));
      if (iu.isPayloadValid(n.type, i))
        n.data = i;
      else
        throw new Error("invalid payload");
    }
    return n;
  }
  tryParse(u) {
    try {
      return JSON.parse(u, this.opts.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(u, t) {
    switch (u) {
      case v.CONNECT:
        return Ae(t);
      case v.DISCONNECT:
        return t === void 0;
      case v.CONNECT_ERROR:
        return typeof t == "string" || Ae(t);
      case v.EVENT:
      case v.BINARY_EVENT:
        return Array.isArray(t) && (typeof t[0] == "number" || typeof t[0] == "string" && Ju.indexOf(t[0]) === -1);
      case v.ACK:
      case v.BINARY_ACK:
        return Array.isArray(t);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class bn {
  constructor(u) {
    this.packet = u, this.buffers = [], this.reconPack = u;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(u) {
    if (this.buffers.push(u), this.buffers.length === this.reconPack.attachments) {
      const t = dn(this.reconPack, this.buffers);
      return this.finishedReconstruction(), t;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
function mn(e) {
  return typeof e == "string";
}
const Yu = Number.isInteger || function(e) {
  return typeof e == "number" && isFinite(e) && Math.floor(e) === e;
};
function _n(e) {
  return e === void 0 || Yu(e);
}
function Ae(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function gn(e, u) {
  switch (e) {
    case v.CONNECT:
      return u === void 0 || Ae(u);
    case v.DISCONNECT:
      return u === void 0;
    case v.EVENT:
      return Array.isArray(u) && (typeof u[0] == "number" || typeof u[0] == "string" && Ju.indexOf(u[0]) === -1);
    case v.ACK:
      return Array.isArray(u);
    case v.CONNECT_ERROR:
      return typeof u == "string" || Ae(u);
    default:
      return !1;
  }
}
function xn(e) {
  return mn(e.nsp) && _n(e.id) && gn(e.type, e.data);
}
const kn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: iu,
  Encoder: pn,
  get PacketType() {
    return v;
  },
  isPacketValid: xn,
  protocol: hn
}, Symbol.toStringTag, { value: "Module" }));
function U(e, u, t) {
  return e.on(u, t), function() {
    e.off(u, t);
  };
}
const yn = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class Xu extends R {
  /**
   * `Socket` constructor.
   */
  constructor(u, t, n) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = u, this.nsp = t, n && n.auth && (this.auth = n.auth), this._opts = Object.assign({}, n), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const u = this.io;
    this.subs = [
      U(u, "open", this.onopen.bind(this)),
      U(u, "packet", this.onpacket.bind(this)),
      U(u, "error", this.onerror.bind(this)),
      U(u, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...u) {
    return u.unshift("message"), this.emit.apply(this, u), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(u, ...t) {
    var n, r, i;
    if (yn.hasOwnProperty(u))
      throw new Error('"' + u.toString() + '" is a reserved event name');
    if (t.unshift(u), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(t), this;
    const s = {
      type: v.EVENT,
      data: t
    };
    if (s.options = {}, s.options.compress = this.flags.compress !== !1, typeof t[t.length - 1] == "function") {
      const f = this.ids++, d = t.pop();
      this._registerAckCallback(f, d), s.id = f;
    }
    const o = (r = (n = this.io.engine) === null || n === void 0 ? void 0 : n.transport) === null || r === void 0 ? void 0 : r.writable, c = this.connected && !(!((i = this.io.engine) === null || i === void 0) && i._hasPingExpired());
    return this.flags.volatile && !o || (c ? (this.notifyOutgoingListeners(s), this.packet(s)) : this.sendBuffer.push(s)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(u, t) {
    var n;
    const r = (n = this.flags.timeout) !== null && n !== void 0 ? n : this._opts.ackTimeout;
    if (r === void 0) {
      this.acks[u] = t;
      return;
    }
    const i = this.io.setTimeoutFn(() => {
      delete this.acks[u];
      for (let o = 0; o < this.sendBuffer.length; o++)
        this.sendBuffer[o].id === u && this.sendBuffer.splice(o, 1);
      t.call(this, new Error("operation has timed out"));
    }, r), s = (...o) => {
      this.io.clearTimeoutFn(i), t.apply(this, o);
    };
    s.withError = !0, this.acks[u] = s;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(u, ...t) {
    return new Promise((n, r) => {
      const i = (s, o) => s ? r(s) : n(o);
      i.withError = !0, t.push(i), this.emit(u, ...t);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(u) {
    let t;
    typeof u[u.length - 1] == "function" && (t = u.pop());
    const n = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: u,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    u.push((r, ...i) => (this._queue[0], r !== null ? n.tryCount > this._opts.retries && (this._queue.shift(), t && t(r)) : (this._queue.shift(), t && t(null, ...i)), n.pending = !1, this._drainQueue())), this._queue.push(n), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(u = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const t = this._queue[0];
    t.pending && !u || (t.pending = !0, t.tryCount++, this.flags = t.flags, this.emit.apply(this, t.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(u) {
    u.nsp = this.nsp, this.io._packet(u);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((u) => {
      this._sendConnectPacket(u);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(u) {
    this.packet({
      type: v.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, u) : u
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(u) {
    this.connected || this.emitReserved("connect_error", u);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(u, t) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", u, t), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((u) => {
      if (!this.sendBuffer.some((n) => String(n.id) === u)) {
        const n = this.acks[u];
        delete this.acks[u], n.withError && n.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(u) {
    if (u.nsp === this.nsp)
      switch (u.type) {
        case v.CONNECT:
          u.data && u.data.sid ? this.onconnect(u.data.sid, u.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case v.EVENT:
        case v.BINARY_EVENT:
          this.onevent(u);
          break;
        case v.ACK:
        case v.BINARY_ACK:
          this.onack(u);
          break;
        case v.DISCONNECT:
          this.ondisconnect();
          break;
        case v.CONNECT_ERROR:
          this.destroy();
          const n = new Error(u.data.message);
          n.data = u.data.data, this.emitReserved("connect_error", n);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(u) {
    const t = u.data || [];
    u.id != null && t.push(this.ack(u.id)), this.connected ? this.emitEvent(t) : this.receiveBuffer.push(Object.freeze(t));
  }
  emitEvent(u) {
    if (this._anyListeners && this._anyListeners.length) {
      const t = this._anyListeners.slice();
      for (const n of t)
        n.apply(this, u);
    }
    super.emit.apply(this, u), this._pid && u.length && typeof u[u.length - 1] == "string" && (this._lastOffset = u[u.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(u) {
    const t = this;
    let n = !1;
    return function(...r) {
      n || (n = !0, t.packet({
        type: v.ACK,
        id: u,
        data: r
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(u) {
    const t = this.acks[u.id];
    typeof t == "function" && (delete this.acks[u.id], t.withError && u.data.unshift(null), t.apply(this, u.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(u, t) {
    this.id = u, this.recovered = t && this._pid === t, this._pid = t, this.connected = !0, this.emitBuffered(), this._drainQueue(!0), this.emitReserved("connect");
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((u) => this.emitEvent(u)), this.receiveBuffer = [], this.sendBuffer.forEach((u) => {
      this.notifyOutgoingListeners(u), this.packet(u);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((u) => u()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: v.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(u) {
    return this.flags.compress = u, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(u) {
    return this.flags.timeout = u, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(u) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(u), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(u) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(u), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(u) {
    if (!this._anyListeners)
      return this;
    if (u) {
      const t = this._anyListeners;
      for (let n = 0; n < t.length; n++)
        if (u === t[n])
          return t.splice(n, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(u) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(u), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(u) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(u), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(u) {
    if (!this._anyOutgoingListeners)
      return this;
    if (u) {
      const t = this._anyOutgoingListeners;
      for (let n = 0; n < t.length; n++)
        if (u === t[n])
          return t.splice(n, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(u) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const t = this._anyOutgoingListeners.slice();
      for (const n of t)
        n.apply(this, u.data);
    }
  }
}
function se(e) {
  e = e || {}, this.ms = e.min || 100, this.max = e.max || 1e4, this.factor = e.factor || 2, this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0, this.attempts = 0;
}
se.prototype.duration = function() {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var u = Math.random(), t = Math.floor(u * this.jitter * e);
    e = Math.floor(u * 10) & 1 ? e + t : e - t;
  }
  return Math.min(e, this.max) | 0;
};
se.prototype.reset = function() {
  this.attempts = 0;
};
se.prototype.setMin = function(e) {
  this.ms = e;
};
se.prototype.setMax = function(e) {
  this.max = e;
};
se.prototype.setJitter = function(e) {
  this.jitter = e;
};
class Je extends R {
  constructor(u, t) {
    var n;
    super(), this.nsps = {}, this.subs = [], u && typeof u == "object" && (t = u, u = void 0), t = t || {}, t.path = t.path || "/socket.io", this.opts = t, Te(this, t), this.reconnection(t.reconnection !== !1), this.reconnectionAttempts(t.reconnectionAttempts || 1 / 0), this.reconnectionDelay(t.reconnectionDelay || 1e3), this.reconnectionDelayMax(t.reconnectionDelayMax || 5e3), this.randomizationFactor((n = t.randomizationFactor) !== null && n !== void 0 ? n : 0.5), this.backoff = new se({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(t.timeout == null ? 2e4 : t.timeout), this._readyState = "closed", this.uri = u;
    const r = t.parser || kn;
    this.encoder = new r.Encoder(), this.decoder = new r.Decoder(), this._autoConnect = t.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(u) {
    return arguments.length ? (this._reconnection = !!u, u || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(u) {
    return u === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = u, this);
  }
  reconnectionDelay(u) {
    var t;
    return u === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = u, (t = this.backoff) === null || t === void 0 || t.setMin(u), this);
  }
  randomizationFactor(u) {
    var t;
    return u === void 0 ? this._randomizationFactor : (this._randomizationFactor = u, (t = this.backoff) === null || t === void 0 || t.setJitter(u), this);
  }
  reconnectionDelayMax(u) {
    var t;
    return u === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = u, (t = this.backoff) === null || t === void 0 || t.setMax(u), this);
  }
  timeout(u) {
    return arguments.length ? (this._timeout = u, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(u) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new rn(this.uri, this.opts);
    const t = this.engine, n = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const r = U(t, "open", function() {
      n.onopen(), u && u();
    }), i = (o) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", o), u ? u(o) : this.maybeReconnectOnOpen();
    }, s = U(t, "error", i);
    if (this._timeout !== !1) {
      const o = this._timeout, c = this.setTimeoutFn(() => {
        r(), i(new Error("timeout")), t.close();
      }, o);
      this.opts.autoUnref && c.unref(), this.subs.push(() => {
        this.clearTimeoutFn(c);
      });
    }
    return this.subs.push(r), this.subs.push(s), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(u) {
    return this.open(u);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const u = this.engine;
    this.subs.push(
      U(u, "ping", this.onping.bind(this)),
      U(u, "data", this.ondata.bind(this)),
      U(u, "error", this.onerror.bind(this)),
      U(u, "close", this.onclose.bind(this)),
      // @ts-ignore
      U(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(u) {
    try {
      this.decoder.add(u);
    } catch (t) {
      this.onclose("parse error", t);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(u) {
    Se(() => {
      this.emitReserved("packet", u);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(u) {
    this.emitReserved("error", u);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(u, t) {
    let n = this.nsps[u];
    return n ? this._autoConnect && !n.active && n.connect() : (n = new Xu(this, u, t), this.nsps[u] = n), n;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(u) {
    const t = Object.keys(this.nsps);
    for (const n of t)
      if (this.nsps[n].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(u) {
    const t = this.encoder.encode(u);
    for (let n = 0; n < t.length; n++)
      this.engine.write(t[n], u.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((u) => u()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(u, t) {
    var n;
    this.cleanup(), (n = this.engine) === null || n === void 0 || n.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", u, t), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const u = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const t = this.backoff.duration();
      this._reconnecting = !0;
      const n = this.setTimeoutFn(() => {
        u.skipReconnect || (this.emitReserved("reconnect_attempt", u.backoff.attempts), !u.skipReconnect && u.open((r) => {
          r ? (u._reconnecting = !1, u.reconnect(), this.emitReserved("reconnect_error", r)) : u.onreconnect();
        }));
      }, t);
      this.opts.autoUnref && n.unref(), this.subs.push(() => {
        this.clearTimeoutFn(n);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const u = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", u);
  }
}
const ce = {};
function we(e, u) {
  typeof e == "object" && (u = e, e = void 0), u = u || {};
  const t = sn(e, u.path || "/socket.io"), n = t.source, r = t.id, i = t.path, s = ce[r] && i in ce[r].nsps, o = u.forceNew || u["force new connection"] || u.multiplex === !1 || s;
  let c;
  return o ? c = new Je(n, u) : (ce[r] || (ce[r] = new Je(n, u)), c = ce[r]), t.query && !u.query && (u.query = t.queryKey), c.socket(t.path, u);
}
Object.assign(we, {
  Manager: Je,
  Socket: Xu,
  io: we,
  connect: we
});
class Vi {
  constructor(u) {
    this.socket = null, this.currentCallbacks = null, this.accumulatedText = "", this.publicQuestionHandler = null, this.isConnecting = !1, this.baseUrl = u.baseUrl.replace(/\/+$/, ""), this.sessionId = u.sessionId, this.realtime = u.realtime, this.reconnectAttempts = u.reconnectAttempts ?? 5, this.reconnectBaseDelay = u.reconnectBaseDelay ?? 1e3, this.reconnectMaxDelay = u.reconnectMaxDelay ?? 3e4, this.commandAckTimeoutMs = u.commandAckTimeoutMs ?? 8e3;
  }
  errorMessage(u) {
    return u instanceof Error ? u.message : String(u);
  }
  createCommandId() {
    return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  async init() {
    var u;
    if (!((u = this.socket) != null && u.connected)) {
      if (this.isConnecting)
        return new Promise((t, n) => {
          const r = () => {
            var i;
            if ((i = this.socket) != null && i.connected) {
              t();
              return;
            }
            if (!this.isConnecting) {
              n(new Error("Socket.IO connection failed"));
              return;
            }
            setTimeout(r, 100);
          };
          r();
        });
      await this.connect();
    }
  }
  async connect() {
    if (this.isConnecting)
      return;
    this.isConnecting = !0;
    const u = we(`${this.baseUrl}${this.realtime.namespace}`, {
      path: this.realtime.path,
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: this.reconnectAttempts,
      reconnectionDelay: this.reconnectBaseDelay,
      reconnectionDelayMax: this.reconnectMaxDelay,
      auth: {
        sessionId: this.sessionId,
        token: this.realtime.auth.token
      },
      autoConnect: !1
    });
    this.bindSocketHandlers(u), this.socket = u, await new Promise((t, n) => {
      const r = () => {
        this.isConnecting = !1, s(), t();
      }, i = (o) => {
        this.isConnecting = !1, s(), n(o);
      }, s = () => {
        u.off("connect", r), u.off("connect_error", i);
      };
      u.on("connect", r), u.on("connect_error", i), u.connect();
    });
  }
  bindSocketHandlers(u) {
    u.on("session.snapshot", (t) => {
    }), u.on("assistant.delta", (t) => {
      this.handleAssistantDelta(t);
    }), u.on("assistant.done", (t) => {
      this.handleAssistantDone();
    }), u.on("assistant.error", (t) => {
      this.handleAssistantError(t);
    }), u.on("question.ask", (t) => {
      this.handleQuestionAsk(t);
    }), u.on("disconnect", (t) => {
    });
  }
  assertConnectedSocket() {
    if (!this.socket || !this.socket.connected)
      throw new Error("Socket.IO is not connected");
    return this.socket;
  }
  async emitCommandWithAck(u, t) {
    const n = this.assertConnectedSocket();
    return new Promise((r, i) => {
      n.timeout(this.commandAckTimeoutMs).emit(
        u,
        t,
        (s, o) => {
          if (s) {
            i(s);
            return;
          }
          r(o);
        }
      );
    });
  }
  async requireAcceptedAck(u, t) {
    var i, s;
    const n = await this.emitCommandWithAck(u, t);
    if (n.status === "accepted")
      return n;
    const r = new Error(((i = n.error) == null ? void 0 : i.message) ?? `${u} command rejected`);
    throw r.code = (s = n.error) == null ? void 0 : s.code, r;
  }
  handleAssistantDelta(u) {
    this.currentCallbacks && u.payload.kind === "text" && (this.accumulatedText += u.payload.delta, this.currentCallbacks.onChunk(this.accumulatedText));
  }
  handleAssistantDone() {
    this.currentCallbacks && (this.currentCallbacks.onComplete(), this.clearCurrentTurn());
  }
  handleAssistantError(u) {
    var n;
    const t = new Error(u.payload.errorMessage || "Unknown assistant error");
    t.code = u.payload.errorCode, (n = this.currentCallbacks) == null || n.onError(t), this.clearCurrentTurn();
  }
  async handleQuestionAsk(u) {
    var n;
    const t = (n = this.currentCallbacks) != null && n.onQuestion ? (r) => {
      var i, s;
      return (s = (i = this.currentCallbacks) == null ? void 0 : i.onQuestion) == null ? void 0 : s.call(i, r);
    } : this.publicQuestionHandler ? (r) => {
      var i;
      return (i = this.publicQuestionHandler) == null ? void 0 : i.call(this, r, { autoFocus: !1 });
    } : null;
    if (!t) {
      await this.sendQuestionAnswer(u.payload.questionId, []);
      return;
    }
    try {
      const r = await t(u.payload.request) ?? [];
      await this.sendQuestionAnswer(u.payload.questionId, r);
    } catch {
      await this.sendQuestionAnswer(u.payload.questionId, []);
    }
  }
  async sendQuestionAnswer(u, t) {
    const n = {
      commandId: this.createCommandId(),
      questionId: u,
      answers: t
    };
    await this.requireAcceptedAck("question.answer", n);
  }
  clearCurrentTurn() {
    this.currentCallbacks = null, this.accumulatedText = "";
  }
  async sendMessage(u, t) {
    var r;
    (r = this.socket) != null && r.connected || await this.init(), this.currentCallbacks = t, this.accumulatedText = "";
    const n = {
      commandId: this.createCommandId(),
      content: u.message
    };
    try {
      await this.requireAcceptedAck("prompt.send", n);
    } catch (i) {
      throw this.clearCurrentTurn(), i;
    }
  }
  cancel() {
    var t;
    if (!((t = this.socket) != null && t.connected)) {
      this.clearCurrentTurn();
      return;
    }
    const u = {
      commandId: this.createCommandId(),
      reason: "user_cancelled"
    };
    this.requireAcceptedAck("prompt.cancel", u).finally(() => {
      this.clearCurrentTurn();
    });
  }
  async updateSessionInfo(u) {
    var n;
    (n = this.socket) != null && n.connected || await this.init();
    const t = {
      commandId: this.createCommandId(),
      sessionInfo: u
    };
    await this.requireAcceptedAck("session.update", t);
  }
  setPublicQuestionHandler(u) {
    this.publicQuestionHandler = u;
  }
  async showQuestion(u, t) {
    if (!this.publicQuestionHandler)
      throw new Error(
        "No question handler is registered. Mount ChatWidget with this adapter first."
      );
    return this.publicQuestionHandler(u, t);
  }
  disconnect() {
    this.socket && (this.socket.disconnect(), this.socket = null), this.isConnecting = !1, this.clearCurrentTurn();
  }
  getSlashCommands() {
    return [{ name: "new", description: "Start a new conversation" }];
  }
  async newSession() {
    this.disconnect();
  }
}
const Ye = "Welcome to Audako MCP Chat. How can I assist you today?", gu = "Audako Assistant", Cn = (e) => ({
  text: e.trim(),
  attachments: []
}), $u = (e = 0) => (Date.now() + e).toString(), xu = (e, u = "1") => ({
  id: u,
  from: "system",
  text: e,
  timestamp: /* @__PURE__ */ new Date()
}), En = (e) => ({
  id: $u(),
  from: "user",
  text: e,
  timestamp: /* @__PURE__ */ new Date()
}), wn = (e) => ({
  id: e,
  from: "assistant",
  text: "",
  timestamp: /* @__PURE__ */ new Date(),
  isStreaming: !0
}), An = (e) => e.label, Dn = ({ getConfig: e, getShowThinking: u, scrollToBottom: t }) => {
  const n = a.proxy({
    messages: [],
    draft: "",
    isTyping: !1,
    streamingMessageId: null,
    pendingQuestion: null,
    selectedQuestionAnswers: [],
    shouldFocusQuestion: !1
  });
  let r = null, i = null, s = null, o = !1;
  const c = (...b) => {
    console.log("[chat-ui]", ...b);
  }, l = () => {
    n.pendingQuestion = null, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = !1, r = null;
  }, f = (b) => {
    const m = r;
    l(), m == null || m(b);
  }, d = (b, m = !1) => (r && r([]), n.pendingQuestion = b, n.selectedQuestionAnswers = [], n.shouldFocusQuestion = m, new Promise((A) => {
    r = A;
  })), _ = (b, m) => {
    const A = n.messages.findIndex((F) => F.id === b);
    A !== -1 && (n.messages[A] = m(n.messages[A]), n.messages = [...n.messages]);
  };
  return {
    state: n,
    syncConfig: () => {
      var A, F, O, K;
      const b = e(), m = b == null ? void 0 : b.adapter;
      if (c("config resolved", {
        title: b == null ? void 0 : b.title,
        hasAdapter: !!(b != null && b.adapter),
        adapterType: (F = (A = b == null ? void 0 : b.adapter) == null ? void 0 : A.constructor) == null ? void 0 : F.name,
        hasInitialMessage: !!(b != null && b.initialMessage)
      }), s && s !== m && ((O = s.setPublicQuestionHandler) == null || O.call(s, null), s = null), m && s !== m) {
        const S = (M, B) => d(M, (B == null ? void 0 : B.autoFocus) ?? !1);
        (K = m.setPublicQuestionHandler) == null || K.call(m, S), s = m;
      }
      m && typeof m.init == "function" && m !== i && (i = m, c("initializing adapter"), m.init().catch((S) => {
        console.error("Failed to initialize adapter:", S);
      })), o || (o = !0, n.messages = [
        xu((b == null ? void 0 : b.initialMessage) ?? Ye)
      ]);
    },
    setDraft: (b) => {
      n.draft = b;
    },
    sendMessage: async () => {
      var K;
      const b = e(), m = Cn(n.draft);
      if (c("sendMessage called", {
        draftLength: n.draft.length,
        isDraftEmpty: !m.text,
        hasStreamingMessage: !!n.streamingMessageId,
        hasAdapter: !!(b != null && b.adapter),
        attachmentCount: m.attachments.length
      }), !m.text || n.streamingMessageId || !(b != null && b.adapter)) {
        c("sendMessage aborted", {
          reason: {
            emptyDraft: !m.text,
            streamingInProgress: !!n.streamingMessageId,
            missingAdapter: !(b != null && b.adapter)
          }
        });
        return;
      }
      const A = En(m.text);
      n.messages = [...n.messages, A], c("user message appended", {
        messageId: A.id,
        totalMessages: n.messages.length
      }), n.draft = "", t();
      const F = $u(1), O = wn(F);
      n.messages = [...n.messages, O], n.streamingMessageId = F, c("assistant streaming message created", {
        messageId: F,
        historyLength: n.messages.filter((S) => S.from !== "system").length,
        adapterType: (K = b.adapter.constructor) == null ? void 0 : K.name
      }), t();
      try {
        c("calling adapter.sendMessage"), await b.adapter.sendMessage(
          {
            message: m.text,
            conversationHistory: n.messages.filter((S) => S.from !== "system")
          },
          {
            onChunk: (S) => {
              c("adapter chunk received", { messageId: F, chunkLength: S.length }), _(F, (M) => ({ ...M, text: S })), t();
            },
            onThinking: (S) => {
              u() && (c("adapter thinking chunk received", { messageId: F, chunkLength: S.length }), _(F, (M) => ({ ...M, thinking: { content: S, isStreaming: !0 } })), t());
            },
            onQuestion: async (S) => {
              var J;
              c("adapter question received", {
                optionCount: ((J = S.options) == null ? void 0 : J.length) ?? 0,
                allowMultiple: !!S.allowMultiple
              });
              const M = typeof document < "u" ? document.activeElement : null, B = M instanceof HTMLElement && !!M.closest(".chat-widget__composer");
              return d(S, B);
            },
            onComplete: () => {
              c("adapter stream completed", { messageId: F }), _(F, (S) => ({
                ...S,
                isStreaming: !1,
                thinking: u() && S.thinking ? { ...S.thinking, isStreaming: !1 } : void 0
              })), l(), n.streamingMessageId = null, t();
            },
            onError: (S) => {
              c("adapter stream errored", { messageId: F, errorMessage: S.message }), console.error("Chat error:", S), _(F, (M) => ({
                ...M,
                text: `Error: ${S.message}`,
                isStreaming: !1
              })), l(), n.streamingMessageId = null, t();
            }
          }
        ), c("adapter.sendMessage resolved", { messageId: F });
      } catch (S) {
        c("adapter.sendMessage threw", {
          messageId: F,
          errorMessage: S instanceof Error ? S.message : "Unknown error"
        }), console.error("Unexpected error:", S), _(F, (M) => ({
          ...M,
          text: "Unexpected error occurred",
          isStreaming: !1
        })), l(), n.streamingMessageId = null, t();
      }
    },
    cancelMessage: () => {
      var A, F;
      const b = e(), m = n.streamingMessageId;
      m && (c("cancelMessage called", { messageId: m }), (F = (A = b == null ? void 0 : b.adapter) == null ? void 0 : A.cancel) == null || F.call(A), _(m, (O) => ({
        ...O,
        isStreaming: !1,
        thinking: O.thinking ? { ...O.thinking, isStreaming: !1 } : void 0
      })), l(), n.streamingMessageId = null, n.isTyping = !1);
    },
    toggleQuestionAnswer: (b) => {
      if (n.pendingQuestion) {
        if (!n.pendingQuestion.allowMultiple) {
          f([b]);
          return;
        }
        n.selectedQuestionAnswers.includes(b) ? n.selectedQuestionAnswers = n.selectedQuestionAnswers.filter((m) => m !== b) : n.selectedQuestionAnswers = [...n.selectedQuestionAnswers, b];
      }
    },
    submitQuestionAnswers: () => {
      var b;
      !((b = n.pendingQuestion) != null && b.allowMultiple) || n.selectedQuestionAnswers.length === 0 || f(n.selectedQuestionAnswers);
    },
    submitCustomAnswer: (b) => {
      !n.pendingQuestion || !b || f([b]);
    },
    clearQuestionFocusRequest: () => {
      n.shouldFocusQuestion = !1;
    },
    getSlashCommands: () => {
      var m, A;
      const b = e();
      return ((A = (m = b == null ? void 0 : b.adapter) == null ? void 0 : m.getSlashCommands) == null ? void 0 : A.call(m)) ?? [];
    },
    executeSlashCommand: async (b) => {
      var A, F;
      const m = e();
      c("executeSlashCommand called", { commandName: b }), b === "new" && (await ((F = (A = m == null ? void 0 : m.adapter) == null ? void 0 : A.newSession) == null ? void 0 : F.call(A)), o = !1, n.messages = [], n.draft = "", n.isTyping = !1, n.streamingMessageId = null, l(), o = !0, n.messages = [
        xu((m == null ? void 0 : m.initialMessage) ?? Ye)
      ], c("new session started"));
    }
  };
};
var vn = a.from_html('<h2 class="chat-widget__header-title svelte-hbwy0v"> </h2>'), Fn = a.from_html('<header class="chat-widget__header svelte-hbwy0v"><div><!></div></header>');
function Sn(e, u) {
  var t = Fn(), n = a.child(t), r = a.child(n);
  {
    var i = (o) => {
      var c = a.comment(), l = a.first_child(c);
      a.snippet(l, () => u.header, () => u.title), a.append(o, c);
    }, s = (o) => {
      var c = vn(), l = a.child(c, !0);
      a.reset(c), a.template_effect(() => a.set_text(l, u.title)), a.append(o, c);
    };
    a.if(r, (o) => {
      u.header ? o(i) : o(s, !1);
    });
  }
  a.reset(n), a.reset(t), a.append(e, t);
}
var Tn = a.from_html('<button type="button"><span class="chat-widget__slash-name svelte-u1oxqp"> </span> <span class="chat-widget__slash-desc svelte-u1oxqp"> </span></button>'), Bn = a.from_html('<div class="chat-widget__slash-menu svelte-u1oxqp"></div>');
function Rn(e, u) {
  a.push(u, !0);
  var t = Bn();
  a.each(t, 21, () => u.commands, a.index, (n, r, i) => {
    var s = Tn();
    let o;
    s.__click = () => u.onSelect(a.get(r));
    var c = a.child(s), l = a.child(c);
    a.reset(c);
    var f = a.sibling(c, 2), d = a.child(f, !0);
    a.reset(f), a.reset(s), a.template_effect(() => {
      o = a.set_class(s, 1, "chat-widget__slash-item svelte-u1oxqp", null, o, {
        "chat-widget__slash-item--selected": i === u.selectedIndex
      }), a.set_text(l, `/${a.get(r).name ?? ""}`), a.set_text(d, a.get(r).description);
    }), a.append(n, s);
  }), a.reset(t), a.append(e, t), a.pop();
}
a.delegate(["click"]);
var qn = a.from_html('<div class="chat-widget__slash-menu-anchor svelte-1m0eido"><!></div>'), In = a.from_html('<div class="chat-widget__composer-wrap svelte-1m0eido"><!> <!></div>');
function Mn(e, u) {
  a.push(u, !0);
  let t = a.prop(u, "isStreaming", 3, !1), n = a.prop(u, "slashCommands", 19, () => []), r = a.state(void 0), i = a.state(void 0), s = a.state(0), o = !1;
  const c = a.derived(() => u.draft.startsWith("/") ? u.draft.slice(1).toLowerCase() : null), l = a.derived(() => a.get(c) !== null ? n().filter((x) => x.name.toLowerCase().startsWith(a.get(c))) : []), f = a.derived(() => a.get(c) !== null && a.get(l).length > 0), d = () => {
    var x;
    (x = a.get(i)) == null || x.focus();
  }, _ = (x) => {
    var b;
    (b = u.onSlashCommand) == null || b.call(u, x), u.onDraftChange(""), requestAnimationFrame(d);
  }, p = (x) => {
    u.onDraftChange(x);
  }, h = (x, b) => {
    if (a.get(f)) {
      const m = a.get(l)[a.get(s)];
      m && _(m);
      return;
    }
    !u.draft.trim() || u.disabled || u.onSubmit();
  }, y = (x) => {
    const b = x;
    if (!(b.isComposing || !a.get(f))) {
      if (b.key === "ArrowDown") {
        b.preventDefault(), b.stopImmediatePropagation(), a.set(s, (a.get(s) + 1) % a.get(l).length);
        return;
      }
      if (b.key === "ArrowUp") {
        b.preventDefault(), b.stopImmediatePropagation(), a.set(s, (a.get(s) - 1 + a.get(l).length) % a.get(l).length);
        return;
      }
      if (b.key === "Tab") {
        const m = a.get(l)[a.get(s)];
        if (!m)
          return;
        b.preventDefault(), b.stopImmediatePropagation(), u.onDraftChange(`/${m.name}`);
        return;
      }
      b.key === "Escape" && (b.preventDefault(), b.stopImmediatePropagation(), u.onDraftChange(""));
    }
  }, w = () => {
    a.get(i) && (a.get(i).removeEventListener("keydown", y, !0), a.set(i, void 0));
  }, D = (x, b) => {
    var A;
    const m = ((A = a.get(r)) == null ? void 0 : A.querySelector("textarea")) ?? void 0;
    if (!m) {
      w();
      return;
    }
    a.get(i) !== m && (w(), a.set(i, m, !0), a.get(i).addEventListener("keydown", y, !0)), a.get(i).classList.add("chat-widget__input"), a.get(i).disabled = b, a.get(i).placeholder = x, o || (o = !0, requestAnimationFrame(() => {
      typeof document < "u" && document.activeElement === a.get(i) && a.get(i).blur();
    }));
  };
  a.user_effect(() => {
    a.get(l), a.set(s, 0);
  }), a.user_effect(() => {
    if (!a.get(r)) {
      w();
      return;
    }
    a.get(r).value !== u.draft && (a.get(r).value = u.draft), a.get(r).isStreaming = t(), a.get(r).showAttachmentButton = !1, a.get(r).showModelSelector = !1, a.get(r).showThinkingSelector = !1, a.get(r).onInput = p, a.get(r).onSend = h, a.get(r).onAbort = u.onCancel;
    const x = u.placeholder, b = u.disabled;
    queueMicrotask(() => {
      D(x, b);
    });
  }), a.user_effect(() => () => {
    w();
  });
  var k = In(), E = a.child(k);
  {
    var C = (x) => {
      var b = qn(), m = a.child(b);
      Rn(m, {
        get commands() {
          return a.get(l);
        },
        get selectedIndex() {
          return a.get(s);
        },
        onSelect: _
      }), a.reset(b), a.append(x, b);
    };
    a.if(E, (x) => {
      a.get(f) && x(C);
    });
  }
  var g = a.sibling(E, 2);
  a.element(g, () => "message-editor", !1, (x, b) => {
    a.bind_this(x, (m) => a.set(r, m, !0), () => a.get(r)), a.set_class(x, 0, "chat-widget__composer svelte-1m0eido");
  }), a.reset(k), a.append(e, k), a.pop();
}
const ku = {};
function On(e) {
  let u = ku[e];
  if (u)
    return u;
  u = ku[e] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    u.push(n);
  }
  for (let t = 0; t < e.length; t++) {
    const n = e.charCodeAt(t);
    u[n] = "%" + ("0" + n.toString(16).toUpperCase()).slice(-2);
  }
  return u;
}
function re(e, u) {
  typeof u != "string" && (u = re.defaultChars);
  const t = On(u);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(n) {
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
          const l = o << 6 & 1984 | c & 63;
          l < 128 ? r += "��" : r += String.fromCharCode(l), i += 3;
          continue;
        }
      }
      if ((o & 240) === 224 && i + 6 < s) {
        const c = parseInt(n.slice(i + 4, i + 6), 16), l = parseInt(n.slice(i + 7, i + 9), 16);
        if ((c & 192) === 128 && (l & 192) === 128) {
          const f = o << 12 & 61440 | c << 6 & 4032 | l & 63;
          f < 2048 || f >= 55296 && f <= 57343 ? r += "���" : r += String.fromCharCode(f), i += 6;
          continue;
        }
      }
      if ((o & 248) === 240 && i + 9 < s) {
        const c = parseInt(n.slice(i + 4, i + 6), 16), l = parseInt(n.slice(i + 7, i + 9), 16), f = parseInt(n.slice(i + 10, i + 12), 16);
        if ((c & 192) === 128 && (l & 192) === 128 && (f & 192) === 128) {
          let d = o << 18 & 1835008 | c << 12 & 258048 | l << 6 & 4032 | f & 63;
          d < 65536 || d > 1114111 ? r += "����" : (d -= 65536, r += String.fromCharCode(55296 + (d >> 10), 56320 + (d & 1023))), i += 9;
          continue;
        }
      }
      r += "�";
    }
    return r;
  });
}
re.defaultChars = ";/?:@&=+$,#";
re.componentChars = "";
const yu = {};
function Ln(e) {
  let u = yu[e];
  if (u)
    return u;
  u = yu[e] = [];
  for (let t = 0; t < 128; t++) {
    const n = String.fromCharCode(t);
    /^[0-9a-z]$/i.test(n) ? u.push(n) : u.push("%" + ("0" + t.toString(16).toUpperCase()).slice(-2));
  }
  for (let t = 0; t < e.length; t++)
    u[e.charCodeAt(t)] = e[t];
  return u;
}
function pe(e, u, t) {
  typeof u != "string" && (t = u, u = pe.defaultChars), typeof t > "u" && (t = !0);
  const n = Ln(u);
  let r = "";
  for (let i = 0, s = e.length; i < s; i++) {
    const o = e.charCodeAt(i);
    if (t && o === 37 && i + 2 < s && /^[0-9a-f]{2}$/i.test(e.slice(i + 1, i + 3))) {
      r += e.slice(i, i + 3), i += 2;
      continue;
    }
    if (o < 128) {
      r += n[o];
      continue;
    }
    if (o >= 55296 && o <= 57343) {
      if (o >= 55296 && o <= 56319 && i + 1 < s) {
        const c = e.charCodeAt(i + 1);
        if (c >= 56320 && c <= 57343) {
          r += encodeURIComponent(e[i] + e[i + 1]), i++;
          continue;
        }
      }
      r += "%EF%BF%BD";
      continue;
    }
    r += encodeURIComponent(e[i]);
  }
  return r;
}
pe.defaultChars = ";/?:@&=+$,-_.!~*'()#";
pe.componentChars = "-_.!~*'()";
function su(e) {
  let u = "";
  return u += e.protocol || "", u += e.slashes ? "//" : "", u += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? u += "[" + e.hostname + "]" : u += e.hostname || "", u += e.port ? ":" + e.port : "", u += e.pathname || "", u += e.search || "", u += e.hash || "", u;
}
function De() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const Pn = /^([a-z0-9.+-]+:)/i, Nn = /:[0-9]*$/, zn = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, Un = ["<", ">", '"', "`", " ", "\r", `
`, "	"], Hn = ["{", "}", "|", "\\", "^", "`"].concat(Un), Qn = ["'"].concat(Hn), Cu = ["%", "/", "?", ";", "#"].concat(Qn), Eu = ["/", "?", "#"], Vn = 255, wu = /^[+a-z0-9A-Z_-]{0,63}$/, jn = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Au = {
  javascript: !0,
  "javascript:": !0
}, Du = {
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
function ou(e, u) {
  if (e && e instanceof De) return e;
  const t = new De();
  return t.parse(e, u), t;
}
De.prototype.parse = function(e, u) {
  let t, n, r, i = e;
  if (i = i.trim(), !u && e.split("#").length === 1) {
    const l = zn.exec(i);
    if (l)
      return this.pathname = l[1], l[2] && (this.search = l[2]), this;
  }
  let s = Pn.exec(i);
  if (s && (s = s[0], t = s.toLowerCase(), this.protocol = s, i = i.substr(s.length)), (u || s || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(s && Au[s]) && (i = i.substr(2), this.slashes = !0)), !Au[s] && (r || s && !Du[s])) {
    let l = -1;
    for (let h = 0; h < Eu.length; h++)
      n = i.indexOf(Eu[h]), n !== -1 && (l === -1 || n < l) && (l = n);
    let f, d;
    l === -1 ? d = i.lastIndexOf("@") : d = i.lastIndexOf("@", l), d !== -1 && (f = i.slice(0, d), i = i.slice(d + 1), this.auth = f), l = -1;
    for (let h = 0; h < Cu.length; h++)
      n = i.indexOf(Cu[h]), n !== -1 && (l === -1 || n < l) && (l = n);
    l === -1 && (l = i.length), i[l - 1] === ":" && l--;
    const _ = i.slice(0, l);
    i = i.slice(l), this.parseHost(_), this.hostname = this.hostname || "";
    const p = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!p) {
      const h = this.hostname.split(/\./);
      for (let y = 0, w = h.length; y < w; y++) {
        const D = h[y];
        if (D && !D.match(wu)) {
          let k = "";
          for (let E = 0, C = D.length; E < C; E++)
            D.charCodeAt(E) > 127 ? k += "x" : k += D[E];
          if (!k.match(wu)) {
            const E = h.slice(0, y), C = h.slice(y + 1), g = D.match(jn);
            g && (E.push(g[1]), C.unshift(g[2])), C.length && (i = C.join(".") + i), this.hostname = E.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Vn && (this.hostname = ""), p && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const o = i.indexOf("#");
  o !== -1 && (this.hash = i.substr(o), i = i.slice(0, o));
  const c = i.indexOf("?");
  return c !== -1 && (this.search = i.substr(c), i = i.slice(0, c)), i && (this.pathname = i), Du[t] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
De.prototype.parseHost = function(e) {
  let u = Nn.exec(e);
  u && (u = u[0], u !== ":" && (this.port = u.substr(1)), e = e.substr(0, e.length - u.length)), e && (this.hostname = e);
};
const Zn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: re,
  encode: pe,
  format: su,
  parse: ou
}, Symbol.toStringTag, { value: "Module" })), et = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, ut = /[\0-\x1F\x7F-\x9F]/, Wn = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, cu = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, tt = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, nt = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Gn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: et,
  Cc: ut,
  Cf: Wn,
  P: cu,
  S: tt,
  Z: nt
}, Symbol.toStringTag, { value: "Module" })), Kn = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((e) => e.charCodeAt(0))
), Jn = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((e) => e.charCodeAt(0))
);
var Pe;
const Yn = /* @__PURE__ */ new Map([
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
]), Xn = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (Pe = String.fromCodePoint) !== null && Pe !== void 0 ? Pe : function(e) {
    let u = "";
    return e > 65535 && (e -= 65536, u += String.fromCharCode(e >>> 10 & 1023 | 55296), e = 56320 | e & 1023), u += String.fromCharCode(e), u;
  }
);
function $n(e) {
  var u;
  return e >= 55296 && e <= 57343 || e > 1114111 ? 65533 : (u = Yn.get(e)) !== null && u !== void 0 ? u : e;
}
var I;
(function(e) {
  e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_F = 102] = "LOWER_F", e[e.LOWER_X = 120] = "LOWER_X", e[e.LOWER_Z = 122] = "LOWER_Z", e[e.UPPER_A = 65] = "UPPER_A", e[e.UPPER_F = 70] = "UPPER_F", e[e.UPPER_Z = 90] = "UPPER_Z";
})(I || (I = {}));
const er = 32;
var $;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE";
})($ || ($ = {}));
function Xe(e) {
  return e >= I.ZERO && e <= I.NINE;
}
function ur(e) {
  return e >= I.UPPER_A && e <= I.UPPER_F || e >= I.LOWER_A && e <= I.LOWER_F;
}
function tr(e) {
  return e >= I.UPPER_A && e <= I.UPPER_Z || e >= I.LOWER_A && e <= I.LOWER_Z || Xe(e);
}
function nr(e) {
  return e === I.EQUALS || tr(e);
}
var q;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(q || (q = {}));
var X;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(X || (X = {}));
class rr {
  constructor(u, t, n) {
    this.decodeTree = u, this.emitCodePoint = t, this.errors = n, this.state = q.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = X.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(u) {
    this.decodeMode = u, this.state = q.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
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
  write(u, t) {
    switch (this.state) {
      case q.EntityStart:
        return u.charCodeAt(t) === I.NUM ? (this.state = q.NumericStart, this.consumed += 1, this.stateNumericStart(u, t + 1)) : (this.state = q.NamedEntity, this.stateNamedEntity(u, t));
      case q.NumericStart:
        return this.stateNumericStart(u, t);
      case q.NumericDecimal:
        return this.stateNumericDecimal(u, t);
      case q.NumericHex:
        return this.stateNumericHex(u, t);
      case q.NamedEntity:
        return this.stateNamedEntity(u, t);
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
  stateNumericStart(u, t) {
    return t >= u.length ? -1 : (u.charCodeAt(t) | er) === I.LOWER_X ? (this.state = q.NumericHex, this.consumed += 1, this.stateNumericHex(u, t + 1)) : (this.state = q.NumericDecimal, this.stateNumericDecimal(u, t));
  }
  addToNumericResult(u, t, n, r) {
    if (t !== n) {
      const i = n - t;
      this.result = this.result * Math.pow(r, i) + parseInt(u.substr(t, i), r), this.consumed += i;
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
  stateNumericHex(u, t) {
    const n = t;
    for (; t < u.length; ) {
      const r = u.charCodeAt(t);
      if (Xe(r) || ur(r))
        t += 1;
      else
        return this.addToNumericResult(u, n, t, 16), this.emitNumericEntity(r, 3);
    }
    return this.addToNumericResult(u, n, t, 16), -1;
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
  stateNumericDecimal(u, t) {
    const n = t;
    for (; t < u.length; ) {
      const r = u.charCodeAt(t);
      if (Xe(r))
        t += 1;
      else
        return this.addToNumericResult(u, n, t, 10), this.emitNumericEntity(r, 2);
    }
    return this.addToNumericResult(u, n, t, 10), -1;
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
  emitNumericEntity(u, t) {
    var n;
    if (this.consumed <= t)
      return (n = this.errors) === null || n === void 0 || n.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (u === I.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === X.Strict)
      return 0;
    return this.emitCodePoint($n(this.result), this.consumed), this.errors && (u !== I.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
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
  stateNamedEntity(u, t) {
    const { decodeTree: n } = this;
    let r = n[this.treeIndex], i = (r & $.VALUE_LENGTH) >> 14;
    for (; t < u.length; t++, this.excess++) {
      const s = u.charCodeAt(t);
      if (this.treeIndex = ir(n, r, this.treeIndex + Math.max(1, i), s), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === X.Attribute && // We shouldn't have consumed any characters after the entity,
        (i === 0 || // And there should be no invalid characters.
        nr(s)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (r = n[this.treeIndex], i = (r & $.VALUE_LENGTH) >> 14, i !== 0) {
        if (s === I.SEMI)
          return this.emitNamedEntityData(this.treeIndex, i, this.consumed + this.excess);
        this.decodeMode !== X.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
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
    var u;
    const { result: t, decodeTree: n } = this, r = (n[t] & $.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(t, r, this.consumed), (u = this.errors) === null || u === void 0 || u.missingSemicolonAfterCharacterReference(), this.consumed;
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
  emitNamedEntityData(u, t, n) {
    const { decodeTree: r } = this;
    return this.emitCodePoint(t === 1 ? r[u] & ~$.VALUE_LENGTH : r[u + 1], n), t === 3 && this.emitCodePoint(r[u + 2], n), n;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   *
   * @returns The number of characters consumed.
   */
  end() {
    var u;
    switch (this.state) {
      case q.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== X.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case q.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case q.NumericHex:
        return this.emitNumericEntity(0, 3);
      case q.NumericStart:
        return (u = this.errors) === null || u === void 0 || u.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case q.EntityStart:
        return 0;
    }
  }
}
function rt(e) {
  let u = "";
  const t = new rr(e, (n) => u += Xn(n));
  return function(r, i) {
    let s = 0, o = 0;
    for (; (o = r.indexOf("&", o)) >= 0; ) {
      u += r.slice(s, o), t.startEntity(i);
      const l = t.write(
        r,
        // Skip the "&"
        o + 1
      );
      if (l < 0) {
        s = o + t.end();
        break;
      }
      s = o + l, o = l === 0 ? s + 1 : s;
    }
    const c = u + r.slice(s);
    return u = "", c;
  };
}
function ir(e, u, t, n) {
  const r = (u & $.BRANCH_LENGTH) >> 7, i = u & $.JUMP_TABLE;
  if (r === 0)
    return i !== 0 && n === i ? t : -1;
  if (i) {
    const c = n - i;
    return c < 0 || c >= r ? -1 : e[t + c] - 1;
  }
  let s = t, o = s + r - 1;
  for (; s <= o; ) {
    const c = s + o >>> 1, l = e[c];
    if (l < n)
      s = c + 1;
    else if (l > n)
      o = c - 1;
    else
      return e[c + r];
  }
  return -1;
}
const sr = rt(Kn);
rt(Jn);
function it(e, u = X.Legacy) {
  return sr(e, u);
}
function or(e) {
  return Object.prototype.toString.call(e);
}
function au(e) {
  return or(e) === "[object String]";
}
const cr = Object.prototype.hasOwnProperty;
function ar(e, u) {
  return cr.call(e, u);
}
function Be(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    if (t) {
      if (typeof t != "object")
        throw new TypeError(t + "must be object");
      Object.keys(t).forEach(function(n) {
        e[n] = t[n];
      });
    }
  }), e;
}
function st(e, u, t) {
  return [].concat(e.slice(0, u), t, e.slice(u + 1));
}
function lu(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) === 65535 || (e & 65535) === 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function ve(e) {
  if (e > 65535) {
    e -= 65536;
    const u = 55296 + (e >> 10), t = 56320 + (e & 1023);
    return String.fromCharCode(u, t);
  }
  return String.fromCharCode(e);
}
const ot = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, lr = /&([a-z#][a-z0-9]{1,31});/gi, fr = new RegExp(ot.source + "|" + lr.source, "gi"), dr = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function hr(e, u) {
  if (u.charCodeAt(0) === 35 && dr.test(u)) {
    const n = u[1].toLowerCase() === "x" ? parseInt(u.slice(2), 16) : parseInt(u.slice(1), 10);
    return lu(n) ? ve(n) : e;
  }
  const t = it(e);
  return t !== e ? t : e;
}
function pr(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(ot, "$1");
}
function ie(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(fr, function(u, t, n) {
    return t || hr(u, n);
  });
}
const br = /[&<>"]/, mr = /[&<>"]/g, _r = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function gr(e) {
  return _r[e];
}
function ue(e) {
  return br.test(e) ? e.replace(mr, gr) : e;
}
const xr = /[.?*+^$[\]\\(){}|-]/g;
function kr(e) {
  return e.replace(xr, "\\$&");
}
function T(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function le(e) {
  if (e >= 8192 && e <= 8202)
    return !0;
  switch (e) {
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
function fe(e) {
  return cu.test(e) || tt.test(e);
}
function de(e) {
  switch (e) {
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
function Re(e) {
  return e = e.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (e = e.replace(/ẞ/g, "ß")), e.toLowerCase().toUpperCase();
}
const yr = { mdurl: Zn, ucmicro: Gn }, Cr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: st,
  assign: Be,
  escapeHtml: ue,
  escapeRE: kr,
  fromCodePoint: ve,
  has: ar,
  isMdAsciiPunct: de,
  isPunctChar: fe,
  isSpace: T,
  isString: au,
  isValidEntityCode: lu,
  isWhiteSpace: le,
  lib: yr,
  normalizeReference: Re,
  unescapeAll: ie,
  unescapeMd: pr
}, Symbol.toStringTag, { value: "Module" }));
function Er(e, u, t) {
  let n, r, i, s;
  const o = e.posMax, c = e.pos;
  for (e.pos = u + 1, n = 1; e.pos < o; ) {
    if (i = e.src.charCodeAt(e.pos), i === 93 && (n--, n === 0)) {
      r = !0;
      break;
    }
    if (s = e.pos, e.md.inline.skipToken(e), i === 91) {
      if (s === e.pos - 1)
        n++;
      else if (t)
        return e.pos = c, -1;
    }
  }
  let l = -1;
  return r && (l = e.pos), e.pos = c, l;
}
function wr(e, u, t) {
  let n, r = u;
  const i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(r) === 60) {
    for (r++; r < t; ) {
      if (n = e.charCodeAt(r), n === 10 || n === 60)
        return i;
      if (n === 62)
        return i.pos = r + 1, i.str = ie(e.slice(u + 1, r)), i.ok = !0, i;
      if (n === 92 && r + 1 < t) {
        r += 2;
        continue;
      }
      r++;
    }
    return i;
  }
  let s = 0;
  for (; r < t && (n = e.charCodeAt(r), !(n === 32 || n < 32 || n === 127)); ) {
    if (n === 92 && r + 1 < t) {
      if (e.charCodeAt(r + 1) === 32)
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
  return u === r || s !== 0 || (i.str = ie(e.slice(u, r)), i.pos = r, i.ok = !0), i;
}
function Ar(e, u, t, n) {
  let r, i = u;
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
    let o = e.charCodeAt(i);
    if (o !== 34 && o !== 39 && o !== 40)
      return s;
    u++, i++, o === 40 && (o = 41), s.marker = o;
  }
  for (; i < t; ) {
    if (r = e.charCodeAt(i), r === s.marker)
      return s.pos = i + 1, s.str += ie(e.slice(u, i)), s.ok = !0, s;
    if (r === 40 && s.marker === 41)
      return s;
    r === 92 && i + 1 < t && i++, i++;
  }
  return s.can_continue = !0, s.str += ie(e.slice(u, i)), s;
}
const Dr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: wr,
  parseLinkLabel: Er,
  parseLinkTitle: Ar
}, Symbol.toStringTag, { value: "Module" })), W = {};
W.code_inline = function(e, u, t, n, r) {
  const i = e[u];
  return "<code" + r.renderAttrs(i) + ">" + ue(i.content) + "</code>";
};
W.code_block = function(e, u, t, n, r) {
  const i = e[u];
  return "<pre" + r.renderAttrs(i) + "><code>" + ue(e[u].content) + `</code></pre>
`;
};
W.fence = function(e, u, t, n, r) {
  const i = e[u], s = i.info ? ie(i.info).trim() : "";
  let o = "", c = "";
  if (s) {
    const f = s.split(/(\s+)/g);
    o = f[0], c = f.slice(2).join("");
  }
  let l;
  if (t.highlight ? l = t.highlight(i.content, o, c) || ue(i.content) : l = ue(i.content), l.indexOf("<pre") === 0)
    return l + `
`;
  if (s) {
    const f = i.attrIndex("class"), d = i.attrs ? i.attrs.slice() : [];
    f < 0 ? d.push(["class", t.langPrefix + o]) : (d[f] = d[f].slice(), d[f][1] += " " + t.langPrefix + o);
    const _ = {
      attrs: d
    };
    return `<pre><code${r.renderAttrs(_)}>${l}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${l}</code></pre>
`;
};
W.image = function(e, u, t, n, r) {
  const i = e[u];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, t, n), r.renderToken(e, u, t);
};
W.hardbreak = function(e, u, t) {
  return t.xhtmlOut ? `<br />
` : `<br>
`;
};
W.softbreak = function(e, u, t) {
  return t.breaks ? t.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
W.text = function(e, u) {
  return ue(e[u].content);
};
W.html_block = function(e, u) {
  return e[u].content;
};
W.html_inline = function(e, u) {
  return e[u].content;
};
function oe() {
  this.rules = Be({}, W);
}
oe.prototype.renderAttrs = function(u) {
  let t, n, r;
  if (!u.attrs)
    return "";
  for (r = "", t = 0, n = u.attrs.length; t < n; t++)
    r += " " + ue(u.attrs[t][0]) + '="' + ue(u.attrs[t][1]) + '"';
  return r;
};
oe.prototype.renderToken = function(u, t, n) {
  const r = u[t];
  let i = "";
  if (r.hidden)
    return "";
  r.block && r.nesting !== -1 && t && u[t - 1].hidden && (i += `
`), i += (r.nesting === -1 ? "</" : "<") + r.tag, i += this.renderAttrs(r), r.nesting === 0 && n.xhtmlOut && (i += " /");
  let s = !1;
  if (r.block && (s = !0, r.nesting === 1 && t + 1 < u.length)) {
    const o = u[t + 1];
    (o.type === "inline" || o.hidden || o.nesting === -1 && o.tag === r.tag) && (s = !1);
  }
  return i += s ? `>
` : ">", i;
};
oe.prototype.renderInline = function(e, u, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, s = e.length; i < s; i++) {
    const o = e[i].type;
    typeof r[o] < "u" ? n += r[o](e, i, u, t, this) : n += this.renderToken(e, i, u);
  }
  return n;
};
oe.prototype.renderInlineAsText = function(e, u, t) {
  let n = "";
  for (let r = 0, i = e.length; r < i; r++)
    switch (e[r].type) {
      case "text":
        n += e[r].content;
        break;
      case "image":
        n += this.renderInlineAsText(e[r].children, u, t);
        break;
      case "html_inline":
      case "html_block":
        n += e[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        n += `
`;
        break;
    }
  return n;
};
oe.prototype.render = function(e, u, t) {
  let n = "";
  const r = this.rules;
  for (let i = 0, s = e.length; i < s; i++) {
    const o = e[i].type;
    o === "inline" ? n += this.renderInline(e[i].children, u, t) : typeof r[o] < "u" ? n += r[o](e, i, u, t, this) : n += this.renderToken(e, i, u, t);
  }
  return n;
};
function L() {
  this.__rules__ = [], this.__cache__ = null;
}
L.prototype.__find__ = function(e) {
  for (let u = 0; u < this.__rules__.length; u++)
    if (this.__rules__[u].name === e)
      return u;
  return -1;
};
L.prototype.__compile__ = function() {
  const e = this, u = [""];
  e.__rules__.forEach(function(t) {
    t.enabled && t.alt.forEach(function(n) {
      u.indexOf(n) < 0 && u.push(n);
    });
  }), e.__cache__ = {}, u.forEach(function(t) {
    e.__cache__[t] = [], e.__rules__.forEach(function(n) {
      n.enabled && (t && n.alt.indexOf(t) < 0 || e.__cache__[t].push(n.fn));
    });
  });
};
L.prototype.at = function(e, u, t) {
  const n = this.__find__(e), r = t || {};
  if (n === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__[n].fn = u, this.__rules__[n].alt = r.alt || [], this.__cache__ = null;
};
L.prototype.before = function(e, u, t, n) {
  const r = this.__find__(e), i = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(r, 0, {
    name: u,
    enabled: !0,
    fn: t,
    alt: i.alt || []
  }), this.__cache__ = null;
};
L.prototype.after = function(e, u, t, n) {
  const r = this.__find__(e), i = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + e);
  this.__rules__.splice(r + 1, 0, {
    name: u,
    enabled: !0,
    fn: t,
    alt: i.alt || []
  }), this.__cache__ = null;
};
L.prototype.push = function(e, u, t) {
  const n = t || {};
  this.__rules__.push({
    name: e,
    enabled: !0,
    fn: u,
    alt: n.alt || []
  }), this.__cache__ = null;
};
L.prototype.enable = function(e, u) {
  Array.isArray(e) || (e = [e]);
  const t = [];
  return e.forEach(function(n) {
    const r = this.__find__(n);
    if (r < 0) {
      if (u)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[r].enabled = !0, t.push(n);
  }, this), this.__cache__ = null, t;
};
L.prototype.enableOnly = function(e, u) {
  Array.isArray(e) || (e = [e]), this.__rules__.forEach(function(t) {
    t.enabled = !1;
  }), this.enable(e, u);
};
L.prototype.disable = function(e, u) {
  Array.isArray(e) || (e = [e]);
  const t = [];
  return e.forEach(function(n) {
    const r = this.__find__(n);
    if (r < 0) {
      if (u)
        return;
      throw new Error("Rules manager: invalid rule name " + n);
    }
    this.__rules__[r].enabled = !1, t.push(n);
  }, this), this.__cache__ = null, t;
};
L.prototype.getRules = function(e) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[e] || [];
};
function H(e, u, t) {
  this.type = e, this.tag = u, this.attrs = null, this.map = null, this.nesting = t, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
H.prototype.attrIndex = function(u) {
  if (!this.attrs)
    return -1;
  const t = this.attrs;
  for (let n = 0, r = t.length; n < r; n++)
    if (t[n][0] === u)
      return n;
  return -1;
};
H.prototype.attrPush = function(u) {
  this.attrs ? this.attrs.push(u) : this.attrs = [u];
};
H.prototype.attrSet = function(u, t) {
  const n = this.attrIndex(u), r = [u, t];
  n < 0 ? this.attrPush(r) : this.attrs[n] = r;
};
H.prototype.attrGet = function(u) {
  const t = this.attrIndex(u);
  let n = null;
  return t >= 0 && (n = this.attrs[t][1]), n;
};
H.prototype.attrJoin = function(u, t) {
  const n = this.attrIndex(u);
  n < 0 ? this.attrPush([u, t]) : this.attrs[n][1] = this.attrs[n][1] + " " + t;
};
function ct(e, u, t) {
  this.src = e, this.env = t, this.tokens = [], this.inlineMode = !1, this.md = u;
}
ct.prototype.Token = H;
const vr = /\r\n?|\n/g, Fr = /\0/g;
function Sr(e) {
  let u;
  u = e.src.replace(vr, `
`), u = u.replace(Fr, "�"), e.src = u;
}
function Tr(e) {
  let u;
  e.inlineMode ? (u = new e.Token("inline", "", 0), u.content = e.src, u.map = [0, 1], u.children = [], e.tokens.push(u)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function Br(e) {
  const u = e.tokens;
  for (let t = 0, n = u.length; t < n; t++) {
    const r = u[t];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function Rr(e) {
  return /^<a[>\s]/i.test(e);
}
function qr(e) {
  return /^<\/a\s*>/i.test(e);
}
function Ir(e) {
  const u = e.tokens;
  if (e.md.options.linkify)
    for (let t = 0, n = u.length; t < n; t++) {
      if (u[t].type !== "inline" || !e.md.linkify.pretest(u[t].content))
        continue;
      let r = u[t].children, i = 0;
      for (let s = r.length - 1; s >= 0; s--) {
        const o = r[s];
        if (o.type === "link_close") {
          for (s--; r[s].level !== o.level && r[s].type !== "link_open"; )
            s--;
          continue;
        }
        if (o.type === "html_inline" && (Rr(o.content) && i > 0 && i--, qr(o.content) && i++), !(i > 0) && o.type === "text" && e.md.linkify.test(o.content)) {
          const c = o.content;
          let l = e.md.linkify.match(c);
          const f = [];
          let d = o.level, _ = 0;
          l.length > 0 && l[0].index === 0 && s > 0 && r[s - 1].type === "text_special" && (l = l.slice(1));
          for (let p = 0; p < l.length; p++) {
            const h = l[p].url, y = e.md.normalizeLink(h);
            if (!e.md.validateLink(y))
              continue;
            let w = l[p].text;
            l[p].schema ? l[p].schema === "mailto:" && !/^mailto:/i.test(w) ? w = e.md.normalizeLinkText("mailto:" + w).replace(/^mailto:/, "") : w = e.md.normalizeLinkText(w) : w = e.md.normalizeLinkText("http://" + w).replace(/^http:\/\//, "");
            const D = l[p].index;
            if (D > _) {
              const g = new e.Token("text", "", 0);
              g.content = c.slice(_, D), g.level = d, f.push(g);
            }
            const k = new e.Token("link_open", "a", 1);
            k.attrs = [["href", y]], k.level = d++, k.markup = "linkify", k.info = "auto", f.push(k);
            const E = new e.Token("text", "", 0);
            E.content = w, E.level = d, f.push(E);
            const C = new e.Token("link_close", "a", -1);
            C.level = --d, C.markup = "linkify", C.info = "auto", f.push(C), _ = l[p].lastIndex;
          }
          if (_ < c.length) {
            const p = new e.Token("text", "", 0);
            p.content = c.slice(_), p.level = d, f.push(p);
          }
          u[t].children = r = st(r, s, f);
        }
      }
    }
}
const at = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Mr = /\((c|tm|r)\)/i, Or = /\((c|tm|r)\)/ig, Lr = {
  c: "©",
  r: "®",
  tm: "™"
};
function Pr(e, u) {
  return Lr[u.toLowerCase()];
}
function Nr(e) {
  let u = 0;
  for (let t = e.length - 1; t >= 0; t--) {
    const n = e[t];
    n.type === "text" && !u && (n.content = n.content.replace(Or, Pr)), n.type === "link_open" && n.info === "auto" && u--, n.type === "link_close" && n.info === "auto" && u++;
  }
}
function zr(e) {
  let u = 0;
  for (let t = e.length - 1; t >= 0; t--) {
    const n = e[t];
    n.type === "text" && !u && at.test(n.content) && (n.content = n.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), n.type === "link_open" && n.info === "auto" && u--, n.type === "link_close" && n.info === "auto" && u++;
  }
}
function Ur(e) {
  let u;
  if (e.md.options.typographer)
    for (u = e.tokens.length - 1; u >= 0; u--)
      e.tokens[u].type === "inline" && (Mr.test(e.tokens[u].content) && Nr(e.tokens[u].children), at.test(e.tokens[u].content) && zr(e.tokens[u].children));
}
const Hr = /['"]/, vu = /['"]/g, Fu = "’";
function xe(e, u, t) {
  return e.slice(0, u) + t + e.slice(u + 1);
}
function Qr(e, u) {
  let t;
  const n = [];
  for (let r = 0; r < e.length; r++) {
    const i = e[r], s = e[r].level;
    for (t = n.length - 1; t >= 0 && !(n[t].level <= s); t--)
      ;
    if (n.length = t + 1, i.type !== "text")
      continue;
    let o = i.content, c = 0, l = o.length;
    e:
      for (; c < l; ) {
        vu.lastIndex = c;
        const f = vu.exec(o);
        if (!f)
          break;
        let d = !0, _ = !0;
        c = f.index + 1;
        const p = f[0] === "'";
        let h = 32;
        if (f.index - 1 >= 0)
          h = o.charCodeAt(f.index - 1);
        else
          for (t = r - 1; t >= 0 && !(e[t].type === "softbreak" || e[t].type === "hardbreak"); t--)
            if (e[t].content) {
              h = e[t].content.charCodeAt(e[t].content.length - 1);
              break;
            }
        let y = 32;
        if (c < l)
          y = o.charCodeAt(c);
        else
          for (t = r + 1; t < e.length && !(e[t].type === "softbreak" || e[t].type === "hardbreak"); t++)
            if (e[t].content) {
              y = e[t].content.charCodeAt(0);
              break;
            }
        const w = de(h) || fe(String.fromCharCode(h)), D = de(y) || fe(String.fromCharCode(y)), k = le(h), E = le(y);
        if (E ? d = !1 : D && (k || w || (d = !1)), k ? _ = !1 : w && (E || D || (_ = !1)), y === 34 && f[0] === '"' && h >= 48 && h <= 57 && (_ = d = !1), d && _ && (d = w, _ = D), !d && !_) {
          p && (i.content = xe(i.content, f.index, Fu));
          continue;
        }
        if (_)
          for (t = n.length - 1; t >= 0; t--) {
            let C = n[t];
            if (n[t].level < s)
              break;
            if (C.single === p && n[t].level === s) {
              C = n[t];
              let g, x;
              p ? (g = u.md.options.quotes[2], x = u.md.options.quotes[3]) : (g = u.md.options.quotes[0], x = u.md.options.quotes[1]), i.content = xe(i.content, f.index, x), e[C.token].content = xe(
                e[C.token].content,
                C.pos,
                g
              ), c += x.length - 1, C.token === r && (c += g.length - 1), o = i.content, l = o.length, n.length = t;
              continue e;
            }
          }
        d ? n.push({
          token: r,
          pos: f.index,
          single: p,
          level: s
        }) : _ && p && (i.content = xe(i.content, f.index, Fu));
      }
  }
}
function Vr(e) {
  if (e.md.options.typographer)
    for (let u = e.tokens.length - 1; u >= 0; u--)
      e.tokens[u].type !== "inline" || !Hr.test(e.tokens[u].content) || Qr(e.tokens[u].children, e);
}
function jr(e) {
  let u, t;
  const n = e.tokens, r = n.length;
  for (let i = 0; i < r; i++) {
    if (n[i].type !== "inline") continue;
    const s = n[i].children, o = s.length;
    for (u = 0; u < o; u++)
      s[u].type === "text_special" && (s[u].type = "text");
    for (u = t = 0; u < o; u++)
      s[u].type === "text" && u + 1 < o && s[u + 1].type === "text" ? s[u + 1].content = s[u].content + s[u + 1].content : (u !== t && (s[t] = s[u]), t++);
    u !== t && (s.length = t);
  }
}
const Ne = [
  ["normalize", Sr],
  ["block", Tr],
  ["inline", Br],
  ["linkify", Ir],
  ["replacements", Ur],
  ["smartquotes", Vr],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", jr]
];
function fu() {
  this.ruler = new L();
  for (let e = 0; e < Ne.length; e++)
    this.ruler.push(Ne[e][0], Ne[e][1]);
}
fu.prototype.process = function(e) {
  const u = this.ruler.getRules("");
  for (let t = 0, n = u.length; t < n; t++)
    u[t](e);
};
fu.prototype.State = ct;
function G(e, u, t, n) {
  this.src = e, this.md = u, this.env = t, this.tokens = n, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const r = this.src;
  for (let i = 0, s = 0, o = 0, c = 0, l = r.length, f = !1; s < l; s++) {
    const d = r.charCodeAt(s);
    if (!f)
      if (T(d)) {
        o++, d === 9 ? c += 4 - c % 4 : c++;
        continue;
      } else
        f = !0;
    (d === 10 || s === l - 1) && (d !== 10 && s++, this.bMarks.push(i), this.eMarks.push(s), this.tShift.push(o), this.sCount.push(c), this.bsCount.push(0), f = !1, o = 0, c = 0, i = s + 1);
  }
  this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
G.prototype.push = function(e, u, t) {
  const n = new H(e, u, t);
  return n.block = !0, t < 0 && this.level--, n.level = this.level, t > 0 && this.level++, this.tokens.push(n), n;
};
G.prototype.isEmpty = function(u) {
  return this.bMarks[u] + this.tShift[u] >= this.eMarks[u];
};
G.prototype.skipEmptyLines = function(u) {
  for (let t = this.lineMax; u < t && !(this.bMarks[u] + this.tShift[u] < this.eMarks[u]); u++)
    ;
  return u;
};
G.prototype.skipSpaces = function(u) {
  for (let t = this.src.length; u < t; u++) {
    const n = this.src.charCodeAt(u);
    if (!T(n))
      break;
  }
  return u;
};
G.prototype.skipSpacesBack = function(u, t) {
  if (u <= t)
    return u;
  for (; u > t; )
    if (!T(this.src.charCodeAt(--u)))
      return u + 1;
  return u;
};
G.prototype.skipChars = function(u, t) {
  for (let n = this.src.length; u < n && this.src.charCodeAt(u) === t; u++)
    ;
  return u;
};
G.prototype.skipCharsBack = function(u, t, n) {
  if (u <= n)
    return u;
  for (; u > n; )
    if (t !== this.src.charCodeAt(--u))
      return u + 1;
  return u;
};
G.prototype.getLines = function(u, t, n, r) {
  if (u >= t)
    return "";
  const i = new Array(t - u);
  for (let s = 0, o = u; o < t; o++, s++) {
    let c = 0;
    const l = this.bMarks[o];
    let f = l, d;
    for (o + 1 < t || r ? d = this.eMarks[o] + 1 : d = this.eMarks[o]; f < d && c < n; ) {
      const _ = this.src.charCodeAt(f);
      if (T(_))
        _ === 9 ? c += 4 - (c + this.bsCount[o]) % 4 : c++;
      else if (f - l < this.tShift[o])
        c++;
      else
        break;
      f++;
    }
    c > n ? i[s] = new Array(c - n + 1).join(" ") + this.src.slice(f, d) : i[s] = this.src.slice(f, d);
  }
  return i.join("");
};
G.prototype.Token = H;
const Zr = 65536;
function ze(e, u) {
  const t = e.bMarks[u] + e.tShift[u], n = e.eMarks[u];
  return e.src.slice(t, n);
}
function Su(e) {
  const u = [], t = e.length;
  let n = 0, r = e.charCodeAt(n), i = !1, s = 0, o = "";
  for (; n < t; )
    r === 124 && (i ? (o += e.substring(s, n - 1), s = n) : (u.push(o + e.substring(s, n)), o = "", s = n + 1)), i = r === 92, n++, r = e.charCodeAt(n);
  return u.push(o + e.substring(s)), u;
}
function Wr(e, u, t, n) {
  if (u + 2 > t)
    return !1;
  let r = u + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4)
    return !1;
  let i = e.bMarks[r] + e.tShift[r];
  if (i >= e.eMarks[r])
    return !1;
  const s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 || i >= e.eMarks[r])
    return !1;
  const o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 && !T(o) || s === 45 && T(o))
    return !1;
  for (; i < e.eMarks[r]; ) {
    const C = e.src.charCodeAt(i);
    if (C !== 124 && C !== 45 && C !== 58 && !T(C))
      return !1;
    i++;
  }
  let c = ze(e, u + 1), l = c.split("|");
  const f = [];
  for (let C = 0; C < l.length; C++) {
    const g = l[C].trim();
    if (!g) {
      if (C === 0 || C === l.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(g))
      return !1;
    g.charCodeAt(g.length - 1) === 58 ? f.push(g.charCodeAt(0) === 58 ? "center" : "right") : g.charCodeAt(0) === 58 ? f.push("left") : f.push("");
  }
  if (c = ze(e, u).trim(), c.indexOf("|") === -1 || e.sCount[u] - e.blkIndent >= 4)
    return !1;
  l = Su(c), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop();
  const d = l.length;
  if (d === 0 || d !== f.length)
    return !1;
  if (n)
    return !0;
  const _ = e.parentType;
  e.parentType = "table";
  const p = e.md.block.ruler.getRules("blockquote"), h = e.push("table_open", "table", 1), y = [u, 0];
  h.map = y;
  const w = e.push("thead_open", "thead", 1);
  w.map = [u, u + 1];
  const D = e.push("tr_open", "tr", 1);
  D.map = [u, u + 1];
  for (let C = 0; C < l.length; C++) {
    const g = e.push("th_open", "th", 1);
    f[C] && (g.attrs = [["style", "text-align:" + f[C]]]);
    const x = e.push("inline", "", 0);
    x.content = l[C].trim(), x.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let k, E = 0;
  for (r = u + 2; r < t && !(e.sCount[r] < e.blkIndent); r++) {
    let C = !1;
    for (let x = 0, b = p.length; x < b; x++)
      if (p[x](e, r, t, !0)) {
        C = !0;
        break;
      }
    if (C || (c = ze(e, r).trim(), !c) || e.sCount[r] - e.blkIndent >= 4 || (l = Su(c), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop(), E += d - l.length, E > Zr))
      break;
    if (r === u + 2) {
      const x = e.push("tbody_open", "tbody", 1);
      x.map = k = [u + 2, 0];
    }
    const g = e.push("tr_open", "tr", 1);
    g.map = [r, r + 1];
    for (let x = 0; x < d; x++) {
      const b = e.push("td_open", "td", 1);
      f[x] && (b.attrs = [["style", "text-align:" + f[x]]]);
      const m = e.push("inline", "", 0);
      m.content = l[x] ? l[x].trim() : "", m.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return k && (e.push("tbody_close", "tbody", -1), k[1] = r), e.push("table_close", "table", -1), y[1] = r, e.parentType = _, e.line = r, !0;
}
function Gr(e, u, t) {
  if (e.sCount[u] - e.blkIndent < 4)
    return !1;
  let n = u + 1, r = n;
  for (; n < t; ) {
    if (e.isEmpty(n)) {
      n++;
      continue;
    }
    if (e.sCount[n] - e.blkIndent >= 4) {
      n++, r = n;
      continue;
    }
    break;
  }
  e.line = r;
  const i = e.push("code_block", "code", 0);
  return i.content = e.getLines(u, r, 4 + e.blkIndent, !1) + `
`, i.map = [u, e.line], !0;
}
function Kr(e, u, t, n) {
  let r = e.bMarks[u] + e.tShift[u], i = e.eMarks[u];
  if (e.sCount[u] - e.blkIndent >= 4 || r + 3 > i)
    return !1;
  const s = e.src.charCodeAt(r);
  if (s !== 126 && s !== 96)
    return !1;
  let o = r;
  r = e.skipChars(r, s);
  let c = r - o;
  if (c < 3)
    return !1;
  const l = e.src.slice(o, r), f = e.src.slice(r, i);
  if (s === 96 && f.indexOf(String.fromCharCode(s)) >= 0)
    return !1;
  if (n)
    return !0;
  let d = u, _ = !1;
  for (; d++, !(d >= t || (r = o = e.bMarks[d] + e.tShift[d], i = e.eMarks[d], r < i && e.sCount[d] < e.blkIndent)); )
    if (e.src.charCodeAt(r) === s && !(e.sCount[d] - e.blkIndent >= 4) && (r = e.skipChars(r, s), !(r - o < c) && (r = e.skipSpaces(r), !(r < i)))) {
      _ = !0;
      break;
    }
  c = e.sCount[u], e.line = d + (_ ? 1 : 0);
  const p = e.push("fence", "code", 0);
  return p.info = f, p.content = e.getLines(u + 1, d, c, !0), p.markup = l, p.map = [u, e.line], !0;
}
function Jr(e, u, t, n) {
  let r = e.bMarks[u] + e.tShift[u], i = e.eMarks[u];
  const s = e.lineMax;
  if (e.sCount[u] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 62)
    return !1;
  if (n)
    return !0;
  const o = [], c = [], l = [], f = [], d = e.md.block.ruler.getRules("blockquote"), _ = e.parentType;
  e.parentType = "blockquote";
  let p = !1, h;
  for (h = u; h < t; h++) {
    const E = e.sCount[h] < e.blkIndent;
    if (r = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], r >= i)
      break;
    if (e.src.charCodeAt(r++) === 62 && !E) {
      let g = e.sCount[h] + 1, x, b;
      e.src.charCodeAt(r) === 32 ? (r++, g++, b = !1, x = !0) : e.src.charCodeAt(r) === 9 ? (x = !0, (e.bsCount[h] + g) % 4 === 3 ? (r++, g++, b = !1) : b = !0) : x = !1;
      let m = g;
      for (o.push(e.bMarks[h]), e.bMarks[h] = r; r < i; ) {
        const A = e.src.charCodeAt(r);
        if (T(A))
          A === 9 ? m += 4 - (m + e.bsCount[h] + (b ? 1 : 0)) % 4 : m++;
        else
          break;
        r++;
      }
      p = r >= i, c.push(e.bsCount[h]), e.bsCount[h] = e.sCount[h] + 1 + (x ? 1 : 0), l.push(e.sCount[h]), e.sCount[h] = m - g, f.push(e.tShift[h]), e.tShift[h] = r - e.bMarks[h];
      continue;
    }
    if (p)
      break;
    let C = !1;
    for (let g = 0, x = d.length; g < x; g++)
      if (d[g](e, h, t, !0)) {
        C = !0;
        break;
      }
    if (C) {
      e.lineMax = h, e.blkIndent !== 0 && (o.push(e.bMarks[h]), c.push(e.bsCount[h]), f.push(e.tShift[h]), l.push(e.sCount[h]), e.sCount[h] -= e.blkIndent);
      break;
    }
    o.push(e.bMarks[h]), c.push(e.bsCount[h]), f.push(e.tShift[h]), l.push(e.sCount[h]), e.sCount[h] = -1;
  }
  const y = e.blkIndent;
  e.blkIndent = 0;
  const w = e.push("blockquote_open", "blockquote", 1);
  w.markup = ">";
  const D = [u, 0];
  w.map = D, e.md.block.tokenize(e, u, h);
  const k = e.push("blockquote_close", "blockquote", -1);
  k.markup = ">", e.lineMax = s, e.parentType = _, D[1] = e.line;
  for (let E = 0; E < f.length; E++)
    e.bMarks[E + u] = o[E], e.tShift[E + u] = f[E], e.sCount[E + u] = l[E], e.bsCount[E + u] = c[E];
  return e.blkIndent = y, !0;
}
function Yr(e, u, t, n) {
  const r = e.eMarks[u];
  if (e.sCount[u] - e.blkIndent >= 4)
    return !1;
  let i = e.bMarks[u] + e.tShift[u];
  const s = e.src.charCodeAt(i++);
  if (s !== 42 && s !== 45 && s !== 95)
    return !1;
  let o = 1;
  for (; i < r; ) {
    const l = e.src.charCodeAt(i++);
    if (l !== s && !T(l))
      return !1;
    l === s && o++;
  }
  if (o < 3)
    return !1;
  if (n)
    return !0;
  e.line = u + 1;
  const c = e.push("hr", "hr", 0);
  return c.map = [u, e.line], c.markup = Array(o + 1).join(String.fromCharCode(s)), !0;
}
function Tu(e, u) {
  const t = e.eMarks[u];
  let n = e.bMarks[u] + e.tShift[u];
  const r = e.src.charCodeAt(n++);
  if (r !== 42 && r !== 45 && r !== 43)
    return -1;
  if (n < t) {
    const i = e.src.charCodeAt(n);
    if (!T(i))
      return -1;
  }
  return n;
}
function Bu(e, u) {
  const t = e.bMarks[u] + e.tShift[u], n = e.eMarks[u];
  let r = t;
  if (r + 1 >= n)
    return -1;
  let i = e.src.charCodeAt(r++);
  if (i < 48 || i > 57)
    return -1;
  for (; ; ) {
    if (r >= n)
      return -1;
    if (i = e.src.charCodeAt(r++), i >= 48 && i <= 57) {
      if (r - t >= 10)
        return -1;
      continue;
    }
    if (i === 41 || i === 46)
      break;
    return -1;
  }
  return r < n && (i = e.src.charCodeAt(r), !T(i)) ? -1 : r;
}
function Xr(e, u) {
  const t = e.level + 2;
  for (let n = u + 2, r = e.tokens.length - 2; n < r; n++)
    e.tokens[n].level === t && e.tokens[n].type === "paragraph_open" && (e.tokens[n + 2].hidden = !0, e.tokens[n].hidden = !0, n += 2);
}
function $r(e, u, t, n) {
  let r, i, s, o, c = u, l = !0;
  if (e.sCount[c] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[c] - e.listIndent >= 4 && e.sCount[c] < e.blkIndent)
    return !1;
  let f = !1;
  n && e.parentType === "paragraph" && e.sCount[c] >= e.blkIndent && (f = !0);
  let d, _, p;
  if ((p = Bu(e, c)) >= 0) {
    if (d = !0, s = e.bMarks[c] + e.tShift[c], _ = Number(e.src.slice(s, p - 1)), f && _ !== 1) return !1;
  } else if ((p = Tu(e, c)) >= 0)
    d = !1;
  else
    return !1;
  if (f && e.skipSpaces(p) >= e.eMarks[c])
    return !1;
  if (n)
    return !0;
  const h = e.src.charCodeAt(p - 1), y = e.tokens.length;
  d ? (o = e.push("ordered_list_open", "ol", 1), _ !== 1 && (o.attrs = [["start", _]])) : o = e.push("bullet_list_open", "ul", 1);
  const w = [c, 0];
  o.map = w, o.markup = String.fromCharCode(h);
  let D = !1;
  const k = e.md.block.ruler.getRules("list"), E = e.parentType;
  for (e.parentType = "list"; c < t; ) {
    i = p, r = e.eMarks[c];
    const C = e.sCount[c] + p - (e.bMarks[c] + e.tShift[c]);
    let g = C;
    for (; i < r; ) {
      const B = e.src.charCodeAt(i);
      if (B === 9)
        g += 4 - (g + e.bsCount[c]) % 4;
      else if (B === 32)
        g++;
      else
        break;
      i++;
    }
    const x = i;
    let b;
    x >= r ? b = 1 : b = g - C, b > 4 && (b = 1);
    const m = C + b;
    o = e.push("list_item_open", "li", 1), o.markup = String.fromCharCode(h);
    const A = [c, 0];
    o.map = A, d && (o.info = e.src.slice(s, p - 1));
    const F = e.tight, O = e.tShift[c], K = e.sCount[c], S = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = m, e.tight = !0, e.tShift[c] = x - e.bMarks[c], e.sCount[c] = g, x >= r && e.isEmpty(c + 1) ? e.line = Math.min(e.line + 2, t) : e.md.block.tokenize(e, c, t, !0), (!e.tight || D) && (l = !1), D = e.line - c > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = S, e.tShift[c] = O, e.sCount[c] = K, e.tight = F, o = e.push("list_item_close", "li", -1), o.markup = String.fromCharCode(h), c = e.line, A[1] = c, c >= t || e.sCount[c] < e.blkIndent || e.sCount[c] - e.blkIndent >= 4)
      break;
    let M = !1;
    for (let B = 0, J = k.length; B < J; B++)
      if (k[B](e, c, t, !0)) {
        M = !0;
        break;
      }
    if (M)
      break;
    if (d) {
      if (p = Bu(e, c), p < 0)
        break;
      s = e.bMarks[c] + e.tShift[c];
    } else if (p = Tu(e, c), p < 0)
      break;
    if (h !== e.src.charCodeAt(p - 1))
      break;
  }
  return d ? o = e.push("ordered_list_close", "ol", -1) : o = e.push("bullet_list_close", "ul", -1), o.markup = String.fromCharCode(h), w[1] = c, e.line = c, e.parentType = E, l && Xr(e, y), !0;
}
function e0(e, u, t, n) {
  let r = e.bMarks[u] + e.tShift[u], i = e.eMarks[u], s = u + 1;
  if (e.sCount[u] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 91)
    return !1;
  function o(k) {
    const E = e.lineMax;
    if (k >= E || e.isEmpty(k))
      return null;
    let C = !1;
    if (e.sCount[k] - e.blkIndent > 3 && (C = !0), e.sCount[k] < 0 && (C = !0), !C) {
      const b = e.md.block.ruler.getRules("reference"), m = e.parentType;
      e.parentType = "reference";
      let A = !1;
      for (let F = 0, O = b.length; F < O; F++)
        if (b[F](e, k, E, !0)) {
          A = !0;
          break;
        }
      if (e.parentType = m, A)
        return null;
    }
    const g = e.bMarks[k] + e.tShift[k], x = e.eMarks[k];
    return e.src.slice(g, x + 1);
  }
  let c = e.src.slice(r, i + 1);
  i = c.length;
  let l = -1;
  for (r = 1; r < i; r++) {
    const k = c.charCodeAt(r);
    if (k === 91)
      return !1;
    if (k === 93) {
      l = r;
      break;
    } else if (k === 10) {
      const E = o(s);
      E !== null && (c += E, i = c.length, s++);
    } else if (k === 92 && (r++, r < i && c.charCodeAt(r) === 10)) {
      const E = o(s);
      E !== null && (c += E, i = c.length, s++);
    }
  }
  if (l < 0 || c.charCodeAt(l + 1) !== 58)
    return !1;
  for (r = l + 2; r < i; r++) {
    const k = c.charCodeAt(r);
    if (k === 10) {
      const E = o(s);
      E !== null && (c += E, i = c.length, s++);
    } else if (!T(k)) break;
  }
  const f = e.md.helpers.parseLinkDestination(c, r, i);
  if (!f.ok)
    return !1;
  const d = e.md.normalizeLink(f.str);
  if (!e.md.validateLink(d))
    return !1;
  r = f.pos;
  const _ = r, p = s, h = r;
  for (; r < i; r++) {
    const k = c.charCodeAt(r);
    if (k === 10) {
      const E = o(s);
      E !== null && (c += E, i = c.length, s++);
    } else if (!T(k)) break;
  }
  let y = e.md.helpers.parseLinkTitle(c, r, i);
  for (; y.can_continue; ) {
    const k = o(s);
    if (k === null) break;
    c += k, r = i, i = c.length, s++, y = e.md.helpers.parseLinkTitle(c, r, i, y);
  }
  let w;
  for (r < i && h !== r && y.ok ? (w = y.str, r = y.pos) : (w = "", r = _, s = p); r < i; ) {
    const k = c.charCodeAt(r);
    if (!T(k))
      break;
    r++;
  }
  if (r < i && c.charCodeAt(r) !== 10 && w)
    for (w = "", r = _, s = p; r < i; ) {
      const k = c.charCodeAt(r);
      if (!T(k))
        break;
      r++;
    }
  if (r < i && c.charCodeAt(r) !== 10)
    return !1;
  const D = Re(c.slice(1, l));
  return D ? (n || (typeof e.env.references > "u" && (e.env.references = {}), typeof e.env.references[D] > "u" && (e.env.references[D] = { title: w, href: d }), e.line = s), !0) : !1;
}
const u0 = [
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
], t0 = "[a-zA-Z_:][a-zA-Z0-9:._-]*", n0 = "[^\"'=<>`\\x00-\\x20]+", r0 = "'[^']*'", i0 = '"[^"]*"', s0 = "(?:" + n0 + "|" + r0 + "|" + i0 + ")", o0 = "(?:\\s+" + t0 + "(?:\\s*=\\s*" + s0 + ")?)", lt = "<[A-Za-z][A-Za-z0-9\\-]*" + o0 + "*\\s*\\/?>", ft = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", c0 = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", a0 = "<[?][\\s\\S]*?[?]>", l0 = "<![A-Za-z][^>]*>", f0 = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", d0 = new RegExp("^(?:" + lt + "|" + ft + "|" + c0 + "|" + a0 + "|" + l0 + "|" + f0 + ")"), h0 = new RegExp("^(?:" + lt + "|" + ft + ")"), te = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + u0.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(h0.source + "\\s*$"), /^$/, !1]
];
function p0(e, u, t, n) {
  let r = e.bMarks[u] + e.tShift[u], i = e.eMarks[u];
  if (e.sCount[u] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60)
    return !1;
  let s = e.src.slice(r, i), o = 0;
  for (; o < te.length && !te[o][0].test(s); o++)
    ;
  if (o === te.length)
    return !1;
  if (n)
    return te[o][2];
  let c = u + 1;
  if (!te[o][1].test(s)) {
    for (; c < t && !(e.sCount[c] < e.blkIndent); c++)
      if (r = e.bMarks[c] + e.tShift[c], i = e.eMarks[c], s = e.src.slice(r, i), te[o][1].test(s)) {
        s.length !== 0 && c++;
        break;
      }
  }
  e.line = c;
  const l = e.push("html_block", "", 0);
  return l.map = [u, c], l.content = e.getLines(u, c, e.blkIndent, !0), !0;
}
function b0(e, u, t, n) {
  let r = e.bMarks[u] + e.tShift[u], i = e.eMarks[u];
  if (e.sCount[u] - e.blkIndent >= 4)
    return !1;
  let s = e.src.charCodeAt(r);
  if (s !== 35 || r >= i)
    return !1;
  let o = 1;
  for (s = e.src.charCodeAt(++r); s === 35 && r < i && o <= 6; )
    o++, s = e.src.charCodeAt(++r);
  if (o > 6 || r < i && !T(s))
    return !1;
  if (n)
    return !0;
  i = e.skipSpacesBack(i, r);
  const c = e.skipCharsBack(i, 35, r);
  c > r && T(e.src.charCodeAt(c - 1)) && (i = c), e.line = u + 1;
  const l = e.push("heading_open", "h" + String(o), 1);
  l.markup = "########".slice(0, o), l.map = [u, e.line];
  const f = e.push("inline", "", 0);
  f.content = e.src.slice(r, i).trim(), f.map = [u, e.line], f.children = [];
  const d = e.push("heading_close", "h" + String(o), -1);
  return d.markup = "########".slice(0, o), !0;
}
function m0(e, u, t) {
  const n = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[u] - e.blkIndent >= 4)
    return !1;
  const r = e.parentType;
  e.parentType = "paragraph";
  let i = 0, s, o = u + 1;
  for (; o < t && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3)
      continue;
    if (e.sCount[o] >= e.blkIndent) {
      let p = e.bMarks[o] + e.tShift[o];
      const h = e.eMarks[o];
      if (p < h && (s = e.src.charCodeAt(p), (s === 45 || s === 61) && (p = e.skipChars(p, s), p = e.skipSpaces(p), p >= h))) {
        i = s === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[o] < 0)
      continue;
    let _ = !1;
    for (let p = 0, h = n.length; p < h; p++)
      if (n[p](e, o, t, !0)) {
        _ = !0;
        break;
      }
    if (_)
      break;
  }
  if (!i)
    return !1;
  const c = e.getLines(u, o, e.blkIndent, !1).trim();
  e.line = o + 1;
  const l = e.push("heading_open", "h" + String(i), 1);
  l.markup = String.fromCharCode(s), l.map = [u, e.line];
  const f = e.push("inline", "", 0);
  f.content = c, f.map = [u, e.line - 1], f.children = [];
  const d = e.push("heading_close", "h" + String(i), -1);
  return d.markup = String.fromCharCode(s), e.parentType = r, !0;
}
function _0(e, u, t) {
  const n = e.md.block.ruler.getRules("paragraph"), r = e.parentType;
  let i = u + 1;
  for (e.parentType = "paragraph"; i < t && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0)
      continue;
    let l = !1;
    for (let f = 0, d = n.length; f < d; f++)
      if (n[f](e, i, t, !0)) {
        l = !0;
        break;
      }
    if (l)
      break;
  }
  const s = e.getLines(u, i, e.blkIndent, !1).trim();
  e.line = i;
  const o = e.push("paragraph_open", "p", 1);
  o.map = [u, e.line];
  const c = e.push("inline", "", 0);
  return c.content = s, c.map = [u, e.line], c.children = [], e.push("paragraph_close", "p", -1), e.parentType = r, !0;
}
const ke = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", Wr, ["paragraph", "reference"]],
  ["code", Gr],
  ["fence", Kr, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", Jr, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", Yr, ["paragraph", "reference", "blockquote", "list"]],
  ["list", $r, ["paragraph", "reference", "blockquote"]],
  ["reference", e0],
  ["html_block", p0, ["paragraph", "reference", "blockquote"]],
  ["heading", b0, ["paragraph", "reference", "blockquote"]],
  ["lheading", m0],
  ["paragraph", _0]
];
function qe() {
  this.ruler = new L();
  for (let e = 0; e < ke.length; e++)
    this.ruler.push(ke[e][0], ke[e][1], { alt: (ke[e][2] || []).slice() });
}
qe.prototype.tokenize = function(e, u, t) {
  const n = this.ruler.getRules(""), r = n.length, i = e.md.options.maxNesting;
  let s = u, o = !1;
  for (; s < t && (e.line = s = e.skipEmptyLines(s), !(s >= t || e.sCount[s] < e.blkIndent)); ) {
    if (e.level >= i) {
      e.line = t;
      break;
    }
    const c = e.line;
    let l = !1;
    for (let f = 0; f < r; f++)
      if (l = n[f](e, s, t, !1), l) {
        if (c >= e.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!l) throw new Error("none of the block rules matched");
    e.tight = !o, e.isEmpty(e.line - 1) && (o = !0), s = e.line, s < t && e.isEmpty(s) && (o = !0, s++, e.line = s);
  }
};
qe.prototype.parse = function(e, u, t, n) {
  if (!e)
    return;
  const r = new this.State(e, u, t, n);
  this.tokenize(r, r.line, r.lineMax);
};
qe.prototype.State = G;
function be(e, u, t, n) {
  this.src = e, this.env = t, this.md = u, this.tokens = n, this.tokens_meta = Array(n.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
be.prototype.pushPending = function() {
  const e = new H("text", "", 0);
  return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
};
be.prototype.push = function(e, u, t) {
  this.pending && this.pushPending();
  const n = new H(e, u, t);
  let r = null;
  return t < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, t > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(r), n;
};
be.prototype.scanDelims = function(e, u) {
  const t = this.posMax, n = this.src.charCodeAt(e), r = e > 0 ? this.src.charCodeAt(e - 1) : 32;
  let i = e;
  for (; i < t && this.src.charCodeAt(i) === n; )
    i++;
  const s = i - e, o = i < t ? this.src.charCodeAt(i) : 32, c = de(r) || fe(String.fromCharCode(r)), l = de(o) || fe(String.fromCharCode(o)), f = le(r), d = le(o), _ = !d && (!l || f || c), p = !f && (!c || d || l);
  return { can_open: _ && (u || !p || c), can_close: p && (u || !_ || l), length: s };
};
be.prototype.Token = H;
function g0(e) {
  switch (e) {
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
function x0(e, u) {
  let t = e.pos;
  for (; t < e.posMax && !g0(e.src.charCodeAt(t)); )
    t++;
  return t === e.pos ? !1 : (u || (e.pending += e.src.slice(e.pos, t)), e.pos = t, !0);
}
const k0 = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function y0(e, u) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  const t = e.pos, n = e.posMax;
  if (t + 3 > n || e.src.charCodeAt(t) !== 58 || e.src.charCodeAt(t + 1) !== 47 || e.src.charCodeAt(t + 2) !== 47) return !1;
  const r = e.pending.match(k0);
  if (!r) return !1;
  const i = r[1], s = e.md.linkify.matchAtStart(e.src.slice(t - i.length));
  if (!s) return !1;
  let o = s.url;
  if (o.length <= i.length) return !1;
  let c = o.length;
  for (; c > 0 && o.charCodeAt(c - 1) === 42; )
    c--;
  c !== o.length && (o = o.slice(0, c));
  const l = e.md.normalizeLink(o);
  if (!e.md.validateLink(l)) return !1;
  if (!u) {
    e.pending = e.pending.slice(0, -i.length);
    const f = e.push("link_open", "a", 1);
    f.attrs = [["href", l]], f.markup = "linkify", f.info = "auto";
    const d = e.push("text", "", 0);
    d.content = e.md.normalizeLinkText(o);
    const _ = e.push("link_close", "a", -1);
    _.markup = "linkify", _.info = "auto";
  }
  return e.pos += o.length - i.length, !0;
}
function C0(e, u) {
  let t = e.pos;
  if (e.src.charCodeAt(t) !== 10)
    return !1;
  const n = e.pending.length - 1, r = e.posMax;
  if (!u)
    if (n >= 0 && e.pending.charCodeAt(n) === 32)
      if (n >= 1 && e.pending.charCodeAt(n - 1) === 32) {
        let i = n - 1;
        for (; i >= 1 && e.pending.charCodeAt(i - 1) === 32; ) i--;
        e.pending = e.pending.slice(0, i), e.push("hardbreak", "br", 0);
      } else
        e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
    else
      e.push("softbreak", "br", 0);
  for (t++; t < r && T(e.src.charCodeAt(t)); )
    t++;
  return e.pos = t, !0;
}
const du = [];
for (let e = 0; e < 256; e++)
  du.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  du[e.charCodeAt(0)] = 1;
});
function E0(e, u) {
  let t = e.pos;
  const n = e.posMax;
  if (e.src.charCodeAt(t) !== 92 || (t++, t >= n)) return !1;
  let r = e.src.charCodeAt(t);
  if (r === 10) {
    for (u || e.push("hardbreak", "br", 0), t++; t < n && (r = e.src.charCodeAt(t), !!T(r)); )
      t++;
    return e.pos = t, !0;
  }
  let i = e.src[t];
  if (r >= 55296 && r <= 56319 && t + 1 < n) {
    const o = e.src.charCodeAt(t + 1);
    o >= 56320 && o <= 57343 && (i += e.src[t + 1], t++);
  }
  const s = "\\" + i;
  if (!u) {
    const o = e.push("text_special", "", 0);
    r < 256 && du[r] !== 0 ? o.content = i : o.content = s, o.markup = s, o.info = "escape";
  }
  return e.pos = t + 1, !0;
}
function w0(e, u) {
  let t = e.pos;
  if (e.src.charCodeAt(t) !== 96)
    return !1;
  const r = t;
  t++;
  const i = e.posMax;
  for (; t < i && e.src.charCodeAt(t) === 96; )
    t++;
  const s = e.src.slice(r, t), o = s.length;
  if (e.backticksScanned && (e.backticks[o] || 0) <= r)
    return u || (e.pending += s), e.pos += o, !0;
  let c = t, l;
  for (; (l = e.src.indexOf("`", c)) !== -1; ) {
    for (c = l + 1; c < i && e.src.charCodeAt(c) === 96; )
      c++;
    const f = c - l;
    if (f === o) {
      if (!u) {
        const d = e.push("code_inline", "code", 0);
        d.markup = s, d.content = e.src.slice(t, l).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return e.pos = c, !0;
    }
    e.backticks[f] = l;
  }
  return e.backticksScanned = !0, u || (e.pending += s), e.pos += o, !0;
}
function A0(e, u) {
  const t = e.pos, n = e.src.charCodeAt(t);
  if (u || n !== 126)
    return !1;
  const r = e.scanDelims(e.pos, !0);
  let i = r.length;
  const s = String.fromCharCode(n);
  if (i < 2)
    return !1;
  let o;
  i % 2 && (o = e.push("text", "", 0), o.content = s, i--);
  for (let c = 0; c < i; c += 2)
    o = e.push("text", "", 0), o.content = s + s, e.delimiters.push({
      marker: n,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: e.tokens.length - 1,
      end: -1,
      open: r.can_open,
      close: r.can_close
    });
  return e.pos += r.length, !0;
}
function Ru(e, u) {
  let t;
  const n = [], r = u.length;
  for (let i = 0; i < r; i++) {
    const s = u[i];
    if (s.marker !== 126 || s.end === -1)
      continue;
    const o = u[s.end];
    t = e.tokens[s.token], t.type = "s_open", t.tag = "s", t.nesting = 1, t.markup = "~~", t.content = "", t = e.tokens[o.token], t.type = "s_close", t.tag = "s", t.nesting = -1, t.markup = "~~", t.content = "", e.tokens[o.token - 1].type === "text" && e.tokens[o.token - 1].content === "~" && n.push(o.token - 1);
  }
  for (; n.length; ) {
    const i = n.pop();
    let s = i + 1;
    for (; s < e.tokens.length && e.tokens[s].type === "s_close"; )
      s++;
    s--, i !== s && (t = e.tokens[s], e.tokens[s] = e.tokens[i], e.tokens[i] = t);
  }
}
function D0(e) {
  const u = e.tokens_meta, t = e.tokens_meta.length;
  Ru(e, e.delimiters);
  for (let n = 0; n < t; n++)
    u[n] && u[n].delimiters && Ru(e, u[n].delimiters);
}
const dt = {
  tokenize: A0,
  postProcess: D0
};
function v0(e, u) {
  const t = e.pos, n = e.src.charCodeAt(t);
  if (u || n !== 95 && n !== 42)
    return !1;
  const r = e.scanDelims(e.pos, n === 42);
  for (let i = 0; i < r.length; i++) {
    const s = e.push("text", "", 0);
    s.content = String.fromCharCode(n), e.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: n,
      // Total length of these series of delimiters.
      //
      length: r.length,
      // A position of the token this delimiter corresponds to.
      //
      token: e.tokens.length - 1,
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
  return e.pos += r.length, !0;
}
function qu(e, u) {
  const t = u.length;
  for (let n = t - 1; n >= 0; n--) {
    const r = u[n];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1)
      continue;
    const i = u[r.end], s = n > 0 && u[n - 1].end === r.end + 1 && // check that first two markers match and adjacent
    u[n - 1].marker === r.marker && u[n - 1].token === r.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    u[r.end + 1].token === i.token + 1, o = String.fromCharCode(r.marker), c = e.tokens[r.token];
    c.type = s ? "strong_open" : "em_open", c.tag = s ? "strong" : "em", c.nesting = 1, c.markup = s ? o + o : o, c.content = "";
    const l = e.tokens[i.token];
    l.type = s ? "strong_close" : "em_close", l.tag = s ? "strong" : "em", l.nesting = -1, l.markup = s ? o + o : o, l.content = "", s && (e.tokens[u[n - 1].token].content = "", e.tokens[u[r.end + 1].token].content = "", n--);
  }
}
function F0(e) {
  const u = e.tokens_meta, t = e.tokens_meta.length;
  qu(e, e.delimiters);
  for (let n = 0; n < t; n++)
    u[n] && u[n].delimiters && qu(e, u[n].delimiters);
}
const ht = {
  tokenize: v0,
  postProcess: F0
};
function S0(e, u) {
  let t, n, r, i, s = "", o = "", c = e.pos, l = !0;
  if (e.src.charCodeAt(e.pos) !== 91)
    return !1;
  const f = e.pos, d = e.posMax, _ = e.pos + 1, p = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (p < 0)
    return !1;
  let h = p + 1;
  if (h < d && e.src.charCodeAt(h) === 40) {
    for (l = !1, h++; h < d && (t = e.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
      ;
    if (h >= d)
      return !1;
    if (c = h, r = e.md.helpers.parseLinkDestination(e.src, h, e.posMax), r.ok) {
      for (s = e.md.normalizeLink(r.str), e.md.validateLink(s) ? h = r.pos : s = "", c = h; h < d && (t = e.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
        ;
      if (r = e.md.helpers.parseLinkTitle(e.src, h, e.posMax), h < d && c !== h && r.ok)
        for (o = r.str, h = r.pos; h < d && (t = e.src.charCodeAt(h), !(!T(t) && t !== 10)); h++)
          ;
    }
    (h >= d || e.src.charCodeAt(h) !== 41) && (l = !0), h++;
  }
  if (l) {
    if (typeof e.env.references > "u")
      return !1;
    if (h < d && e.src.charCodeAt(h) === 91 ? (c = h + 1, h = e.md.helpers.parseLinkLabel(e, h), h >= 0 ? n = e.src.slice(c, h++) : h = p + 1) : h = p + 1, n || (n = e.src.slice(_, p)), i = e.env.references[Re(n)], !i)
      return e.pos = f, !1;
    s = i.href, o = i.title;
  }
  if (!u) {
    e.pos = _, e.posMax = p;
    const y = e.push("link_open", "a", 1), w = [["href", s]];
    y.attrs = w, o && w.push(["title", o]), e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = h, e.posMax = d, !0;
}
function T0(e, u) {
  let t, n, r, i, s, o, c, l, f = "";
  const d = e.pos, _ = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91)
    return !1;
  const p = e.pos + 2, h = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (h < 0)
    return !1;
  if (i = h + 1, i < _ && e.src.charCodeAt(i) === 40) {
    for (i++; i < _ && (t = e.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
      ;
    if (i >= _)
      return !1;
    for (l = i, o = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), o.ok && (f = e.md.normalizeLink(o.str), e.md.validateLink(f) ? i = o.pos : f = ""), l = i; i < _ && (t = e.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
      ;
    if (o = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < _ && l !== i && o.ok)
      for (c = o.str, i = o.pos; i < _ && (t = e.src.charCodeAt(i), !(!T(t) && t !== 10)); i++)
        ;
    else
      c = "";
    if (i >= _ || e.src.charCodeAt(i) !== 41)
      return e.pos = d, !1;
    i++;
  } else {
    if (typeof e.env.references > "u")
      return !1;
    if (i < _ && e.src.charCodeAt(i) === 91 ? (l = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? r = e.src.slice(l, i++) : i = h + 1) : i = h + 1, r || (r = e.src.slice(p, h)), s = e.env.references[Re(r)], !s)
      return e.pos = d, !1;
    f = s.href, c = s.title;
  }
  if (!u) {
    n = e.src.slice(p, h);
    const y = [];
    e.md.inline.parse(
      n,
      e.md,
      e.env,
      y
    );
    const w = e.push("image", "img", 0), D = [["src", f], ["alt", ""]];
    w.attrs = D, w.children = y, w.content = n, c && D.push(["title", c]);
  }
  return e.pos = i, e.posMax = _, !0;
}
const B0 = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, R0 = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function q0(e, u) {
  let t = e.pos;
  if (e.src.charCodeAt(t) !== 60)
    return !1;
  const n = e.pos, r = e.posMax;
  for (; ; ) {
    if (++t >= r) return !1;
    const s = e.src.charCodeAt(t);
    if (s === 60) return !1;
    if (s === 62) break;
  }
  const i = e.src.slice(n + 1, t);
  if (R0.test(i)) {
    const s = e.md.normalizeLink(i);
    if (!e.md.validateLink(s))
      return !1;
    if (!u) {
      const o = e.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      const c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      const l = e.push("link_close", "a", -1);
      l.markup = "autolink", l.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  if (B0.test(i)) {
    const s = e.md.normalizeLink("mailto:" + i);
    if (!e.md.validateLink(s))
      return !1;
    if (!u) {
      const o = e.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      const c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      const l = e.push("link_close", "a", -1);
      l.markup = "autolink", l.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  return !1;
}
function I0(e) {
  return /^<a[>\s]/i.test(e);
}
function M0(e) {
  return /^<\/a\s*>/i.test(e);
}
function O0(e) {
  const u = e | 32;
  return u >= 97 && u <= 122;
}
function L0(e, u) {
  if (!e.md.options.html)
    return !1;
  const t = e.posMax, n = e.pos;
  if (e.src.charCodeAt(n) !== 60 || n + 2 >= t)
    return !1;
  const r = e.src.charCodeAt(n + 1);
  if (r !== 33 && r !== 63 && r !== 47 && !O0(r))
    return !1;
  const i = e.src.slice(n).match(d0);
  if (!i)
    return !1;
  if (!u) {
    const s = e.push("html_inline", "", 0);
    s.content = i[0], I0(s.content) && e.linkLevel++, M0(s.content) && e.linkLevel--;
  }
  return e.pos += i[0].length, !0;
}
const P0 = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, N0 = /^&([a-z][a-z0-9]{1,31});/i;
function z0(e, u) {
  const t = e.pos, n = e.posMax;
  if (e.src.charCodeAt(t) !== 38 || t + 1 >= n) return !1;
  if (e.src.charCodeAt(t + 1) === 35) {
    const i = e.src.slice(t).match(P0);
    if (i) {
      if (!u) {
        const s = i[1][0].toLowerCase() === "x" ? parseInt(i[1].slice(1), 16) : parseInt(i[1], 10), o = e.push("text_special", "", 0);
        o.content = lu(s) ? ve(s) : ve(65533), o.markup = i[0], o.info = "entity";
      }
      return e.pos += i[0].length, !0;
    }
  } else {
    const i = e.src.slice(t).match(N0);
    if (i) {
      const s = it(i[0]);
      if (s !== i[0]) {
        if (!u) {
          const o = e.push("text_special", "", 0);
          o.content = s, o.markup = i[0], o.info = "entity";
        }
        return e.pos += i[0].length, !0;
      }
    }
  }
  return !1;
}
function Iu(e) {
  const u = {}, t = e.length;
  if (!t) return;
  let n = 0, r = -2;
  const i = [];
  for (let s = 0; s < t; s++) {
    const o = e[s];
    if (i.push(0), (e[n].marker !== o.marker || r !== o.token - 1) && (n = s), r = o.token, o.length = o.length || 0, !o.close) continue;
    u.hasOwnProperty(o.marker) || (u[o.marker] = [-1, -1, -1, -1, -1, -1]);
    const c = u[o.marker][(o.open ? 3 : 0) + o.length % 3];
    let l = n - i[n] - 1, f = l;
    for (; l > c; l -= i[l] + 1) {
      const d = e[l];
      if (d.marker === o.marker && d.open && d.end < 0) {
        let _ = !1;
        if ((d.close || o.open) && (d.length + o.length) % 3 === 0 && (d.length % 3 !== 0 || o.length % 3 !== 0) && (_ = !0), !_) {
          const p = l > 0 && !e[l - 1].open ? i[l - 1] + 1 : 0;
          i[s] = s - l + p, i[l] = p, o.open = !1, d.end = s, d.close = !1, f = -1, r = -2;
          break;
        }
      }
    }
    f !== -1 && (u[o.marker][(o.open ? 3 : 0) + (o.length || 0) % 3] = f);
  }
}
function U0(e) {
  const u = e.tokens_meta, t = e.tokens_meta.length;
  Iu(e.delimiters);
  for (let n = 0; n < t; n++)
    u[n] && u[n].delimiters && Iu(u[n].delimiters);
}
function H0(e) {
  let u, t, n = 0;
  const r = e.tokens, i = e.tokens.length;
  for (u = t = 0; u < i; u++)
    r[u].nesting < 0 && n--, r[u].level = n, r[u].nesting > 0 && n++, r[u].type === "text" && u + 1 < i && r[u + 1].type === "text" ? r[u + 1].content = r[u].content + r[u + 1].content : (u !== t && (r[t] = r[u]), t++);
  u !== t && (r.length = t);
}
const Ue = [
  ["text", x0],
  ["linkify", y0],
  ["newline", C0],
  ["escape", E0],
  ["backticks", w0],
  ["strikethrough", dt.tokenize],
  ["emphasis", ht.tokenize],
  ["link", S0],
  ["image", T0],
  ["autolink", q0],
  ["html_inline", L0],
  ["entity", z0]
], He = [
  ["balance_pairs", U0],
  ["strikethrough", dt.postProcess],
  ["emphasis", ht.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", H0]
];
function me() {
  this.ruler = new L();
  for (let e = 0; e < Ue.length; e++)
    this.ruler.push(Ue[e][0], Ue[e][1]);
  this.ruler2 = new L();
  for (let e = 0; e < He.length; e++)
    this.ruler2.push(He[e][0], He[e][1]);
}
me.prototype.skipToken = function(e) {
  const u = e.pos, t = this.ruler.getRules(""), n = t.length, r = e.md.options.maxNesting, i = e.cache;
  if (typeof i[u] < "u") {
    e.pos = i[u];
    return;
  }
  let s = !1;
  if (e.level < r) {
    for (let o = 0; o < n; o++)
      if (e.level++, s = t[o](e, !0), e.level--, s) {
        if (u >= e.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    e.pos = e.posMax;
  s || e.pos++, i[u] = e.pos;
};
me.prototype.tokenize = function(e) {
  const u = this.ruler.getRules(""), t = u.length, n = e.posMax, r = e.md.options.maxNesting;
  for (; e.pos < n; ) {
    const i = e.pos;
    let s = !1;
    if (e.level < r) {
      for (let o = 0; o < t; o++)
        if (s = u[o](e, !1), s) {
          if (i >= e.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (s) {
      if (e.pos >= n)
        break;
      continue;
    }
    e.pending += e.src[e.pos++];
  }
  e.pending && e.pushPending();
};
me.prototype.parse = function(e, u, t, n) {
  const r = new this.State(e, u, t, n);
  this.tokenize(r);
  const i = this.ruler2.getRules(""), s = i.length;
  for (let o = 0; o < s; o++)
    i[o](r);
};
me.prototype.State = be;
function Q0(e) {
  const u = {};
  e = e || {}, u.src_Any = et.source, u.src_Cc = ut.source, u.src_Z = nt.source, u.src_P = cu.source, u.src_ZPCc = [u.src_Z, u.src_P, u.src_Cc].join("|"), u.src_ZCc = [u.src_Z, u.src_Cc].join("|");
  const t = "[><｜]";
  return u.src_pseudo_letter = "(?:(?!" + t + "|" + u.src_ZPCc + ")" + u.src_Any + ")", u.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", u.src_auth = "(?:(?:(?!" + u.src_ZCc + "|[@/\\[\\]()]).)+@)?", u.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", u.src_host_terminator = "(?=$|" + t + "|" + u.src_ZPCc + ")(?!" + (e["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + u.src_ZPCc + "))", u.src_path = "(?:[/?#](?:(?!" + u.src_ZCc + "|" + t + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + u.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + u.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + u.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + u.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + u.src_ZCc + "|[']).)+\\'|\\'(?=" + u.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + u.src_ZCc + "|[.]|$)|" + (e["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  ",(?!" + u.src_ZCc + "|$)|;(?!" + u.src_ZCc + "|$)|\\!+(?!" + u.src_ZCc + "|[!]|$)|\\?(?!" + u.src_ZCc + "|[?]|$))+|\\/)?", u.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*', u.src_xn = "xn--[a-z0-9\\-]{1,59}", u.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + u.src_xn + "|" + u.src_pseudo_letter + "{1,63})", u.src_domain = "(?:" + u.src_xn + "|(?:" + u.src_pseudo_letter + ")|(?:" + u.src_pseudo_letter + "(?:-|" + u.src_pseudo_letter + "){0,61}" + u.src_pseudo_letter + "))", u.src_host = "(?:(?:(?:(?:" + u.src_domain + ")\\.)*" + u.src_domain + "))", u.tpl_host_fuzzy = "(?:" + u.src_ip4 + "|(?:(?:(?:" + u.src_domain + ")\\.)+(?:%TLDS%)))", u.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + u.src_domain + ")\\.)+(?:%TLDS%))", u.src_host_strict = u.src_host + u.src_host_terminator, u.tpl_host_fuzzy_strict = u.tpl_host_fuzzy + u.src_host_terminator, u.src_host_port_strict = u.src_host + u.src_port + u.src_host_terminator, u.tpl_host_port_fuzzy_strict = u.tpl_host_fuzzy + u.src_port + u.src_host_terminator, u.tpl_host_port_no_ip_fuzzy_strict = u.tpl_host_no_ip_fuzzy + u.src_port + u.src_host_terminator, u.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + u.src_ZPCc + "|>|$))", u.tpl_email_fuzzy = "(^|" + t + '|"|\\(|' + u.src_ZCc + ")(" + u.src_email_name + "@" + u.tpl_host_fuzzy_strict + ")", u.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + u.src_ZPCc + "))((?![$+<=>^`|｜])" + u.tpl_host_port_fuzzy_strict + u.src_path + ")", u.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  "(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|" + u.src_ZPCc + "))((?![$+<=>^`|｜])" + u.tpl_host_port_no_ip_fuzzy_strict + u.src_path + ")", u;
}
function $e(e) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
    t && Object.keys(t).forEach(function(n) {
      e[n] = t[n];
    });
  }), e;
}
function Ie(e) {
  return Object.prototype.toString.call(e);
}
function V0(e) {
  return Ie(e) === "[object String]";
}
function j0(e) {
  return Ie(e) === "[object Object]";
}
function Z0(e) {
  return Ie(e) === "[object RegExp]";
}
function Mu(e) {
  return Ie(e) === "[object Function]";
}
function W0(e) {
  return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const pt = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function G0(e) {
  return Object.keys(e || {}).reduce(function(u, t) {
    return u || pt.hasOwnProperty(t);
  }, !1);
}
const K0 = {
  "http:": {
    validate: function(e, u, t) {
      const n = e.slice(u);
      return t.re.http || (t.re.http = new RegExp(
        "^\\/\\/" + t.re.src_auth + t.re.src_host_port_strict + t.re.src_path,
        "i"
      )), t.re.http.test(n) ? n.match(t.re.http)[0].length : 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(e, u, t) {
      const n = e.slice(u);
      return t.re.no_http || (t.re.no_http = new RegExp(
        "^" + t.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        "(?:localhost|(?:(?:" + t.re.src_domain + ")\\.)+" + t.re.src_domain_root + ")" + t.re.src_port + t.re.src_host_terminator + t.re.src_path,
        "i"
      )), t.re.no_http.test(n) ? u >= 3 && e[u - 3] === ":" || u >= 3 && e[u - 3] === "/" ? 0 : n.match(t.re.no_http)[0].length : 0;
    }
  },
  "mailto:": {
    validate: function(e, u, t) {
      const n = e.slice(u);
      return t.re.mailto || (t.re.mailto = new RegExp(
        "^" + t.re.src_email_name + "@" + t.re.src_host_strict,
        "i"
      )), t.re.mailto.test(n) ? n.match(t.re.mailto)[0].length : 0;
    }
  }
}, J0 = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", Y0 = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function X0(e) {
  e.__index__ = -1, e.__text_cache__ = "";
}
function $0(e) {
  return function(u, t) {
    const n = u.slice(t);
    return e.test(n) ? n.match(e)[0].length : 0;
  };
}
function Ou() {
  return function(e, u) {
    u.normalize(e);
  };
}
function Fe(e) {
  const u = e.re = Q0(e.__opts__), t = e.__tlds__.slice();
  e.onCompile(), e.__tlds_replaced__ || t.push(J0), t.push(u.src_xn), u.src_tlds = t.join("|");
  function n(o) {
    return o.replace("%TLDS%", u.src_tlds);
  }
  u.email_fuzzy = RegExp(n(u.tpl_email_fuzzy), "i"), u.link_fuzzy = RegExp(n(u.tpl_link_fuzzy), "i"), u.link_no_ip_fuzzy = RegExp(n(u.tpl_link_no_ip_fuzzy), "i"), u.host_fuzzy_test = RegExp(n(u.tpl_host_fuzzy_test), "i");
  const r = [];
  e.__compiled__ = {};
  function i(o, c) {
    throw new Error('(LinkifyIt) Invalid schema "' + o + '": ' + c);
  }
  Object.keys(e.__schemas__).forEach(function(o) {
    const c = e.__schemas__[o];
    if (c === null)
      return;
    const l = { validate: null, link: null };
    if (e.__compiled__[o] = l, j0(c)) {
      Z0(c.validate) ? l.validate = $0(c.validate) : Mu(c.validate) ? l.validate = c.validate : i(o, c), Mu(c.normalize) ? l.normalize = c.normalize : c.normalize ? i(o, c) : l.normalize = Ou();
      return;
    }
    if (V0(c)) {
      r.push(o);
      return;
    }
    i(o, c);
  }), r.forEach(function(o) {
    e.__compiled__[e.__schemas__[o]] && (e.__compiled__[o].validate = e.__compiled__[e.__schemas__[o]].validate, e.__compiled__[o].normalize = e.__compiled__[e.__schemas__[o]].normalize);
  }), e.__compiled__[""] = { validate: null, normalize: Ou() };
  const s = Object.keys(e.__compiled__).filter(function(o) {
    return o.length > 0 && e.__compiled__[o];
  }).map(W0).join("|");
  e.re.schema_test = RegExp("(^|(?!_)(?:[><｜]|" + u.src_ZPCc + "))(" + s + ")", "i"), e.re.schema_search = RegExp("(^|(?!_)(?:[><｜]|" + u.src_ZPCc + "))(" + s + ")", "ig"), e.re.schema_at_start = RegExp("^" + e.re.schema_search.source, "i"), e.re.pretest = RegExp(
    "(" + e.re.schema_test.source + ")|(" + e.re.host_fuzzy_test.source + ")|@",
    "i"
  ), X0(e);
}
function ei(e, u) {
  const t = e.__index__, n = e.__last_index__, r = e.__text_cache__.slice(t, n);
  this.schema = e.__schema__.toLowerCase(), this.index = t + u, this.lastIndex = n + u, this.raw = r, this.text = r, this.url = r;
}
function eu(e, u) {
  const t = new ei(e, u);
  return e.__compiled__[t.schema].normalize(t, e), t;
}
function P(e, u) {
  if (!(this instanceof P))
    return new P(e, u);
  u || G0(e) && (u = e, e = {}), this.__opts__ = $e({}, pt, u), this.__index__ = -1, this.__last_index__ = -1, this.__schema__ = "", this.__text_cache__ = "", this.__schemas__ = $e({}, K0, e), this.__compiled__ = {}, this.__tlds__ = Y0, this.__tlds_replaced__ = !1, this.re = {}, Fe(this);
}
P.prototype.add = function(u, t) {
  return this.__schemas__[u] = t, Fe(this), this;
};
P.prototype.set = function(u) {
  return this.__opts__ = $e(this.__opts__, u), this;
};
P.prototype.test = function(u) {
  if (this.__text_cache__ = u, this.__index__ = -1, !u.length)
    return !1;
  let t, n, r, i, s, o, c, l, f;
  if (this.re.schema_test.test(u)) {
    for (c = this.re.schema_search, c.lastIndex = 0; (t = c.exec(u)) !== null; )
      if (i = this.testSchemaAt(u, t[2], c.lastIndex), i) {
        this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + i;
        break;
      }
  }
  return this.__opts__.fuzzyLink && this.__compiled__["http:"] && (l = u.search(this.re.host_fuzzy_test), l >= 0 && (this.__index__ < 0 || l < this.__index__) && (n = u.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null && (s = n.index + n[1].length, (this.__index__ < 0 || s < this.__index__) && (this.__schema__ = "", this.__index__ = s, this.__last_index__ = n.index + n[0].length))), this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && (f = u.indexOf("@"), f >= 0 && (r = u.match(this.re.email_fuzzy)) !== null && (s = r.index + r[1].length, o = r.index + r[0].length, (this.__index__ < 0 || s < this.__index__ || s === this.__index__ && o > this.__last_index__) && (this.__schema__ = "mailto:", this.__index__ = s, this.__last_index__ = o))), this.__index__ >= 0;
};
P.prototype.pretest = function(u) {
  return this.re.pretest.test(u);
};
P.prototype.testSchemaAt = function(u, t, n) {
  return this.__compiled__[t.toLowerCase()] ? this.__compiled__[t.toLowerCase()].validate(u, n, this) : 0;
};
P.prototype.match = function(u) {
  const t = [];
  let n = 0;
  this.__index__ >= 0 && this.__text_cache__ === u && (t.push(eu(this, n)), n = this.__last_index__);
  let r = n ? u.slice(n) : u;
  for (; this.test(r); )
    t.push(eu(this, n)), r = r.slice(this.__last_index__), n += this.__last_index__;
  return t.length ? t : null;
};
P.prototype.matchAtStart = function(u) {
  if (this.__text_cache__ = u, this.__index__ = -1, !u.length) return null;
  const t = this.re.schema_at_start.exec(u);
  if (!t) return null;
  const n = this.testSchemaAt(u, t[2], t[0].length);
  return n ? (this.__schema__ = t[2], this.__index__ = t.index + t[1].length, this.__last_index__ = t.index + t[0].length + n, eu(this, 0)) : null;
};
P.prototype.tlds = function(u, t) {
  return u = Array.isArray(u) ? u : [u], t ? (this.__tlds__ = this.__tlds__.concat(u).sort().filter(function(n, r, i) {
    return n !== i[r - 1];
  }).reverse(), Fe(this), this) : (this.__tlds__ = u.slice(), this.__tlds_replaced__ = !0, Fe(this), this);
};
P.prototype.normalize = function(u) {
  u.schema || (u.url = "http://" + u.url), u.schema === "mailto:" && !/^mailto:/i.test(u.url) && (u.url = "mailto:" + u.url);
};
P.prototype.onCompile = function() {
};
const ne = 2147483647, Q = 36, hu = 1, he = 26, ui = 38, ti = 700, bt = 72, mt = 128, _t = "-", ni = /^xn--/, ri = /[^\0-\x7F]/, ii = /[\x2E\u3002\uFF0E\uFF61]/g, si = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, Qe = Q - hu, V = Math.floor, Ve = String.fromCharCode;
function Y(e) {
  throw new RangeError(si[e]);
}
function oi(e, u) {
  const t = [];
  let n = e.length;
  for (; n--; )
    t[n] = u(e[n]);
  return t;
}
function gt(e, u) {
  const t = e.split("@");
  let n = "";
  t.length > 1 && (n = t[0] + "@", e = t[1]), e = e.replace(ii, ".");
  const r = e.split("."), i = oi(r, u).join(".");
  return n + i;
}
function xt(e) {
  const u = [];
  let t = 0;
  const n = e.length;
  for (; t < n; ) {
    const r = e.charCodeAt(t++);
    if (r >= 55296 && r <= 56319 && t < n) {
      const i = e.charCodeAt(t++);
      (i & 64512) == 56320 ? u.push(((r & 1023) << 10) + (i & 1023) + 65536) : (u.push(r), t--);
    } else
      u.push(r);
  }
  return u;
}
const ci = (e) => String.fromCodePoint(...e), ai = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : Q;
}, Lu = function(e, u) {
  return e + 22 + 75 * (e < 26) - ((u != 0) << 5);
}, kt = function(e, u, t) {
  let n = 0;
  for (e = t ? V(e / ti) : e >> 1, e += V(e / u); e > Qe * he >> 1; n += Q)
    e = V(e / Qe);
  return V(n + (Qe + 1) * e / (e + ui));
}, yt = function(e) {
  const u = [], t = e.length;
  let n = 0, r = mt, i = bt, s = e.lastIndexOf(_t);
  s < 0 && (s = 0);
  for (let o = 0; o < s; ++o)
    e.charCodeAt(o) >= 128 && Y("not-basic"), u.push(e.charCodeAt(o));
  for (let o = s > 0 ? s + 1 : 0; o < t; ) {
    const c = n;
    for (let f = 1, d = Q; ; d += Q) {
      o >= t && Y("invalid-input");
      const _ = ai(e.charCodeAt(o++));
      _ >= Q && Y("invalid-input"), _ > V((ne - n) / f) && Y("overflow"), n += _ * f;
      const p = d <= i ? hu : d >= i + he ? he : d - i;
      if (_ < p)
        break;
      const h = Q - p;
      f > V(ne / h) && Y("overflow"), f *= h;
    }
    const l = u.length + 1;
    i = kt(n - c, l, c == 0), V(n / l) > ne - r && Y("overflow"), r += V(n / l), n %= l, u.splice(n++, 0, r);
  }
  return String.fromCodePoint(...u);
}, Ct = function(e) {
  const u = [];
  e = xt(e);
  const t = e.length;
  let n = mt, r = 0, i = bt;
  for (const c of e)
    c < 128 && u.push(Ve(c));
  const s = u.length;
  let o = s;
  for (s && u.push(_t); o < t; ) {
    let c = ne;
    for (const f of e)
      f >= n && f < c && (c = f);
    const l = o + 1;
    c - n > V((ne - r) / l) && Y("overflow"), r += (c - n) * l, n = c;
    for (const f of e)
      if (f < n && ++r > ne && Y("overflow"), f === n) {
        let d = r;
        for (let _ = Q; ; _ += Q) {
          const p = _ <= i ? hu : _ >= i + he ? he : _ - i;
          if (d < p)
            break;
          const h = d - p, y = Q - p;
          u.push(
            Ve(Lu(p + h % y, 0))
          ), d = V(h / y);
        }
        u.push(Ve(Lu(d, 0))), i = kt(r, l, o === s), r = 0, ++o;
      }
    ++r, ++n;
  }
  return u.join("");
}, li = function(e) {
  return gt(e, function(u) {
    return ni.test(u) ? yt(u.slice(4).toLowerCase()) : u;
  });
}, fi = function(e) {
  return gt(e, function(u) {
    return ri.test(u) ? "xn--" + Ct(u) : u;
  });
}, Et = {
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
    decode: xt,
    encode: ci
  },
  decode: yt,
  encode: Ct,
  toASCII: fi,
  toUnicode: li
}, di = {
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
}, hi = {
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
}, pi = {
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
}, bi = {
  default: di,
  zero: hi,
  commonmark: pi
}, mi = /^(vbscript|javascript|file|data):/, _i = /^data:image\/(gif|png|jpeg|webp);/;
function gi(e) {
  const u = e.trim().toLowerCase();
  return mi.test(u) ? _i.test(u) : !0;
}
const wt = ["http:", "https:", "mailto:"];
function xi(e) {
  const u = ou(e, !0);
  if (u.hostname && (!u.protocol || wt.indexOf(u.protocol) >= 0))
    try {
      u.hostname = Et.toASCII(u.hostname);
    } catch {
    }
  return pe(su(u));
}
function ki(e) {
  const u = ou(e, !0);
  if (u.hostname && (!u.protocol || wt.indexOf(u.protocol) >= 0))
    try {
      u.hostname = Et.toUnicode(u.hostname);
    } catch {
    }
  return re(su(u), re.defaultChars + "%");
}
function z(e, u) {
  if (!(this instanceof z))
    return new z(e, u);
  u || au(e) || (u = e || {}, e = "default"), this.inline = new me(), this.block = new qe(), this.core = new fu(), this.renderer = new oe(), this.linkify = new P(), this.validateLink = gi, this.normalizeLink = xi, this.normalizeLinkText = ki, this.utils = Cr, this.helpers = Be({}, Dr), this.options = {}, this.configure(e), u && this.set(u);
}
z.prototype.set = function(e) {
  return Be(this.options, e), this;
};
z.prototype.configure = function(e) {
  const u = this;
  if (au(e)) {
    const t = e;
    if (e = bi[t], !e)
      throw new Error('Wrong `markdown-it` preset "' + t + '", check name');
  }
  if (!e)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return e.options && u.set(e.options), e.components && Object.keys(e.components).forEach(function(t) {
    e.components[t].rules && u[t].ruler.enableOnly(e.components[t].rules), e.components[t].rules2 && u[t].ruler2.enableOnly(e.components[t].rules2);
  }), this;
};
z.prototype.enable = function(e, u) {
  let t = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(r) {
    t = t.concat(this[r].ruler.enable(e, !0));
  }, this), t = t.concat(this.inline.ruler2.enable(e, !0));
  const n = e.filter(function(r) {
    return t.indexOf(r) < 0;
  });
  if (n.length && !u)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + n);
  return this;
};
z.prototype.disable = function(e, u) {
  let t = [];
  Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach(function(r) {
    t = t.concat(this[r].ruler.disable(e, !0));
  }, this), t = t.concat(this.inline.ruler2.disable(e, !0));
  const n = e.filter(function(r) {
    return t.indexOf(r) < 0;
  });
  if (n.length && !u)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + n);
  return this;
};
z.prototype.use = function(e) {
  const u = [this].concat(Array.prototype.slice.call(arguments, 1));
  return e.apply(e, u), this;
};
z.prototype.parse = function(e, u) {
  if (typeof e != "string")
    throw new Error("Input data should be a String");
  const t = new this.core.State(e, this, u);
  return this.core.process(t), t.tokens;
};
z.prototype.render = function(e, u) {
  return u = u || {}, this.renderer.render(this.parse(e, u), this.options, u);
};
z.prototype.parseInline = function(e, u) {
  const t = new this.core.State(e, this, u);
  return t.inlineMode = !0, this.core.process(t), t.tokens;
};
z.prototype.renderInline = function(e, u) {
  return u = u || {}, this.renderer.render(this.parseInline(e, u), this.options, u);
};
const yi = new z({
  html: !1,
  breaks: !0,
  linkify: !0
}), Ci = (e) => e ? yi.render(e) : "", Ei = (e) => e.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
var wi = a.from_html('<span class="chat-widget__thinking-pulse svelte-6zhkyr"></span>'), Ai = a.from_html('<details class="chat-widget__thinking svelte-6zhkyr"><summary class="chat-widget__thinking-summary svelte-6zhkyr"><div class="chat-widget__thinking-toggle svelte-6zhkyr"><svg class="chat-widget__thinking-chevron svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg> <span class="chat-widget__thinking-label svelte-6zhkyr"><svg class="chat-widget__thinking-icon svelte-6zhkyr" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg> Thinking <!></span></div></summary> <div class="chat-widget__thinking-content svelte-6zhkyr"><p class="chat-widget__thinking-text svelte-6zhkyr"> </p></div></details>');
function Di(e, u) {
  a.push(u, !0);
  var t = Ai(), n = a.child(t), r = a.child(n), i = a.sibling(a.child(r), 2), s = a.sibling(a.child(i), 2);
  {
    var o = (d) => {
      var _ = wi();
      a.append(d, _);
    };
    a.if(s, (d) => {
      u.thinking.isStreaming && d(o);
    });
  }
  a.reset(i), a.reset(r), a.reset(n);
  var c = a.sibling(n, 2), l = a.child(c), f = a.child(l, !0);
  a.reset(l), a.reset(c), a.reset(t), a.template_effect(() => {
    t.open = u.thinking.isStreaming, a.set_text(f, u.thinking.content);
  }), a.append(e, t), a.pop();
}
var vi = a.from_html('<div><div class="chat-widget__bubble-content svelte-1m4gqe"><!></div></div> <span> </span>', 1), Fi = a.from_html('<div><div class="chat-widget__message svelte-1m4gqe"><!> <!></div></div>');
function Si(e, u) {
  a.push(u, !0);
  var t = Fi();
  let n;
  var r = a.child(t), i = a.child(r);
  {
    var s = (l) => {
      Di(l, {
        get thinking() {
          return u.message.thinking;
        }
      });
    };
    a.if(i, (l) => {
      u.showThinking && u.message.thinking && u.message.from === "assistant" && l(s);
    });
  }
  var o = a.sibling(i, 2);
  {
    var c = (l) => {
      var f = vi(), d = a.first_child(f);
      let _;
      var p = a.child(d), h = a.child(p);
      a.html(h, () => Ci(u.message.text)), a.reset(p), a.reset(d);
      var y = a.sibling(d, 2);
      let w;
      var D = a.child(y, !0);
      a.reset(y), a.template_effect(
        (k) => {
          _ = a.set_class(d, 1, "chat-widget__bubble svelte-1m4gqe", null, _, {
            "chat-widget__bubble--user": u.message.from === "user",
            "chat-widget__bubble--assistant": u.message.from === "assistant",
            "chat-widget__bubble--system": u.message.from === "system"
          }), w = a.set_class(y, 1, "chat-widget__timestamp svelte-1m4gqe", null, w, {
            "chat-widget__timestamp--user": u.message.from === "user"
          }), a.set_text(D, k);
        },
        [() => Ei(u.message.timestamp)]
      ), a.append(l, f);
    };
    a.if(o, (l) => {
      u.message.text && l(c);
    });
  }
  a.reset(r), a.reset(t), a.template_effect(() => n = a.set_class(t, 1, "chat-widget__message-row svelte-1m4gqe", null, n, {
    "chat-widget__message-row--user": u.message.from === "user",
    "chat-widget__message-row--assistant": u.message.from === "assistant",
    "chat-widget__message-row--system": u.message.from === "system"
  })), a.append(e, t), a.pop();
}
var Ti = a.from_html('<div class="chat-widget__typing-dots svelte-gu507e" aria-label="Loading" aria-live="polite"><div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 0ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 160ms"></div> <div class="chat-widget__typing-dot svelte-gu507e" style="animation-delay: 320ms"></div></div>');
function Bi(e) {
  var u = Ti();
  a.append(e, u);
}
var Ri = a.from_html("<!> <!>", 1);
function qi(e, u) {
  var t = Ri(), n = a.first_child(t);
  a.each(n, 17, () => u.messages, (s) => s.id, (s, o) => {
    Si(s, {
      get message() {
        return a.get(o);
      },
      get showThinking() {
        return u.showThinking;
      }
    });
  });
  var r = a.sibling(n, 2);
  {
    var i = (s) => {
      Bi(s);
    };
    a.if(r, (s) => {
      u.isTyping && s(i);
    });
  }
  a.append(e, t);
}
var Ii = a.from_html('<button type="button"><span class="chat-widget__question-option-label svelte-11fq3uo"> </span> <span class="chat-widget__question-option-description svelte-11fq3uo"> </span></button>'), Mi = a.from_html('<button type="button" class="chat-widget__question-submit svelte-11fq3uo">Submit selection</button>'), Oi = a.from_html('<div class="chat-widget__question-panel svelte-11fq3uo"><p class="chat-widget__question-text svelte-11fq3uo"> </p> <div class="chat-widget__question-options svelte-11fq3uo"><!> <div class="chat-widget__question-option chat-widget__question-option--custom svelte-11fq3uo"><span class="chat-widget__question-option-label svelte-11fq3uo">Type your own answer</span> <div class="chat-widget__custom-input-row svelte-11fq3uo"><input type="text" class="chat-widget__custom-input svelte-11fq3uo" placeholder="Your answer..."/> <button type="button" class="chat-widget__custom-submit svelte-11fq3uo">Send</button></div></div></div> <!></div>');
function Li(e, u) {
  a.push(u, !0);
  let t = a.prop(u, "autoFocusFirst", 3, !1), n = a.state(a.proxy([])), r = a.state(""), i = a.state(void 0);
  const s = (g) => {
    var b;
    if (u.question.options.length === 0)
      return;
    const x = (g % u.question.options.length + u.question.options.length) % u.question.options.length;
    (b = a.get(n)[x]) == null || b.focus();
  }, o = (g, x, b) => {
    if (!g.isComposing) {
      if (g.key === "ArrowDown" || g.key === "ArrowRight") {
        g.preventDefault(), s(b + 1);
        return;
      }
      if (g.key === "ArrowUp" || g.key === "ArrowLeft") {
        g.preventDefault(), s(b - 1);
        return;
      }
      if (g.key === "Home") {
        g.preventDefault(), s(0);
        return;
      }
      if (g.key === "End") {
        g.preventDefault(), s(u.question.options.length - 1);
        return;
      }
      (g.key === "Enter" || g.key === " ") && (g.preventDefault(), u.onToggleAnswer(x));
    }
  }, c = () => {
    const g = a.get(r).trim();
    g && (u.onSubmitCustomAnswer(g), a.set(r, ""));
  }, l = (g) => {
    g.isComposing || g.key === "Enter" && (g.preventDefault(), c());
  };
  a.user_effect(() => {
    u.question, a.set(n, [], !0), a.set(r, "");
  }), a.user_effect(() => {
    var g;
    t() && (s(0), (g = u.onAutoFocusHandled) == null || g.call(u));
  });
  var f = Oi(), d = a.child(f), _ = a.child(d, !0);
  a.reset(d);
  var p = a.sibling(d, 2), h = a.child(p);
  a.each(h, 19, () => u.question.options, (g, x) => `${g.label}-${x}`, (g, x, b) => {
    const m = a.derived(() => An(a.get(x)));
    var A = Ii();
    let F;
    A.__click = () => u.onToggleAnswer(a.get(m)), A.__keydown = (B) => o(B, a.get(m), a.get(b));
    var O = a.child(A), K = a.child(O, !0);
    a.reset(O);
    var S = a.sibling(O, 2), M = a.child(S, !0);
    a.reset(S), a.reset(A), a.bind_this(A, (B, J) => a.get(n)[J] = B, (B) => {
      var J;
      return (J = a.get(n)) == null ? void 0 : J[B];
    }, () => [a.get(b)]), a.template_effect(
      (B) => {
        F = a.set_class(A, 1, "chat-widget__question-option svelte-11fq3uo", null, F, B), a.set_text(K, a.get(x).label), a.set_text(M, a.get(x).description);
      },
      [
        () => ({
          "chat-widget__question-option--selected": u.selectedAnswers.includes(a.get(m))
        })
      ]
    ), a.append(g, A);
  });
  var y = a.sibling(h, 2), w = a.sibling(a.child(y), 2), D = a.child(w);
  a.remove_input_defaults(D), D.__keydown = l, a.bind_this(D, (g) => a.set(i, g), () => a.get(i));
  var k = a.sibling(D, 2);
  k.__click = c, a.reset(w), a.reset(y), a.reset(p);
  var E = a.sibling(p, 2);
  {
    var C = (g) => {
      var x = Mi();
      x.__click = function(...b) {
        var m;
        (m = u.onSubmitAnswers) == null || m.apply(this, b);
      }, a.template_effect(() => x.disabled = u.selectedAnswers.length === 0), a.append(g, x);
    };
    a.if(E, (g) => {
      u.question.allowMultiple && g(C);
    });
  }
  a.reset(f), a.template_effect(
    (g) => {
      a.set_text(_, u.question.text), k.disabled = g;
    },
    [() => !a.get(r).trim()]
  ), a.bind_value(D, () => a.get(r), (g) => a.set(r, g)), a.append(e, f), a.pop();
}
a.delegate(["click", "keydown"]);
var Pi = a.from_html('<div role="presentation"><!> <div class="chat-widget__messages svelte-3vislt"><!></div> <footer class="chat-widget__footer svelte-3vislt"><!></footer></div>');
function ji(e, u) {
  a.push(u, !0);
  const t = {
    title: gu,
    placeholder: "Type a message",
    initialMessage: Ye,
    showThinking: !0,
    adapter: void 0
  };
  let n = a.prop(u, "primary", 3, "#0B57D0"), r = a.prop(u, "secondary", 3, "#4D5F7A"), i = a.prop(u, "darkMode", 3, !1);
  const s = a.derived(() => u.config ?? t), o = a.derived(() => {
    var m;
    return ((m = a.get(s)) == null ? void 0 : m.title) || gu;
  }), c = a.derived(() => `--chat-primary: ${n()}; --chat-secondary: ${r()};`), l = a.derived(() => {
    var m;
    return ((m = a.get(s)) == null ? void 0 : m.showThinking) ?? !0;
  }), f = a.derived(() => {
    var m;
    return ((m = a.get(s)) == null ? void 0 : m.placeholder) || "Type a message";
  });
  let d = a.state(void 0);
  const p = Dn({
    getConfig: () => a.get(s),
    getShowThinking: () => a.get(l),
    scrollToBottom: () => {
      a.get(d) && setTimeout(
        () => {
          a.get(d) && (a.get(d).scrollTop = a.get(d).scrollHeight);
        },
        50
      );
    }
  }), h = a.derived(() => !!p.state.streamingMessageId);
  a.user_effect(() => {
    p.syncConfig();
  });
  var y = Pi();
  let w;
  y.__keydown = (m) => m.stopPropagation(), y.__keyup = (m) => m.stopPropagation();
  var D = a.child(y);
  Sn(D, {
    get title() {
      return a.get(o);
    },
    get header() {
      return u.header;
    }
  });
  var k = a.sibling(D, 2), E = a.child(k);
  qi(E, {
    get messages() {
      return p.state.messages;
    },
    get showThinking() {
      return a.get(l);
    },
    get isTyping() {
      return p.state.isTyping;
    }
  }), a.reset(k), a.bind_this(k, (m) => a.set(d, m), () => a.get(d));
  var C = a.sibling(k, 2), g = a.child(C);
  {
    var x = (m) => {
      Li(m, {
        get question() {
          return p.state.pendingQuestion;
        },
        get selectedAnswers() {
          return p.state.selectedQuestionAnswers;
        },
        get autoFocusFirst() {
          return p.state.shouldFocusQuestion;
        },
        get onToggleAnswer() {
          return p.toggleQuestionAnswer;
        },
        get onSubmitAnswers() {
          return p.submitQuestionAnswers;
        },
        get onSubmitCustomAnswer() {
          return p.submitCustomAnswer;
        },
        get onAutoFocusHandled() {
          return p.clearQuestionFocusRequest;
        }
      });
    }, b = (m) => {
      {
        let A = a.derived(() => p.getSlashCommands());
        Mn(m, {
          get draft() {
            return p.state.draft;
          },
          get placeholder() {
            return a.get(f);
          },
          disabled: !1,
          get isStreaming() {
            return a.get(h);
          },
          get slashCommands() {
            return a.get(A);
          },
          get onDraftChange() {
            return p.setDraft;
          },
          get onSubmit() {
            return p.sendMessage;
          },
          get onCancel() {
            return p.cancelMessage;
          },
          onSlashCommand: (F) => p.executeSlashCommand(F.name)
        });
      }
    };
    a.if(g, (m) => {
      p.state.pendingQuestion ? m(x) : m(b, !1);
    });
  }
  a.reset(C), a.reset(y), a.template_effect(() => {
    w = a.set_class(y, 1, "chat-widget svelte-3vislt", null, w, { "chat-widget--dark": i() }), a.set_style(y, a.get(c));
  }), a.event("keypress", y, (m) => m.stopPropagation()), a.append(e, y), a.pop();
}
a.delegate(["keydown", "keyup"]);
export {
  ji as ChatWidget,
  Ye as DEFAULT_INITIAL_MESSAGE,
  gu as DEFAULT_TITLE,
  Hi as MockAdapter,
  Vi as SocketIOAdapter
};
