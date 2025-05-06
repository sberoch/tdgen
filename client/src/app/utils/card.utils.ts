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

export const truncateHtml = (html: string, maxLength: number): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const textContent = doc.body.textContent || '';

  if (textContent.length <= maxLength) {
    return html; // Return original HTML if it's short enough
  } else {
    // Fallback to truncated plain text if HTML is too long to display fully
    // This avoids breaking HTML structure with naive truncation.
    return getTruncatedPlainText(html, maxLength);
  }
};
