import { JobTask } from '../types/job-tasks';

export type Card = {
  classification: string;
  jobTask: JobTask;
  title: string;
  text: string;
  percentage: number;
  order: number;
  tags: string[];
};

const pastelColors = [
  '#ffebf0',
  '#e6f5ff',
  '#ffffe6',
  '#ebffeb',
  '#f5ebf5',
  '#fff0eb',
  '#ebfff0',
  '#faf5ff',
  '#fff5eb',
  '#f0ffff',
];

export const getNextPastelColor = (currentIndex: number): string => {
  return pastelColors[currentIndex % pastelColors.length];
};

export const getTruncatedPlainText = (
  html: string,
  maxLength: number
): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getSmartTruncatedHtmlPreview = (
  html: string,
  maxLength: number
): string => {
  if (!html) return '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';

  if (textContent.length <= maxLength) {
    return html;
  } else {
    const truncatedText = textContent.substring(0, maxLength) + '...';
    return truncatedText
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }
};
