<template>
    <div class='legacy-chat'>
        <!-- Header -->
        <div class='legacy-header'>
            <div class='legacy-title'>
                <span class='legacy-hex'>⬡</span>
                <span>Legacy AI</span>
            </div>
            <div
                class='legacy-status'
                :class='wsState'
            >
                <span class='legacy-dot' />
                {{ wsState === 'open' ? 'Live' : wsState === 'connecting' ? 'Connecting…' : 'Offline' }}
            </div>
        </div>

        <!-- Messages -->
        <div
            ref='messagesEl'
            class='legacy-messages'
        >
            <div
                v-for='(msg, i) in messages'
                :key='i'
                class='legacy-msg'
                :class='msg.role'
            >
                <div
                    class='legacy-bubble'
                    v-html='renderMd(msg.text)'
                />
            </div>
            <div
                v-if='streaming'
                class='legacy-msg assistant'
            >
                <div
                    class='legacy-bubble streaming'
                    v-html='renderMd(streamBuf) + "<span class=cursor>▋</span>"'
                />
            </div>
            <div
                v-if='!messages.length && !streaming'
                class='legacy-empty'
            >
                <span class='legacy-hex-big'>⬡</span>
                <p>OneMind's sovereign AI.<br>Ask anything about the op.</p>
            </div>
        </div>

        <!-- Input -->
        <div class='legacy-input-row'>
            <textarea
                ref='inputEl'
                v-model='draft'
                class='legacy-input'
                placeholder='Message Legacy…'
                rows='1'
                :disabled='wsState !== "open" || streaming'
                @keydown.enter.exact.prevent='send'
                @input='autoResize'
            />
            <button
                class='legacy-send'
                :disabled='!draft.trim() || wsState !== "open" || streaming'
                @click='send'
            >
                <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                >
                    <path d='M2 21l21-9L2 3v7l15 2-15 2v7z'/>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

// ── WebSocket connection ─────────────────────────────────────────────────────
const WS_URL = (() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/api/omos/ai/ws`;
})();

type Message = { role: 'user' | 'assistant'; text: string };

const messages  = ref<Message[]>([]);
const draft     = ref('');
const streaming = ref(false);
const streamBuf = ref('');
const wsState   = ref<'connecting' | 'open' | 'closed'>('connecting');
const msgId     = ref(0);

const messagesEl = ref<HTMLElement | null>(null);
const inputEl    = ref<HTMLTextAreaElement | null>(null);

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
    wsState.value = 'connecting';
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        wsState.value = 'open';
    };

    ws.onmessage = (ev) => {
        try {
            const d = JSON.parse(ev.data);
            if (d.kind === 'chunk') {
                streaming.value = true;
                streamBuf.value += (d.text ?? '');
                scrollBottom();
            } else if (d.kind === 'done') {
                if (streamBuf.value) {
                    messages.value.push({ role: 'assistant', text: streamBuf.value });
                }
                streamBuf.value = '';
                streaming.value = false;
                scrollBottom();
            }
        } catch { /* ignore */ }
    };

    ws.onerror = () => { ws?.close(); };
    ws.onclose = () => {
        wsState.value = 'closed';
        reconnectTimer = setTimeout(connect, 3000);
    };
}

function send() {
    const text = draft.value.trim();
    if (!text || wsState.value !== 'open' || streaming.value) return;
    messages.value.push({ role: 'user', text });
    draft.value = '';
    nextTick(() => {
        autoResize();
        scrollBottom();
    });
    const id = String(++msgId.value);
    ws?.send(JSON.stringify({ kind: 'prompt', id, text, callsign: 'CloudTAK' }));
}

function scrollBottom() {
    nextTick(() => {
        if (messagesEl.value) {
            messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
        }
    });
}

function autoResize() {
    const el = inputEl.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Minimal markdown (bold, italic, inline code, line breaks) ────────────────
function renderMd(text: string): string {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

onMounted(connect);
onUnmounted(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
});
</script>

<style scoped>
.legacy-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--cloudtak-panel-bg, rgba(20,20,25,0.98));
    color: #e8eaf0;
    font-size: 13px;
}

/* Header */
.legacy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.legacy-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
}
.legacy-hex { color: #4a9eff; font-size: 18px; }
.legacy-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    opacity: 0.7;
}
.legacy-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #666;
}
.legacy-status.open .legacy-dot   { background: #4caf50; }
.legacy-status.open              { opacity: 1; color: #4caf50; }
.legacy-status.connecting .legacy-dot { background: #ff9800; }
.legacy-status.closed .legacy-dot { background: #f44336; }

/* Messages */
.legacy-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    scroll-behavior: smooth;
}
.legacy-messages::-webkit-scrollbar { width: 4px; }
.legacy-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

.legacy-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.3;
    text-align: center;
    gap: 8px;
}
.legacy-hex-big { font-size: 40px; color: #4a9eff; }
.legacy-empty p { font-size: 12px; line-height: 1.5; margin: 0; }

.legacy-msg { display: flex; }
.legacy-msg.user     { justify-content: flex-end; }
.legacy-msg.assistant { justify-content: flex-start; }

.legacy-bubble {
    max-width: 85%;
    padding: 8px 11px;
    border-radius: 12px;
    line-height: 1.55;
    word-break: break-word;
}
.legacy-msg.user .legacy-bubble {
    background: #1a6ef5;
    color: #fff;
    border-bottom-right-radius: 3px;
}
.legacy-msg.assistant .legacy-bubble {
    background: rgba(255,255,255,0.07);
    border-bottom-left-radius: 3px;
}
.legacy-bubble.streaming { opacity: 0.9; }
:deep(.cursor) {
    display: inline-block;
    animation: blink 0.8s step-end infinite;
    color: #4a9eff;
    font-weight: bold;
    margin-left: 1px;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
:deep(code) {
    background: rgba(0,0,0,0.35);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
}
:deep(strong) { color: #fff; }

/* Input */
.legacy-input-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding: 8px 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}
.legacy-input {
    flex: 1;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: #e8eaf0;
    padding: 8px 11px;
    font-size: 13px;
    resize: none;
    min-height: 36px;
    max-height: 120px;
    outline: none;
    line-height: 1.45;
    transition: border-color 0.15s;
}
.legacy-input:focus { border-color: #4a9eff; }
.legacy-input::placeholder { color: rgba(255,255,255,0.3); }
.legacy-input:disabled { opacity: 0.4; }

.legacy-send {
    background: #1a6ef5;
    border: none;
    border-radius: 9px;
    color: #fff;
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, opacity 0.15s;
}
.legacy-send:disabled { background: rgba(255,255,255,0.1); opacity: 0.4; cursor: default; }
.legacy-send:not(:disabled):hover { background: #1459cc; }
</style>
