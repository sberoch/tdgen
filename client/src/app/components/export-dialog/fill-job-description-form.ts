import { FormGroup } from '@angular/forms';
import { PDFDict, PDFDocument, PDFName, StandardFonts } from 'pdf-lib';
import {
  ExportJobDescriptionForm,
  JobDescription,
} from '../../types/job-descriptions';
import {
  fillCheckboxes,
  jobTasksTextSplit,
  setTextFieldFontSize,
  convertHtmlToText,
} from './fill-job-description-utils';

const FONT_SIZE = 12;

const formatDate = (date: string | null | undefined) => {
  if (!date) return '';
  if (date.includes('.')) return date;
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
};

export const transformFormData = (
  formData: FormGroup<ExportJobDescriptionForm>,
  jobDescription: JobDescription
) => {
  const formValue = formData.value;
  const orderedTasks = jobDescription.tasks.sort((a, b) => a.order - b.order);
  const jobTasksTextSplitResult = jobTasksTextSplit(orderedTasks);

  return {
    'f.dienst.10': formValue.department,
    'f.ort_datum.1': formValue.location + ', ' + formatDate(formValue.date),
    'f.sonstiges.1': formValue.sonstigesInput,
    'f.datum.1': formatDate(formValue.effectiveDate),
    'f.dienstst.1': formValue.beschaftigungsdienststelle,
    'f.einheit.1': formValue.organisationseinheit,
    'f.dienstposten.1': formValue.dienstpostennr,
    'f.funktion.1': formValue.funktion,
    'f.vorn.1': formValue.employeeName,
    'f.uebernahme.1': formatDate(formValue.workplaceStartDate),
    'f.std.1': formValue.parttimeHours,
    'f.zeitraum.1':
      formatDate(formValue.periodStart) +
      (formValue.periodType
        ? ' bis ' +
          (formValue.periodType === 'today'
            ? 'heute'
            : formatDate(formValue.periodEnd))
        : ''),
    'f.zeitraum.2':
      formatDate(formValue.periodStart) +
      (formValue.periodType
        ? ' bis ' +
          (formValue.periodType === 'today'
            ? 'heute'
            : formatDate(formValue.periodEnd))
        : ''),
    'f.beschreibung.1': jobTasksTextSplitResult.group1,
    'f.beschreibung.2': jobTasksTextSplitResult.group2,
    'f.zeitanteil.1': jobTasksTextSplitResult.stats1,
    'f.zeitanteil.2': jobTasksTextSplitResult.stats2,
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
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const pdfForm = pdfDoc.getForm();
  const acroForm = pdfForm.acroForm;
  const dict = acroForm.dict;
  let DR = dict.lookupMaybe(PDFName.of('DR'), PDFDict);
  if (!DR) {
    DR = pdfDoc.context.obj({});
    dict.set(PDFName.of('DR'), DR);
  }

  let fontDict = DR.lookupMaybe(PDFName.of('Font'), PDFDict);
  if (!fontDict) {
    fontDict = pdfDoc.context.obj({});
    DR.set(PDFName.of('Font'), fontDict);
  }

  const courierRef = pdfDoc.context.register(courierFont.ref);
  fontDict.set(PDFName.of('Courier'), courierRef);

  const formData = transformFormData(form, jobDescription);

  fillCheckboxes(pdfDoc, pdfForm, form);

  pdfForm.getTextField('f.dienstst.10').setText(formData['f.dienst.10'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.dienstst.10').acroField,
    FONT_SIZE,
    'f.dienst.10',
    formData['f.dienst.10']
  );

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

  pdfForm
    .getTextField('f.beschreibung.1')
    .setText(formData['f.beschreibung.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.beschreibung.1').acroField,
    FONT_SIZE,
    'f.beschreibung.1',
    formData['f.beschreibung.1']
  );

  pdfForm
    .getTextField('f.beschreibung.2')
    .setText(formData['f.beschreibung.2'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.beschreibung.2').acroField,
    FONT_SIZE,
    'f.beschreibung.2',
    formData['f.beschreibung.2']
  );

  pdfForm
    .getTextField('f.zeitanteil.1')
    .setText(formData['f.zeitanteil.1'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.zeitanteil.1').acroField,
    FONT_SIZE,
    'f.zeitanteil.1',
    formData['f.zeitanteil.1']
  );

  pdfForm
    .getTextField('f.zeitanteil.2')
    .setText(formData['f.zeitanteil.2'] || '');
  setTextFieldFontSize(
    pdfForm.getTextField('f.zeitanteil.2').acroField,
    FONT_SIZE,
    'f.zeitanteil.2',
    formData['f.zeitanteil.2']
  );

  for (const field of formData.jdFormFields) {
    const value = convertHtmlToText(field.value);
    if (field.key === 'f.aufgabenbeschreibung.1') {
      pdfForm.getTextField('f.aufgabenbeschreibung.1').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.aufgabenbeschreibung.1').acroField,
        FONT_SIZE,
        'f.aufgabenbeschreibung.1',
        value
      );
    } else if (field.key === 'f.eingliederung.1') {
      pdfForm.getTextField('f.eingliederung.1').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.eingliederung.1').acroField,
        FONT_SIZE,
        'f.eingliederung.1',
        value
      );
    } else if (field.key === 'f.beschaeftigter.1') {
      pdfForm.getTextField('f.beschaeftigter.1').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.1').acroField,
        FONT_SIZE,
        'f.beschaeftigter.1',
        value
      );
    } else if (field.key === 'f.beschaeftigter.2') {
      pdfForm.getTextField('f.beschaeftigter.2').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.2').acroField,
        FONT_SIZE,
        'f.beschaeftigter.2',
        value
      );
    } else if (field.key === 'f.beschaeftigter.3') {
      pdfForm.getTextField('f.beschaeftigter.3').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.3').acroField,
        FONT_SIZE,
        'f.beschaeftigter.3',
        value
      );
    } else if (field.key === 'f.beschaeftigter.4') {
      pdfForm.getTextField('f.beschaeftigter.4').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.beschaeftigter.4').acroField,
        FONT_SIZE,
        'f.beschaeftigter.4',
        value
      );
    } else if (field.key === 'f.ausbildung.1') {
      pdfForm.getTextField('f.ausbildung.1').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.ausbildung.1').acroField,
        FONT_SIZE,
        'f.ausbildung.1',
        value
      );
    } else if (field.key === 'f.fachkenntnisse.1') {
      pdfForm.getTextField('f.fachkenntnisse.1').setText(value || '');
      setTextFieldFontSize(
        pdfForm.getTextField('f.fachkenntnisse.1').acroField,
        FONT_SIZE,
        'f.fachkenntnisse.1',
        value
      );
    }
  }

  pdfForm.updateFieldAppearances(courierFont);

  return await pdfDoc.save();
};
