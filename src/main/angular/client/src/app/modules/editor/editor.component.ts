import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CoreService} from '../../services/core.service';
import {AuthService} from '../../components/guard';
import {saveAs} from 'file-saver/FileSaver';
import * as _ from 'underscore';

declare const mxEditor;
declare const mxUtils;
declare const mxEvent;
declare const mxClient;
declare const mxObjectCodec;
declare const mxGuide;
declare const mxEdgeHandler;
declare const mxImage;
declare const mxConnectionHandler;
declare const mxCodec;
declare const mxAutoSaveManager;
declare const mxGraphHandler;
declare const mxCellAttributeChange;
declare const mxGraph;
declare const mxForm;
declare const mxMultiplicity;
declare const mxHierarchicalLayout;
declare const mxImageExport;
declare const mxXmlCanvas2D;
declare const mxMorphing;
declare const mxOutline;

declare const X2JS;
declare const $;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  host: {
    '(window:resize)': 'onResize()'
  }
})
export class EditorComponent implements OnInit, OnDestroy {
  schedulerIds: any = {};
  tree: any = [];
  isLoading: boolean = true;
  view: string;
  editor: any;
  xmlTest: any;
  workFlows: any = [];
  object: any = {checkbox: false, workflows: []};
  lastId: any;
  joinId: any;
  isPropertyHide: boolean = false;
  json: any = {};
  options: any = {};

  count = 2;

  @ViewChild('treeCtrl') treeCtrl;

  constructor(private authService: AuthService, public coreService: CoreService) {

  }

  ngOnInit() {

    this.init();
    EditorComponent.setGraphHt();

    let json: any = {};

    this.coreService.get("workflow.json").subscribe((data) => {
      this.appendIdInJson(data.If);
      this.count = 2;
      json = data.If;
      let mxJson = {
        mxGraphModel: {
          root: {
            mxCell: [
              {_id: '0'},
              {
                _id: '1',
                _parent: '0'
              }
            ]
          }
        }
      };
      this.jsonParser(json, mxJson.mxGraphModel.root);
      let x2js = new X2JS();
      this.xmlTest = x2js.json2xml_str(mxJson);
    });
  }

  ngOnDestroy() {
    //  this.xmlToJsonParser();
    try {
      if (this.editor) {
        mxEvent.removeAllListeners(this.editor.graph);
        this.editor.destroy();
        this.editor = null;
      }
    } catch (e) {
      console.log(e)
    }

  }

  init() {
    this.schedulerIds = JSON.parse(this.authService.scheduleIds);
    this.view = JSON.parse(localStorage.views).joe || 'grid';

    this.workFlows = [
      {id: 1, job: 'Job 1', path: '/test/test101/job1'},
      {id: 1, job: 'Job 2', path: '/test/test101/job1'},
      {id: 1, job: 'Job 3', path: '/test/test101/job3'}
    ];
    this.initTree();
  }

  initTree() {
    this.coreService.post('tree', {
      jobschedulerId: this.schedulerIds.selected,
      compact: true
    }).subscribe(res => {
      this.tree = this.coreService.prepareTree(res);
      const self = this;
      let interval = setInterval(function () {
        if (self.treeCtrl && self.treeCtrl.treeModel) {
          const node = self.treeCtrl.treeModel.getNodeById(1);
          node.expand();
          clearInterval(interval);
        }
      }, 5);
      this.isLoading = false;
      this.createEditor('./assets/mxgraph/config/diagrameditor.xml');
    }, () => this.isLoading = false);
  }

  private appendIdInJson(json) {
    for (let x = 0; x < json.instructions.length; x++) {
      json.instructions[x].id = ++this.count;
      if (json.instructions[x].instructions) {
        this.appendIdInJson(json.instructions[x])
      }
      if (json.instructions[x].then) {
        this.appendIdInJson(json.instructions[x].then)
      }
      if (json.instructions[x].else) {
        this.appendIdInJson(json.instructions[x].else)
      }
      if (json.instructions[x].branches) {
        for (let i = 0; i < json.instructions[x].branches.length; i++) {
          this.appendIdInJson(json.instructions[x].branches[i]);
        }
      }
    }
  }

  private jsonParseForAwait(eventObj, mxJson) {
    if (eventObj.TYPE) {
      if (eventObj.TYPE === 'OfferedOrder') {
        if (mxJson.OfferedOrder) {
          if (!_.isArray(mxJson.OfferedOrder)) {
            let _tempOfferedOrder = _.clone(mxJson.OfferedOrder);
            mxJson.OfferedOrder = [];
            mxJson.OfferedOrder.push(_tempOfferedOrder);
          }
        } else {
          mxJson.OfferedOrder = [];
        }
        let obj: any = {
          _id: eventObj.id,
          _label: 'Offered Order',
          mxCell: {
            _parent: '1',
            _vertex: '1',
            _style: 'ellipse',
            mxGeometry: {
              _as: 'geometry',
              _width: '80',
              _height: '60'
            }
          }
        };
        mxJson.OfferedOrder.push(obj);
      }
    } else if (eventObj.TYPE === 'TimePeriod') {
      //TODO
    } else if (eventObj.TYPE === 'FileOrder') {
      //TODO
    }
  }

