import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CloseDescriptionDialogComponent } from '../../components/close-description-dialog/close-description-dialog.component';
import { CurrentWorkspaceService } from '../../services/current-workspace.service';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
})
export class FooterComponent {
  isWorkspaceSet = false;

  constructor(
    private dialog: MatDialog,
    private currentWorkspaceService: CurrentWorkspaceService
  ) {
    this.currentWorkspaceService.currentJobDescription.subscribe(
      (jobDescription) => {
        this.isWorkspaceSet = jobDescription !== null;
      }
    );
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
        this.currentWorkspaceService.clearCurrentJobDescription();
      }
    });
  }
}
