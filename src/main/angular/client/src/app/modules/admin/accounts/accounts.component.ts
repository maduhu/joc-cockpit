import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { CoreService } from '../../../services/core.service';
import { AuthService } from '../../../components/guard';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../data.service';
import { DeleteModal } from '../../../components/delete-modal/delete.component';
import * as _ from 'underscore';

@Component({
    selector: 'ngbd-modal-content',
    templateUrl: './user-dialog.html'
})
export class AccountModal implements OnInit {
    submitted:boolean = false;
    isUnique:boolean = true;
    currentUser:any={};
    roles:any= [];

    @Input() newUser:boolean = false;
    @Input() copy:boolean = false;
    @Input() userDetail:any;
    @Input() oldUser:any;

    constructor(public activeModal:NgbActiveModal, private coreService:CoreService) {
    }

    ngOnInit() {
        if (this.oldUser) {
            this.currentUser = _.clone(this.oldUser);
            this.currentUser.fakePassword = "00000000";
            this.currentUser.userName = this.currentUser.user;
            if(this.copy){
                this.currentUser.user ='';
            }
            this.roles =  _.clone(this.currentUser.roles);

        } else {
            this.currentUser = {
                user: '',
                fakePassword: '',
                roles: []
            };
        }
    }

    checkUser(newUser, existingUser) {
        this.isUnique = true;
        for (let i = 0; i < this.userDetail.users.length; i++) {
            if (this.userDetail.users[i].user === newUser && newUser !== existingUser) {
                this.isUnique = false;
                break;
            }
        }
    }

    onSubmit(obj):void {
        this.submitted = true;
        this.isUnique = true;

        if (obj.fakePassword != '00000000') {
            obj.password = obj.fakePassword || '';
        }

        if (this.newUser || this.copy) {
            let data ={
                user:obj.user,
                password:obj.password,
                roles:this.roles
            };
            this.userDetail.users.push(data);
        }else {
            for (let i = 0; i < this.userDetail.users.length; i++) {
                if (this.userDetail.users[i] === this.oldUser ||  _.isEqual(this.userDetail.users[i], this.oldUser)) {
                    this.userDetail.users[i].user = obj.user;
                    this.userDetail.users[i].password = obj.password;
                    this.userDetail.users[i].roles = this.roles;
                    break;
                }
            }
        }

        this.coreService.post('security_configuration/write', this.userDetail).subscribe(res => {
            this.submitted = false;
            this.activeModal.close(this.userDetail.users);
        }, err => {
            this.submitted = false;
        });
    }

    selected(value:any):void {
        this.roles.push(value.text);
    }

    removed(value:any):void {
        this.roles.splice(this.roles.indexOf(value.text), 1);
    }
}

//Main Component
@Component({
    selector: 'app-accounts-all',
    templateUrl: 'accounts.component.html',
    styleUrls: ['./accounts.component.css'],

})
export class AccountsComponent implements OnInit, OnDestroy {

  preferences: any = {};
  users: any = [];
  roles: any = [];
  order: string = 'user';
  reverse: boolean = false;
  usr: any = {};
  userDetail: any = {};
  temp: any = 0;
  searchKey: string;
  subscription1: Subscription;
  subscription2: Subscription;
  subscription3: Subscription;

  constructor(private router: Router, private authService: AuthService, private coreService: CoreService, private modalService: NgbModal, private dataService: DataService) {
    this.subscription1 = this.dataService.searchKeyAnnounced$.subscribe(res => {
      this.searchKey = res;
    });
    this.subscription2 = this.dataService.dataAnnounced$.subscribe(res => {
      if (res)
        this.setUserData(res);
    });
    this.subscription3 = this.dataService.functionAnnounced$.subscribe(res => {
      if (res === 'ADD')
        this.addUser();
    });
  }

  ngOnInit() {
    this.usr = {currentPage: 1};
    if (sessionStorage.preferences)
      this.preferences = JSON.parse(sessionStorage.preferences) || {};
  }

  setUserData(res) {
    this.userDetail = res;
    this.users = res.users;
    this.getRoles();
  }

  ngOnDestroy() {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
  }

  saveInfo() {
    let obj = {
      users: this.users,
      masters: this.userDetail.masters,
      main: this.userDetail.main
    };

    this.coreService.post('security_configuration/write', obj).subscribe(res => {
      console.log(res)
    }, err => {

    });
  }

  getRoles() {
    let obj: any;
    this.coreService.post('security/permissions', {}).subscribe(res => {
      obj = res;
      this.roles = obj.SOSPermissionRoles.SOSPermissionRole;
    });
  }

  showMaster(user) {
    console.log(user);
    this.router.navigate(['/users/master'], {queryParams: {user: user}});
  }

  addUser() {
    const modalRef = this.modalService.open(AccountModal, {backdrop: "static"});
    modalRef.componentInstance.userDetail = this.userDetail;
    modalRef.componentInstance.allRoles = this.roles;
    modalRef.componentInstance.newUser = true;
    modalRef.result.then((result) => {
      this.users = result;
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  editUser(user) {

    const modalRef = this.modalService.open(AccountModal, {backdrop: "static"});
    modalRef.componentInstance.userDetail = this.userDetail;
    modalRef.componentInstance.allRoles = this.roles;
    modalRef.componentInstance.oldUser = user;
    modalRef.result.then((result) => {
      this.users = result;
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  copyUser(user) {

    const modalRef = this.modalService.open(AccountModal, {backdrop: "static"});
    modalRef.componentInstance.userDetail = this.userDetail;
    modalRef.componentInstance.copy = true;
    modalRef.componentInstance.oldUser = user;
    modalRef.result.then((result) => {
      this.users = result;
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  deleteUser(user) {
    const modalRef = this.modalService.open(DeleteModal, {backdrop: "static"});
    modalRef.componentInstance.user = user;
    modalRef.result.then((result) => {
      this.users.splice(this.users.indexOf(user), 1);
      this.saveInfo();
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  sortBy(propertyName) {
    this.reverse = !this.reverse;
    this.order = propertyName;
  }

}
