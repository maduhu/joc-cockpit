import {Component, OnInit, Input, OnDestroy, EventEmitter, Output} from '@angular/core';
import { CoreService } from '../../services/core.service';
import { SaveService } from '../../services/save.service';
import { AuthService } from '../../components/guard';
import { DataService } from '../../services/data.service';
import { Subscription }   from 'rxjs/Subscription';
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TreeModal} from "../../components/tree-modal/tree.component";
import {EditFilterModal} from "../../components/filter-modal/filter.component";

import * as moment from 'moment';
import * as _ from 'underscore';
declare const $;

@Component({
  selector: 'ngbd-modal-content',
  templateUrl: './filter-dialog.html',
})

export class FilterModal implements OnInit {
  schedulerIds: any = {};
  preferences: any  = {};
  permission: any  = {};

  @Input() allFilter;
  @Input() new;
  @Input() edit;
  @Input() filter;

  name: string;

  constructor(private authService: AuthService, public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    this.preferences = JSON.parse(sessionStorage.preferences) || {};
    this.schedulerIds = JSON.parse(this.authService.scheduleIds) || {};
    this.permission = JSON.parse(this.authService.permission) || {};
    if (this.new) {
      this.filter = {
        radio: 'planned',
        paths: [],
        state: [],
        planned: 'today',
        shared: false
      };
    }else{
      this.filter.radio = 'planned';
      this.name = _.clone(this.filter.name);
    }
  }

  cancel(obj){
    if(obj){
      this.activeModal.close(obj);
    }else {
      this.activeModal.dismiss('');
    }
  }

}

@Component({
  selector: 'app-form-template',
  templateUrl: './form-template.html',
})
export class SearchComponent implements OnInit {

  @Input() schedulerIds: any;
  @Input() filter: any;
  @Input() preferences: any;
  @Input() allFilter: any;
  @Input() permission: any;
  @Input() isSearch: boolean;

  @Output() onCancel: EventEmitter<any> = new EventEmitter();
  @Output() onSearch: EventEmitter<any> = new EventEmitter();

  dateFormat: any;
  dateFormatM: any;
  config: any = {};
  existingName: any;
  submitted: boolean = false;
  isUnique: boolean = true;

  constructor(public coreService: CoreService) {}

  ngOnInit() {
    this.dateFormat = this.coreService.getDateFormat(this.preferences.dateFormat);
    this.dateFormatM = this.coreService.getDateFormatMom(this.preferences.dateFormat);
    this.config = {
      format: this.dateFormatM
    };
  }

  checkFilterName() {
    this.isUnique = true;
    for (let i = 0; i < this.allFilter.length; i++) {
      if (this.filter.name === this.allFilter[i].name && this.permission.user === this.allFilter[i].account && this.filter.name !== this.existingName) {
        this.isUnique = false;
      }
    }
  }

  onSubmit(result): void {
    this.submitted = true;
    let configObj = {
      jobschedulerId: this.schedulerIds.selected,
      account: this.permission.user,
      configurationType: "CUSTOMIZATION",
      objectType: "AUDITLOG",
      name: result.name,
      shared: result.shared,
      id: 0,
      configurationItem: {}
    };
    let fromDate:any;
    let toDate:any;
    let obj:any = {};
    obj.regex = result.regex;
    obj.paths = result.paths;
    obj.jobChain = result.jobChain;
    obj.orderId = result.orderId;
    obj.job = result.job;
    obj.state = result.state;
    obj.name = result.name;
    if (result.radio != 'current') {
      if (result.from1) {
       fromDate = this.coreService.parseProcessExecuted(result.from1);
      }
      if (result.to1) {
        toDate = this.coreService.parseProcessExecuted(result.to1);
      }
    }
    console.log(fromDate)
    console.log(toDate)
    if (fromDate) {
      obj.from1 = fromDate;
    } else {
      obj.from1 = '0d';
    }
    if (toDate) {
      obj.to1 = toDate;
    } else {
      obj.to1 = '0d';
    }
    configObj.configurationItem = JSON.stringify(obj);
    let data: any;
    this.coreService.post('configuration/save', configObj).subscribe((res) => {
      data = res;
      configObj.id = data.id;
      this.allFilter.push(configObj);
      if(this.isSearch){
        this.filter.name = '';
      }else{
         this.onCancel.emit(configObj);
      }
      this.submitted = false;
    }, err => {
      this.submitted = false;
    });
  }

