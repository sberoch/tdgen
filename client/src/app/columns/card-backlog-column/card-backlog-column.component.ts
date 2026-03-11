import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDragStart,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobDescriptionTitleDialogComponent } from '../../components/job-descriptions/job-description-title-dialog/job-description-title-dialog.component';
import { JtOverviewAccordionComponent } from '../../components/job-tasks/overview-accordion/jt-overview-accordion.component';
import { OverlayModalComponent } from '../../components/overlay-modal/overlay-modal.component';
import { PastelColorPipe } from '../../pipes/get-pastel-color-pipe';
import { TruncateSafeHtmlPipe } from '../../pipes/truncate-safe-html-pipe';
import { CardService } from '../../services/card.service';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
import { JobDescriptionsService } from '../../services/job-descriptions.service';
import { AuthService } from '../../services/auth.service';
import { JobDescription } from '../../types/job-descriptions';
import { Card, getTruncatedPlainText } from '../../utils/card.utils';
import { InsufficientRightsDialogComponent } from '../../components/insufficient-rights-dialog/insufficient-rights-dialog.component';
import { CardTooltipDirective } from '../../utils/directives/card-tooltip.directive';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import {
  validateFilterToken,
  extractFilters,
  TOKEN_REGEX,
} from './card-backlog-column.utils';

const MAX_DISPLAY_CARDS = 10;
const COLUMN_WIDTH_STORAGE_KEY = 'cardBacklogColumnWidth';

@Component({
  selector: 'app-card-backlog-column',
  templateUrl: './card-backlog-column.component.html',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    CardTooltipDirective,
    OverlayModalComponent,
    JtOverviewAccordionComponent,
    CommonModule,
    TruncateSafeHtmlPipe,
    PastelColorPipe,
  ],
  styles: [
    `
      .search-backdrop {
        line-height: normal;
      }

      :host ::ng-deep .token-valid {
        background-color: #e0e0e0;
        font-style: italic;
        border-radius: 3px;
        box-shadow: -0.75px 2.25px 0 4px #e0e0e0;
      }

      :host ::ng-deep .token-invalid {
        background-color: #fecaca;
        color: #dc2626;
        font-style: italic;
        border-radius: 3px;
        box-shadow: -0.75px 2.25px 0 4px #fecaca;
      }

      :host ::ng-deep .token-remove-target {
        pointer-events: auto;
        position: relative;
      }

      :host ::ng-deep .token-remove-btn {
        display: none;
        position: absolute;
        right: -14px;
        top: -6px;
        width: 15px;
        height: 15px;
        line-height: 15px;
        text-align: center;
        font-size: 11px;
        font-style: normal;
        background: #9e9e9e;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 5;
      }

      :host ::ng-deep .token-remove-target:hover .token-remove-btn {
        display: block;
      }

      :host ::ng-deep ol {
        list-style: decimal;
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }

      :host ::ng-deep ul {
        list-style: disc;
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }

      :host ::ng-deep li {
        margin: 0.25rem 0;
      }
    `,
  ],
})
export class CardBacklogColumnComponent implements OnInit {
  @ViewChild('displayScrollContainer', { static: false })
  private scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('backlogSearchInput')
  backlogSearchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('jtAccordion') jtOverviewAccordion!: JtOverviewAccordionComponent;
  @ViewChild('searchArea') searchArea!: ElementRef<HTMLElement>;
  @ViewChild('tooltipOverlay') tooltipOverlayRef?: ElementRef<HTMLElement>;

  isWorkspaceSet = false;
  isHelpPanelOpen = false;
  private currentJobDescription: JobDescription | null = null;
  private allBacklogCards: Card[] = [];
  private filteredBacklogCards: Card[] = [];
  backlogCards: Card[] = [];
  displayCards: Card[] = [];
  selectedCard: Card | null = null;
  currentIndex = 0;
  private _snackBar = inject(MatSnackBar);
  isJobTaskModalOpen = false;
  selectedCardToOpenModal: Card | null = null;
  currentDraggingCard: Card | undefined;
  private currentSearchTerm: string = '';
  highlightedSearchHtml: SafeHtml = '';
  tooltipOverlayHtml: SafeHtml = '';
  filterTooltipText: string = '';
  filterTooltipVisible: boolean = false;
  filterTooltipLeft: number = 0;
  private destroy$ = new Subject<void>();
  private filterSubject$ = new Subject<string>();
  private hasActiveServerFilters = false;
  leftWidth = this.loadColumnWidth();
  resizing = false;

