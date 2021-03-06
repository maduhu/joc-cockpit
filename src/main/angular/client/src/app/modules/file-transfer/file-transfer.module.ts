import { NgModule } from '@angular/core';
import { FileTransferComponent,FilterModal, SearchComponent } from './file-transfer.component';
import {SharedModule} from "../shared/shared.module";

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [FileTransferComponent, FilterModal, SearchComponent],
  entryComponents: [
    FilterModal
  ]
})
export class FileTransferModule { }
