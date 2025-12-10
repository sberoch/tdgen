import { FormGroup } from '@angular/forms';
import {
  PDFAcroTerminal,
  PDFDocument,
  PDFForm,
  PDFWidgetAnnotation,
  rgb,
} from 'pdf-lib';
import { JobDescriptionTask } from '../../types/job-description-tasks';
import { ExportJobDescriptionForm } from '../../types/job-descriptions';

const FONT_SIZE = 12;

const lengthThresholdsForFontSizeChange: Record<string, number[]> = {
  'f.aufgabenbeschreibung.1': [500, 750],
  'f.beschreibung.1': [750, 900],
  'f.beschreibung.2': [900, 1050],
  'f.eingliederung.1': [300, 450],
  'f.beschaeftigter.1': [300, 450],
  'f.beschaeftigter.2': [300, 450],
  'f.beschaeftigter.3': [300, 450],
  'f.beschaeftigter.4': [300, 450],
  'f.ausbildung.1': [500, 625, 750],
  'f.ausbildung.2': [500, 625, 750],
  'f.fachkenntnisse.1': [600, 750, 900, 1100, 1500],
};

// Helper function to set font size for a PDF text field
export const setTextFieldFontSize = (
  acroField: PDFAcroTerminal,
  fontSize: number = FONT_SIZE,
  label: string,
  value: string | null | undefined
): void => {
  // Set font size by modifying the default appearance
  const currentDA = acroField.getDefaultAppearance();
  // Replace any existing font size with the specified size, or add it if none exists
  // The DA string format is like: "/FontName 12 Tf" where 12 is the font size
  let newDA;

  if (
    value &&
    lengthThresholdsForFontSizeChange[label] &&
    value.length > lengthThresholdsForFontSizeChange[label][0]
  ) {
    fontSize = 0; // Automatically adjust font size to fit the text
    acroField.setDefaultAppearance(`/Courier ${fontSize} Tf`);
    return;
  }

  if (currentDA) {
    // Replace existing font size (pattern: /FontName number Tf)
    newDA = currentDA.replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/, (match: string) => {
      const parts = match.split(' ');
      return `${parts[0]} ${fontSize} Tf`;
    });
    // If no font was found, append font size to existing DA
    if (newDA === currentDA && !currentDA.includes('Tf')) {
      newDA = currentDA + ` /Courier ${fontSize} Tf`;
    }
  } else {
    // If no DA exists, create a new one with the specified font size
    newDA = `/Courier ${fontSize} Tf`;
  }
  acroField.setDefaultAppearance(newDA);
};

const drawBlankCheckbox = (
  pdfDoc: PDFDocument,
  widget: PDFWidgetAnnotation,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const pageRef = widget.P();
  const page = pdfDoc.getPages().find((page) => page.ref === pageRef);

  if (page) {
    // Draw white rectangle with black border
    page.drawRectangle({
      x: x,
      y: y,
      width: width,
      height: height,
      color: rgb(1, 1, 1), // White fill
      borderColor: rgb(0, 0, 0), // Black border
      borderWidth: 1,
    });
  }
};

