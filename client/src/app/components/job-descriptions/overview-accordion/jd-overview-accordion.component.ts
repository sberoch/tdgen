import { Component } from '@angular/core';
import { TitleActivityDialogComponent } from '../../title-activity-dialog/title-activity-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../../../services/title.service';

@Component({
  selector: 'app-jd-overview-accordion',
  templateUrl: './jd-overview-accordion.component.html',
  standalone: true,
})
export class JdOverviewAccordionComponent {
  constructor(private dialog: MatDialog, private titleService: TitleService) {}

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
}
