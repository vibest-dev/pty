Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_events = require("node:events");
let node_fs_promises = require("node:fs/promises");
let node_net = require("node:net");
node_net = __toESM(node_net);
let node_child_process = require("node:child_process");
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_url = require("node:url");
let _msgpack_msgpack = require("@msgpack/msgpack");

//#region src/daemon.ts
const DEFAULT_SOCKET_PATH = "/tmp/rust-pty.sock";
const DEFAULT_TOKEN_PATH = "/tmp/rust-pty.token";
function packageRootFromModule() {
	const here = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
	return node_path.default.resolve(here, "..");
}
function isExecutableFile(candidate) {
	try {
		return node_fs.default.statSync(candidate).isFile();
	} catch {
		return false;
	}
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function resolveBinaryPath(options = {}) {
	const override = (options.env ?? process.env).PTY_DAEMON_PATH;
	if (override && isExecutableFile(override)) return override;
	const root = options.packageRoot ?? packageRootFromModule();
	const candidate = node_path.default.join(root, "bin", "vibest-pty-daemon");
	if (isExecutableFile(candidate)) return candidate;
	return null;
}
function isDaemonReady(socketPath, tokenPath) {
	return node_fs.default.existsSync(socketPath) && node_fs.default.existsSync(tokenPath);
}
async function waitForDaemonReady(child, socketPath, tokenPath, timeoutMs) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		if (isDaemonReady(socketPath, tokenPath)) return;
		if (child.exitCode !== null) throw new Error(`daemon exited early with code ${child.exitCode}`);
		await sleep(25);
	}
	throw new Error(`daemon startup timeout after ${timeoutMs}ms`);
}
async function ensureDaemonRunning(options = {}) {
	const socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
	const tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
	if (node_fs.default.existsSync(socketPath)) return null;
	const env = {
		...process.env,
		...options.env,
		RUST_PTY_SOCKET_PATH: socketPath,
		RUST_PTY_TOKEN_PATH: tokenPath
	};
	const binaryPath = options.binaryPath ?? resolveBinaryPath({ env });
	if (!binaryPath) throw new Error("daemon binary not found (set PTY_DAEMON_PATH or install platform package)");
	const child = (0, node_child_process.spawn)(binaryPath, [], {
		env,
		stdio: "ignore",
		detached: false
	});
	await waitForDaemonReady(child, socketPath, tokenPath, options.timeoutMs ?? 5e3);
	return child;
}
async function stopDaemon(child) {
	if (!child) return;
	if (child.exitCode !== null) return;
	await new Promise((resolve) => {
		let finished = false;
		const finish = () => {
			if (finished) return;
			finished = true;
			resolve();
		};
		const termTimer = setTimeout(() => {
			if (child.exitCode === null) child.kill("SIGKILL");
			const killTimer = setTimeout(() => finish(), 1e3);
			child.once("exit", () => {
				clearTimeout(killTimer);
				finish();
			});
		}, 2e3);
		child.once("exit", () => {
			clearTimeout(termTimer);
			finish();
		});
		child.kill("SIGTERM");
	});
}