const drawXInCheckbox = (
  pdfDoc: PDFDocument,
  widget: PDFWidgetAnnotation,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const pageRef = widget.P();
  const page = pdfDoc.getPages().find((page) => page.ref === pageRef);

  if (page) {
    // Draw an "X" to mark the checkbox as checked
    page.drawText('X', {
      x: x + Math.abs(width) / 2 - 3,
      y: y + Math.abs(height) / 2 - 3,
      size: Math.min(Math.abs(width), Math.abs(height)) * 0.8,
      color: rgb(0, 0, 0),
    });
  }
};
// Fill checkboxes with an "X". We need to do this instead of checking them because PDF is misconfigured and all
// checkboxes have the same name but different exportvalue, making it impossible to check them using pdf-lib.
export const fillCheckboxes = async (
  drawMode: boolean,
  pdfDoc: PDFDocument,
  pdfForm: PDFForm,
  formData: FormGroup<ExportJobDescriptionForm>,
  bypassFormData: boolean = false
) => {
  if (bypassFormData) {
    return;
  }
  const checkboxes = ['f.kk.1', 'f.kk.2', 'f.kk.21', 'f.kk.22', 'f.kk.23'];
  for (const checkbox of checkboxes) {
    const field = pdfForm.getCheckBox(checkbox);
    field.enableReadOnly();
    field.uncheck();
  }

  const allFields = pdfForm.getFields();
  allFields.forEach((field) => {
    const fieldName = field.acroField.getFullyQualifiedName();

    if (fieldName && drawMode) {
      field.enableReadOnly();
      const widgets = field.acroField.getWidgets();
      widgets.forEach((field) => {
        const { x, y, width, height } = field.getRectangle();
        console.log({ x, y, width, height, fieldName });

        // Draw a rectangle around the field
        const pageRef = field.P();
        const page = pdfDoc.getPages().find((page) => page.ref === pageRef);
        if (page) {
          page.drawRectangle({
            x: x,
            y:
              fieldName && fieldName.toLowerCase().includes('f.beschreibung.1')
                ? 141.8
                : y,
            width: Math.abs(width),
            height: Math.abs(height),
            color: rgb(1, 1, 1),
          });
        }
      });
    }

    if (fieldName && checkboxes.includes(fieldName)) {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget) => {
        const { x, y, width, height } = widget.getRectangle();
        drawBlankCheckbox(pdfDoc, widget, x, y, width, height);

        if (fieldName === 'f.kk.1') {
          if (Math.abs(x - 62) < 1 && formData.value.einstellung) {
            drawXInCheckbox(pdfDoc, widget, x, y - 1, width, height);
          } else if (Math.abs(x - 223.8) < 1 && formData.value.versetzung) {
            drawXInCheckbox(pdfDoc, widget, x, 635.895, width, height);
          } else if (Math.abs(x - 370.2) < 1 && formData.value.umsetzung) {
            drawXInCheckbox(pdfDoc, widget, x, y - 1, width, height);
          }
        }

        if (fieldName === 'f.kk.2' && formData.value.aufgabenaderung) {
          drawXInCheckbox(pdfDoc, widget, x, y, width, height);
        }

        if (fieldName === 'f.kk.21' && formData.value.sonstigesCheckbox) {
          drawXInCheckbox(pdfDoc, widget, x, y, width, height);
        }

        if (fieldName === 'f.kk.22') {
          if (Math.abs(x - 311.8) < 1 && formData.value.disabled === 'yes') {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          } else if (
            Math.abs(x - 390.4) < 1 &&
            formData.value.disabled === 'no'
          ) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          }
        }

        if (fieldName === 'f.kk.23') {
          if (
            Math.abs(x - 61.8) < 1 &&
            formData.value.employmentScope === 'fulltime'
          ) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          } else if (
            Math.abs(x - 223.8) < 1 &&
            formData.value.employmentScope === 'parttime'
          ) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          }
        }
      });
    }
  });
};

/**
 * Generates the appropriate list item prefix (bullet or number) based on
 * the list type and nesting level.
 * @param context The current list processing context.
 * @returns The string prefix for the list item (e.g., "• ", "a. ").
 */
function getListPrefix(context: {
  indentLevel: number;
  listType: 'ul' | 'ol' | null;
  listCounter: number;
}): string {
  if (context.listType === 'ul') {
    // Cycle between • and - for unordered lists based on nesting depth
    return context.indentLevel % 2 === 1 ? '• ' : '- ';
  }

  if (context.listType === 'ol') {
    // Level 1: 1., 2., 3.
    // Level 2: a., b., c.
    // Level 3+: Revert to numbers
    if (context.indentLevel === 2) {
      // Convert number to a lowercase letter. 97 is the char code for 'a'.
      // This works for list counters 1-26.
      const letter = String.fromCharCode(96 + context.listCounter);
      return `${letter}. `;
    }
    // Default to standard numbering for all other levels
    return `${context.listCounter}. `;
  }

  return ''; // Should not happen in a list item
}

/**
 * Recursively traverses a DOM node and its children to generate plain text.
 */
