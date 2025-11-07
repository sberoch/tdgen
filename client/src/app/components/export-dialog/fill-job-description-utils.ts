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

export const convertHtmlToText = (html: string): string => {
  let result = html;

  // Remove &nbsp; and \n
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/\n/g, ' ');

  // Handle unordered lists (<ul>)
  result = result.replace(
    /<ul[^>]*>(.*?)<\/ul>/gis,
    (match: string, content: string) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
      const listContent = items
        .map((item: string) => {
          let text = item.replace(/<li[^>]*>(.*?)<\/li>/is, '$1');
          // Strip any remaining HTML tags and trim whitespace
          text = text.replace(/<[^>]*>/g, '').trim();
          return `• ${text}`;
        })
        .join('\n');
      return '\n' + listContent + '\n';
    }
  );

  // Handle ordered lists (<ol>)
  result = result.replace(
    /<ol[^>]*>(.*?)<\/ol>/gis,
    (match: string, content: string) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
      const listContent = items
        .map((item: string, index: number) => {
          let text = item.replace(/<li[^>]*>(.*?)<\/li>/is, '$1');
          // Strip any remaining HTML tags and trim whitespace
          text = text.replace(/<[^>]*>/g, '').trim();
          return `${index + 1}. ${text}`;
        })
        .join('\n');
      return '\n' + listContent + '\n';
    }
  );

  // Add newline before first <div>
  result = result.replace(/<div[^>]*>/, (match: string) => {
    return '\n' + match;
  });

  // Handle div containers - replace with content followed by newline
  result = result.replace(
    /<div[^>]*>(.*?)<\/div>/gis,
    (match: string, content: string) => {
      // Trim the content and add a newline
      return content.trim() + '\n';
    }
  );

  // Strip any remaining HTML tags
  result = result.replace(/<[^>]*>/g, '');

  // Clean up multiple consecutive newlines and trim
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
};

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

  // Case 1: Single element array
  if (inputArray.length === 1) {
    numbering = getParagraphNumbering(inputArray);
    const [text, value, title] = inputArray[0];

    // Try to split by paragraphs first
    let parts = text.split(/\n\s*\n/);

    if (parts.length === 1) {
      // No paragraphs, try to split by sentences
      parts = text.split(/(?<=[.!?])\s+/);

      if (parts.length === 1) {
        // No sentences, split in half
        const midpoint = Math.floor(text.length / 2);
        // Try to find a space near the midpoint
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
      ' %)\n' +
      parts.slice(0, bestSplitIndex).join('\n\n');
    const secondPart =
      numbering[0] +
      ' ' +
      title +
      ' (' +
      value +
      ' %) (Fortsetzung)\n' +
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
      ' %)\n' +
      resArray[i][0];
    statsArray[i] = numbering[i] + ':\n' + resArray[i][1];
  }

  // Create the two groups based on the optimal split point
  const group1 = resArray.slice(0, bestSplitIndex);
  const group2 = resArray.slice(bestSplitIndex);
  const stats1 = statsArray.slice(0, bestSplitIndex);
  const stats2 = statsArray.slice(bestSplitIndex);

  return {
    group1: group1.map(([text]) => text).join('\n\n'),
    group2: group2.map(([text]) => text).join('\n\n'),
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
    convertHtmlToText(task.jobTask.text),
    task.percentage,
    task.jobTask.title,
  ]) as [string, number, string][];
  const result: JobTasksTextSplitResult = textSplit(tasksArray);
  return result;
};

export const wrapText = (
  text: string,
  maxWidth: number,
  fontSize: number
): string => {
  console.log({ text });
  // For Courier (monospaced) font, character width is approximately 0.6 * fontSize
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);

  if (!text || maxCharsPerLine <= 0) return text;

  // Split text into blocks (separated by double newlines)
  const blocks = text.split(/\n\n+/);
  const wrappedBlocks: string[] = [];

  for (const block of blocks) {
    if (block.trim() === '') continue;

    const lines = block.split('\n');
    const wrappedLines: string[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        wrappedLines.push('');
        continue;
      }

      // Check if this is a list item (bullet point •, dash -, or numbered list)
      const bulletMatch = line.match(/^(•|-)\s/);
      const numberedMatch = line.match(/^(\d+\.)\s/);
      const isListItem = bulletMatch !== null || numberedMatch !== null;

      if (isListItem) {
        // Process list item
        const prefix = bulletMatch ? bulletMatch[0] : numberedMatch![0]; // "• ", "- ", or "1. "
        const content = line.substring(prefix.length);
        const wrappedListItem = wrapListItem(content, maxCharsPerLine, prefix);
        wrappedLines.push(...wrappedListItem);
      } else {
        // Process normal text
        const wrappedNormalText = wrapNormalText(line, maxCharsPerLine);
        wrappedLines.push(...wrappedNormalText);
      }
    }

    wrappedBlocks.push(wrappedLines.join('\n'));
  }

  return wrappedBlocks.join('\n\n');
};

// Helper function to wrap list items with indentation
// Supports bullet points (•, -) and numbered lists (1., 2., etc.)
const wrapListItem = (
  content: string,
  lineLength: number,
  prefix: string
): string[] => {
  const availableLength = lineLength - prefix.length;
  const words = content.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= availableLength) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than available line - add it anyway
        lines.push(word);
        currentLine = '';
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // First line gets prefix (bullet/number), subsequent lines get space indentation
  const result: string[] = [];
  const indent = ' '.repeat(prefix.length);

  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      result.push(prefix + lines[i]);
    } else {
      result.push(indent + lines[i]);
    }
  }

  return result;
};

// Helper function to wrap normal text
const wrapNormalText = (text: string, lineLength: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= lineLength) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than line length - add it anyway
        lines.push(word);
        currentLine = '';
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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
    const BASE_FONT_SIZE = 12;

    // Calculate dynamic font size based on text length and thresholds
    let fontSize = BASE_FONT_SIZE;
    const thresholds = lengthThresholdsForFontSizeChange[fieldName];

    if (thresholds && text) {
      const textLength = text.length;
      // Count how many thresholds are exceeded
      let thresholdsExceeded = 0;
      for (const threshold of thresholds) {
        if (textLength > threshold) {
          thresholdsExceeded++;
        } else {
          break; // Thresholds should be in ascending order
        }
      }
      // Decrease font size by 2 for each threshold exceeded
      fontSize = BASE_FONT_SIZE - thresholdsExceeded * 1;
    }

    widgets.forEach((widget: any) => {
      const { x, y, height } = widget.getRectangle();
      const pageRef = widget.P();
      const page = pdfDoc.getPages().find((page) => page.ref === pageRef);

      if (page && text) {
        const wrappedText = wrapText(text, maxWidth, fontSize);
        page.setFont(font);

        const yPosition =
          yPositionOverride !== undefined
            ? yPositionOverride + Math.abs(height) + yOffset
            : y;

        page.drawText(wrappedText, {
          x: x + xOffset,
          y: yPosition,
          size: fontSize,
          lineHeight: fontSize,
        });
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