  private jsonParser(json, mxJson) {
    const self = this;
    if (json.instructions) {
      for (let x = 0; x < json.instructions.length; x++) {
        let obj: any = {
          mxCell: {
            _parent: '1',
            _vertex: '1',
            mxGeometry: {
              _as: 'geometry'
            }
          }
        };

        if (json.instructions[x].TYPE === 'Job') {
          if (mxJson.Job) {
            if (!_.isArray(mxJson.Job)) {
              let _tempJob = _.clone(mxJson.Job);
              mxJson.Job = [];
              mxJson.Job.push(_tempJob);
            }

          } else {
            mxJson.Job = [];
          }

          obj._id = json.instructions[x].id;
          obj._path = json.instructions[x].jobPath;
          obj._title = json.instructions[x].title ? json.instructions[x].title : '';
          obj._agent = json.instructions[x].agentPath ? json.instructions[x].agentPath : '';
          obj.mxCell._style = 'rounded';
          obj.mxCell.mxGeometry._width = '200';
          obj.mxCell.mxGeometry._height = '50';
          mxJson.Job.push(obj);
        }
        else if (json.instructions[x].TYPE === 'If') {
          if (mxJson.If) {
            if (!_.isArray(mxJson.If)) {
              let _tempIf = _.clone(mxJson.If);
              mxJson.If = [];
              mxJson.If.push(_tempIf);
            }
          } else {
            mxJson.If = [];
          }
          obj._id = json.instructions[x].id;
          obj._predicate = json.instructions[x].predicate;
          obj.mxCell._style = 'rhombus';
          obj.mxCell.mxGeometry._width = '150';
          obj.mxCell.mxGeometry._height = '70';

          if (json.instructions[x].then && json.instructions[x].then.instructions) {
            self.jsonParser(json.instructions[x].then, mxJson);
            self.connectInstruction(json.instructions[x], json.instructions[x].then.instructions[0], mxJson, 'then');
          }
          if (json.instructions[x].else && json.instructions[x].else.instructions) {
            self.jsonParser(json.instructions[x].else, mxJson);
            self.connectInstruction(json.instructions[x], json.instructions[x].else.instructions[0], mxJson, 'else');
          }
          mxJson.If.push(obj);

        }
        else if (json.instructions[x].TYPE === 'ForkJoin') {
          if (mxJson.Fork) {
            if (!_.isArray(mxJson.Fork)) {
              let _tempFork = _.clone(mxJson.Fork);
              mxJson.Fork = [];
              mxJson.Fork.push(_tempFork);
            }
          } else {
            mxJson.Fork = [];
          }
          obj._id = json.instructions[x].id;
          obj._label = 'Fork';
          obj.mxCell._style = 'symbol;image=./assets/mxgraph/images/symbols/fork.png';
          obj.mxCell.mxGeometry._width = '70';
          obj.mxCell.mxGeometry._height = '70';

          if (json.instructions[x].branches && json.instructions[x].branches.length > 0) {
            for (let i = 0; i < json.instructions[x].branches.length; i++) {
              self.jsonParser(json.instructions[x].branches[i], mxJson);
              self.connectInstruction(json.instructions[x], json.instructions[x].branches[i], mxJson, 'branch');
            }
            self.joinFork(json.instructions[x].branches, mxJson, json.instructions, x);
          }
          mxJson.Fork.push(obj);
        }
        else if (json.instructions[x].TYPE === 'Await') {
          if (mxJson.Await) {
            if (!_.isArray(mxJson.Await)) {
              let _tempAwait = _.clone(mxJson.Await);
              mxJson.Await = [];
              mxJson.Await.push(_tempAwait);
            }
          } else {
            mxJson.Await = [];
          }
          obj._id = json.instructions[x].id;
          obj._label = 'Await';
          obj.mxCell._style = 'symbol;image=./assets/mxgraph/images/symbols/timer.png';
          obj.mxCell.mxGeometry._width = '70';
          obj.mxCell.mxGeometry._height = '70';

          if (json.instructions[x].events && json.instructions[x].events.length > 0) {
            for (let i = 0; i < json.instructions[x].events.length; i++) {
              //TODO
              self.jsonParseForAwait(json.instructions[x].events[i], mxJson);
              self.connectInstruction(json.instructions[x], json.instructions[x].events[i], mxJson, '');
            }
          }

          mxJson.Await.push(obj);
        }
        else if (json.instructions[x].TYPE === 'Retry') {
          if (mxJson.Retry) {
            if (!_.isArray(mxJson.Retry)) {
              let _tempRetry = _.clone(mxJson.Retry);
              mxJson.Retry = [];
              mxJson.Retry.push(_tempRetry);
            }
          } else {
            mxJson.Retry = [];
          }
          obj._id = json.instructions[x].id;
          obj._predicate = json.instructions[x].predicate;
          obj._maxSteps = json.instructions[x].maxSteps;
          obj._delay = json.instructions[x].delay;
          obj.mxCell._style = 'rhombus';
          obj.mxCell.mxGeometry._width = '200';
          obj.mxCell.mxGeometry._height = '90';

          if (json.instructions[x].instructions && json.instructions[x].instructions.length > 0) {
            self.jsonParser(json.instructions[x], mxJson);
            self.connectInstruction(json.instructions[x], json.instructions[x].instructions[0], mxJson, 'retry');
          }
          mxJson.Retry.push(obj);
        }
        else if (json.instructions[x].TYPE === 'Exit') {
          if (mxJson.Exit) {
            if (!_.isArray(mxJson.Exit)) {
              let _tempExit = _.clone(mxJson.Exit);
              mxJson.Exit = [];
              mxJson.Exit.push(_tempExit);
            }
          } else {
            mxJson.Exit = [];
          }
          obj._id = json.instructions[x].id;
          obj._label = json.instructions[x].TYPE;
          obj.mxCell._style = 'symbol;image=./assets/mxgraph/images/symbols/cancel_end.png';
          obj.mxCell.mxGeometry._width = '60';
          obj.mxCell.mxGeometry._height = '60';
          mxJson.Exit.push(obj);
        }
        else {
          console.log('Workflow yet to parse : ' + json.instructions[x].TYPE);
        }
        if (json.instructions[x].TYPE !== 'ForkJoin')
          self.connectEdges(json.instructions, x, mxJson);
      }
    } else {
      console.log('No instruction..');
    }
  }

