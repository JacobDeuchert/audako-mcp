<script lang="ts"></script>

<div class="chat-widget__typing-dots" aria-label="Loading" aria-live="polite">
  <div class="chat-widget__typing-dot" style="animation-delay: 0ms"></div>
  <div class="chat-widget__typing-dot" style="animation-delay: 160ms"></div>
  <div class="chat-widget__typing-dot" style="animation-delay: 320ms"></div>
</div>

<style>
  .chat-widget__typing-dots {
    display: flex;
    gap: 4px;
    padding: 4px 6px;
  }

  .chat-widget__typing-dot {
    animation: chat-widget-bounce 0.95s ease-in-out infinite;
    background: color-mix(in srgb, var(--md-outline) 50%, transparent);
    border-radius: 999px;
    height: 5px;
    width: 5px;
  }

  @keyframes chat-widget-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }

    40% {
      transform: translateY(-3px);
    }
  }
</style>
