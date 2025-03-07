import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { TitleActivityDialogComponent } from '../../components/title-activity-dialog/title-activity-dialog.component';
import { AboutDialogComponent } from '../../components/about-dialog/about-dialog.component';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MatDividerModule],
})
export class HeaderComponent implements OnInit {
  currentTitle: string = '';

  constructor(private dialog: MatDialog, private titleService: TitleService) {}

  ngOnInit() {
    this.titleService.currentTitle.subscribe((title) => {
      if (title) this.currentTitle = title;
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(TitleActivityDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.titleService.updateTitle(result);
      }
    });
  }

  openAboutDialog() {
    this.dialog.open(AboutDialogComponent, {
      width: '600px',
    });
  }

  onButtonClick() {
    alert('TODO');
  }
}
