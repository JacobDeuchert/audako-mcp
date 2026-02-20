import MarkdownIt from 'markdown-it';

const markdownRenderer = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

export const renderMessageMarkdown = (value: string): string => {
  if (!value) {
    return '';
  }

  return markdownRenderer.render(value);
};
