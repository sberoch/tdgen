import { FormGroup } from '@angular/forms';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import {
  ExportJobDescriptionForm,
  JobDescription,
} from '../../types/job-descriptions';

const FONT_SIZE = 12;

// Helper function to set font size for a PDF text field
const setTextFieldFontSize = (
  textField: PDFTextField,
  fontSize: number = FONT_SIZE
): void => {
  const acroField = textField.acroField;

  // Set font size by modifying the default appearance
  const currentDA = acroField.getDefaultAppearance();
  // Replace any existing font size with the specified size, or add it if none exists
  // The DA string format is like: "/FontName 12 Tf" where 12 is the font size
  let newDA;
  if (currentDA) {
    // Replace existing font size (pattern: /FontName number Tf)
    newDA = currentDA.replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/, (match: string) => {
      const parts = match.split(' ');
      return `${parts[0]} ${fontSize} Tf`;
    });
    // If no font was found, append font size to existing DA
    if (newDA === currentDA && !currentDA.includes('Tf')) {
      newDA = currentDA + ` /Helvetica ${fontSize} Tf`;
    }
  } else {
    // If no DA exists, create a new one with the specified font size
    newDA = `/Helvetica ${fontSize} Tf`;
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
    //TODO: handle f.kk.1 checkboxes. They all have the same name but different exportvalue.
    //'f.kk.1': formValue.einstellung,
    //'f.kk.1#1': formValue.versetzung,
    //'f.kk.1#2': formValue.umsetzung,
    'f.kk.2': formValue.aufgabenaderung,
    'f.kk.21': formValue.sonstigesCheckbox,
    'f.sonstiges.1': formValue.sonstigesInput,
    'f.datum.1': formValue.effectiveDate,
    'f.dienstst.1': formValue.beschaftigungsdienststelle,
    'f.einheit.1': formValue.organisationseinheit,
    'f.dienstposten.1': formValue.dienstpostennr,
    'f.funktion.1': formValue.funktion,
    'f.vorn.1': formValue.employeeName,
    'f.uebernahme.1': formValue.workplaceStartDate,
    //TODO: handle f.kk.22#0 and f.kk.23#0 checkboxes
    //'f.kk.22#0': formValue.disabled,
    //'f.kk.23#0': formValue.employmentScope,
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
  setTextFieldFontSize(pdfForm.getTextField('f.dienstst.10'), FONT_SIZE);

  pdfForm
    .getTextField('f.ort_datum.1')
    .setText(formData['f.ort_datum.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.ort_datum.1'), FONT_SIZE);

  //TODO: handle f.kk.1 checkboxes. They all have the same name but different exportvalue.

  formData['f.kk.2']
    ? pdfForm.getCheckBox('f.kk.2').check()
    : pdfForm.getCheckBox('f.kk.2').uncheck();
  formData['f.kk.21']
    ? pdfForm.getCheckBox('f.kk.21').check()
    : pdfForm.getCheckBox('f.kk.21').uncheck();

  pdfForm
    .getTextField('f.sonstiges.1')
    .setText(formData['f.sonstiges.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.sonstiges.1'), FONT_SIZE);
  pdfForm.getTextField('f.datum.1').setText(formData['f.datum.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.datum.1'), FONT_SIZE);

  pdfForm.getTextField('f.dienstst.1').setText(formData['f.dienstst.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.dienstst.1'), FONT_SIZE);
  pdfForm.getTextField('f.einheit.1').setText(formData['f.einheit.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.einheit.1'), FONT_SIZE);
  pdfForm
    .getTextField('f.dienstposten.1')
    .setText(formData['f.dienstposten.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.dienstposten.1'), FONT_SIZE);
  pdfForm.getTextField('f.funktion.1').setText(formData['f.funktion.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.funktion.1'), FONT_SIZE);
  pdfForm.getTextField('f.vorn.1').setText(formData['f.vorn.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.vorn.1'), FONT_SIZE);
  pdfForm
    .getTextField('f.uebernahme.1')
    .setText(formData['f.uebernahme.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.uebernahme.1'), FONT_SIZE);
  //TODO: handle f.kk.22#0 and f.kk.23#0 checkboxes

  pdfForm.getTextField('f.std.1').setText(formData['f.std.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.std.1'), FONT_SIZE);
  pdfForm.getTextField('f.zeitraum.1').setText(formData['f.zeitraum.1'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.zeitraum.1'), FONT_SIZE);
  pdfForm.getTextField('f.zeitraum.2').setText(formData['f.zeitraum.2'] || '');
  setTextFieldFontSize(pdfForm.getTextField('f.zeitraum.2'), FONT_SIZE);

  for (const field of formData.jdFormFields) {
    if (field.key === 'f.aufgabenbeschreibung.1') {
      pdfForm
        .getTextField('f.aufgabenbeschreibung.1')
        .setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.aufgabenbeschreibung.1'),
        FONT_SIZE
      );
    } else if (field.key === 'f.eingliederung.1') {
      pdfForm.getTextField('f.eingliederung.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.eingliederung.1'),
        FONT_SIZE
      );
    } else if (field.key === 'f.beschaeftigter.1') {
      pdfForm.getTextField('f.beschaeftigter.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.1'),
        FONT_SIZE
      );
    } else if (field.key === 'f.beschaeftigter.2') {
      pdfForm.getTextField('f.beschaeftigter.2').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.2'),
        FONT_SIZE
      );
    } else if (field.key === 'f.beschaeftigter.3') {
      pdfForm.getTextField('f.beschaeftigter.3').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.3'),
        FONT_SIZE
      );
    } else if (field.key === 'f.beschaeftigter.4') {
      pdfForm.getTextField('f.beschaeftigter.4').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.4'),
        FONT_SIZE
      );
    } else if (field.key === 'f.ausbildung.1') {
      pdfForm.getTextField('f.ausbildung.1').setText(field.value || '');
      setTextFieldFontSize(pdfForm.getTextField('f.ausbildung.1'), FONT_SIZE);
    } else if (field.key === 'f.fachkenntnisse.1') {
      pdfForm.getTextField('f.fachkenntnisse.1').setText(field.value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.fachkenntnisse.1'),
        FONT_SIZE
      );
    }
  }

  return await pdfDoc.save();
};
