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
  // Optimized pastel palette: 10 colors evenly distributed at 36° intervals around the color wheel
  // All colors normalized to 98% lightness and 60% saturation for maximum distinction while maintaining pastel quality
  '#fdf7f7',
  '#fdfbf7',
  '#fcfdf7',
  '#f8fdf7',
  '#f7fdf9',
  '#f7fdfd',
  '#f7f9fd',
  '#f8f7fd',
  '#fcf7fd',
  '#fdf7fb',
  
  /* Old values kept for reference
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
  */
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
    // Smart truncation that preserves HTML structure
    return truncateHtmlContent(tempDiv, maxLength);
  }
};

const truncateHtmlContent = (element: Element, maxLength: number): string => {
  let currentLength = 0;
  const result: string[] = [];
  const tagStack: string[] = [];

  const processNode = (node: Node): boolean => {
    if (currentLength >= maxLength) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const remainingLength = maxLength - currentLength;

      if (text.length <= remainingLength) {
        result.push(text);
        currentLength += text.length;
        return true;
      } else {
        // Truncate text and add ellipsis
        const truncatedText = text.substring(0, remainingLength).trimEnd();
        result.push(truncatedText + '...');
        currentLength = maxLength;
        return false;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Open tag
      result.push(`<${tagName}`);

      // Add attributes if any
      if (element.attributes.length > 0) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          result.push(` ${attr.name}="${attr.value}"`);
        }
      }

      result.push('>');
      tagStack.push(tagName);

      // Process children
      for (let i = 0; i < node.childNodes.length; i++) {
        if (!processNode(node.childNodes[i])) {
          break;
        }
      }

      // Close tag
      result.push(`</${tagName}>`);
      tagStack.pop();

      return currentLength < maxLength;
    }

    return true;
  };

  // Process all child nodes
  for (let i = 0; i < element.childNodes.length; i++) {
    if (!processNode(element.childNodes[i])) {
      break;
    }
  }

  // Close any remaining open tags
  while (tagStack.length > 0) {
    const tag = tagStack.pop();
    result.push(`</${tag}>`);
  }

  return result.join('');
};
