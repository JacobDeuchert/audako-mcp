<script lang="ts">
import type { ChatQuestion } from '../../types';
import { getQuestionOptionValue } from '../../chat/utils/message';

let {
  question,
  selectedAnswers,
  autoFocusFirst = false,
  onToggleAnswer,
  onSubmitAnswers,
  onAutoFocusHandled,
}: {
  question: ChatQuestion;
  selectedAnswers: string[];
  autoFocusFirst?: boolean;
  onToggleAnswer: (optionValue: string) => void;
  onSubmitAnswers: () => void;
  onAutoFocusHandled?: () => void;
} = $props();

let optionButtons = $state<(HTMLButtonElement | undefined)[]>([]);

const focusOptionByIndex = (index: number) => {
  if (question.options.length === 0) {
    return;
  }

  const normalizedIndex =
    ((index % question.options.length) + question.options.length) % question.options.length;
  optionButtons[normalizedIndex]?.focus();
};

const handleOptionKeydown = (event: KeyboardEvent, optionValue: string, index: number) => {
  if (event.isComposing) {
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault();
    focusOptionByIndex(index + 1);
    return;
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault();
    focusOptionByIndex(index - 1);
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    focusOptionByIndex(0);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    focusOptionByIndex(question.options.length - 1);
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onToggleAnswer(optionValue);
  }
};

$effect(() => {
  question;
  optionButtons = [];
});

$effect(() => {
  if (!autoFocusFirst) {
    return;
  }

  focusOptionByIndex(0);
  onAutoFocusHandled?.();
});
</script>

<div class="chat-widget__question-panel">
  <p class="chat-widget__question-text">{question.text}</p>

  <div class="chat-widget__question-options">
    {#each question.options as option, index (`${option.value ?? option.label}-${index}`)}
      {@const optionValue = getQuestionOptionValue(option)}
      <button
        bind:this={optionButtons[index]}
        type="button"
        class="chat-widget__question-option"
        class:chat-widget__question-option--selected={selectedAnswers.includes(optionValue)}
        onclick={() => onToggleAnswer(optionValue)}
        onkeydown={(event) => handleOptionKeydown(event, optionValue, index)}
      >
        <span class="chat-widget__question-option-label">{option.label}</span>
        {#if option.description}
          <span class="chat-widget__question-option-description">{option.description}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if question.allowMultiple}
    <button
      type="button"
      class="chat-widget__question-submit"
      disabled={selectedAnswers.length === 0}
      onclick={onSubmitAnswers}
    >
      Submit selection
    </button>
  {/if}
</div>

<style>
  .chat-widget__question-panel {
    background: var(--md-surface-bright);
    border: 1px solid color-mix(in srgb, var(--md-outline) 35%, transparent);
    border-radius: 16px;
    display: grid;
    gap: 10px;
    padding: 12px;
  }

  .chat-widget__question-text {
    color: var(--md-on-surface);
    font-size: 0.86rem;
    font-weight: 500;
    line-height: 1.4;
    margin: 0;
  }

  .chat-widget__question-options {
    display: grid;
    gap: 8px;
  }

  .chat-widget__question-option {
    background: color-mix(in srgb, var(--md-surface) 94%, white);
    border: 1px solid color-mix(in srgb, var(--md-outline) 40%, transparent);
    border-radius: 12px;
    color: var(--md-on-surface);
    cursor: pointer;
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    text-align: left;
    transition: border-color 0.18s ease, background 0.18s ease;
  }

  .chat-widget__question-option:hover {
    background: color-mix(in srgb, var(--md-surface) 88%, white);
    border-color: color-mix(in srgb, var(--md-outline) 68%, transparent);
  }

  .chat-widget__question-option--selected {
    background: var(--md-primary-container);
    border-color: color-mix(in srgb, var(--md-primary) 48%, transparent);
  }

  .chat-widget__question-option-label {
    font-size: 0.83rem;
    font-weight: 600;
    line-height: 1.35;
  }

  .chat-widget__question-option-description {
    color: var(--md-on-surface-variant);
    font-size: 0.75rem;
    line-height: 1.35;
  }

  .chat-widget__question-submit {
    background: var(--md-primary-container);
    border: 1px solid color-mix(in srgb, var(--md-primary) 45%, transparent);
    border-radius: 10px;
    color: var(--md-on-primary-container);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    justify-self: start;
    padding: 8px 12px;
    transition: border-color 0.18s ease, opacity 0.18s ease;
  }

  .chat-widget__question-submit:hover:enabled {
    border-color: color-mix(in srgb, var(--md-primary) 66%, transparent);
  }

  .chat-widget__question-submit:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
</style>
