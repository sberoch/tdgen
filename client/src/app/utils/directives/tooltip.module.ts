import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardTooltipDirective } from './card-tooltip.directive';

@NgModule({
  imports: [CommonModule, CardTooltipDirective],
  exports: [CardTooltipDirective],
})
export class TooltipModule {}
