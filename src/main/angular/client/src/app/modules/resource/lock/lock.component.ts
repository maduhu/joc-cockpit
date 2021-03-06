import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {CoreService} from '../../../services/core.service';
import {AuthService} from '../../../components/guard';
import {DataService} from '../../../services/data.service';
import {TreeComponent} from "../../../components/tree-navigation/tree.component";

import * as _ from 'underscore';

//Main Component
@Component({
  selector: 'app-lock',
  templateUrl: 'lock.component.html',
  styleUrls: ['./lock.component.css'],

})
export class LockComponent implements OnInit, OnDestroy {

  isLoading: boolean = false;
  loading: boolean;
  schedulerIds: any  = {};
  tree: any = [];
  preferences: any  = {};
  permission: any  = {};
  pageView: any;
  locks: any = [];
  locksFilters: any = {};
  subscription1: Subscription;
  subscription2: Subscription;

  @ViewChild(TreeComponent) child;

  constructor(private authService: AuthService, public coreService: CoreService, private dataService: DataService) {
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
            if ((args[i].eventSnapshots[j].eventType == "FileBasedActivated" || args[i].eventSnapshots[j].eventType == "FileBasedRemoved") && args[i].eventSnapshots[j].objectType === "PROCESSCLASS") {
              this.initTree();
              break;
            } else if (args[i].eventSnapshots[j].eventType === "JobStateChanged" && args[i].eventSnapshots[j].path) {
              if(this.locks.length>0) {
                for (let x = 0; x < this.locks.length; x++) {
                  if (this.locks[x].path === args[i].eventSnapshots[j].path) {
                    let obj = {
                      jobschedulerId: this.schedulerIds.selected,
                      folders: [{folder: this.locks[x].path, recursive: false}]
                    };
                    this.coreService.post('locks',obj).subscribe(res=>{
                      //TODO merge
                      console.log(res)
                    })
                  }
                }
              }
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
    this.locksFilters = this.coreService.getResourceTab().locks;
    if (sessionStorage.preferences)
      this.preferences = JSON.parse(sessionStorage.preferences);
    this.schedulerIds = JSON.parse(this.authService.scheduleIds)  || {};
    this.permission = JSON.parse(this.authService.permission) || {};
    if (localStorage.views)
      this.pageView = JSON.parse(localStorage.views).lock;

    this.initTree();
  }


  ngOnDestroy() {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
  }

  initTree() {
    this.coreService.post('tree', {
      jobschedulerId: this.schedulerIds.selected,
      compact: true,
      types: ["LOCK"]
    }).subscribe(res => {
      this.filteredTreeData(this.coreService.prepareTree(res));
      this.isLoading = true;
    }, () => {
      this.isLoading = true;
    });
  }


  private filteredTreeData(output) {
    if (_.isEmpty(this.locksFilters.expand_to)) {
        this.tree = output;
        this.locksFilters.expand_to = this.tree;
        this.checkExpand();
      } else {
        this.locksFilters.expand_to = this.coreService.recursiveTreeUpdate(output, this.locksFilters.expand_to);
        this.tree = this.locksFilters.expand_to;
        this.expandTree();
      }
  }


  private expandTree() {
    const self = this;
    setTimeout(function () {
      self.tree.forEach(function (data) {
        recursive(data);
      });
    }, 10);

    function recursive(data) {
      if (data.isExpanded && self.child) {
        let node = self.child.getNodeById(data.id);
        node.expand();
        if (data.children && data.children.length > 0) {
          data.children.forEach(function (child) {
            recursive(child);
          });
        }
      }
    }
  }

  private checkExpand() {
    const self = this;
    setTimeout(function () {
      const node = self.child.getNodeById(1);
      node.expand();
      node.setActiveAndVisible(true);
    }, 10)
  }

  private startTraverseNode(data) {
    let self = this;
    data.isSelected = true;
    data.children.forEach(function (a) {
      self.startTraverseNode(a);
    });
  }

  private getLocksList(obj, node) {
    let result: any;
    this.coreService.post('locks', obj).subscribe(res => {
      this.loading = false;
      result = res;
      result.locks.forEach(function (value) {
        value.path1 = value.path.substring(0, value.path.lastIndexOf('/')) || value.path.substring(0, value.path.lastIndexOf('/') + 1);
      });
      this.locks = result.locks;
      if (node) {
        this.startTraverseNode(node.data);
      }
    }, () => {
      this.loading = false;
    });
  }

  expandNode(node): void {
    this.navFullTree();
    const someNode = this.child.getNodeById(node.data.id);
    someNode.expandAll();
    this.locks = [];
    this.loading = true;

    let obj = {
      jobschedulerId: this.schedulerIds.selected,
      folders: [{folder: node.data.path, recursive: true}],
      compact: true
    };

    this.getLocksList(obj, node);
  }


  receiveAction($event) {
    if($event.action === 'NODE')
     this.getLocks($event.data);
    else
      this.expandNode($event)

  }

  getLocks(data) {
    data.isSelected = true;
    this.loading = true;
    let obj = {
      folders: [{folder: data.path, recursive: false}],
      jobschedulerId: this.schedulerIds.selected,
      compact: true
    };

    this.getLocksList(obj, null);
  }

  private traverseTree(data) {
    let self = this;
    data.children.forEach(function (value) {
      value.isSelected = false;
      self.traverseTree(value);
    });
  }

  private navFullTree() {
    let self = this;
    this.tree.forEach(function (value) {
      value.isSelected = false;
      self.traverseTree(value);
    });
  }

  sortBy(propertyName) {
    this.locksFilters.reverse = !this.locksFilters.reverse;
    this.locksFilters.filter.sortBy = propertyName;
  }


  /** ---------------------------- Action ----------------------------------*/

  receiveMessage($event) {
    this.pageView = $event;
  }

  showConfiguration(lock){

  }
}

