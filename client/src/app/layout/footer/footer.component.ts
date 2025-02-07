import { Component } from '@angular/core';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
})
export class FooterComponent {
  currentTitle: string = '';

  constructor(private titleService: TitleService) {
    this.titleService.currentTitle.subscribe((title) => {
      this.currentTitle = title;
    });
  }

  onButtonClick() {
    alert('TODO');
  }
}
