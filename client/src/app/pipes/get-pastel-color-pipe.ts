import { Pipe, PipeTransform } from '@angular/core';
import { getNextPastelColor } from '../utils/card.utils';

@Pipe({ name: 'pastelColor', pure: true })
export class PastelColorPipe implements PipeTransform {
  transform(index: number): string {
    return getNextPastelColor(index);
  }
}
