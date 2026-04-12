<script lang="ts">
import '@mariozechner/pi-web-ui';
import type { SlashCommand } from '../../types';
import SlashCommandMenu from './SlashCommandMenu.svelte';

type MessageEditorElement = HTMLElement & {
  value: string;
  isStreaming: boolean;
  showAttachmentButton: boolean;
  showModelSelector: boolean;
  showThinkingSelector: boolean;
  onInput?: (value: string) => void;
  onSend?: (input: string, attachments: unknown[]) => void;
  onAbort?: () => void;
};

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

let editorElement = $state<MessageEditorElement | undefined>();
let editorTextarea = $state<HTMLTextAreaElement | undefined>();
let selectedCommandIndex = $state(0);
let preventedInitialAutofocus = false;

const slashQuery = $derived(
  draft.startsWith('/') ? draft.slice(1).toLowerCase() : null,
);

const filteredCommands = $derived(
  slashQuery !== null
    ? slashCommands.filter(command =>
        command.name.toLowerCase().startsWith(slashQuery),
      )
    : [],
);

const showSlashMenu = $derived(slashQuery !== null && filteredCommands.length > 0);

const focusEditor = () => {
  editorTextarea?.focus();
};

const selectSlashCommand = (command: SlashCommand) => {
  onSlashCommand?.(command);
  onDraftChange('');
  requestAnimationFrame(focusEditor);
};

const handleEditorInput = (value: string) => {
  onDraftChange(value);
};

const handleEditorSend = (_input: string, _attachments: unknown[]) => {
  if (showSlashMenu) {
    const command = filteredCommands[selectedCommandIndex];
    if (command) {
      selectSlashCommand(command);
    }
    return;
  }

  if (!draft.trim() || disabled) {
    return;
  }

  onSubmit();
};

const handleTextareaKeydown = (event: Event) => {
  const keyboardEvent = event as KeyboardEvent;

  if (keyboardEvent.isComposing || !showSlashMenu) {
    return;
  }

  if (keyboardEvent.key === 'ArrowDown') {
    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
    selectedCommandIndex = (selectedCommandIndex + 1) % filteredCommands.length;
    return;
  }

  if (keyboardEvent.key === 'ArrowUp') {
    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
    selectedCommandIndex =
      (selectedCommandIndex - 1 + filteredCommands.length) % filteredCommands.length;
    return;
  }

  if (keyboardEvent.key === 'Tab') {
    const command = filteredCommands[selectedCommandIndex];
    if (!command) {
      return;
    }

    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
    onDraftChange(`/${command.name}`);
    return;
  }

  if (keyboardEvent.key === 'Escape') {
    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
    onDraftChange('');
  }
};

const clearTextareaBinding = () => {
  if (!editorTextarea) {
    return;
  }

  editorTextarea.removeEventListener('keydown', handleTextareaKeydown, true);
  editorTextarea = undefined;
};

const syncTextarea = (nextPlaceholder: string, nextDisabled: boolean) => {
  const nextTextarea = editorElement?.querySelector('textarea') ?? undefined;

  if (!nextTextarea) {
    clearTextareaBinding();
    return;
  }

  if (editorTextarea !== nextTextarea) {
    clearTextareaBinding();
    editorTextarea = nextTextarea;
    editorTextarea.addEventListener('keydown', handleTextareaKeydown, true);
  }

  editorTextarea.classList.add('chat-widget__input');
  editorTextarea.disabled = nextDisabled;
  editorTextarea.placeholder = nextPlaceholder;

  if (!preventedInitialAutofocus) {
    preventedInitialAutofocus = true;
    requestAnimationFrame(() => {
      if (typeof document !== 'undefined' && document.activeElement === editorTextarea) {
        editorTextarea.blur();
      }
    });
  }
};

$effect(() => {
  filteredCommands;
  selectedCommandIndex = 0;
});

$effect(() => {
  if (!editorElement) {
    clearTextareaBinding();
    return;
  }

  if (editorElement.value !== draft) {
    editorElement.value = draft;
  }

  editorElement.isStreaming = isStreaming;
  editorElement.showAttachmentButton = false;
  editorElement.showModelSelector = false;
  editorElement.showThinkingSelector = false;
  editorElement.onInput = handleEditorInput;
  editorElement.onSend = handleEditorSend;
  editorElement.onAbort = onCancel;

  const nextPlaceholder = placeholder;
  const nextDisabled = disabled;
  queueMicrotask(() => {
    syncTextarea(nextPlaceholder, nextDisabled);
  });
});

$effect(() => {
  return () => {
    clearTextareaBinding();
  };
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

  <svelte:element
    this={'message-editor'}
    bind:this={editorElement}
    class="chat-widget__composer"
  />
</div>

<style>
  .chat-widget__composer-wrap {
    --background: var(--md-surface);
    --foreground: var(--md-on-surface);
    --card: var(--md-surface-bright);
    --card-foreground: var(--md-on-surface);
    --popover: var(--md-surface-bright);
    --popover-foreground: var(--md-on-surface);
    --primary: var(--md-primary);
    --primary-foreground: var(--md-on-primary);
    --secondary: var(--md-surface-container);
    --secondary-foreground: var(--md-on-surface);
    --muted: color-mix(in srgb, var(--md-surface-container) 92%, var(--md-surface));
    --muted-foreground: color-mix(in srgb, var(--md-on-surface-variant) 82%, transparent);
    --accent: color-mix(in srgb, var(--md-primary) 12%, var(--md-surface));
    --accent-foreground: var(--md-on-surface);
    --destructive: #c62828;
    --destructive-foreground: #ffffff;
    --border: color-mix(in srgb, var(--md-outline) 45%, transparent);
    --input: color-mix(in srgb, var(--md-outline) 55%, transparent);
    --ring: color-mix(in srgb, var(--md-outline) 70%, transparent);
    --sidebar: var(--md-surface);
    --sidebar-foreground: var(--md-on-surface);
    --sidebar-primary: var(--md-primary);
    --sidebar-primary-foreground: var(--md-on-primary);
    --sidebar-accent: var(--accent);
    --sidebar-accent-foreground: var(--accent-foreground);
    --sidebar-border: var(--border);
    --sidebar-ring: var(--ring);
    --radius: 1.25rem;
    --shadow-sm: var(--md-shadow-1);
    --shadow-xs: var(--md-shadow-1);
    --font-sans: inherit;
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
    display: block;
  }

  :global(.chat-widget__composer > div) {
    border-radius: 20px;
  }

  :global(.chat-widget__composer textarea) {
    font-family: inherit;
    font-size: 0.88rem;
    line-height: 1.45;
  }
</style>
