import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoreService } from '../../../services/core.service';
import { DataService } from '../../../services/data.service';
import { Subscription }   from 'rxjs/Subscription';
import { AuthService } from '../../../components/guard';


declare var $:any;
@Component({
  selector: 'app-agent-running-task',
  templateUrl: './agent-running-task.component.html',
  styleUrls: ['./agent-running-task.component.css']
})
export class AgentRunningTaskComponent implements OnInit, OnDestroy {

  isLoaded: boolean = false;
  schedulerIds: any;
  subscription: Subscription;
  data = [];
  view: any[] = [600, 200];

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private coreService: CoreService, private authService: AuthService, private dataService: DataService) {
    this.subscription = dataService.eventAnnounced$.subscribe(res => {
      this.refresh(res);
    });
  }

  refresh(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i].jobschedulerId == this.schedulerIds.selected) {
        if (args[i].eventSnapshots && args[i].eventSnapshots.length > 0) {
          for (let j = 0; j < args[i].eventSnapshots.length; j++) {
            if (args[i].eventSnapshots[j].eventType === "JobStateChanged") {
              this.getRunningTask();
              break;
            }
          }
        }
        break
      }
    }
  }

  ngOnInit() {
    this.getRunningTask();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  agentClusterRunningTaskGraph(res) {
    this.data = [];
    for (let i = 0; i < res.processClasses.length; i++) {
      this.data.push({name: res.processClasses[i].path, value: res.processClasses[i].numOfProcesses});
    }
  }

  getRunningTask(): void {
    this.schedulerIds = JSON.parse(this.authService.scheduleIds);
    this.coreService.post('process_classes', {
      jobschedulerId: this.schedulerIds.selected,
      isAgentCluster: true
    }).subscribe(res => {
      this.agentClusterRunningTaskGraph(res);
      this.isLoaded = true;
    }, (err) => {
      console.log(err);
      this.isLoaded = true;
    });
  }

  viewAllAgents(): void {

  }

  onSelect(event) {

  }
}