function processNode(
  node: Node,
  context: {
    indentLevel: number;
    listType: 'ul' | 'ol' | null;
    listCounter: number;
  }
): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, ' ') || '';
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    let text = '';
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'ul':
      case 'ol':
        const listContext = {
          indentLevel: context.indentLevel + 1,
          listType: tagName as 'ul' | 'ol',
          listCounter: 1,
        };
        text += '\n';
        for (const child of Array.from(element.childNodes)) {
          text += processNode(child, listContext);
        }
        text += '\n';
        break;

      case 'li':
        const indentation = '  '.repeat(
          context.indentLevel > 0 ? context.indentLevel - 1 : 0
        );
        const prefix = getListPrefix(context);
        if (context.listType === 'ol') {
          context.listCounter++;
        }
        text += '\n' + indentation + prefix;
        for (const child of Array.from(element.childNodes)) {
          text += processNode(child, context);
        }
        break;

      case 'p':
      case 'div':
        text += '\n';
        for (const child of Array.from(element.childNodes)) {
          text += processNode(child, context);
        }
        text += '\n';
        break;

      case 'br':
        text += '\n';
        break;

      default:
        for (const child of Array.from(element.childNodes)) {
          text += processNode(child, context);
        }
        break;
    }
    return text;
  }

  return '';
}

/**
 * Main function to convert an HTML string to formatted plain text.
 * @param html The HTML string to convert.
 * @param domParser A DOMParser instance (required for browser/jsdom).
 * @returns The formatted plain text string.
 */
export function htmlToText(html: string, domParser: DOMParser): string {
  const sanitizedHtml = html.replace(/\n/g, '').replace(/>\s+</g, '><');
  const doc = domParser.parseFromString(sanitizedHtml, 'text/html');

  const initialContext = { indentLevel: 0, listType: null, listCounter: 1 };
  let result = processNode(doc.body, initialContext);

  result = result
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}

export const getParagraphNumbering = (
  textArray: [string, number, string][],
  prefix = '4.'
) => {
  return textArray.map((item, index) => `${prefix}${index + 1}`);
};

function textSplit(
  inputArray: [string, number, string][]
): JobTasksTextSplitResult {
  let numbering;
  let resArray: [string, number, string][] = [];
  if (inputArray.length === 0)
    return {
      group1: '',
      group2: '',
      stats1: '',
      stats2: '',
    };

  if (inputArray.length === 1) {
    numbering = getParagraphNumbering(inputArray);
    const [text, value, title] = inputArray[0];

    let parts = text.split(/\n\s*\n/);

    if (parts.length === 1) {
      parts = text.split(/(?<=[.!?])\s+/);

      if (parts.length === 1) {
        const midpoint = Math.floor(text.length / 2);
        let splitIndex = text.indexOf(' ', midpoint);
        if (splitIndex === -1 || splitIndex > midpoint * 1.5) {
          splitIndex = midpoint;
        }

        parts = [text.substring(0, splitIndex), text.substring(splitIndex)];
      }
    }

    // Find the best split point to create balanced parts
    // while maintaining the original order
    let bestSplitIndex = 0;
    let bestDifference = Infinity;
    let totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    let targetLength = totalLength / 2;
    let currentLength = 0;

    // Find the split point that creates the most balanced division
    for (let i = 0; i < parts.length; i++) {
      currentLength += parts[i].length;
      const difference = Math.abs(currentLength - targetLength);

      if (difference < bestDifference) {
        bestDifference = difference;
        bestSplitIndex = i + 1; // Split after this index
      }
    }

    // Combine parts according to the best split point
    const firstPart =
      numbering[0] +
      ' ' +
      title +
      ' (' +
      value +
      ' %)\n\n' +
      parts.slice(0, bestSplitIndex).join('\n\n');
    const secondPart =
      numbering[0] +
      ' ' +
      title +
      ' (' +
      value +
      ' %) (Fortsetzung)\n\n' +
      parts.slice(bestSplitIndex).join('\n\n');

    return {
      group1: firstPart.trim(),
      group2: secondPart.trim(),
      stats1: value.toString(),
      stats2: value.toString(),
    };
  }

  // Case 2: Multiple elements
  let statsArray: string[] = [];

  // Calculate total text length and individual text lengths
  let totalLength = 0;
  const items = inputArray.map(([text, value, title], index) => {
    const length = text.length;
    totalLength += length;
    resArray[index] = [text, value, title];
    return { text, value, title, length, index };
  });

  numbering = getParagraphNumbering(items as any[]);

  // Find the optimal split point
  let bestSplitIndex = 0;
  let bestDifference = Infinity;
  let currentLength = 0;
  const targetLength = totalLength / 2;

  for (let i = 0; i < items.length; i++) {
    currentLength += items[i].length;
    const difference = Math.abs(currentLength - targetLength);

    if (difference < bestDifference) {
      bestDifference = difference;
      bestSplitIndex = i + 1;
    }

    resArray[i][0] =
      numbering[i] +
      ' ' +
      resArray[i][2] +
      ' (' +
      resArray[i][1] +
      ' %)\n\n' +
      resArray[i][0];
    statsArray[i] = numbering[i] + ':\n' + resArray[i][1];
  }

  // Create the two groups based on the optimal split point
  const group1 = resArray.slice(0, bestSplitIndex);
  const group2 = resArray.slice(bestSplitIndex);
  const stats1 = statsArray.slice(0, bestSplitIndex);
  const stats2 = statsArray.slice(bestSplitIndex);

  return {
    group1: group1.map(([text]) => text).join('\n\n\n'),
    group2: group2.map(([text]) => text).join('\n\n\n'),
    stats1: stats1.join('\n\n'),
    stats2: stats2.join('\n\n'),
  };
}