  private connectEdges(list, index, mxJson) {
    if (mxJson.Connector) {
      if (!_.isArray(mxJson.Connector)) {
        let _tempJob = _.clone(mxJson.Connector);
        mxJson.Connector = [];
        mxJson.Connector.push(_tempJob);
      }

    } else {
      mxJson.Connector = [];
    }

    if (list.length > (index + 1)) {
      let obj: any = {
        _label: '',
        mxCell: {
          _parent: '1',
          _source: list[index].id,
          _target: list[index + 1].id,
          _edge: '1',
          mxGeometry: {
            _relative: 1,
            _as: 'geometry'
          }
        }
      };

      mxJson.Connector.push(obj);
    }
  }

  private connectInstruction(source, target, mxJson, label) {
    if (mxJson.Connector) {
      if (!_.isArray(mxJson.Connector)) {
        let _tempJob = _.clone(mxJson.Connector);
        mxJson.Connector = [];
        mxJson.Connector.push(_tempJob);
      }
    } else {
      mxJson.Connector = [];
    }
    let obj: any = {
      _label: label === 'branch' ? '' : label === 'join' ? '' : label === 'then' ? 'true' : label === 'else' ? 'false' : label,
      _type: label,
      mxCell: {
        _parent: '1',
        _source: source.id,
        _target: source.TYPE === 'ForkJoin' ? target.instructions[0].id : target.id,
        _edge: '1',
        mxGeometry: {
          _relative: 1,
          _as: 'geometry'
        }
      }
    };
    mxJson.Connector.push(obj);
  }

  private joinFork(branchs, mxJson, list, index) {
    if (mxJson.Join) {
      if (!_.isArray(mxJson.Join)) {
        let _tempJoin = _.clone(mxJson.Join);
        mxJson.Join = [];
        mxJson.Join.push(_tempJoin);
      }

    } else {
      mxJson.Join = [];
    }
    let id = parseInt(list[list.length - 1].id) + 1000;
    let joinObj: any = {
      _id: id,
      _label: 'Join',
      mxCell: {
        _parent: '1',
        _vertex: '1',
        _style: 'symbol;image=./assets/mxgraph/images/symbols/fork.png',
        mxGeometry: {
          _as: 'geometry',
          _width: '70',
          _height: '70'
        }
      }
    };
    mxJson.Join.push(joinObj);
    for (let i = 0; i < branchs.length; i++) {
      this.connectInstruction(branchs[i].instructions[branchs[i].instructions.length - 1], {id: id}, mxJson, 'join')
    }

    if (list.length > (index + 1)) {
      this.connectInstruction({id: id}, list[index + 1], mxJson, '')
    }
  }

  private createObject(type, node): any {
    let obj: any = {
      id: node._id,
      TYPE: type,
    };
    if (type == 'Job') {
      obj.jobPath = node._path;
      obj.title = node._title;
      obj.agentPath = node._agent;
      console.log(node);
      let successArr,  failureArr;
      if (node._success) {
        successArr = node._success.split(',');
      }
      if (node._failure) {
        failureArr = node._failure.split(',');
      }

      obj.returnCodeMeaning = {failure: failureArr, success: successArr};
    } else if (type == 'If') {
      obj.predicate = node._predicate;
    } else if (type == 'Retry') {
      obj.predicate = node._predicate;
      obj.maxSteps = node._maxSteps;
      obj.delay = node._delay;
    }

    return obj;
  }

