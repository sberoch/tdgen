import { FormGroup } from '@angular/forms';
import {
  PDFAcroTerminal,
  PDFDocument,
  PDFForm,
  PDFWidgetAnnotation,
  rgb,
} from 'pdf-lib';
import {
  ExportJobDescriptionForm,
  JobDescription,
} from '../../types/job-descriptions';

const FONT_SIZE = 12;

const lengthThresholdsForFontSizeChange: Record<string, number> = {
  'f.aufgabenbeschreibung.1': 500,
  'f.beschreibung.1': 1000,
  'f.beschreibung.2': 1000,
  'f.eingliederung.1': 300,
  'f.beschaeftigter.1': 300,
  'f.beschaeftigter.2': 300,
  'f.beschaeftigter.3': 300,
  'f.beschaeftigter.4': 300,
  'f.ausbildung.1': 500,
  'f.ausbildung.2': 500,
};

// Helper function to set font size for a PDF text field
const setTextFieldFontSize = (
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

  if (value && value.length > lengthThresholdsForFontSizeChange[label]) {
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

export const transformFormData = (
  formData: FormGroup<ExportJobDescriptionForm>,
  jobDescription: JobDescription
) => {
  const formValue = formData.value;
  return {
    'f.dienst.10': formValue.department,
    'f.ort_datum.1': formValue.location + ', ' + formValue.date,
    'f.sonstiges.1': formValue.sonstigesInput,
    'f.datum.1': formValue.effectiveDate,
    'f.dienstst.1': formValue.beschaftigungsdienststelle,
    'f.einheit.1': formValue.organisationseinheit,
    'f.dienstposten.1': formValue.dienstpostennr,
    'f.funktion.1': formValue.funktion,
    'f.vorn.1': formValue.employeeName,
    'f.uebernahme.1': formValue.workplaceStartDate,
    'f.std.1': formValue.parttimeHours,
    'f.zeitraum.1':
      formValue.periodStart +
      (formValue.periodType
        ? ' bis ' +
          (formValue.periodType === 'today' ? 'heute' : formValue.periodEnd)
        : ''),
    'f.zeitraum.2':
      formValue.periodStart +
      (formValue.periodType
        ? ' bis ' +
          (formValue.periodType === 'today' ? 'heute' : formValue.periodEnd)
        : ''),
    jdFormFields: jobDescription.formFields,
  };
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
const fillCheckboxes = (
  pdfDoc: PDFDocument,
  pdfForm: PDFForm,
  formData: FormGroup<ExportJobDescriptionForm>
) => {
  const checkboxes = ['f.kk.1', 'f.kk.2', 'f.kk.21', 'f.kk.22', 'f.kk.23'];
  for (const checkbox of checkboxes) {
    const field = pdfForm.getCheckBox(checkbox);
    field.enableReadOnly();
    field.uncheck();
  }

  const allFields = pdfForm.getFields();
  allFields.forEach((field) => {
    const fieldName = field.acroField.getFullyQualifiedName();
    if (fieldName && checkboxes.includes(fieldName)) {
      const widgets = field.acroField.getWidgets();
      widgets.forEach((widget) => {
        const { x, y, width, height } = widget.getRectangle();

        console.log({
          fieldName,
          x,
          y,
          width,
          height,
        });

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

        if (fieldName === 'f.kk.2' || fieldName === 'f.kk.21') {
          drawXInCheckbox(pdfDoc, widget, x, y, width, height);
        }

        if (fieldName === 'f.kk.22') {
          if (Math.abs(x - 311.8) < 1 && formData.value.disabled) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          } else if (Math.abs(x - 390.4) < 1 && !formData.value.disabled) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          }
        }

        if (fieldName === 'f.kk.23') {
          if (Math.abs(x - 61.8) < 1 && formData.value.employmentScope) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          } else if (
            Math.abs(x - 223.8) < 1 &&
            !formData.value.employmentScope
          ) {
            drawXInCheckbox(pdfDoc, widget, x, y, width, height);
          }
        }
      });
    }
  });
};

