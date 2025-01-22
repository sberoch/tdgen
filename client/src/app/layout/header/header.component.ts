import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MatDividerModule],
})
export class HeaderComponent {
  onButtonClick() {
    alert('TODO');
  }
}