//#endregion
//#region src/frame.ts
const DEFAULT_MAX_FRAME_SIZE = 64 * 1024 * 1024;
const DEFAULT_MAX_BUFFER_SIZE = 128 * 1024 * 1024;
var FrameParserError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "FrameParserError";
	}
};
function encodeFrame(message) {
	const payload = (0, _msgpack_msgpack.encode)(message);
	const frame = new Uint8Array(4 + payload.length);
	new DataView(frame.buffer, frame.byteOffset, frame.byteLength).setUint32(0, payload.length, false);
	frame.set(payload, 4);
	return frame;
}
var FrameParser = class {
	buffer = new Uint8Array(0);
	maxFrameSize;
	maxBufferSize;
	constructor(options = {}) {
		this.maxFrameSize = options.maxFrameSize ?? DEFAULT_MAX_FRAME_SIZE;
		this.maxBufferSize = options.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;
	}
	push(chunk) {
		const next = new Uint8Array(this.buffer.length + chunk.length);
		next.set(this.buffer);
		next.set(chunk, this.buffer.length);
		this.buffer = next;
		if (this.buffer.length > this.maxBufferSize) throw new FrameParserError(`Buffer size ${this.buffer.length} exceeds max ${this.maxBufferSize}`);
		const messages = [];
		while (this.buffer.length >= 4) {
			const len = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength).getUint32(0, false);
			if (len === 0) throw new FrameParserError("Invalid frame: length is 0");
			if (len > this.maxFrameSize) throw new FrameParserError(`Frame size ${len} exceeds max ${this.maxFrameSize}`);
			if (this.buffer.length < len + 4) break;
			const payload = this.buffer.slice(4, 4 + len);
			messages.push((0, _msgpack_msgpack.decode)(payload));
			this.buffer = this.buffer.slice(4 + len);
		}
		return messages;
	}
	reset() {
		this.buffer = new Uint8Array(0);
	}
};

//#endregion
//#region src/pending.ts
var PendingRequests = class {
	pending = /* @__PURE__ */ new Map();
	register(seq, timeoutMs) {
		return new Promise((resolve, reject) => {
			const entry = {
				resolve,
				reject
			};
			if (timeoutMs && timeoutMs > 0) entry.timer = setTimeout(() => {
				this.pending.delete(seq);
				reject(/* @__PURE__ */ new Error(`Request seq=${seq} timed out after ${timeoutMs}ms`));
			}, timeoutMs);
			this.pending.set(seq, entry);
		});
	}
	resolve(response) {
		const entry = this.pending.get(response.seq);
		if (!entry) return;
		this.pending.delete(response.seq);
		if (entry.timer) clearTimeout(entry.timer);
		entry.resolve(response);
	}
	rejectAll(error) {
		for (const [seq, entry] of this.pending) {
			if (entry.timer) clearTimeout(entry.timer);
			entry.reject(error);
		}
		this.pending.clear();
	}
	get size() {
		return this.pending.size;
	}
};