  search() {
      this.onSearch.emit();
  }
  cancel() {
    this.onCancel.emit();
  }
}

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit, OnDestroy {

  schedulerIds: any = {};
  preferences: any = {};
  permission: any = {};
  adtLog: any = {};
  subscription1: Subscription;
  subscription2: Subscription;
  auditLogs: any = [];
  isLoaded: boolean = false;
  loading: boolean = false;
  showSearchPanel: boolean = false;
  searchFilter: any = {};

  searchKey: string;

  selectedFiltered: any = {};
  savedFilter: any = {};
  dateFormatM: any = {};
  filterList: any = [];

  constructor(private authService: AuthService, public coreService: CoreService, private saveService: SaveService, private dataService: DataService, private modalService: NgbModal) {
    this.subscription1 = dataService.eventAnnounced$.subscribe(res => {
      this.refresh(res);
    });
    this.subscription2 = dataService.refreshAnnounced$.subscribe(() => {
      this.init();
    });
  }

  private refresh(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i].jobschedulerId == this.schedulerIds.selected) {
        if (args[i].eventSnapshots && args[i].eventSnapshots.length > 0) {
          for (let j = 0; j < args[i].eventSnapshots.length; j++) {
            if (args[i].eventSnapshots[j].eventType === "AuditLogChanged") {
              this.load(null);
              break;
            }
          }
        }
        break
      }
    }
  }

  ngOnInit() {
    this.init();
  }

  private init() {
    this.preferences = JSON.parse(sessionStorage.preferences) || {};
    this.schedulerIds = JSON.parse(this.authService.scheduleIds) || {};
    this.permission = JSON.parse(this.authService.permission) || {};
    this.dateFormatM = this.coreService.getDateFormatMom(this.preferences.dateFormat);
    this.adtLog = this.coreService.getAuditLogTab();
    this.load(null);

  }

  ngOnDestroy() {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
  }

  sortBy(propertyName) {
    this.adtLog.reverse = !this.adtLog.reverse;
    this.adtLog.filter.sortBy = propertyName;
  }

  private setDateRange(filter) {
    if (this.adtLog.filter.date == 'all') {

    } else if (this.adtLog.filter.date == 'today') {
      filter.dateFrom = '0d';
      filter.dateTo = '0d';
    } else {
      filter.dateFrom = this.adtLog.filter.date;
    }
    return filter;
  }

  private parseProcessExecuted(regex, obj) {
    let fromDate;
    let toDate;

    if (/^\s*(-)\s*(\d+)(h|d|w|M|y)\s*$/.test(regex)) {
      fromDate = /^\s*(-)\s*(\d+)(h|d|w|M|y)\s*$/.exec(regex)[0];

    } else if (/^\s*(now\s*\-)\s*(\d+)\s*$/i.test(regex)) {
      fromDate = new Date();
      toDate = new Date();
      let seconds = parseInt(/^\s*(now\s*\-)\s*(\d+)\s*$/i.exec(regex)[2]);
      fromDate.setSeconds(toDate.getSeconds() - seconds);
    } else if (/^\s*(Today)\s*$/i.test(regex)) {
      fromDate = '0d';
      toDate = '0d';
    } else if (/^\s*(Yesterday)\s*$/i.test(regex)) {
      fromDate = '-1d';
      toDate = '0d';
    } else if (/^\s*(now)\s*$/i.test(regex)) {
      fromDate = new Date();
      toDate = new Date();
    } else if (/^\s*(-)(\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*$/.test(regex)) {
      let date = /^\s*(-)(\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*$/.exec(regex);
      let arr = date[0].split('to');
      fromDate = arr[0].trim();
      toDate = arr[1].trim();

    } else if (/^\s*(-)(\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*$/.test(regex)) {
      let date = /^\s*(-)(\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*$/.exec(regex);
      let arr = date[0].split('to');
      fromDate = arr[0].trim();
      toDate = arr[1].trim();

    } else if (/^\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*$/.test(regex)) {
      let date = /^\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*$/.exec(regex);
      let arr = date[0].split('to');
      fromDate = arr[0].trim();
      toDate = arr[1].trim();

    } else if (/^\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*$/.test(regex)) {
      let date = /^\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*to\s*(-)(\d+)(h|d|w|M|y)\s*[-,+](\d+)(h|d|w|M|y)\s*$/.exec(regex);
      let arr = date[0].split('to');
      fromDate = arr[0].trim();
      toDate = arr[1].trim();

    } else if (/^\s*(\d+):(\d+)\s*(am|pm)\s*to\s*(\d+):(\d+)\s*(am|pm)\s*$/i.test(regex)) {
      let time = /^\s*(\d+):(\d+)\s*(am|pm)\s*to\s*(\d+):(\d+)\s*(am|pm)\s*$/i.exec(regex);
      fromDate = new Date();
      if (/(pm)/i.test(time[3]) && parseInt(time[1]) != 12) {
        fromDate.setHours(parseInt(time[1]) - 12);
      } else {
        fromDate.setHours(parseInt(time[1]));
      }

      fromDate.setMinutes(parseInt(time[2]));
      toDate = new Date();
      if (/(pm)/i.test(time[6]) && parseInt(time[4]) != 12) {
        toDate.setHours(parseInt(time[4]) - 12);
      } else {
        toDate.setHours(parseInt(time[4]));
      }
      toDate.setMinutes(parseInt(time[5]));
    }

    if (fromDate) {
      obj.dateFrom = fromDate;
    }
    if (toDate) {
      obj.dateTo = toDate;
    }
    return obj;
  }

  load(date) {
    if (date)
      this.adtLog.filter.date = date;
    let obj = {
      jobschedulerId: this.adtLog.current == true ? this.schedulerIds.selected : '',
      limit: parseInt(this.preferences.maxAuditLogRecords),
      timeZone: this.preferences.zone
    };
    obj = this.setDateRange(obj);
    let result: any;
    this.coreService.post('audit_log', obj).subscribe(res => {
      result = res;
      this.auditLogs = result.auditLog;
      this.isLoaded = true;
    }, (err) => {
      console.log(err);
      this.isLoaded = true;
    });
  }

  changeJobScheduler() {
    this.load(null);
  }

  /* ----------------------Action --------------------- */

  exportToExcel() {
    $('#auditLogTableId').table2excel({
      exclude: ".tableexport-ignore",
      filename: "jobscheduler-agent-job-excution",
      fileext: ".xls",
      exclude_img: false,
      exclude_links: false,
      exclude_inputs: false
    });
  }


  /* ----------------------Advance Search --------------------- */
  advancedSearch() {
    this.showSearchPanel = true;
    this.searchFilter = {
      radio: 'current',
      planned: 'today',
      from: moment().format(this.dateFormatM),
      fromTime: '00:00',
      to: moment().format(this.dateFormatM),
      toTime: '24:00'
    };
  }

  cancel() {
    if (!this.adtLog.filter.date) {
      this.adtLog.filter.date = 'today';
    }
    this.showSearchPanel = false;
    this.searchFilter = {};
    this.load(null);
  }

  private parseDate(auditSearch, filter) {
    if (auditSearch.date === 'current' && auditSearch.from) {
      let fromDate = new Date(auditSearch.from);
      if (auditSearch.fromTime) {
        fromDate.setHours(moment(auditSearch.fromTime, 'HH:mm:ss').hours());
        fromDate.setMinutes(moment(auditSearch.fromTime, 'HH:mm:ss').minutes());
        fromDate.setSeconds(moment(auditSearch.fromTime, 'HH:mm:ss').seconds());
      } else {
        fromDate.setHours(0);
        fromDate.setMinutes(0);
        fromDate.setSeconds(0);
      }
      fromDate.setMilliseconds(0);

      filter.dateFrom = fromDate;
    }
    if (auditSearch.date === 'current' && auditSearch.to) {
      let toDate = new Date(auditSearch.to);
      if (auditSearch.toTime) {
        toDate.setHours(moment(auditSearch.fromTime, 'HH:mm:ss').hours());
        toDate.setMinutes(moment(auditSearch.fromTime, 'HH:mm:ss').minutes());
        toDate.setSeconds(moment(auditSearch.fromTime, 'HH:mm:ss').seconds());

      } else {
        toDate.setHours(0);
        toDate.setMinutes(0);
        toDate.setSeconds(0);
      }
      toDate.setMilliseconds(0);

      filter.dateTo = toDate;
    }
    if ((filter.dateFrom && typeof filter.dateFrom.getMonth === 'function') || (filter.dateTo && typeof filter.dateTo.getMonth === 'function')) {
      delete filter['timeZone']
    }
    return filter;
  }

  search() {

    let filter = {
      jobschedulerId: this.adtLog.current == true ? this.schedulerIds.selected : '',
      limit: parseInt(this.preferences.maxAuditLogRecords),
      orders: [],
      jobs: [],
      regex: '',
      calendars: '',
      account: this.searchFilter.account ? this.searchFilter.account : undefined,
      timeZone: this.preferences.zone
    };

    this.adtLog.filter.date = '';
    if (this.searchFilter.jobChain) {
      if (this.searchFilter.orderIds) {
        let s = this.searchFilter.orderIds.replace(/\s*(,|^|$)\s*/g, "$1");
        let orderIds = s.split(',');
        let self = this;
        orderIds.forEach(function (value) {
          filter.orders.push({jobChain: self.searchFilter.jobChain, orderId: value})
        });
      } else {
        filter.orders.push({jobChain: this.searchFilter.jobChain})
      }
    }
    if (this.searchFilter.job) {
      let s = this.searchFilter.job.replace(/\s*(,|^|$)\s*/g, "$1");
      let jobs = s.split(',');
      jobs.forEach(function (value) {
        filter.jobs.push({job: value})
      });
    }
    if (this.searchFilter.calendars) {
      let s = this.searchFilter.calendars.replace(/\s*(,|^|$)\s*/g, "$1");
      filter.calendars = s.split(',');
    }
    if (this.searchFilter.regex) {
      filter.regex = this.searchFilter.regex;
    }
    if (this.searchFilter.radio == 'planned') {
      filter = this.parseProcessExecuted(this.searchFilter.planned, filter);
    } else {
      filter = this.parseDate(this.searchFilter, filter);
    }

    let result: any;
    this.coreService.post('audit_log', filter).subscribe(res => {
      result = res;
      this.auditLogs = result.auditLog;
      //  this.isLoaded = false;
    }, (err) => {
      console.log(err);
      //  this.isLoaded = false;
    });
  }


  /* ---- Customization ------ */
  createCustomization() {
    const modalRef = this.modalService.open(FilterModal, {backdrop: "static", size: "lg"});
    modalRef.componentInstance.permission = this.permission;
    modalRef.componentInstance.schedulerId = this.schedulerIds.selected;
    modalRef.componentInstance.allFilter = this.filterList;
    modalRef.componentInstance.new = true;
    modalRef.result.then((configObj) => {
      if (this.filterList.length == 1) {
        this.savedFilter.selected = configObj.id;
        this.adtLog.selectedView = true;
        this.selectedFiltered = configObj;
        // this.isCustomizationSelected(true);
        // this.load();
        // this.saveService.setAuditLog(this.savedFilter);
        // this.saveService.save();
      }
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  editFilters() {
    const modalRef = this.modalService.open(EditFilterModal, {backdrop: "static"});
    modalRef.componentInstance.filterList = this.filterList;
    modalRef.componentInstance.favorite = this.savedFilter.favorite;
    modalRef.componentInstance.permission = this.permission;
    modalRef.componentInstance.username = this.permission.user;
    modalRef.componentInstance.action = this.action;
    modalRef.componentInstance.self = this;

    modalRef.result.then((obj) => {
      if (obj.type === 'EDIT') {
        this.editFilter(obj)
      } else if (obj.type === 'COPY') {
        this.copyFilter(obj)
      }
    }, (reason) => {
      console.log('close...', reason)
    });
  }

  action(type, obj, self) {
    if (type === 'DELETE') {
      if (self.savedFilter.selected == obj.id) {
        self.savedFilter.selected = undefined;
        self.isCustomizationSelected(false);
        self.dailyPlanFilters.selectedView = false;
        self.selectedFiltered = undefined;
        self.setDateRange(null);
        self.load();
      } else {
        if (self.filterList.length == 0) {
          self.isCustomizationSelected(false);
          self.savedFilter.selected = undefined;
          self.dailyPlanFilters.selectedView = false;
          self.selectedFiltered = undefined;
        }
      }
      self.saveService.setDailyPlan(self.savedFilter);
      self.saveService.save();
    } else if (type === 'MAKEFAV') {
      self.savedFilter.favorite = obj.id;
      self.dailyPlanFilters.selectedView = true;
      self.saveService.setDailyPlan(self.savedFilter);
      self.saveService.save();
      self.load();
    } else if (type === 'REMOVEFAV') {
      self.savedFilter.favorite = '';
      self.saveService.setDailyPlan(self.savedFilter);
      self.saveService.save();
    }
  }

  private editFilter(filter) {
    let filterObj: any = {};
    let result: any;
    this.coreService.post('configuration', {jobschedulerId: filter.jobschedulerId, id: filter.id}).subscribe((conf) => {
      result = conf;
      filterObj = JSON.parse(result.configuration.configurationItem);
      filterObj.shared = filter.shared;

      const modalRef = this.modalService.open(FilterModal, {backdrop: "static", size: "lg"});
      modalRef.componentInstance.permission = this.permission;
      modalRef.componentInstance.schedulerId = this.schedulerIds.selected;
      modalRef.componentInstance.allFilter = this.filterList;
      modalRef.componentInstance.filter = filterObj;
      modalRef.componentInstance.edit = true;
      modalRef.result.then((configObj) => {

      }, (reason) => {
        console.log('close...', reason)
      });
    });
  }

  private copyFilter(filter) {
    let filterObj: any = {};
    let result: any;
    this.coreService.post('configuration', {jobschedulerId: filter.jobschedulerId, id: filter.id}).subscribe((conf) => {
      result = conf;
      filterObj = JSON.parse(result.configuration.configurationItem);
      filterObj.shared = filter.shared;
      filterObj.name = this.coreService.checkCopyName(this.filterList, filter.name);

      const modalRef = this.modalService.open(FilterModal, {backdrop: "static", size: "lg"});
      modalRef.componentInstance.permission = this.permission;
      modalRef.componentInstance.schedulerId = this.schedulerIds.selected;
      modalRef.componentInstance.allFilter = this.filterList;
      modalRef.componentInstance.filter = filterObj;
      modalRef.result.then((configObj) => {

      }, (reason) => {
        console.log('close...', reason)
      });
    });
  }

  changeFilter(filter) {
    if (filter) {
      this.savedFilter.selected = filter.id;
      this.adtLog.selectedView = true;
      let result: any;
      this.coreService.post('configuration', {
        jobschedulerId: filter.jobschedulerId,
        id: filter.id
      }).subscribe((conf) => {
        result = conf;
        this.selectedFiltered = JSON.parse(result.configuration.configurationItem);
        this.selectedFiltered.account = filter.account;
        //   this.load();
      });
    } else {
      //  this.isCustomizationSelected(false);
      this.savedFilter.selected = filter;
      this.adtLog.selectedView = false;
      this.selectedFiltered = {};
      // this.setDateRange()
      // this.load();
    }

    // this.saveService.setAuditLog(this.savedFilter);
    //  this.saveService.save();
  }
}
