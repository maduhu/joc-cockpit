import {Component, Input, OnInit} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {CoreService} from "../../services/core.service";

@Component({
    selector: 'ngbd-modal-content',
    templateUrl: './comment.component.html'
})
export class CommentModal implements  OnInit {
  submitted: boolean = false;
  messageList: any =[];
  required: boolean = false;
  @Input() comments: any;
  @Input() obj: any;
  @Input() url: any;

  constructor(public activeModal: NgbActiveModal, public coreService: CoreService) {
  }

  ngOnInit() {
    this.comments.radio = "predefined";
    if (sessionStorage.comments)
      this.messageList = JSON.parse(sessionStorage.comments);
    if (sessionStorage.$SOS$FORCELOGING == 'true') {
      this.required = true;
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.obj.auditLog = {
      comment: this.comments.comment,
      timeSpent: this.comments.timeSpent,
      ticketLink: this.comments.ticketLink
    };

    this.postCall(this.obj)
  }

  postCall(obj) {
    this.coreService.post(this.url, obj).subscribe(res => {
      this.submitted = false;
      this.activeModal.close();
    }, err => {
      this.submitted = false;
    });
  }
}