interface JobTasksTextSplitResult {
  group1: string;
  group2: string;
  stats1: string;
  stats2: string;
}

export const jobTasksTextSplit = (tasks: JobDescriptionTask[]) => {
  if (!tasks || tasks.length === 0)
    return {
      group1: '',
      group2: '',
      stats1: '',
      stats2: '',
    };
  const tasksArray = tasks.map((task) => [
    htmlToText(task.jobTask.text, new DOMParser()),
    task.percentage,
    task.jobTask.title,
  ]) as [string, number, string][];
  const result: JobTasksTextSplitResult = textSplit(tasksArray);
  return result;
};

/**
 * Wraps a single list item's content, creating a hanging indent for subsequent lines.
 * @param content The text content of the list item (after the marker).
 * @param lineLength The maximum number of characters per line.
 * @param indentation The whitespace prefix before the marker (e.g., "  ").
 * @param marker The list marker itself (e.g., "•", "a.").
 * @returns An array of strings representing the wrapped list item.
 */
const wrapListItem = (
  content: string,
  lineLength: number,
  indentation: string,
  marker: string
): string[] => {
  // The prefix for the first line (e.g., "  • ")

  const firstLinePrefix = `${indentation}${marker} `;
  // The hanging indent for subsequent lines (e.g., "    ")
  const hangingIndent = `${indentation}${' '.repeat(marker.length)} `;

  const availableLength = lineLength - firstLinePrefix.length;
  // If the available space is zero or less, wrapping is impossible.
  // We'll just put each word on its own line to avoid infinite loops.
  if (availableLength <= 0) {
    const veryLongResult = content.split(/\s+/).map((word, i) => {
      return i === 0 ? firstLinePrefix + word : hangingIndent + word;
    });
    return veryLongResult;
  }

  const words = content.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    // Prevent adding a leading space on a new line
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= availableLength) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Format the lines with the correct prefixes
  return lines.map((line, index) => {
    return index === 0 ? firstLinePrefix + line : hangingIndent + line;
  });
};

/**
 * Wraps a normal line of text without any special indentation.
 * @param text The text to wrap.
 * @param lineLength The maximum number of characters per line.
 * @returns An array of strings representing the wrapped text.
 */
const wrapNormalText = (text: string, lineLength: number): string[] => {
  if (text.length <= lineLength) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= lineLength) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Takes structured plain text and wraps it into lines of a maximum width,
 * correctly handling hanging indents for nested lists.
 * @param text The structured plain text from the htmlToText function.
 * @param maxWidth The maximum width of the text area (e.g., in pixels).
 * @param fontSize The font size.
 * @returns An array of strings, where each string is a formatted line.
 */
