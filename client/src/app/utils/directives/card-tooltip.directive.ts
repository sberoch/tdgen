import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  OnInit,
  NgZone,
} from '@angular/core';
import { Card } from '../card.utils';

@Directive({
  selector: '[cardTooltip]',
  standalone: true,
})
export class CardTooltipDirective implements OnInit, OnDestroy {
  @Input('cardTooltip') card!: Card;
  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any = null;
  private documentClickListener: Function | null = null;
  private documentScrollListener: Function | null = null;
  private windowResizeListener: Function | null = null;
  private visibilityChangeListener: Function | null = null;
  private maxDisplayTimeout: any = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Listen for visibility changes to cleanup tooltips when tab is switched
    this.ngZone.runOutsideAngular(() => {
      this.visibilityChangeListener = this.renderer.listen(
        document,
        'visibilitychange',
        () => {
          if (document.visibilityState === 'hidden') {
            this.ngZone.run(() => this.removeTooltip());
          }
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.clearAllTimeouts();
    this.removeTooltip();
    this.removeGlobalListeners();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.clearAllTimeouts();
    this.showTimeout = setTimeout(() => {
      this.createTooltip();
      this.setupGlobalListeners();

      // Auto-dismiss tooltip after 10 seconds to prevent stuck tooltips
      this.maxDisplayTimeout = setTimeout(() => {
        this.removeTooltip();
      }, 10000);
    }, 300);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.clearAllTimeouts();
    // Slight delay on removal to allow clicking tooltip content if needed
    setTimeout(() => {
      this.removeTooltip();
    }, 100);
  }

  private clearAllTimeouts(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.maxDisplayTimeout) {
      clearTimeout(this.maxDisplayTimeout);
      this.maxDisplayTimeout = null;
    }
  }

  private setupGlobalListeners(): void {
    if (!this.tooltipElement) return;

    this.ngZone.runOutsideAngular(() => {
      // Close tooltip when clicking anywhere else
      this.documentClickListener = this.renderer.listen(
        document,
        'click',
        (event: MouseEvent) => {
          if (
            this.tooltipElement &&
            !this.tooltipElement.contains(event.target as Node) &&
            !this.el.nativeElement.contains(event.target as Node)
          ) {
            this.ngZone.run(() => this.removeTooltip());
          }
        }
      );

      // Close tooltip on scroll
      this.documentScrollListener = this.renderer.listen(
        document,
        'scroll',
        () => this.ngZone.run(() => this.removeTooltip()),
        { capture: true, passive: true }
      );

      // Reposition or close on resize
      this.windowResizeListener = this.renderer.listen(
        window,
        'resize',
        () => this.ngZone.run(() => this.removeTooltip()),
        { passive: true }
      );
    });
  }

  private removeGlobalListeners(): void {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }

    if (this.documentScrollListener) {
      this.documentScrollListener();
      this.documentScrollListener = null;
    }

    if (this.windowResizeListener) {
      this.windowResizeListener();
      this.windowResizeListener = null;
    }

    if (this.visibilityChangeListener) {
      this.visibilityChangeListener();
      this.visibilityChangeListener = null;
    }
  }

  private createTooltip(): void {
    this.removeTooltip();

    // Create tooltip container
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'card-tooltip');

    // Create title element
    const titleElement = this.renderer.createElement('p');
    this.renderer.addClass(titleElement, 'font-bold');
    this.renderer.addClass(titleElement, 'text-xs');
    this.renderer.addClass(titleElement, '2xl:text-sm');
    this.renderer.addClass(titleElement, '3xl:text-base');
    const titleText = this.renderer.createText(this.card.title);
    this.renderer.appendChild(titleElement, titleText);

    // Create text element
    const textElement = this.renderer.createElement('p');
    this.renderer.addClass(textElement, 'text-xs');
    this.renderer.addClass(textElement, '2xl:text-sm');
    this.renderer.addClass(textElement, 'mt-1');
    this.renderer.setProperty(textElement, 'innerHTML', this.card.text);

    // Create classification element
    const classElement = this.renderer.createElement('p');
    this.renderer.addClass(classElement, 'text-xs');
    this.renderer.addClass(classElement, '2xl:text-sm');
    this.renderer.addClass(classElement, 'text-black/50');
    this.renderer.addClass(classElement, 'mt-1');
    const classText = this.renderer.createText(this.card.classification);
    this.renderer.appendChild(classElement, classText);

    // Append all elements to tooltip
    this.renderer.appendChild(this.tooltipElement, titleElement);
    this.renderer.appendChild(this.tooltipElement, textElement);
    this.renderer.appendChild(this.tooltipElement, classElement);

    // Add tooltip to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position the tooltip
    this.positionTooltip();
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    // Default position to the right of the element
    let top = hostRect.top;
    let left = hostRect.right + 10;

    // Check if tooltip would go off-screen to the right
    if (left + tooltipRect.width > window.innerWidth) {
      // Try positioning to the left
      left = hostRect.left - tooltipRect.width - 10;

      // If it would go off-screen to the left, position it below
      if (left < 0) {
        left = Math.max(10, hostRect.left);
        top = hostRect.bottom + 10;
      }
    }

    // Check if tooltip would go off-screen at the bottom
    if (top + tooltipRect.height > window.innerHeight) {
      top = Math.max(10, window.innerHeight - tooltipRect.height - 10);
    }

    // Apply position
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private removeTooltip(): void {
    if (this.tooltipElement) {
      const parent = this.tooltipElement.parentNode;
      if (parent) {
        this.renderer.removeChild(parent, this.tooltipElement);
      }
      this.tooltipElement = null;
      this.removeGlobalListeners();
    }
  }
}