//#endregion
//#region src/client.ts
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
function isHandshakeWireResponse(value) {
	if (!isRecord(value)) return false;
	return value.type === "handshake" && typeof value.protocol_version === "number" && typeof value.daemon_version === "string" && typeof value.daemon_pid === "number" && (typeof value.seq === "number" || typeof value.seq === "undefined");
}
function isDaemonOkResponse(value) {
	if (!isRecord(value)) return false;
	return value.type === "ok" && typeof value.seq === "number";
}
function isDaemonErrorResponse(value) {
	if (!isRecord(value)) return false;
	return value.type === "error" && typeof value.seq === "number" && typeof value.code === "string" && typeof value.message === "string";
}
function isOutputEvent(value) {
	if (!isRecord(value)) return false;
	return value.type === "output" && typeof value.session === "number" && value.data instanceof Uint8Array;
}
function isExitEvent(value) {
	if (!isRecord(value)) return false;
	return value.type === "exit" && typeof value.session === "number" && typeof value.code === "number" && (typeof value.signal === "number" || typeof value.signal === "undefined");
}
function isBackpressureWarningEvent(value) {
	if (!isRecord(value)) return false;
	return value.type === "backpressure_warning" && typeof value.session === "number" && typeof value.queue_size === "number" && typeof value.level === "string" && [
		"green",
		"yellow",
		"red"
	].includes(value.level);
}
var DaemonError = class extends Error {
	constructor(code, message) {
		super(`${code}: ${message}`);
		this.code = code;
		this.name = "DaemonError";
	}
};
var PtyDaemonClient = class extends node_events.EventEmitter {
	socket = null;
	parser = new FrameParser();
	pending = new PendingRequests();
	socketPath;
	token;
	tokenPath;
	protocolVersion;
	autoStart;
	requestTimeoutMs;
	daemonOptions;
	startedDaemon = null;
	pendingHandshakeSeq = null;
	handshakeResponse = null;
	handshakePromise = null;
	seq = 1;
	closed = false;
	processedCounts = /* @__PURE__ */ new Map();
	ackThreshold = 100;
	manualAckMode = false;
	constructor(options) {
		super();
		this.socketPath = options.socketPath;
		this.token = options.token;
		this.tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
		this.protocolVersion = options.protocolVersion ?? 1;
		this.autoStart = options.autoStart ?? true;
		this.requestTimeoutMs = options.requestTimeoutMs;
		this.daemonOptions = options.daemon ?? {};
		const flowControl = options.flowControl ?? {};
		this.ackThreshold = flowControl.ackThreshold ?? 100;
		this.manualAckMode = flowControl.manualAck ?? false;
		if (this.manualAckMode) this.ackThreshold = 0;
	}
	async waitForConnection() {
		if (this.autoStart) this.startedDaemon = await ensureDaemonRunning({
			...this.daemonOptions,
			socketPath: this.socketPath,
			tokenPath: this.tokenPath
		});
		await new Promise((resolve, reject) => {
			const socket = node_net.default.createConnection(this.socketPath, () => {
				this.socket = socket;
				resolve();
			});
			socket.once("error", (err) => {
				if (!this.socket) reject(err);
				else this.handleSocketError(err);
			});
			socket.on("data", (buf) => this.onData(buf));
			socket.on("close", () => this.handleSocketClose());
		});
		await this.handshake();
	}
	close() {
		if (this.closed) return;
		this.closed = true;
		this.pendingHandshakeSeq = null;
		this.handshakeResponse = null;
		this.handshakePromise = null;
		this.pending.rejectAll(/* @__PURE__ */ new Error("Client closed"));
		this.socket?.end();
		this.socket = null;
	}
	async shutdown() {
		this.close();
		await stopDaemon(this.startedDaemon);
		this.startedDaemon = null;
	}
	get isConnected() {
		return this.socket !== null && !this.closed;
	}
	get daemonProcess() {
		return this.startedDaemon;
	}
	async handshake(options) {
		if (this.handshakeResponse) return this.handshakeResponse;
		if (this.handshakePromise) return this.handshakePromise;
		this.handshakePromise = this.performHandshake(options);
		try {
			const reply = await this.handshakePromise;
			this.handshakeResponse = reply;
			return reply;
		} finally {
			this.handshakePromise = null;
		}
	}
	async performHandshake(options) {
		const token = this.token ?? await this.readTokenFromFile();
		this.token = token;
		const reply = await this.requestRaw({
			type: "handshake",
			token,
			protocol_version: this.protocolVersion
		}, options);
		if (reply.type === "error") throw new DaemonError(reply.code, reply.message);
		if (reply.type !== "handshake") throw new Error(`Expected handshake, got ${reply.type}`);
		return reply;
	}
	async create(options, reqOptions) {
		const ok = this.unwrapOk(await this.requestRaw({
			type: "create",
			...options
		}, reqOptions));
		return { session: this.requireSession(ok) };
	}
	async list(reqOptions) {
		const ok = this.unwrapOk(await this.requestRaw({ type: "list" }, reqOptions));
		return this.requireSessions(ok);
	}
	async attach(session, reqOptions) {
		const ok = this.unwrapOk(await this.requestRaw({
			type: "attach",
			session
		}, reqOptions));
		return {
			session: this.requireSession(ok),
			snapshot: this.requireSnapshot(ok)
		};
	}
	async detach(session, reqOptions) {
		this.unwrapOk(await this.requestRaw({
			type: "detach",
			session
		}, reqOptions));
	}
	async kill(session, reqOptions) {
		this.unwrapOk(await this.requestRaw({
			type: "kill",
			session
		}, reqOptions));
	}
	async killAll(reqOptions) {
		const ok = this.unwrapOk(await this.requestRaw({ type: "kill_all" }, reqOptions));
		return this.requireSession(ok);
	}
	input(session, data) {
		this.notifyRaw({
			type: "input",
			session,
			data
		});
	}
	write(session, data) {
		this.input(session, data);
	}
	resize(session, cols, rows) {
		this.notifyRaw({
			type: "resize",
			session,
			cols,
			rows
		});
	}
	async signal(session, signal, reqOptions) {
		this.unwrapOk(await this.requestRaw({
			type: "signal",
			session,
			signal
		}, reqOptions));
	}
	async clearScrollback(session, reqOptions) {
		this.unwrapOk(await this.requestRaw({
			type: "clear_scrollback",
			session
		}, reqOptions));
	}
	/**
	* Acknowledge processed messages for flow control
	* This helps the daemon track backpressure and prevent disconnections
	*/
	ack(session, count) {
		this.notifyRaw({
			type: "ack",
			session,
			count
		});
	}
	/**
	* Set the threshold for automatic ACKs (default: 100 messages)
	* Set to 0 to disable automatic ACKs
	*/
	setAckThreshold(threshold) {
		if (this.manualAckMode && threshold > 0) throw new Error("Cannot enable auto-ACK in manual ACK mode. Create client with manualAck: false");
		this.ackThreshold = threshold;
	}
	/**
	* Enable or disable manual ACK mode
	*/
	setManualAckMode(enabled) {
		this.manualAckMode = enabled;
		if (enabled) this.ackThreshold = 0;
		else if (this.ackThreshold === 0) this.ackThreshold = 100;
	}
	/**
	* Get current flow control configuration
	*/
	getFlowControlConfig() {
		return {
			ackThreshold: this.ackThreshold,
			manualAckMode: this.manualAckMode,
			pendingCounts: new Map(this.processedCounts)
		};
	}
	/**
	* Get pending message count for a specific session
	*/
	getPendingCount(sessionId) {
		return this.processedCounts.get(sessionId) ?? 0;
	}
	unwrapOk(reply) {
		if (reply.type === "error") throw new DaemonError(reply.code, reply.message);
		if (reply.type !== "ok") throw new Error(`Expected ok, got ${reply.type}`);
		return reply;
	}
	requireSession(ok) {
		if (typeof ok.session !== "number") throw new Error("Protocol error: missing ok.session");
		return ok.session;
	}
	requireSessions(ok) {
		if (!Array.isArray(ok.sessions)) throw new Error("Protocol error: missing ok.sessions");
		return ok.sessions;
	}
	requireSnapshot(ok) {
		if (!ok.snapshot) throw new Error("Protocol error: missing ok.snapshot");
		return ok.snapshot;
	}
	async requestRaw(request, options) {
		if (!this.socket || this.closed) throw new Error("Socket is not connected");
		const seq = this.nextSeq();
		const timeoutMs = options?.timeoutMs ?? this.requestTimeoutMs;
		if (request.type === "handshake") this.pendingHandshakeSeq = seq;
		const pendingPromise = this.pending.register(seq, timeoutMs);
		const payload = {
			...request,
			seq
		};
		this.socket.write(Buffer.from(encodeFrame(payload)));
		try {
			return await pendingPromise;
		} finally {
			if (request.type === "handshake") this.pendingHandshakeSeq = null;
		}
	}
	notifyRaw(request) {
		if (!this.socket || this.closed) throw new Error("Socket is not connected");
		const seq = this.nextSeq();
		const payload = {
			...request,
			seq
		};
		this.socket.write(Buffer.from(encodeFrame(payload)));
	}
	onData(buf) {
		try {
			const messages = this.parser.push(new Uint8Array(buf));
			for (const message of messages) {
				if (isHandshakeWireResponse(message)) {
					const seq = typeof message.seq === "number" ? message.seq : this.takePendingHandshakeSeq();
					if (typeof seq !== "number") {
						this.emit("error", /* @__PURE__ */ new Error("Protocol error: handshake response missing seq"));
						continue;
					}
					const reply = {
						...message,
						seq
					};
					this.pending.resolve(reply);
					continue;
				}
				if (isDaemonOkResponse(message) || isDaemonErrorResponse(message)) {
					this.pending.resolve(message);
					continue;
				}
				if (isOutputEvent(message)) {
					this.emit(message.type, message);
					if (this.ackThreshold > 0 && !this.manualAckMode) {
						const session = message.session;
						const count = (this.processedCounts.get(session) ?? 0) + 1;
						this.processedCounts.set(session, count);
						if (count >= this.ackThreshold) {
							this.ack(session, count);
							this.processedCounts.set(session, 0);
						}
					} else if (this.manualAckMode) {
						const session = message.session;
						const count = (this.processedCounts.get(session) ?? 0) + 1;
						this.processedCounts.set(session, count);
					}
					continue;
				}
				if (isExitEvent(message)) {
					this.emit(message.type, message);
					this.processedCounts.delete(message.session);
					continue;
				}
				if (isBackpressureWarningEvent(message)) this.emit("backpressure_warning", message);
			}
		} catch (err) {
			const error = err instanceof FrameParserError ? err : err instanceof Error ? err : new Error(String(err));
			this.emit("error", error);
			this.close();
		}
	}
	handleSocketError(err) {
		this.pendingHandshakeSeq = null;
		this.handshakeResponse = null;
		this.handshakePromise = null;
		this.pending.rejectAll(err);
		this.parser.reset();
		this.emit("error", err);
	}
	handleSocketClose() {
		this.pendingHandshakeSeq = null;
		this.handshakeResponse = null;
		this.handshakePromise = null;
		if (!this.closed) this.pending.rejectAll(/* @__PURE__ */ new Error("Socket closed unexpectedly"));
		this.parser.reset();
		this.socket = null;
		this.emit("close");
	}
	nextSeq() {
		return this.seq++;
	}
	takePendingHandshakeSeq() {
		const seq = this.pendingHandshakeSeq ?? void 0;
		this.pendingHandshakeSeq = null;
		return seq;
	}
	async readTokenFromFile() {
		return (await (0, node_fs_promises.readFile)(this.tokenPath, "utf8")).trim();
	}
};
function createClient(options) {
	return new PtyDaemonClient(options);
}

