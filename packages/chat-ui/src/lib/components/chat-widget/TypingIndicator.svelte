<script lang="ts">
</script>

<div class="chat-widget__typing-row">
  <div class="chat-widget__typing-bubble">
    <div class="chat-widget__typing-dots">
      <div class="chat-widget__typing-dot" style="animation-delay: 0ms"></div>
      <div class="chat-widget__typing-dot" style="animation-delay: 150ms"></div>
      <div class="chat-widget__typing-dot" style="animation-delay: 300ms"></div>
    </div>
  </div>
</div>

<style>
  .chat-widget__typing-row {
    display: flex;
    justify-content: flex-start;
  }

  .chat-widget__typing-bubble {
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 34%, transparent);
    border-radius: 18px;
    border-bottom-right-radius: 6px;
    box-shadow: var(--md-shadow-1);
    padding: 12px 16px;
  }

  .chat-widget__typing-dots {
    display: flex;
    gap: 5px;
  }

  .chat-widget__typing-dot {
    animation: chat-widget-bounce 0.95s ease-in-out infinite;
    background: color-mix(in srgb, var(--md-outline) 55%, transparent);
    border-radius: 999px;
    height: 7px;
    width: 7px;
  }

  @keyframes chat-widget-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }

    40% {
      transform: translateY(-2px);
    }
  }
</style>