export const fillJobDescriptionForm = async (
  form: FormGroup<ExportJobDescriptionForm>,
  jobDescription: JobDescription,
  arrayBuffer: ArrayBuffer
) => {
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  });
  const pdfForm = pdfDoc.getForm();
  const formData = transformFormData(form, jobDescription);

  pdfForm.getTextField('f.dienstst.10').setText(formData['f.dienst.10'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.dienstst.10').acroField,
    FONT_SIZE,
    'f.dienst.10',
    formData['f.dienst.10']
  );

  fillCheckboxes(pdfDoc, pdfForm, form);

  pdfForm
    .getTextField('f.ort_datum.1')
    .setText(formData['f.ort_datum.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.ort_datum.1').acroField,
    FONT_SIZE,
    'f.ort_datum.1',
    formData['f.ort_datum.1']
  );

  pdfForm
    .getTextField('f.sonstiges.1')
    .setText(formData['f.sonstiges.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.sonstiges.1').acroField,
    FONT_SIZE,
    'f.sonstiges.1',
    formData['f.sonstiges.1']
  );
  pdfForm.getTextField('f.datum.1').setText(formData['f.datum.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.datum.1').acroField,
    FONT_SIZE,
    'f.datum.1',
    formData['f.datum.1']
  );

  pdfForm.getTextField('f.dienstst.1').setText(formData['f.dienstst.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.dienstst.1').acroField,
    FONT_SIZE,
    'f.dienstst.1',
    formData['f.dienstst.1']
  );
  pdfForm.getTextField('f.einheit.1').setText(formData['f.einheit.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.einheit.1').acroField,
    FONT_SIZE,
    'f.einheit.1',
    formData['f.einheit.1']
  );
  pdfForm
    .getTextField('f.dienstposten.1')
    .setText(formData['f.dienstposten.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.dienstposten.1').acroField,
    FONT_SIZE,
    'f.dienstposten.1',
    formData['f.dienstposten.1']
  );
  pdfForm.getTextField('f.funktion.1').setText(formData['f.funktion.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.funktion.1').acroField,
    FONT_SIZE,
    'f.funktion.1',
    formData['f.funktion.1']
  );
  pdfForm.getTextField('f.vorn.1').setText(formData['f.vorn.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.vorn.1').acroField,
    FONT_SIZE,
    'f.vorn.1',
    formData['f.vorn.1']
  );
  pdfForm
    .getTextField('f.uebernahme.1')
    .setText(formData['f.uebernahme.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.uebernahme.1').acroField,
    FONT_SIZE,
    'f.uebernahme.1',
    formData['f.uebernahme.1']
  );

  pdfForm.getTextField('f.std.1').setText(formData['f.std.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.std.1').acroField,
    FONT_SIZE,
    'f.std.1',
    formData['f.std.1']
  );
  pdfForm.getTextField('f.zeitraum.1').setText(formData['f.zeitraum.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.zeitraum.1').acroField,
    FONT_SIZE,
    'f.zeitraum.1',
    formData['f.zeitraum.1']
  );
  pdfForm.getTextField('f.zeitraum.2').setText(formData['f.zeitraum.2'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.zeitraum.2').acroField,
    FONT_SIZE,
    'f.zeitraum.2',
    formData['f.zeitraum.2']
  );

  for (const field of formData.jdFormFields) {
    if (field.key === 'f.aufgabenbeschreibung.1') {
      pdfForm
        .getTextField('f.aufgabenbeschreibung.1')
        .setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.aufgabenbeschreibung.1').acroField,
        FONT_SIZE,
        'f.aufgabenbeschreibung.1',
        field.value
      );
    } else if (field.key === 'f.eingliederung.1') {
      pdfForm.getTextField('f.eingliederung.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.eingliederung.1').acroField,
        FONT_SIZE,
        'f.eingliederung.1',
        field.value
      );
    } else if (field.key === 'f.beschaeftigter.1') {
      pdfForm.getTextField('f.beschaeftigter.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.1').acroField,
        FONT_SIZE,
        'f.beschaeftigter.1',
        field.value
      );
    } else if (field.key === 'f.beschaeftigter.2') {
      pdfForm.getTextField('f.beschaeftigter.2').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.2').acroField,
        FONT_SIZE,
        'f.beschaeftigter.2',
        field.value
      );
    } else if (field.key === 'f.beschaeftigter.3') {
      pdfForm.getTextField('f.beschaeftigter.3').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.3').acroField,
        FONT_SIZE,
        'f.beschaeftigter.3',
        field.value
      );
    } else if (field.key === 'f.beschaeftigter.4') {
      pdfForm.getTextField('f.beschaeftigter.4').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.4').acroField,
        FONT_SIZE,
        'f.beschaeftigter.4',
        field.value
      );
    } else if (field.key === 'f.ausbildung.1') {
      pdfForm.getTextField('f.ausbildung.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.ausbildung.1').acroField,
        FONT_SIZE,
        'f.ausbildung.1',
        field.value
      );
    } else if (field.key === 'f.fachkenntnisse.1') {
      pdfForm.getTextField('f.fachkenntnisse.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.fachkenntnisse.1').acroField,
        FONT_SIZE,
        'f.fachkenntnisse.1',
        field.value
      );
    }
  }

  return await pdfDoc.save();
};