//#endregion
//#region src/server.ts
function createPtyClient(options) {
	return createClient(options);
}
async function createPty(options = {}) {
	const socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
	const tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
	const client = createPtyClient({
		...options,
		socketPath,
		tokenPath
	});
	await client.waitForConnection();
	const close = async () => {
		await client.shutdown();
	};
	return {
		client,
		daemon: {
			get process() {
				return client.daemonProcess;
			},
			socketPath,
			tokenPath,
			close
		},
		close,
		shutdown: close
	};
}

//#endregion
exports.DEFAULT_MAX_BUFFER_SIZE = DEFAULT_MAX_BUFFER_SIZE;
exports.DEFAULT_MAX_FRAME_SIZE = DEFAULT_MAX_FRAME_SIZE;
exports.DEFAULT_SOCKET_PATH = DEFAULT_SOCKET_PATH;
exports.DEFAULT_TOKEN_PATH = DEFAULT_TOKEN_PATH;
exports.DaemonError = DaemonError;
exports.FrameParser = FrameParser;
exports.FrameParserError = FrameParserError;
exports.PendingRequests = PendingRequests;
exports.PtyDaemonClient = PtyDaemonClient;
exports.createClient = createClient;
exports.createPty = createPty;
exports.createPtyClient = createPtyClient;
exports.encodeFrame = encodeFrame;
exports.ensureDaemonRunning = ensureDaemonRunning;
exports.isDaemonReady = isDaemonReady;
exports.resolveBinaryPath = resolveBinaryPath;
exports.stopDaemon = stopDaemon;