export const wrapTextIntoLines = (
  text: string,
  maxWidth: number,
  fontSize: number
): string[] => {
  // A common approximation for average character width of a monospace font.
  // For proportional fonts, this is less accurate but a decent heuristic.
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);

  if (!text || maxCharsPerLine <= 0) return text ? [text] : [];

  // This single regex handles all our list item cases, including indentation.
  // Breakdown:
  // ^(\s*)       - Group 1: Capture any leading whitespace (our indentation).
  // (•|-|        - Group 2: Start capturing the marker. Can be '•', '-',
  // \d+\.|      - or one or more digits followed by a dot,
  // [a-z]+\.)    - or one or more letters followed by a dot.
  // \s+          - Matches the space(s) after the marker.
  const listItemRegex = /^(\s*)(•|-|\d+\.|[a-z]+\.)\s+/;

  const allLines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const line of allLines) {
    if (line.trim() === '') {
      wrappedLines.push('');
      continue;
    }

    const match = line.match(listItemRegex);

    if (match) {
      // It's a list item (nested or not)
      let indentation = match[1]; // e.g., "" or "  "
      const marker = match[2]; // e.g., "•" or "1." or "a."

      // The full prefix including the space after, to find where content starts
      const fullPrefix = match[0];
      const content = line.substring(fullPrefix.length);

      if (/^[a-z]+\./.test(marker)) {
        indentation += ' ';
      }

      const wrappedItem = wrapListItem(
        content,
        maxCharsPerLine,
        indentation,
        marker
      );

      wrappedLines.push(...wrappedItem);
    } else {
      // It's a normal line of text (a paragraph)
      const wrappedText = wrapNormalText(line, maxCharsPerLine);
      wrappedLines.push(...wrappedText);
    }
  }

  return wrappedLines;
};

const getFontSize = (text: string, fieldName: string) => {
  let fontSize = FONT_SIZE;
  const thresholds = lengthThresholdsForFontSizeChange[fieldName];

  if (thresholds && text) {
    const textLength = text.length;
    let thresholdsExceeded = 0;
    for (const threshold of thresholds) {
      if (textLength > threshold) {
        thresholdsExceeded++;
      } else {
        break;
      }
    }
    fontSize = FONT_SIZE - thresholdsExceeded * 1;
  }
  return fontSize;
};

interface DrawTextOnFieldOptions {
  drawMode: boolean;
  pdfDoc: PDFDocument;
  pdfForm: any; // PDFForm type
  fieldName: string;
  text: string;
  font: any; // PDFFont type
  maxWidth?: number;
  xOffset?: number;
  yPositionOverride?: number;
  yOffset?: number;
}

// Draw text directly on a PDF page at the field's position
export const drawTextOnField = ({
  drawMode,
  pdfDoc,
  pdfForm,
  fieldName,
  text,
  font,
  maxWidth = 502,
  xOffset = 0,
  yPositionOverride,
  yOffset = 0,
}: DrawTextOnFieldOptions): void => {
  if (drawMode) {
    const field = pdfForm.getTextField(fieldName);
    const widgets = field.acroField.getWidgets();
    const fontSize = getFontSize(text, fieldName);

    widgets.forEach((widget: any) => {
      const { x, y, height } = widget.getRectangle();
      const pageRef = widget.P();
      const page = pdfDoc.getPages().find((page) => page.ref === pageRef);

      if (page && text) {
        page.setFont(font);
        const lines = wrapTextIntoLines(text, maxWidth, fontSize);

        let yPosition =
          yPositionOverride !== undefined
            ? yPositionOverride + Math.abs(height) + yOffset
            : y;

        for (const line of lines) {
          if (line.trim() === '') {
            yPosition -= fontSize * 0.75;
          } else {
            page.drawText(line, {
              x: x + xOffset,
              y: yPosition,
              size: fontSize,
              lineHeight: fontSize,
            });
            yPosition -= fontSize;
          }
        }
      }
    });
  } else {
    pdfForm.getTextField(fieldName).setText(text || '');
    setTextFieldFontSize(
      pdfForm.getTextField(fieldName).acroField,
      FONT_SIZE,
      fieldName,
      text
    );
  }
};
