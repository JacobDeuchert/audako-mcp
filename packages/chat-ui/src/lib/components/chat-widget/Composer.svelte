<script lang="ts">
import type { SlashCommand } from '../../types';
import SlashCommandMenu from './SlashCommandMenu.svelte';

let {
  draft,
  placeholder,
  disabled,
  isStreaming = false,
  slashCommands = [] as SlashCommand[],
  onDraftChange,
  onSubmit,
  onCancel,
  onSlashCommand,
}: {
  draft: string;
  placeholder: string;
  disabled: boolean;
  isStreaming?: boolean;
  slashCommands?: SlashCommand[];
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onSlashCommand?: (command: SlashCommand) => void;
} = $props();

const MAX_TEXTAREA_HEIGHT = 160;

let textArea = $state<HTMLTextAreaElement | undefined>();
let selectedCommandIndex = $state(0);

const slashQuery = $derived(
  draft.startsWith('/') ? draft.slice(1).toLowerCase() : null,
);

const filteredCommands = $derived(
  slashQuery !== null
    ? slashCommands.filter(cmd =>
        cmd.name.toLowerCase().startsWith(slashQuery),
      )
    : [],
);

const showSlashMenu = $derived(slashQuery !== null && filteredCommands.length > 0);

const isSendDisabled = $derived(!draft.trim() || disabled || showSlashMenu);

// Reset selection when filtered list changes
$effect(() => {
  filteredCommands;
  selectedCommandIndex = 0;
});

const resizeTextarea = (element: HTMLTextAreaElement | undefined = textArea) => {
  if (!element) {
    return;
  }

  element.style.height = 'auto';
  const nextHeight = Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY = element.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
};

const selectSlashCommand = (command: SlashCommand) => {
  onSlashCommand?.(command);
  onDraftChange('');
};

const handleSubmit = (event: Event) => {
  event.preventDefault();

  if (showSlashMenu) {
    const command = filteredCommands[selectedCommandIndex];
    if (command) {
      selectSlashCommand(command);
    }
    return;
  }

  if (isSendDisabled) {
    return;
  }

  onSubmit();
};
const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return;
  }

  if (showSlashMenu) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedCommandIndex = (selectedCommandIndex + 1) % filteredCommands.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedCommandIndex =
        (selectedCommandIndex - 1 + filteredCommands.length) % filteredCommands.length;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const command = filteredCommands[selectedCommandIndex];
      if (command) {
        selectSlashCommand(command);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onDraftChange('');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const command = filteredCommands[selectedCommandIndex];
      if (command) {
        onDraftChange(`/${command.name}`);
      }
      return;
    }

    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    onCancel?.();
    return;
  }

  if (event.key !== 'Enter' || event.shiftKey) {
    return;
  }

  event.preventDefault();
  if (isSendDisabled) {
    return;
  }

  onSubmit();
};
const handleInput = (event: Event) => {
  const target = event.currentTarget as HTMLTextAreaElement;
  onDraftChange(target.value);
  resizeTextarea(target);
};

$effect(() => {
  draft;
  resizeTextarea();
});
</script>

<div class="chat-widget__composer-wrap">
  {#if showSlashMenu}
    <div class="chat-widget__slash-menu-anchor">
      <SlashCommandMenu
        commands={filteredCommands}
        selectedIndex={selectedCommandIndex}
        onSelect={selectSlashCommand}
      />
    </div>
  {/if}
  <form onsubmit={handleSubmit} class="chat-widget__composer">
    <div class="chat-widget__input-wrap">
      <textarea
        bind:this={textArea}
        class="chat-widget__input"
        {placeholder}
        value={draft}
        oninput={handleInput}
        onkeydown={handleInputKeydown}
        rows="1"
      ></textarea>
    </div>
    {#if isStreaming}
      <button
        type="button"
        class="chat-widget__send chat-widget__send--cancel"
        onclick={onCancel}
        title="Stop generating"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon" viewBox="0 0 20 20" fill="currentColor">
          <rect x="5" y="5" width="10" height="10" rx="1.5" />
        </svg>
      </button>
    {:else}
      <button
        type="submit"
        class="chat-widget__send"
        disabled={isSendDisabled}
        title="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="chat-widget__send-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    {/if}
  </form>
</div>

<style>
  .chat-widget__composer-wrap {
    position: relative;
  }

  .chat-widget__slash-menu-anchor {
    bottom: 100%;
    left: 0;
    padding-bottom: 6px;
    position: absolute;
    right: 0;
    z-index: 10;
  }

  .chat-widget__composer {
    align-items: flex-end;
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 45%, transparent);
    border-radius: 20px;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--md-outline) 12%, transparent);
    display: flex;
    gap: 8px;
    padding: 6px 8px 6px 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .chat-widget__input-wrap {
    display: flex;
    flex: 1;
  }

  .chat-widget__input {
    background: transparent;
    border: 0;
    color: var(--md-on-surface);
    display: block;
    font-family: inherit;
    font-size: 0.88rem;
    line-height: 1.45;
    max-height: 160px;
    min-height: 22px;
    overflow-y: hidden;
    padding: 7px 6px;
    resize: none;
    width: 100%;
  }

  .chat-widget__input::placeholder {
    color: color-mix(in srgb, var(--md-on-surface-variant) 72%, transparent);
  }

  .chat-widget__input:focus {
    outline: none;
  }

  .chat-widget__composer:focus-within {
    border-color: color-mix(in srgb, var(--md-outline) 70%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-outline) 20%, transparent);
  }

  .chat-widget__input:disabled {
    cursor: not-allowed;
    opacity: 0.64;
  }

  .chat-widget__send {
    align-self: flex-end;
    align-items: center;
    background: color-mix(in srgb, var(--md-surface) 92%, white);
    border: 1px solid color-mix(in srgb, var(--md-outline) 55%, transparent);
    border-radius: 999px;
    box-shadow: none;
    color: var(--md-primary);
    cursor: pointer;
    display: inline-flex;
    height: 36px;
    justify-content: center;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
    width: 36px;
  }

  .chat-widget__send:hover:enabled {
    background: color-mix(in srgb, var(--md-surface) 86%, white);
    border-color: color-mix(in srgb, var(--md-outline) 75%, transparent);
  }

  .chat-widget__send:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .chat-widget__send--cancel {
    background: color-mix(in srgb, var(--md-primary) 12%, var(--md-surface));
    border-color: color-mix(in srgb, var(--md-primary) 45%, transparent);
    color: var(--md-primary);
    opacity: 1;
  }

  .chat-widget__send--cancel:hover {
    background: color-mix(in srgb, var(--md-primary) 20%, var(--md-surface));
    border-color: color-mix(in srgb, var(--md-primary) 65%, transparent);
  }

  .chat-widget__send-icon {
    height: 18px;
    width: 18px;
  }
</style>
