// The content of Rahmendaten_form_fields.txt
import { FormField } from '../../types/form-field';

export const RAHMENDATEN_FORM_FIELDS: FormField[] = [
  {
    headline: 'Aufgaben auf dem Arbeitsplatz gemäß Geschäftsverteilungsplan',
  },
  {
    type: 'text',
    label: 'Kurze Darstellung des Aufgabenkreises:',
    name: 'f.aufgabenbeschreibung.1',
    validations: [
      {
        name: 'maxlength',
        value: '1000',
      },
    ],
  },
  {
    headline:
      'Organisatorische Eingliederung des Arbeitsplatzes und Befugnisse der Arbeitsplatzinhaberin/des Arbeitsplatzinhabers',
  },
  {
    type: 'text',
    label:
      'Der/dem Beschäftigten sind die folgenden Mitarbeiter/-innen (Funktion + Besoldungs- oder Entgeltgruppe) ständig unmittelbar unterstellt:',
    name: 'f.eingliederung.1',
    validations: [
      {
        name: 'maxlength',
        value: '600',
      },
    ],
  },
  {
    type: 'text',
    label: 'Die/der Beschäftigte ist unmittelbar unterstellt (nur Funktion):',
    name: 'f.beschaeftigter.1',
    validations: [
      {
        name: 'maxlength',
        value: '600',
      },
    ],
  },
  {
    type: 'text',
    label: 'Die/der Beschäftigte vertritt (nur Funktion):',
    name: 'f.beschaeftigter.2',
    validations: [
      {
        name: 'maxlength',
        value: '600',
      },
    ],
  },
  {
    type: 'text',
    label: 'Die/der Beschäftigte wird vertreten durch (nur Funktion):',
    name: 'f.beschaeftigter.3',
    validations: [
      {
        name: 'maxlength',
        value: '600',
      },
    ],
  },
  {
    type: 'text',
    label: 'Die/der Beschäftigte hat folgende Befugnisse/Vollmachten:',
    name: 'f.beschaeftigter.4',
    validations: [
      {
        name: 'maxlength',
        value: '600',
      },
    ],
  },
  {
    headline:
      'Qualifikation der Arbeitsplatzinhaberin bzw. des Arbeitsplatzinhabers',
  },
  {
    type: 'text',
    label:
      'Schul- oder Hochschulausbildung, Fachprüfungen, Ausbildungsberuf inkl. Ausbildungsdauer nach BerufsausbildungsVO:',
    name: 'f.ausbildung.1',
    validations: [
      {
        name: 'maxlength',
        value: '1000',
      },
    ],
  },
  {
    type: 'text',
    label: 'Sonstige Fachkenntnisse, Fähigkeiten und Erfahrungen:',
    name: 'f.fachkenntnisse.1',
    validations: [
      {
        name: 'maxlength',
        value: '1000',
      },
    ],
  },
];
