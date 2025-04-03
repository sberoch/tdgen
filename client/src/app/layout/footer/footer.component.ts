import { Component } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { MatDialog } from '@angular/material/dialog';
import { CloseDescriptionDialogComponent } from '../../components/close-description-dialog/close-description-dialog.component';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
})
export class FooterComponent {
  currentTitle: string = '';

  constructor(private titleService: TitleService, private dialog: MatDialog) {
    this.titleService.currentTitle.subscribe((title) => {
      this.currentTitle = title;
    });
  }

  onButtonClick() {
    alert('TODO');
  }

  onCloseDescriptionButtonClick() {
    const dialogRef = this.dialog.open(CloseDescriptionDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        console.log('User confirmed closing the activity');
      }
    });
  }
}