  private xmlToJsonParser() {
    if (this.editor) {
      let _graph = _.clone(this.editor.graph);
      let enc = new mxCodec();

      let node = enc.encode(_graph.getModel());
      let xml = mxUtils.getXml(node);
      let x2js = new X2JS();
      let _json: any;
      try {
        _json = x2js.xml_str2json(xml);
      } catch (e) {
        console.log(e);
      }

      if (!_json.mxGraphModel) {
        return;
      }
      let objects = _json.mxGraphModel.root;

      let jsonObj = {
        id: '',
        instructions: []
      };
      let startNode: any = {};

      if (objects.Connector) {
        if (!_.isArray(objects.Connector)) {
          let _tempCon = _.clone(objects.Connector);
          objects.Connector = [];
          objects.Connector.push(_tempCon);
        }
        let connectors = objects.Connector;
        let _jobs = _.clone(objects.Job);
        let _ifInstructions = _.clone(objects.If);
        let _forkInstructions = _.clone(objects.Fork);
        let _retryInstructions = _.clone(objects.Retry);
        let _awaitInstructions = _.clone(objects.Await);
        let _exitInstructions = _.clone(objects.Exit);

        for (let i = 0; i < connectors.length; i++) {
          if (_jobs) {
            if (_.isArray(_jobs)) {
              for (let j = 0; j < _jobs.length; j++) {
                if (connectors[i].mxCell._target == _jobs[j]._id) {
                  _jobs.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _jobs._id) {
                _jobs = [];
              }
            }
          }
          if (_forkInstructions) {
            if (_.isArray(_forkInstructions)) {
              for (let j = 0; j < _forkInstructions.length; j++) {
                if (connectors[i].mxCell._target == _forkInstructions[j]._id) {
                  _forkInstructions.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _forkInstructions._id) {
                _forkInstructions = [];
              }
            }
          }
          if (_retryInstructions) {
            if (_.isArray(_retryInstructions)) {
              for (let j = 0; j < _retryInstructions.length; j++) {
                if (connectors[i].mxCell._target == _retryInstructions[j]._id) {
                  _retryInstructions.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _retryInstructions._id) {
                _retryInstructions = [];
              }
            }
          }
          if (_awaitInstructions) {
            if (_.isArray(_awaitInstructions)) {
              for (let j = 0; j < _awaitInstructions.length; j++) {
                if (connectors[i].mxCell._target == _awaitInstructions[j]._id) {
                  _awaitInstructions.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _awaitInstructions._id) {
                _awaitInstructions = [];
              }
            }
          }

          if (_ifInstructions) {
            if (_.isArray(_ifInstructions)) {
              for (let j = 0; j < _ifInstructions.length; j++) {
                if (connectors[i].mxCell._target == _ifInstructions[j]._id) {
                  _ifInstructions.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _ifInstructions._id) {
                _ifInstructions = [];
              }
            }
          }
          if (_exitInstructions) {
            if (_.isArray(_exitInstructions)) {
              for (let j = 0; j < _exitInstructions.length; j++) {
                if (connectors[i].mxCell._target == _exitInstructions[j]._id) {
                  _exitInstructions.splice(j, 1);
                  break;
                }
              }
            } else {
              if (connectors[i].mxCell._target == _exitInstructions._id) {
                _exitInstructions = [];
              }
            }
          }
        }

        if (_jobs) {
          if (_.isArray(_jobs) && _jobs.length > 0) {
            startNode = _jobs[0];
          } else {
            startNode = _jobs;
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('Job', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        }
        else {
          if (_forkInstructions) {
            if (_.isArray(_forkInstructions) && _forkInstructions.length > 0) {
              startNode = _forkInstructions[0];
            } else {
              startNode = _forkInstructions;
            }
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('ForkJoin', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        }
        else {
          if (_retryInstructions) {
            if (_.isArray(_retryInstructions) && _retryInstructions.length > 0) {
              startNode = _retryInstructions[0];
            } else {
              startNode = _retryInstructions;
            }
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('Retry', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        }
        else {
          if (_awaitInstructions) {
            if (_.isArray(_awaitInstructions) && _awaitInstructions.length > 0) {
              startNode = _awaitInstructions[0];
            } else {
              startNode = _awaitInstructions;
            }
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('Await', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        }
        else {
          if (_ifInstructions) {
            if (_.isArray(_ifInstructions) && _ifInstructions.length > 0) {
              startNode = _ifInstructions[0];
            } else {
              startNode = _ifInstructions;
            }
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('If', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        }
        else {
          if (_exitInstructions) {
            if (_.isArray(_exitInstructions) && _exitInstructions.length > 0) {
              startNode = _exitInstructions[0];
            } else {
              startNode = _exitInstructions;
            }
          }
        }

        if (!_.isEmpty(startNode)) {
          jsonObj.instructions.push(this.createObject('Exit', startNode));
          this.findNextNode(connectors, startNode._id, objects, jsonObj.instructions);
          startNode = null;
        } else {
          console.log('start node not found');
        }

        if (this.joinId && connectors.length > 0) {
          this.findNextNode(connectors, this.joinId, objects, jsonObj.instructions);
        } else {
          if (this.lastId && connectors.length > 0) {
            this.findNextNode(connectors, this.lastId, objects, jsonObj.instructions);
          }
        }
      } else {
        let job = objects.Job;
        let ifIns = objects.If;
        let fork = objects.Fork;
        let retry = objects.Retry;
        let awaitIns = objects.Await;
        let exit = objects.Exit;
        if (job) {
          if (_.isArray(job)) {
            for (let i = 0; i < job.length; i++) {
              jsonObj.instructions.push(this.createObject('Job', job[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('Job', job));
          }
        }
        if (ifIns) {
          if (_.isArray(ifIns)) {
            for (let i = 0; i < ifIns.length; i++) {
              jsonObj.instructions.push(this.createObject('If', ifIns[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('If', ifIns));
          }
        }
        if (fork) {
          if (_.isArray(fork)) {
            for (let i = 0; i < fork.length; i++) {
              jsonObj.instructions.push(this.createObject('ForkJoin', fork[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('ForkJoin', fork));
          }
        }
        if (retry) {
          if (_.isArray(retry)) {
            for (let i = 0; i < retry.length; i++) {
              jsonObj.instructions.push(this.createObject('Retry', retry[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('Retry', retry));
          }
        }
        if (awaitIns) {
          if (_.isArray(awaitIns)) {
            for (let i = 0; i < awaitIns.length; i++) {
              jsonObj.instructions.push(this.createObject('Await', awaitIns[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('Await', awaitIns));
          }
        }
        if (exit) {
          if (_.isArray(exit)) {
            for (let i = 0; i < exit.length; i++) {
              jsonObj.instructions.push(this.createObject('Exit', exit[i]));
            }
          } else {
            jsonObj.instructions.push(this.createObject('Exit', exit));
          }
        }
      }
      this.json = jsonObj;
    }
  }

  private findNextNode(connectors, id, objects, instructions: Array<any>) {
    if (_.isArray(connectors)) {
      for (let i = 0; i < connectors.length; i++) {
        if (connectors[i].mxCell._source && connectors[i].mxCell._source === id) {
          let _id = _.clone(connectors[i].mxCell._target);
          let instructionArr = instructions;
          if (connectors[i]._type == 'then' || connectors[i]._type == 'else') {
            for (let j = 0; j < instructions.length; j++) {
              if (instructions[j].TYPE == 'If' && instructions[j].id === id) {

                if (connectors[i]._type == 'then') {
                  instructions[j].then = {
                    instructions: []
                  };
                  instructionArr = instructions[j].then.instructions;
                } else {
                  instructions[j].else = {
                    instructions: []
                  };
                  instructionArr = instructions[j].else.instructions;
                }
                break;
              }
            }
          }
          if (connectors[i]._type == 'branch') {
            for (let j = 0; j < instructions.length; j++) {

              if (instructions[j].TYPE == 'ForkJoin' && instructions[j].id === id) {

                if (!instructions[j].branches) {
                  instructions[j].branches = [];
                }
                instructions[j].branches.push({instructions: []});
                for (let x = 0; x < instructions[j].branches.length; x++) {
                  if (!instructions[j].branches[x].id) {
                    instructions[j].branches[x].id = 'branch ' + (x + 1);
                    instructionArr = instructions[j].branches[x].instructions;
                    break;
                  }
                }
                break;
              }
            }
          }
          if (connectors[i]._type == 'retry') {
            for (let j = 0; j < instructions.length; j++) {
              if (instructions[j].TYPE == 'Retry' && instructions[j].id === id) {
                if (!instructions[j].instructions) {
                  instructions[j].instructions = [];
                  instructionArr = instructions[j].instructions;
                }
                break;
              }
            }
          }
          if (connectors[i]._type == 'join') {
            this.joinId = _id;
            connectors.splice(i, 1);
          } else {
            connectors.splice(i, 1);
            this.getNextNode(_id, objects, instructionArr);
          }
        }
      }
    } else {
      if (connectors.mxCell._source && connectors.mxCell._source === id) {
        let _id = _.clone(connectors.mxCell._target);
        connectors = null;
        this.getNextNode(_id, objects, instructions);
      }
    }
    this.lastId = id;
  }

  private getNextNode(id, objects, instructionsArr: Array<any>) {
    let jobs = objects.Job;
    let ifInstructions = objects.If;
    let forkInstructions = objects.Fork;
    let retryInstructions = objects.Retry;
    let awaitInstructions = objects.Await;
    let connectors = objects.Connector;
    let exitInstructions = objects.Exit;
    let nextNode: any = {};
    if (jobs) {
      if (_.isArray(jobs)) {
        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i]._id === id) {
            nextNode = jobs[i];
            break;
          }
        }
      } else {
        if (jobs._id === id) {
          nextNode = jobs;
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('Job', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    }
    else {
      if (forkInstructions) {
        if (_.isArray(forkInstructions)) {
          for (let i = 0; i < forkInstructions.length; i++) {
            if (forkInstructions[i]._id === id) {
              nextNode = forkInstructions[i];
              break;
            }
          }
        } else {
          if (forkInstructions._id === id) {
            nextNode = forkInstructions;
          }
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('ForkJoin', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    }
    else {
      if (retryInstructions) {
        if (_.isArray(retryInstructions)) {
          for (let i = 0; i < retryInstructions.length; i++) {
            if (retryInstructions[i]._id === id) {
              nextNode = retryInstructions[i];
              break;
            }
          }
        } else {
          if (retryInstructions._id === id) {
            nextNode = retryInstructions;
          }
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('Retry', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    }
    else {
      if (awaitInstructions) {
        if (_.isArray(awaitInstructions)) {
          for (let i = 0; i < awaitInstructions.length; i++) {
            if (awaitInstructions[i]._id === id) {
              nextNode = awaitInstructions[i];
              break;
            }
          }
        } else {
          if (awaitInstructions._id === id) {
            nextNode = awaitInstructions;
          }
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('Await', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    }
    else {
      if (ifInstructions) {
        if (_.isArray(ifInstructions)) {
          for (let i = 0; i < ifInstructions.length; i++) {
            if (ifInstructions[i]._id === id) {
              nextNode = ifInstructions[i];
              break;
            }
          }
        } else {
          if (ifInstructions._id === id) {
            nextNode = ifInstructions;
          }
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('If', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    }
    else {
      if (exitInstructions) {
        if (_.isArray(exitInstructions)) {
          for (let i = 0; i < exitInstructions.length; i++) {
            if (exitInstructions[i]._id === id) {
              nextNode = exitInstructions[i];
              break;
            }
          }
        } else {
          if (exitInstructions._id === id) {
            nextNode = exitInstructions;
          }
        }
      }
    }

    if (nextNode && !_.isEmpty(nextNode)) {
      instructionsArr.push(this.createObject('Exit', nextNode));
      this.findNextNode(connectors, nextNode._id, objects, instructionsArr);
      nextNode = null;
    } else {
      this.findNextNode(connectors, id, objects, instructionsArr);
    }
  }

  private initEditorConf(editor) {
    const self = this;
    let graph = editor.graph;
    // Alt disables guides
    mxGraphHandler.prototype.guidesEnabled = true;
    /**
     * Variable: autoSaveDelay
     *
     * Minimum amount of seconds between two consecutive autosaves. Eg. a
     * value of 1 (s) means the graph is not stored more than once per second.
     * Default is 10.
     */
    mxAutoSaveManager.prototype.autoSaveDelay = 2;
    /**
     * Variable: autoSaveThreshold
     *
     * Minimum amount of ignored changes before an autosave. Eg. a value of 2
     * means after 2 change of the graph model the autosave will trigger if the
     * condition below is true. Default is 5.
     */
    mxAutoSaveManager.prototype.autoSaveThreshold = 1;

    mxGraph.prototype.cellsResizable = false;
    mxGraph.prototype.multigraph = false;
    mxGraph.prototype.allowDanglingEdges = false;
    mxGraph.prototype.disconnectOnMove = false;

    mxHierarchicalLayout.prototype.intraCellSpacing = 30;
    mxHierarchicalLayout.prototype.interRankCellSpacing = 60;


    editor.validation = true;

    mxGuide.prototype.isEnabledForEvent = function (evt) {
      return !mxEvent.isAltDown(evt);
    };


    // Enables snapping waypoints to terminals
    mxEdgeHandler.prototype.snapToTerminals = true;

    // Defines an icon for creating new connections in the connection handler.
    // This will automatically disable the highlighting of the source vertex.
    mxConnectionHandler.prototype.connectImage = new mxImage(mxClient.imageBasePath + '/connector.gif', 16, 16);

    graph.setConnectable(true);


    // Changes the zoom on mouseWheel events
    mxEvent.addMouseWheelListener(function (evt, up) {
      if (self.editor) {
        if (!mxEvent.isConsumed(evt)) {
          if (up) {
            editor.execute('zoomIn');
          } else {
            editor.execute('zoomOut');
          }
          mxEvent.consume(evt);
        }
      }
    });

    // Create select actions in page
    let node = document.getElementById('mainActions');
    let buttons = ['group', 'ungroup', 'undo', 'redo', 'cut', 'copy', 'paste', 'delete'];

    //editor.urlImage = 'http://localhost:4200/export';
    // Only adds image and SVG export if backend is available
    // NOTE: The old image export in mxEditor is not used, the urlImage is used for the new export.
    if (editor.urlImage != null) {
      // Client-side code for image export
      let exportImage = function (editor) {
        const scale = graph.view.scale;
        let bounds = graph.getGraphBounds();

        // New image export
        let xmlDoc = mxUtils.createXmlDocument();
        let root = xmlDoc.createElement('output');
        xmlDoc.appendChild(root);

        // Renders graph. Offset will be multiplied with state's scale when painting state.
        const xmlCanvas = new mxXmlCanvas2D(root);
        const imgExport = new mxImageExport();
        xmlCanvas.translate(Math.floor(1 / scale - bounds.x), Math.floor(1 / scale - bounds.y));
        xmlCanvas.scale(scale);

        imgExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);

        // Puts request data together
        let w = Math.ceil(bounds.width * scale + 2);
        let h = Math.ceil(bounds.height * scale + 2);
        const xml = mxUtils.getXml(root);

        // Requests image if request is valid
        if (w > 0 && h > 0) {
          const name = 'export.xml';
          const format = 'png';
          const bg = '&bg=#FFFFFF';
          const blob = new Blob([xml], {type: 'text/xml'});
          saveAs(blob, name);

          /* new mxXmlRequest(editor.urlImage, 'filename=' + name + '&format=' + format +
             bg + '&w=' + w + '&h=' + h + '&xml=' + encodeURIComponent(xml)).simulate(document, '_blank');*/
        }
      };

      editor.addAction('exportImage', exportImage);
      buttons.push('exportImage');
    }

    for (let i = 0; i < buttons.length; i++) {
      let button = document.createElement('button');
      let dom = document.createElement('img');
      let icon: any;
      if (buttons[i] == 'group') {
        icon = './assets/mxgraph/images/group.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Group');
      } else if (buttons[i] == 'ungroup') {
        icon = './assets/mxgraph/images/ungroup.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Ungroup');
      } else if (buttons[i] == 'undo') {
        icon = './assets/mxgraph/images/undo.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Undo');
      } else if (buttons[i] == 'redo') {
        icon = './assets/mxgraph/images/redo.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Redo');
      } else if (buttons[i] == 'cut') {
        icon = './assets/mxgraph/images/cut.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Cut');
      } else if (buttons[i] == 'copy') {
        icon = './assets/mxgraph/images/copy.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Copy');
      } else if (buttons[i] == 'paste') {
        icon = './assets/mxgraph/images/paste.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Past');
      } else if (buttons[i] == 'delete') {
        icon = './assets/mxgraph/images/delete.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Delete');
      }

      dom.setAttribute('src', icon);
      button.appendChild(dom);
      mxUtils.write(button, '');
      let factory = function (name) {
        return function () {
          editor.execute(name);
        };
      };

      mxEvent.addListener(button, 'click', factory(buttons[i]));
      node.appendChild(button);
    }

    // Create zoom actions in page
    let zoomNode = document.getElementById('zoomActions');
    let zoomButtons = ['zoomIn', 'zoomOut', 'actualSize', 'fit'];

    for (let i = 0; i < zoomButtons.length; i++) {
      let button = document.createElement('button');
      let dom = document.createElement('img');
      let icon: any;
      if (zoomButtons[i] == 'zoomIn') {
        icon = './assets/mxgraph/images/zoomin.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Zoom In');
      } else if (zoomButtons[i] == 'zoomOut') {
        icon = './assets/mxgraph/images/zoomout.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Zoom Out');
      } else if (zoomButtons[i] == 'actualSize') {
        icon = './assets/mxgraph/images/zoomactual.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey');
        button.setAttribute('title', 'Actual');
      } else if (zoomButtons[i] == 'fit') {
        icon = './assets/mxgraph/images/zoom.gif';
        button.setAttribute('class', 'btn btn-sm btn-grey m-r-sm');
        button.setAttribute('title', 'Fit');
      }
      dom.setAttribute('src', icon);
      button.appendChild(dom);
      mxUtils.write(button, '');
      let factory = function (name) {
        return function () {
          editor.execute(name);
        };
      };

      mxEvent.addListener(button, 'click', factory(zoomButtons[i]));
      zoomNode.appendChild(button);
    }

    graph.isCellEditable = function (cell) {
      return !this.getModel().isEdge(cell);
    };
    // Overrides method to provide a cell label in the display
    graph.convertValueToString = function (cell) {
      if (mxUtils.isNode(cell.value)) {
        if (cell.value.nodeName.toLowerCase() == 'job') {
          let path = cell.getAttribute('path', '');
          let title = cell.getAttribute('title', '');
          if (title != null && title.length > 0) {
            return path + ' - ' + title;
          }
          return path;
        }
        else if (cell.value.nodeName.toLowerCase() == 'retry') {
          return cell.getAttribute('predicate', '') + '\n' + ' Steps: ' + cell.getAttribute('maxSteps', '') + '\n' + 'Delay: ' + cell.getAttribute('delay', '');
        } else if (cell.value.nodeName.toLowerCase() == 'if') {
          return cell.getAttribute('predicate', '');
        } else {
          return cell.getAttribute('label', '');
        }
      }

      return '';
    };
    // Implements a properties panel that uses
    // mxCellAttributeChange to change properties
    graph.getSelectionModel().addListener(mxEvent.CHANGE, function () {
      selectionChanged(graph);
    });

    selectionChanged(graph);

    /**
     * Updates the properties panel
     */
    function selectionChanged(graph) {
      let div = document.getElementById('properties');
      // Forces focusout in IE
      graph.container.focus();

      // Clears the DIV the non-DOM way
      div.innerHTML = '';

      // Gets the selection cell
      let cell = graph.getSelectionCell();

      if (cell == null) {
        mxUtils.writeln(div, 'Nothing selected.');
      }
      else {
        if (cell.source && cell.target) {
          if (cell.source.value.nodeName === 'If') {
            if (cell.source.getEdgeCount() > 0) {
              if (!cell.value.attributes[0].nodeValue) {
                let outGoingEdges = 0;
                for (let i = 0; i < cell.source.getEdgeCount(); i++) {
                  if (cell.source.id == cell.source.edges[i].source.id) {
                    outGoingEdges = outGoingEdges + 1;
                  }
                }
                let label = '', type = '';
                if (outGoingEdges == 1) {
                  label = 'true';
                  type = 'then';
                } else if (outGoingEdges == 2) {
                  label = 'false';
                  type = 'else';
                }
                graph.getModel().beginUpdate();
                try {
                  let edit = new mxCellAttributeChange(
                    cell, 'label',
                    label);
                  let edit1 = new mxCellAttributeChange(
                    cell, 'type',
                    type);
                  graph.getModel().execute(edit);
                  graph.getModel().execute(edit1);

                }
                finally {
                  graph.getModel().endUpdate();
                }
              }
            }
          } else if (cell.source.value.nodeName === 'Fork') {
            if (cell.source.getEdgeCount() > 0) {
              graph.getModel().beginUpdate();
              try {
                let edit = new mxCellAttributeChange(
                  cell, 'type',
                  'branch');
                graph.getModel().execute(edit);
              }
              finally {
                graph.getModel().endUpdate();
              }
            }
          } else if (cell.target.value.nodeName === 'Join') {
            if (cell.target.getEdgeCount() > 0) {
              graph.getModel().beginUpdate();
              try {
                let edit = new mxCellAttributeChange(
                  cell, 'type',
                  'join');
                graph.getModel().execute(edit);
              }
              finally {
                graph.getModel().endUpdate();
              }
            }
          } else if (cell.source.value.nodeName === 'Retry') {
            if (cell.source.getEdgeCount() > 0) {
              if (!cell.value.attributes[0].nodeValue) {
                let outGoingEdges = 0;
                for (let i = 0; i < cell.source.getEdgeCount(); i++) {
                  if (cell.source.id == cell.source.edges[i].source.id) {
                    outGoingEdges = outGoingEdges + 1;
                  }
                }
                if (outGoingEdges == 1) {

                  graph.getModel().beginUpdate();
                  try {
                    let edit = new mxCellAttributeChange(
                      cell, 'label',
                      'retry');
                    let edit1 = new mxCellAttributeChange(
                      cell, 'type',
                      'retry');
                    graph.getModel().execute(edit);
                    graph.getModel().execute(edit1);
                  }
                  finally {
                    graph.getModel().endUpdate();
                  }
                }
              }

            }
          }
          return;
        }

        let form = new mxForm('property-table');
        let attrs = cell.value.attributes;
        let flg1 = false, flg2 = false;
        for (let i = 0; i < attrs.length; i++) {
          createTextField(graph, form, cell, attrs[i]);
          if (attrs[i].nodeName == 'success') {
            flg1 = true;
          }
          if (attrs[i].nodeName == 'failure') {
            flg2 = true;
          }
        }
        if (cell.value.nodeName == 'Job') {
          if (!flg1)
            createTextField(graph, form, cell, {nodeName: 'success', nodeValue: ''});
          if (!flg2)
            createTextField(graph, form, cell, {nodeName: 'failure', nodeValue: ''});
          createTextAreaField(graph, form, cell, 'Script', '');
        }
        div.appendChild(form.getTable());
        mxUtils.br(div);
      }
    }

    /**
     * Creates the textfield for the given property.
     */
    function createTextField(graph, form, cell, attribute) {
      let input = form.addText(attribute.nodeName + ':', attribute.nodeValue);

      let applyHandler = function () {
        let newValue = input.value || '';

        let oldValue = cell.getAttribute(attribute.nodeName, '');
        if (newValue != oldValue) {
          graph.getModel().beginUpdate();

          try {
            let edit = new mxCellAttributeChange(
              cell, attribute.nodeName,
              newValue);
            graph.getModel().execute(edit);
          }
          finally {
            graph.getModel().endUpdate();
          }
        }
      };

      mxEvent.addListener(input, 'keypress', function (evt) {
        // Needs to take shift into account for textareas
        if (evt.keyCode == /*enter*/13 &&
          !mxEvent.isShiftDown(evt)) {
          input.blur();
        }
      });

      if (mxClient.IS_IE) {
        mxEvent.addListener(input, 'focusout', applyHandler);
      }
      else {
        mxEvent.addListener(input, 'blur', applyHandler);
      }
    }

    /**
     * Creates the textAreafield for the given property.
     */
    function createTextAreaField(graph, form, cell, name, value) {
      let input = form.addTextarea(name + ':', value, 10);

      let applyHandler = function () {
        let newValue = input.value || '';

        let oldValue = cell.getAttribute(name, '');
        if (newValue != oldValue) {
          graph.getModel().beginUpdate();

          try {
            let edit = new mxCellAttributeChange(
              cell, name,
              newValue);
            graph.getModel().execute(edit);
          }
          finally {
            graph.getModel().endUpdate();
          }
        }
      };

      mxEvent.addListener(input, 'keypress', function (evt) {
        // Needs to take shift into account for textareas
        if (evt.keyCode == /*enter*/13 &&
          !mxEvent.isShiftDown(evt)) {
          input.blur();
        }
      });

      if (mxClient.IS_IE) {
        mxEvent.addListener(input, 'focusout', applyHandler);
      }
      else {
        mxEvent.addListener(input, 'blur', applyHandler);
      }
    }


    // if (sessionStorage.getItem('$JOE$XML')) {
    // let doc = mxUtils.parseXml(sessionStorage.getItem('$JOE$XML'));
    let doc = mxUtils.parseXml(this.xmlTest);
    let codec = new mxCodec(doc);
    codec.decode(doc.documentElement, graph.getModel());

    let layout = new mxHierarchicalLayout(graph);
    layout.execute(graph.getDefaultParent());

    function executeLayout() {
      graph.getModel().beginUpdate();
      try {
        layout = new mxHierarchicalLayout(graph);
        layout.execute(graph.getDefaultParent());
      }
      catch (e) {
        throw e;
      }
      finally {
        // New API for animating graph layout results asynchronously
        let morph = new mxMorphing(graph);
        morph.addListener(mxEvent.DONE, mxUtils.bind(this, function () {
          graph.getModel().endUpdate();
        }));
        morph.startAnimation();
      }
    }

    graph.connectionHandler.addListener(mxEvent.CONNECT, function () {
      executeLayout();
    });
    let mgr = new mxAutoSaveManager(graph);
    mgr.save = function () {
      self.xmlToJsonParser();
    };
  }

  /**
   * Constructs a new application (returns an mxEditor instance)
   */
  createEditor(config) {
    let editor = null;
    try {
      if (!mxClient.isBrowserSupported()) {
        mxUtils.error('Browser is not supported!', 200, false);
      }
      else {
        mxObjectCodec.allowEval = true;
        let node = mxUtils.load(config).getDocumentElement();
        editor = new mxEditor(node);
        this.editor = editor;
        // Source nodes needs 1..2 connected Targets
        editor.graph.multiplicities.push(new mxMultiplicity(
          true, 'Job', null, null, 0, 1, ['Job', 'Process', 'If', 'Fork', 'Join', 'Await', 'Exit', 'Retry'],
          'Job can have only one out going Edge',
          'Job can only Connect to Instructions', true));

        // Source node does not want any incoming connections
        editor.graph.multiplicities.push(new mxMultiplicity(
          false, 'Job', null, null, 0, 1, null,
          'Job can have only one incoming Edge',
          null)); // Type does not matter

        // Source node does not want any incoming connections
        editor.graph.multiplicities.push(new mxMultiplicity(
          true, 'If', null, null, 1, 3, ['Job', 'Process', 'If', 'Fork', 'Join', 'Await', 'Exit', 'Retry'],
          'If instruction can have only 3 out going Edge',
          null));

        editor.graph.multiplicities.push(new mxMultiplicity(
          false, 'If', null, null, 0, 1, null,
          'If instruction can have only one incoming Edge',
          null)); // Type does not matter

        editor.graph.multiplicities.push(new mxMultiplicity(
          false, 'Fork', null, null, 0, 1, null,
          'Fork instruction can have only one incoming Edge',
          null)); // Type does not matter

        editor.graph.multiplicities.push(new mxMultiplicity(
          true, 'Join', null, null, 1, 1, ['Job', 'Process', 'If', 'Fork', 'Await', 'Exit', 'Retry'],
          'Join instruction can have only 1 out going Edge',
          null));

        this.initEditorConf(editor);
        mxObjectCodec.allowEval = false;

       // if (!this.outline) {
          let outln = document.getElementById('outlineContainer');
          outln.style["border"] = "1px solid lightgray";
          outln.style["background"] = "#FFFFFF";
           new mxOutline(this.editor.graph, outln);
      //  }

        editor.graph.allowAutoPanning = true;
        editor.graph.timerAutoScroll = true;
        // editor.graph.panningHandler.useLeftButtonForPanning = true;

        editor.addListener(mxEvent.OPEN);
        // Prints the current root in the window title if the
        // current root of the graph changes (drilling).
        editor.addListener(mxEvent.ROOT);
      }
    }
    catch (e) {
      // Shows an error message if the editor cannot start
      mxUtils.alert('Cannot start application: ' + e.message);
      throw e; // for debugging
    }
  }

  toggleView() {
    this.view = this.view != 'list' ? 'list' : 'grid';
  }

  toggleRightSideBar() {
    this.isPropertyHide = !this.isPropertyHide;
  }


  checkAll() {
    console.log('Check all...')
  }

  checkMainCheckbox() {
    console.log('Check all...')
  }

  onNodeSelected(e): void {
    console.log(e);
  }

  toggleExpanded(e): void {
    e.node.data.isExpanded = e.isExpanded;
  }

  onResize() {
    EditorComponent.setGraphHt();
  }

  static setGraphHt() {
    let ht = window.innerHeight - 168;
    if (ht > 400)
      $('#graph').height(ht + 'px');
  }
}