  constructor(
    private dialog: MatDialog,
    private cardService: CardService,
    private currentWorkspaceService: CurrentWorkspaceService,
    private jobDescriptionsService: JobDescriptionsService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.currentWorkspaceService.currentJobDescription
      .pipe(takeUntil(this.destroy$))
      .subscribe((jobDescription) => {
        this.currentJobDescription = jobDescription;
        const newWorkspaceSet = jobDescription !== null;
        this.isWorkspaceSet = newWorkspaceSet;
        if (!jobDescription) {
          this.currentSearchTerm = '';
          this.highlightedSearchHtml = '';
          this.tooltipOverlayHtml = '';
          if (this.backlogSearchInputRef) {
            this.backlogSearchInputRef.nativeElement.value = '';
          }
          this.cardService.initializeCards();
        }
      });

    this.cardService.cards$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cards) => {
        this.allBacklogCards = cards;
        this.updateFilteredBacklogCards();
        this.applySearchFilter(this.currentSearchTerm);
      });

    this.cardService.displayCards$
      .pipe(takeUntil(this.destroy$))
      .subscribe((displayCards) => {
        this.displayCards = displayCards;
        this.updateFilteredBacklogCards();
        this.applySearchFilter(this.currentSearchTerm);
      });

    this.cardService.selectedCard$
      .pipe(takeUntil(this.destroy$))
      .subscribe((card) => {
        this.selectedCard = card;
        setTimeout(() => {
          this.scrollToSelectedCard();
        }, 50);
      });

    this.filterSubject$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const { filters, freeText } = extractFilters(searchTerm);
        const hasFilters = Object.keys(filters).length > 0;

        if (hasFilters) {
          this.hasActiveServerFilters = true;
          this.cardService.fetchFilteredCards(filters);
          // Store free text for client-side filtering after server response
          this.currentSearchTerm = freeText;
        } else if (this.hasActiveServerFilters) {
          // Had filters before, now removed — reload all cards
          this.hasActiveServerFilters = false;
          this.cardService.initializeCards();
          this.currentSearchTerm = searchTerm;
        }
        // If no filters and no previous filters, client-side filtering already handled in onSearch
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackCardById(_index: number, card: Card): string {
    return card.jobTask.id.toString();
  }

  private scrollToSelectedCard() {
    if (!this.selectedCard || !this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const cardElement = container.querySelector(
      `[data-title="${this.selectedCard.title}"]`,
    ) as HTMLElement;

    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  onSearchAreaMouseMove(event: MouseEvent) {
    if (!this.tooltipOverlayRef) {
      this.filterTooltipVisible = false;
      return;
    }
    const overlayEl = this.tooltipOverlayRef.nativeElement;
    const spans = overlayEl.querySelectorAll('[data-filter-tooltip]');
    let found = false;
    for (let i = 0; i < spans.length; i++) {
      const rect = spans[i].getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        const tooltip = spans[i].getAttribute('data-filter-tooltip')!;
        this.filterTooltipText = tooltip;
        this.filterTooltipVisible = true;
        const parentRect = overlayEl
          .closest('.relative')!
          .getBoundingClientRect();
        this.filterTooltipLeft = rect.left - parentRect.left + rect.width / 2;
        found = true;
        break;
      }
    }
    if (!found) {
      this.filterTooltipVisible = false;
    }
  }

  onTooltipOverlayMouseLeave() {
    this.filterTooltipVisible = false;
  }

  toggleHelpPanel(event: Event) {
    event.stopPropagation();
    this.isHelpPanelOpen = !this.isHelpPanelOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isHelpPanelOpen) return;
    if (!this.searchArea.nativeElement.contains(event.target as Node)) {
      this.isHelpPanelOpen = false;
    }
  }

  onSearch(event: Event) {
    const rawValue = (event.target as HTMLInputElement).value;
    this.currentSearchTerm = rawValue;
    this.updateHighlightedSearch(rawValue);

    // Extract filters to decide if we need server-side filtering
    const { filters, freeText } = extractFilters(rawValue);
    const hasFilters = Object.keys(filters).length > 0;

    if (hasFilters) {
      // Apply client-side filter on free text immediately for responsiveness
      this.applySearchFilter(freeText);
      // Debounced server call
      this.filterSubject$.next(rawValue);
    } else {
      if (this.hasActiveServerFilters) {
        // Filters were just removed — trigger reload
        this.filterSubject$.next(rawValue);
      }
      // Pure free text — client-side only
      this.applySearchFilter(rawValue);
    }
  }

  private updateHighlightedSearch(text: string): void {
    if (!text) {
      this.highlightedSearchHtml = '';
      this.tooltipOverlayHtml = '';
      return;
    }
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Collect matches with positions to avoid string.replace() first-occurrence bug
    const matches: {
      start: number;
      end: number;
      text: string;
      valid: boolean;
      error?: string;
    }[] = [];
    const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);
    let m;
    while ((m = regex.exec(escaped)) !== null) {
      const result = validateFilterToken(m[0]);
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        valid: result.valid,
        error: result.error,
      });
    }

    // Build both HTML strings using index-based splicing (reverse order to preserve positions)
    let highlightedHtml = escaped;
    let tooltipHtml = escaped;
    for (let i = matches.length - 1; i >= 0; i--) {
      const { start, end, text: token, valid, error } = matches[i];
      if (valid) {
        highlightedHtml =
          highlightedHtml.slice(0, start) +
          `<span class="token-valid">${token}</span>` +
          highlightedHtml.slice(end);
        tooltipHtml =
          tooltipHtml.slice(0, start) +
          `<span class="token-remove-target" data-filter-token="${token}">${token}<span class="token-remove-btn">\u00d7</span></span>` +
          tooltipHtml.slice(end);
      } else {
        highlightedHtml =
          highlightedHtml.slice(0, start) +
          `<span class="token-invalid">${token}</span>` +
          highlightedHtml.slice(end);
        tooltipHtml =
          tooltipHtml.slice(0, start) +
          `<span class="token-remove-target" data-filter-tooltip="${error}" data-filter-token="${token}" style="cursor: default;">${token}<span class="token-remove-btn">\u00d7</span></span>` +
          tooltipHtml.slice(end);
      }
    }

    this.highlightedSearchHtml =
      this.sanitizer.bypassSecurityTrustHtml(highlightedHtml);
    this.tooltipOverlayHtml =
      this.sanitizer.bypassSecurityTrustHtml(tooltipHtml);
  }

  private applySearchFilter(searchTerm: string): void {
    const termToFilter = searchTerm.trim().toLowerCase();
    if (!termToFilter) {
      this.backlogCards = [...this.filteredBacklogCards];
      return;
    }

    this.backlogCards = this.filteredBacklogCards.filter((card) => {
      const tags = card.tags.join(' ');
      const text = `${tags} ${card.title} ${card.text}`.toLowerCase();
      const keywords = termToFilter.split(/\s+/);
      return keywords.every((keyword) => text.includes(keyword));
    });
  }

  onTooltipOverlayClick(
    event: MouseEvent,
    inputElement: HTMLInputElement,
  ): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('token-remove-btn')) return;
    const tokenSpan = target.closest('[data-filter-token]');
    if (!tokenSpan) return;
    const token = tokenSpan.getAttribute('data-filter-token')!;
    this.removeFilterToken(token, inputElement);
  }

  private removeFilterToken(
    token: string,
    inputElement: HTMLInputElement,
  ): void {
    const raw = inputElement.value;
    const newValue = raw
      .replace(token, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    inputElement.value = newValue;
    this.currentSearchTerm = newValue;
    this.updateHighlightedSearch(newValue);
    const { filters, freeText } = extractFilters(newValue);
    const hasFilters = Object.keys(filters).length > 0;
    if (hasFilters) {
      this.applySearchFilter(freeText);
      this.filterSubject$.next(newValue);
    } else {
      if (this.hasActiveServerFilters) {
        this.filterSubject$.next(newValue);
      }
      this.applySearchFilter(newValue);
    }
  }

  clearSearch(inputElement: HTMLInputElement) {
    inputElement.value = '';
    this.currentSearchTerm = '';
    this.highlightedSearchHtml = '';
    this.tooltipOverlayHtml = '';
    if (this.hasActiveServerFilters) {
      this.hasActiveServerFilters = false;
      this.cardService.initializeCards();
    }
    this.applySearchFilter('');
  }

  onDragStarted(_event: CdkDragStart, card: Card) {
    this.currentDraggingCard = card;
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (this.isJobDescriptionLockedForUsers()) {
      this.dialog.open(InsufficientRightsDialogComponent, { width: '450px' });
      this.currentDraggingCard = undefined;
      return;
    }
    if (
      event.previousContainer.id === event.container.id &&
      event.previousContainer.id === 'display'
    ) {
      this.cardService.moveInDisplay(event.previousIndex, event.currentIndex);
    } else {
      if (
        event.previousContainer.id === 'backlog' &&
        event.container.id === 'display'
      ) {
        if (this.displayCards.length < MAX_DISPLAY_CARDS) {
          this.cardService.addToDisplay(
            this.currentDraggingCard,
            event.currentIndex,
          );
        } else {
          this.openSnackBar(
            'Maximale Anzahl an Arbeitsvorgängen erreicht',
            'Bestätigen',
          );
        }
      }
      if (
        event.previousContainer.id === 'display' &&
        event.container.id === 'backlog'
      ) {
        this.cardService.removeFromDisplay(this.currentDraggingCard);
      }
    }
    this.currentDraggingCard = undefined;
  }

  moveCardToTop(index: number) {
    this.cardService.moveCardToTop(index);
  }

  moveCardToBottom(index: number) {
    this.cardService.moveCardToBottom(index);
  }

  getTruncatedText(text: string, maxLength: number): string {
    return getTruncatedPlainText(text, maxLength);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(JobDescriptionTitleDialogComponent, {
      width: '600px',
      data: {
        isEditing: false,
      },
    });

    dialogRef.afterClosed().subscribe((result: JobDescription) => {
      if (result) {
        this.currentWorkspaceService.setCurrentJobDescription(result);
        this.jobDescriptionsService.getJobDescriptions().subscribe();
      }
    });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  selectCard(card: Card) {
    this.cardService.selectCard(card);
  }

  removeFromDisplay(card: Card) {
    this.cardService.removeFromDisplay(card);
  }

  openDialogWithCard(card: Card) {
    this.isJobTaskModalOpen = true;
    this.selectedCardToOpenModal = card;
  }

  closeJobTaskModal() {
    this.isJobTaskModalOpen = false;
    this.selectedCardToOpenModal = null;
  }

  shouldDisableEditButton(card: Card): boolean {
    if (!card) return false;
    return card.jobTask.deletedAt !== null;
  }

  startResizing(event: MouseEvent) {
    this.resizing = true;
    event.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.resizing) {
      const containerWidth = window.innerWidth;
      const minWidth = 15;
      const maxWidth = 35;
      const newLeftWidth = (event.clientX / containerWidth) * 100;
      this.leftWidth = Math.min(Math.max(newLeftWidth, minWidth), maxWidth);
      this.saveColumnWidth(this.leftWidth);
    }
  }

  @HostListener('window:mouseup')
  stopResizing() {
    if (this.resizing) {
      this.resizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  private loadColumnWidth(): number {
    const storedWidth = localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY);
    if (storedWidth) {
      const parsedWidth = parseFloat(storedWidth);
      return Math.min(Math.max(parsedWidth, 15), 35);
    }
    return 22;
  }

  private saveColumnWidth(width: number): void {
    localStorage.setItem(COLUMN_WIDTH_STORAGE_KEY, width.toString());
  }

  private updateFilteredBacklogCards(): void {
    const displayCardIds = new Set(
      this.displayCards.map((dc) => dc.jobTask.id),
    );
    this.filteredBacklogCards = this.allBacklogCards.filter(
      (card) => !displayCardIds.has(card.jobTask.id),
    );
  }

  isLockedByOtherUser(card: Card): boolean {
    const currentUser = this.authService.getCurrentUser();
    return (
      card &&
      card.jobTask &&
      !!card.jobTask.lockedById &&
      card.jobTask.lockedById !== currentUser?.id
    );
  }

  isJobDescriptionLocked(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return (
      !!this.currentJobDescription &&
      !!this.currentJobDescription.lockedById &&
      this.currentJobDescription.lockedById !== currentUser?.id
    );
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isJobDescriptionLockedForUsers(): boolean {
    return (
      !!this.currentJobDescription &&
      !!this.currentJobDescription.isLockedForUsers &&
      !this.isAdmin()
    );
  }

  isCardLockedForUsers(card: Card): boolean {
    return (
      card && card.jobTask && !!card.jobTask.isLockedForUsers && !this.isAdmin()
    );
  }
}
