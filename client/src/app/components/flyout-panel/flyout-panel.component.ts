import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  AngularEditorConfig,
  AngularEditorModule,
} from '@kolkov/angular-editor';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { FormField } from '../../types/form-field';
import { JobDescription } from '../../types/job-descriptions';
import { RAHMENDATEN_FORM_FIELDS } from '../../utils/const/job-description-form-fields';

@Component({
  selector: 'app-flyout-panel',
  templateUrl: './flyout-panel.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    AngularEditorModule,
  ],
})
export class FlyoutPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() title = 'Panel Title';
  @Output() close = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  formFieldsDefinition: FormField[] = RAHMENDATEN_FORM_FIELDS;
  formData: Record<string, string> = {};
  currentJobDescription: JobDescription | null = null;
  private destroy$ = new Subject<void>();

  editorConfig: AngularEditorConfig = {
    editable: true,
    sanitize: false,
    spellcheck: true,
    minHeight: '300px',
    toolbarHiddenButtons: [
      [
        'undo',
        'redo',
        'bold',
        'italic',
        'underline',
        'strikeThrough',
        'subscript',
        'superscript',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'indent',
        'outdent',
        'heading',
        'fontName',
      ],
      [
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
      ],
    ],
  };

  constructor(
    private currentWorkspaceService: CurrentWorkspaceService,
    private jobDescriptionsService: JobDescriptionsService
  ) {}

  ngOnInit(): void {
    this.currentWorkspaceService.currentJobDescription
      .pipe(takeUntil(this.destroy$))
      .subscribe((jd) => {
        this.currentJobDescription = jd;
        const newFormData: Record<string, string> = {};
        for (const fieldDef of this.formFieldsDefinition) {
          if (fieldDef.name) {
            newFormData[fieldDef.name] = '';
          }
        }
        if (jd && jd.formFields) {
          for (const fieldDef of this.formFieldsDefinition) {
            if (fieldDef.name) {
              const key = jd.formFields.find((f) => f.key === fieldDef.name);
              if (key) {
                const valueFromJd = key.value;
                if (typeof valueFromJd === 'string') {
                  newFormData[fieldDef.name] = valueFromJd;
                }
              }
            }
          }
        }
        this.formData = newFormData;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onKeydownEscape() {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onClose(): void {
    this.saveForm();
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  saveForm(): void {
    if (this.currentJobDescription && this.currentJobDescription.id) {
      let hasChanged = false;
      const originalFormFields: Record<string, string> =
        this.currentJobDescription.formFields.reduce(
          (acc, field) => ({ ...acc, [field.key]: field.value }),
          {}
        );
      const currentFormValues = this.formData;

      const allKeys = new Set([
        ...Object.keys(originalFormFields),
        ...Object.keys(currentFormValues),
      ]);

      for (const key of allKeys) {
        const originalValue = originalFormFields[key] || '';
        const currentValue = currentFormValues[key] || '';
        if (originalValue !== currentValue) {
          hasChanged = true;
          break;
        }
      }

      if (hasChanged) {
        this.jobDescriptionsService
          .updateJobDescription(this.currentJobDescription.id, {
            formFields: this.formData,
          })
          .subscribe({
            next: (updatedJd) => {
              this.currentWorkspaceService.setCurrentJobDescription(updatedJd);
            },
            error: (error) => {
              console.error('Error saving form data', error);
            },
          });
      }
    }
  }

  getMaxLength(field: FormField): number | null {
    if (field.validations) {
      const maxLengthValidation = field.validations.find(
        (v) => v.name === 'maxlength'
      );
      return maxLengthValidation
        ? parseInt(maxLengthValidation.value, 10)
        : null;
    }
    return null;
  }

  getEditorConfig(field: FormField): AngularEditorConfig {
    return {
      ...this.editorConfig,
    };
  }

  getPlainTextLength(htmlContent: string): number {
    if (!htmlContent) return 0;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
  }

  onExportClick(): void {
    this.saveForm();
    this.exportClick.emit();
  }

  canExport(): boolean {
    return this.currentJobDescription !== null;
  }

  onKeydown(event: KeyboardEvent, field: FormField): void {
    const maxLength = this.getMaxLength(field);
    const fieldName = field.name;

    if (!maxLength || !fieldName) {
      return;
    }

    const currentLength = this.getPlainTextLength(
      this.formData[fieldName] || ''
    );

    if (currentLength >= maxLength) {
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'Home',
        'End',
        'PageUp',
        'PageDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ];

      const isCtrlPressed = event.ctrlKey || event.metaKey;
      const isSpecialCombo =
        isCtrlPressed && ['a', 'c', 'x', 'z'].includes(event.key.toLowerCase());

      if (!allowedKeys.includes(event.key) && !isSpecialCombo) {
        event.preventDefault();
      }
    }
  }

  onPaste(event: ClipboardEvent, field: FormField): void {
    const maxLength = this.getMaxLength(field);
    const fieldName = field.name;

    if (!maxLength || !fieldName) {
      return;
    }

    const pastedText = event.clipboardData?.getData('text') || '';
    const currentText = this.formData[fieldName] || '';

    if (pastedText.length > 0) {
      const availableSpace = maxLength - this.getPlainTextLength(currentText);

      if (availableSpace <= 0) {
        event.preventDefault();
        return;
      }

      if (pastedText.length > availableSpace) {
        event.preventDefault();
        const truncatedText = pastedText.substring(0, availableSpace);
        this.formData[fieldName] = currentText + truncatedText;
        this.saveForm();
      }
    }
  }
}
