/**
 * Created by sourabhagrawal on 30/5/16.
 */

(function () {
    'use strict';
    angular
        .module('app')
        .controller('AppCtrl', AppCtrl)
        .controller('HeaderCtrl', HeaderCtrl)
        .controller('ConfigurationCtrl', ConfigurationCtrl)
        .controller('DialogCtrl', DialogCtrl)
        .controller('RuntimeEditorDialogCtrl', RuntimeEditorDialogCtrl);


    AppCtrl.$inject = ['$scope', '$window', 'SOSAuth'];
    function AppCtrl($scope, $window,  SOSAuth) {
        var vm = $scope;
        vm.schedulerIds = {};

        vm.app = {
            name: 'JobScheduler'
        };

        vm.goBack = function () {
            $window.history.back();
        };

        vm.selectedScheduler = {};

        vm.colorFunction = function (d) {
            if (d == 0) {
                return 'green';
            } else if (d == 1) {
                return 'gold';
            } else if (d == 2) {
                return 'crimson';
            } else if (d == 3) {
                return 'dimgrey';
            }
            else if (d == 4) {
                return 'text-dark';
            } else if (d == 5) {
                return 'dark-orange';
            }
            else if (d == 6) {
                return 'corn-flower-blue';
            }
            else if (d == 7) {
                return 'dark-magenta';
            }
            else if (d == 8) {
                return 'chocolate';
            }
        };

        vm.bgColorFunction = function (d) {
            if (d == 0) {
                return 'bg-green';
            } else if (d == 1) {
                return 'bg-gold';
            } else if (d == 2) {
                return 'bg-crimson';
            } else if (d == 3) {
                return 'bg-dimgrey';
            }
            else if (d == 4) {
                return 'bg-transparent';
            } else if (d == 5) {
                return 'bg-dark-orange';
            }
            else if (d == 6) {
                return 'bg-corn-flower-blue';
            }
            else if (d == 7) {
                return 'bg-dark-magenta';
            }
            else if (d == 8) {
                return 'bg-chocolate';
            }
        };

        vm.calculateHeight = function () {
            var headerHt = $('.app-header').height() || 64;
            var footerHt = $('.app-footer').height() || 30;
            var topHeaderHt = $('.top-header-bar').height() || 16;
            var subHeaderHt = 58;

            var ht = (window.innerHeight - (headerHt + footerHt + topHeaderHt + subHeaderHt)) + 'px';

            $('.max-ht').css('height', ht);
        };

        function checkNavHeader(){
            if($('#navbar1').hasClass('in')){
                $('#navbar1').removeClass('in');
                $('a.navbar-item').addClass('collapsed');
            }
        }

        $(window).resize(function () {
            vm.calculateHeight();
            checkNavHeader();
        });



        vm.username = SOSAuth.currentUserData;
        setPermission();
        setIds();

        $scope.$on('reloadUser', function () {
            vm.username = SOSAuth.currentUserData;
            setPermission();
            setIds();
        });

        function setPermission() {
            if (SOSAuth.permission) {
                vm.permission = JSON.parse(SOSAuth.permission);
            }
        }

        function setIds() {
            if (SOSAuth.scheduleIds) {
                vm.schedulerIds = JSON.parse(SOSAuth.scheduleIds);
            }
        }


        $scope.$on('$viewContentLoaded', function () {
            vm.calculateHeight();
        });
    }

    HeaderCtrl.$inject = ['$scope', 'UserService', 'JobSchedulerService', '$interval', '$state', 'toasty'];
    function HeaderCtrl($scope, UserService, JobSchedulerService, $interval, $state, toasty) {
        var vm = $scope;

        vm.currentTime = moment();
        var interval = $interval(function () {
            vm.currentTime = moment();
        }, 15000);

        $scope.$on('reloadDate', function () {
            vm.currentTime = moment();
            var date = new Date(vm.selectedJobScheduler.startedAt);
            date.setSeconds(date.getSeconds() + 1);
            vm.selectedJobScheduler.startedAt = date;
        });

        vm.logout = function () {
            UserService.logout();
        };

        vm.getScheduleDetail = function (id) {
            JobSchedulerService.get({jobschedulerId: id}).then(function (res) {
                vm.selectedJobScheduler = res.jobscheduler;
                vm.selectedScheduler.scheduler = vm.selectedJobScheduler;
                if (vm.selectedScheduler && vm.selectedScheduler.scheduler)
                    document.title = vm.selectedScheduler.scheduler.host + ':' + vm.selectedScheduler.scheduler.port + '/' + vm.selectedScheduler.scheduler.jobschedulerId;
            }, function (err) {

            })
        };

        vm.getScheduleDetail(vm.schedulerIds.selected);

        vm.changeScheduler = function (jobScheduler) {
            JobSchedulerService.switchSchedulerId(jobScheduler).then(function () {
                JobSchedulerService.getSchedulerIds().then(function (res) {
                    if (res && !res.data) {
                        SOSAuth.setIds(res);
                        SOSAuth.save();
                        $state.reload();
                    } else {
                        toasty.error({
                            title: gettextCatalog.getString('message.oops'),
                            msg: gettextCatalog.getString('message.errorInLoadingScheduleIds')
                        });
                    }
                });



            }, function (err) {

            })
        };

        $scope.$on('$stateChangeSuccess', function () {
            vm.filterString = '';
            if (vm.selectedScheduler && vm.selectedScheduler.scheduler)
                document.title = vm.selectedScheduler.scheduler.host + ':' + vm.selectedScheduler.scheduler.port + '/' + vm.selectedScheduler.scheduler.jobschedulerId;
        });

        $scope.$on('$destroy', function () {
            $interval.cancel(interval);
        });
    }

    ConfigurationCtrl.$inject = ["$scope", "JobService", "JobChainService", "OrderService", "ScheduleService", "ResourceService", "$location", "SOSAuth"];
    function ConfigurationCtrl($scope, JobService, JobChainService, OrderService, ScheduleService, ResourceService, $location, SOSAuth) {
        var vm = $scope;
        if (SOSAuth.scheduleIds) {
            vm.schedulerIds = JSON.parse(SOSAuth.scheduleIds);
        }


        var object = $location.search();
        document.title = object.path.substring(object.path.lastIndexOf('/') + 1) + " - JobScheduler";
        vm.type = object.type;
        if (object.type == 'jobChain') {
            JobChainService.getConfiguration(object.path, vm.schedulerIds.selected).then(function (res) {
                if(res) {
                    vm.configuration = res.configuration;
                    vm.html = $.parseHTML(res.configuration.content.html);
                    vm.html = vm.html[0].textContent;
                }
            }, function (err) {

            });
        }
        else if (object.type == 'job') {
            JobService.getConfiguration(object.path, vm.schedulerIds.selected).then(function (res) {
                if(res) {
                    vm.configuration = res.configuration;
                    vm.html = $.parseHTML(res.configuration.content.html);
                    vm.html = vm.html[0].textContent;
                }

            }, function (err) {

            });
        } else if (object.type == 'order') {
            OrderService.getConfiguration(object.path, vm.schedulerIds.selected).then(function (res) {
                if(res) {
                    vm.configuration = res.configuration;
                    vm.html = $.parseHTML(res.configuration.content.html);
                    vm.html = vm.html[0].textContent;
                }

            }, function (err) {

            });
        }
        else if (object.type == 'schedule') {
            ScheduleService.getConfiguration(object.path, vm.schedulerIds.selected).then(function (res) {
                if(res) {
                    vm.configuration = res.configuration;
                    vm.html = $.parseHTML(res.configuration.content.html);
                    vm.html = vm.html[0].textContent;
                }

            }, function (err) {

            });
        }
        else if (object.type == 'lock') {
            ResourceService.getConfiguration(vm.schedulerIds.selected).then(function (res) {
                if(res) {
                    vm.configuration = res.configuration;
                    vm.html = $.parseHTML(res.configuration.content.html);
                    vm.html = vm.html[0].textContent;
                }

            }, function (err) {

            });
        }
    }

    DialogCtrl.$inject = ["$scope", "$uibModalInstance"];
    function DialogCtrl($scope, $uibModalInstance) {
        var vm = $scope;

        vm.calendarView = 'month';
        vm.viewDate = new Date();
        vm.events = [];
        vm.isCellOpen = true;
        vm.ok = function () {
            $uibModalInstance.close('ok');
        };
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.addCriteria = function () {
            var param = {
                name: null,
                value: null
            };
            if (vm.paramObject && vm.paramObject.params)
                vm.paramObject.params.push(param);
        };

        vm.addCriteria();

        vm.removeParams = function (index) {
            vm.paramObject.params.splice(index, 1);
        };

        vm.viewChangeClicked = function (nextView) {
            if (nextView === 'month') {
                return false;
            }
        };

    }

    RuntimeEditorDialogCtrl.$inject = ["$scope", "$uibModalInstance", "toasty", "$timeout"];
    function RuntimeEditorDialogCtrl($scope, $uibModalInstance, toasty, $timeout) {
        var vm = $scope;
        var dom_parser = new DOMParser();
        vm.ok = function () {

            try {
                var dom_document = dom_parser.parseFromString(vm.xml, "text/xml");
                if (dom_document.documentElement.nodeName == "parsererror") {
                    throw new Error("Error at XML answer: " + dom_document.documentElement.firstChild.nodeValue);
                } else {
                    $uibModalInstance.close('ok');
                }
            } catch (e) {
                toasty.error({
                    title: 'Invalid xml',
                    msg: e
                });
            }
        };
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.editor = {};
        vm.editor.hidePervious = false;
        vm.editor.isEnable = false;
        vm.editor.nextPage = false;
        vm.runTime = {};
        vm.runTime.every = 'weekDays';
        vm.runTime.tab = 'weekDays';
        vm.runTime.frequency = 'single_start';
        vm.tempRunTime = {};
        vm.runTime1 = {};
        var promise1, promise2, promise3;

        var run_time = {};
        run_time = {};
        run_time.month = [];
        run_time.weekdays = {};
        run_time.weekdays.day = [];
        run_time.monthdays = {};
        run_time.monthdays.day = [];
        run_time.ultimos = {};
        run_time.ultimos.day = [];
        var x2js = new X2JS();

        vm.editor.when_holiday_options = {
            'previous_non_holiday': 'previous non holiday',
            'next_non_holiday': 'next non holiday',
            'suppress': 'suppress execution (default)',
            'ignore_holiday': 'ignore holiday'
        };

        function stringToTime(str) {
            if (str) {
                var date = new Date();
                date.setHours(str.substring(0, 2));
                date.setMinutes(str.substring(3, 5));
                if (str.substring(7)) {
                    date.setSeconds(str.substring(7));
                } else {
                    date.setSeconds(0)
                }
                return date;
            }
        }


        function removeExistingPeriod(arr) {
            if (angular.isArray(arr.period)) {
                angular.forEach(arr.period, function (val, index) {
                    var flag = false;
                    if (val._single_start == vm.updateTime.obj._period._single_start) {
                        flag = true;
                    }
                    if (val._absolute_repeat == vm.updateTime.obj._period._absolute_repeat) {
                        flag = true;
                    }
                    if (val._repeat == vm.updateTime.obj._period._repeat) {
                        flag = true;
                    }
                    if (val._begin == vm.updateTime.obj._period._begin) {
                        flag = true;
                    }
                    if (val._end == vm.updateTime.obj._period._end) {
                        flag = true;
                    }
                    if (val._when_holiday == vm.updateTime.obj._period._when_holiday) {
                        flag = true;
                    }
                    if (flag) {
                        arr.period.splice(index, 1);
                    }

                });
            } else {
                var flag = false;
                if (arr.period._single_start == vm.updateTime.obj._period._single_start) {
                    flag = true;
                }
                if (arr.period._absolute_repeat == vm.updateTime.obj._period._absolute_repeat) {
                    flag = true;
                }
                if (arr.period._repeat == vm.updateTime.obj._period._repeat) {
                    flag = true;
                }
                if (arr.period._begin == vm.updateTime.obj._period._begin) {
                    flag = true;
                }
                if (arr.period._end == vm.updateTime.obj._period._end) {
                    flag = true;
                }
                if (arr.period._when_holiday == vm.updateTime.obj._period._when_holiday) {
                    flag = true;
                }
                if (flag) {
                    arr.period = undefined;
                    arr._day = undefined;
                    if (arr._which)
                        arr._which = undefined;
                }

            }
        }


        function getWeekDays(day) {
            if (!day) {
                return;
            }
            var days = day.toString().split(' ');
            var str = '(';
            angular.forEach(days, function (value) {
                if (value == 1) {
                    str = str + 'Mo,';
                } else if (value == 2) {
                    str = str + 'Tu,';
                }
                else if (value == 3) {
                    str = str + 'We,';
                }
                else if (value == 4) {
                    str = str + 'Th,';
                } else if (value == 5) {
                    str = str + 'Fr,';
                } else if (value == 6) {
                    str = str + 'Sa,';
                }
                else if (value == 7 || value == 0) {
                    str = str + 'Su';
                }
            });

            if (str.length == 1) {
                return '';
            } else {
                if (str.substring(str.length - 1) == ',') {
                    str = str.substring(0, str.length - 1);
                }
            }
            return str + ')'
        }

        function getMonths(month) {
            var str = '(';
            if (!month) {
                return;
            }
            var months = month.toString().split(' ');

            angular.forEach(months, function (value) {
                if (value == 1) {
                    str = str + 'Jan,';
                }
                else if (value == 2) {
                    str = str + 'Feb,';
                }
                else if (value == 3) {
                    str = str + 'Mar,';
                } else if (value == 4) {
                    str = str + 'Apr,';
                } else if (value == 5) {
                    str = str + 'May,';
                }
                else if (value == 6) {
                    str = str + 'Jun,';
                }
                else if (value == 7) {
                    str = str + 'Jul,';
                }
                else if (value == 8) {
                    str = str + 'Aug,';
                }
                else if (value == 9) {
                    str = str + 'Sep,';
                }
                else if (value == 10) {
                    str = str + 'Oct,';
                }
                else if (value == 11) {
                    str = str + 'Nov,';
                }
                else if (value == 12) {
                    str = str + 'Dec';
                }
            });

            if (str.length == 1) {
                return '';
            } else {
                if (str.substring(str.length - 1) == ',') {
                    str = str.substring(0, str.length - 1);
                }
            }
            return str + ')'
        }


        function getSpecificDay(day) {

            if (!day) {
                return;
            }
            if (day == 1) {
                return '1st ';
            } else if (day == 2) {
                return '2nd ';
            } else if (day == 3) {
                return '3rd ';
            } else if (day == 4) {
                return '4th ';
            } else if (day == -1) {
                return 'last ';
            } else if (day == -2) {
                return '2nd last ';
            } else if (day == -3) {
                return '3rd last ';
            } else if (day == -4) {
                return '4th last ';
            }
        }

        function getMonthDays(month) {
            var str = '(';
            if (!month) {
                return month;
            }
            var months = month.toString().split(' ');
            angular.forEach(months, function (value) {

                if (value == 1) {
                    str = str + value + 'st,';
                }
                else if (value == 2) {
                    str = str + value + 'nd,';
                }
                else if (value == 3) {
                    str = str + value + 'rd,';
                } else {
                    str = str + value + 'th,';
                }

            });

            if (str.length == 1) {
                return '';
            } else {
                if (str.substring(str.length - 1) == ',') {
                    str = str.substring(0, str.length - 1);
                }
            }
            return str + ')'
        }

        function isEmpty(obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key))
                    return false;
            }
            return true;
        }


        var selectedMonths = [];
        vm.selectMonthDays = function (value) {
            if (selectedMonths.indexOf(value) == -1) {
                selectedMonths.push(value);
            } else {
                selectedMonths.splice(selectedMonths.indexOf(value), 1);
            }
            vm.editor.isEnable = selectedMonths.length > 0;
        };

        vm.getSelectedMonthDays = function (value) {
            if (selectedMonths.indexOf(value) != -1)
                return true;
        };

        vm.textEditor = function (xml) {
            getXml2Json(xml);
        };

        var watcher1 = vm.$watchCollection('runTime', function (newNames, oldValues) {
            if (newNames && oldValues) {

                if (newNames.every && oldValues.every && ((newNames.every != oldValues.every) || (newNames.tab != oldValues.tab))) {
                    vm.runTime = {};
                    vm.runTime.every = newNames.every;
                    vm.runTime.frequency = 'single_start';
                    vm.runTime.tab = newNames.tab;
                    vm.runTime.period = {};
                    vm.runTime.period._when_holiday = 'suppress';
                    if (vm.editor.create)
                        selectedMonths = [];
                }
                if (vm.editor.create) {
                    if (newNames.every == 'monthDays') {
                        vm.str = 'Month Day';
                    } else if (newNames.every == 'yearDays') {
                        vm.str = 'Year Day';
                    } else {
                        vm.str = 'Every Day';
                    }
                }

                if (newNames.isUltimos != oldValues.isUltimos) {
                    if (vm.editor.create)
                        selectedMonths = [];
                }

                if (newNames.tab == 'weekDays' && newNames.days) {
                    vm.editor.isEnable = newNames.days.length > 0;
                }
                if (newNames.tab == 'specificWeekDays') {
                    if (newNames.specificWeekDay) {
                        vm.editor.isEnable = true;
                    } else {
                        vm.editor.isEnable = false;
                    }
                }
            }
        });


        vm.checkAllWeek = function () {
            if (vm.runTime.all) {
                vm.runTime.days = ["0", "1", "2", "3", "4", "5", "6"]
            } else {
                vm.runTime.days = []
            }
        };

        vm.checkAllMonth = function () {
            if (vm.runTime.allMonth) {
                vm.runTime.months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
            } else {
                vm.runTime.months = []
            }
        };

        vm.changeFrequency = function () {
            var temp = angular.copy(vm.runTime.period);
            vm.runTime.period = {};
            vm.runTime.period._when_holiday = temp._when_holiday;

        };

        vm._sch ={};
        vm.changeSchedule = function () {

            if(vm._sch._schedule) {
                try {
                    var xmlStr = x2js.json2xml_str({run_time: vm._sch});
                } catch (e) {
                    console.log(e);
                }

                xmlStr = xmlStr.replace(/,/g, ' ');
                vm.xml = xmlStr;
            }else{
                vm.xml =  x2js.json2xml_str({run_time: 'run_time'});
            }
            getXml2Json(vm.xml);
        };

        var watcher2 = vm.$watchCollection('runTime.days', function (newNames) {
            if (newNames) {
                vm.editor.isEnable = newNames.length > 0;
                vm.runTime.all = newNames.length == 7;
            }
        });

        var watcher3 = vm.$watchCollection('runTime.months', function (newNames) {
            if (newNames) {

                vm.runTime.allMonth = newNames.length == 12;
            }
        });

        function getXml2Json(xml) {
            vm.runtimeList = [];

            if (!xml) {
                return;
            }

            var _xml = {};
            try {
                var dom_document = dom_parser.parseFromString(xml, "text/xml");

                var y = dom_document.documentElement.childNodes;

                if (y.length > 0) {
                    var x = dom_document.getElementsByTagName("period");
                    for (var i = 0; i < x.length; i++) {
                        angular.forEach(x[i].attributes, function (value) {
                            if (value.nodeName == 'when_holiday' && value.nodeValue == 'suppress') {
                                x[i].removeAttribute('when_holiday');
                            }
                            else if (value.nodeName == 'single_start') {
                                if (value.nodeValue.toString().substring(6) == '00') {
                                    x[i].setAttribute("single_start", value.nodeValue.toString().substring(0, 5));
                                }
                            }
                            else if (value.nodeName == 'absolute_repeat') {
                                if (value.nodeValue.toString().substring(6) == '00') {
                                    x[i].setAttribute("absolute_repeat", value.nodeValue.toString().substring(0, 5));
                                }
                            }
                            else if (value.nodeName == 'repeat') {
                                if (value.nodeValue.toString().substring(6) == '00') {
                                    x[i].setAttribute("repeat", value.nodeValue.toString().substring(0, 5));
                                }
                            }
                            else if (value.nodeName == 'begin') {
                                if (value.nodeValue.toString().substring(6) == '00') {
                                    x[i].setAttribute("begin", value.nodeValue.toString().substring(0, 5));
                                }
                            }
                            else if (value.nodeName == 'end') {
                                if (value.nodeValue.toString().substring(6) == '00') {
                                    x[i].setAttribute("end", value.nodeValue.toString().substring(0, 5));
                                }
                            } else {
                                if (value.nodeName != 'when_holiday') {
                                    x[i].removeAttribute(value.nodeName);
                                }
                            }
                        });
                    }
                }

                if (dom_document.documentElement.nodeName == "parsererror") {
                    throw new Error("Error at XML answer: " + dom_document.documentElement.firstChild.nodeValue);
                } else {
                    _xml = x2js.xml_str2json(xml);
                }

                var xmlAsString;
                vm.xml = "";
                try {

                    if (window.DOMParser) {
                        xmlAsString = new XMLSerializer().serializeToString(dom_document);

                    } else {
                        xmlAsString = dom_document.documentElement.xml;
                        xmlAsString = xmlAsString.replace(/\t/g, "  ");

                    }
                    if (y.length > 0)
                        xmlAsString = xmlAsString.replace(/<\w+\/>/g, " ");
                    promise2 = $timeout(function () {
                        vm.xml = vkbeautify.xml(xmlAsString, 2);
                    }, 0);


                } catch (x) {
                    throw new Error(x.message);
                }

            } catch (e) {
                console.log(e);
                toasty.error({
                    title: 'Invalid xml',
                    msg: e
                });
            }

            if (isEmpty(_xml)) {
                return;
            }

            run_time = _xml.run_time || _xml.schedule || {};
            vm.runTime1.timeZone = run_time._time_zone;

            console.log(run_time);

            if (run_time._substitute) {
                vm.sch._substitute = run_time._substitute;
            }
            if (run_time._valid_from) {
            
                vm.from.date = run_time._valid_from;
                vm.from.time = run_time._valid_from;
            }
            if (run_time._valid_to) {
          
                vm.to.date = run_time._valid_to;
                vm.to.time = run_time._valid_to;
            }

            if (isEmpty(vm.runTime1.holidays) && run_time.holidays) {
                vm.runTime1.holidays = {};

                if (run_time.holidays.weekdays && run_time.holidays.weekdays.day) {
                    vm.runTime1.holidays.weekdays = angular.copy(run_time.holidays.weekdays);

                    vm.runTime1.holidays.weekdays.day._day = vm.runTime1.holidays.weekdays.day._day.split(' ');
                }
                if (run_time.holidays.holiday) {
                    if (angular.isArray(run_time.holidays.holiday)) {
                        angular.forEach(run_time.holidays.holiday, function (date) {
                            vm.holidayDates.push(new Date(date._date));
                        });
                    } else {
                        vm.holidayDates.push(new Date(run_time.holidays.holiday._date));
                    }
                }
                if (run_time.holidays.include) {
                    if (angular.isArray(run_time.holidays.include)) {
                        angular.forEach(run_time.holidays.include, function (file) {
                            vm.calendarFiles.push(file._live_file);
                        });
                    } else {
                        vm.calendarFiles.push(run_time.holidays.include._live_file);
                    }
                }

            }

            if (!run_time.month) {
                run_time.month = [];
            } else {
                if (!angular.isArray(run_time.month)) {
                    var temp = angular.copy(run_time.month);
                    run_time.month = [];
                    if (temp)
                        run_time.month.push(temp)
                }
            }


            if (!run_time.weekdays) {
                run_time.weekdays = {};
                run_time.weekdays.day = [];
            } else {
                if (!angular.isArray(run_time.weekdays.day)) {
                    var temp = angular.copy(run_time.weekdays.day);
                    run_time.weekdays.day = [];
                    if (temp)
                        run_time.weekdays.day.push(temp)
                }
            }

            if (!run_time.monthdays) {
                run_time.monthdays = {};
                run_time.monthdays.day = [];
                run_time.monthdays.weekday = [];
            } else {
                if (!angular.isArray(run_time.monthdays.day)) {
                    var temp = angular.copy(run_time.monthdays);
                    run_time.monthdays.day = [];
                    if (temp.day)
                        run_time.monthdays.day.push(temp.day);
                    run_time.monthdays.weekday = [];
                    if (temp.weekday) {
                        if (angular.isArray(temp.weekday)) {
                            run_time.monthdays.weekday = temp.weekday;
                        } else {
                            run_time.monthdays.weekday.push(temp.weekday);
                        }
                    }
                }
            }
            if (!run_time.ultimos) {
                run_time.ultimos = {};
                run_time.ultimos.day = [];
            } else {
                if (!angular.isArray(run_time.ultimos.day)) {
                    var temp = angular.copy(run_time.ultimos.day);
                    run_time.ultimos.day = [];
                    run_time.ultimos.day.push(temp)
                }

            }

            if (run_time.month) {

                if (angular.isArray(run_time.month)) {
                    angular.forEach(run_time.month, function (res) {

                        if (!isEmpty(res.weekdays)) {
                            if (angular.isArray(res.weekdays)) {
                                angular.forEach(res.weekdays, function (value1) {
                                    if (angular.isArray(value1)) {
                                        angular.forEach(value1, function (val) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            if (val._day) {
                                                str = str + ' days at ' + getMonthDays(val._day) + ' - ';

                                                if (angular.isArray(val.period)) {
                                                    angular.forEach(val.period, function (res1) {
                                                        var periodStr = '';
                                                        if (res1._single_start) {
                                                            periodStr = periodStr + ' single start at ' + res1._single_start;
                                                        }
                                                        else if (res1._absolute_repeat) {
                                                            periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                        }
                                                        else if (res1._repeat) {
                                                            periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                        }
                                                        if (res1._begin) {
                                                            periodStr = periodStr + ', begin at ' + res1._begin;
                                                        }
                                                        if (res1._end) {
                                                            periodStr = periodStr + 'and end at ' + res1._end;
                                                        }

                                                        vm.runtimeList.push({
                                                            runTime: (str + periodStr),
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: res1
                                                            },
                                                            type: 'month',
                                                            type2: 'weekdays'
                                                        });
                                                    });
                                                } else {
                                                    if (val.period._single_start) {
                                                        str = str + ' single start at ' + val.period._single_start;
                                                    }
                                                    else if (val.period._absolute_repeat) {
                                                        str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                    }
                                                    else if (val.period._repeat) {
                                                        str = str + ' repeat at ' + val.period._repeat;
                                                    }
                                                    if (val.period._begin) {
                                                        str = str + ', begin at ' + val.period._begin;
                                                    }
                                                    if (val.period._end) {
                                                        str = str + 'and end at ' + val.period._end;
                                                    }

                                                    vm.runtimeList.push(
                                                        {
                                                            runTime: str,
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: val.period
                                                            },
                                                            type: 'month',
                                                            type2: 'weekdays'
                                                        });
                                                }

                                            }

                                        });
                                    } else {
                                        if (value1._day) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            str = str + ' days at ' + getMonthDays(value1._day) + ' - ';
                                            if (angular.isArray(value1.period)) {
                                                angular.forEach(value1.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }

                                                    vm.runtimeList.push(
                                                        {
                                                            runTime: (str + periodStr),
                                                            obj: {
                                                                _day: value1._day,
                                                                _month: res._month,
                                                                _period: res1
                                                            },
                                                            type: 'month',
                                                            type2: 'weekdays'
                                                        });
                                                });
                                            } else {
                                                if (value1.period._single_start) {
                                                    str = str + ' single start at ' + value1.period._single_start;
                                                }
                                                else if (value1.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + value1.period._absolute_repeat;
                                                }
                                                else if (value1.period._repeat) {
                                                    str = str + ' repeat at ' + value1.period._repeat;
                                                }
                                                if (value1.period._begin) {
                                                    str = str + ', begin at ' + value1.period._begin;
                                                }
                                                if (value1.period._end) {
                                                    str = str + ' and end at ' + value1.period._end;
                                                }

                                                vm.runtimeList.push(
                                                    {
                                                        runTime: str,
                                                        obj: {
                                                            _day: value1._day,
                                                            _month: res._month,
                                                            _period: value1.period
                                                        },
                                                        type: 'month',
                                                        type2: 'weekdays'
                                                    });
                                            }


                                        }
                                    }

                                });
                            } else {

                                if (angular.isArray(res.weekdays.day)) {
                                    angular.forEach(res.weekdays.day, function (val) {
                                        var str = 'Month ';
                                        if (res._month)
                                            str = str + getMonths(res._month);
                                        if (val._day) {
                                            str = str + ' days at ' + getMonthDays(val._day) + ' - ';

                                            if (angular.isArray(val.period)) {
                                                angular.forEach(val.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }

                                                    vm.runtimeList.push(
                                                        {
                                                            runTime: (str + periodStr),
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: res1
                                                            },
                                                            type: 'month',
                                                            type2: 'weekdays'
                                                        });
                                                });
                                            } else {
                                                if (val.period._single_start) {
                                                    str = str + ' single start at ' + val.period._single_start;
                                                }
                                                else if (val.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                }
                                                else if (val.period._repeat) {
                                                    str = str + ' repeat at ' + val.period._repeat;
                                                }
                                                if (val.period._begin) {
                                                    str = str + ', begin at ' + val.period._begin;
                                                }
                                                if (val.period._end) {
                                                    str = str + ' and end at ' + val.period._end;
                                                }

                                                vm.runtimeList.push({
                                                    runTime: str, obj: {
                                                        _day: val._day,
                                                        _month: res._month,
                                                        _period: val.period
                                                    }, type: 'month', type2: 'weekdays'
                                                });
                                            }

                                        }
                                    });
                                } else {
                                    var str = 'Month ';
                                    if (res._month)
                                        str = str + getMonths(res._month);

                                    if (res.weekdays.day._day) {

                                        str = str + ' days at ' + getMonthDays(res.weekdays.day._day) + ' - ';

                                        if (angular.isArray(res.weekdays.day.period)) {
                                            angular.forEach(res.weekdays.day.period, function (res1) {
                                                var periodStr = '';
                                                if (res1._single_start) {
                                                    periodStr = periodStr + ' single start at ' + res1._single_start;
                                                }
                                                else if (res1._absolute_repeat) {
                                                    periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                }
                                                else if (res1._repeat) {
                                                    periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                }
                                                if (res1._begin) {
                                                    periodStr = periodStr + ', begin at ' + res1._begin;
                                                }
                                                if (res1._end) {
                                                    periodStr = periodStr + ' and end at ' + res1._end;
                                                }

                                                vm.runtimeList.push({
                                                    runTime: (str + periodStr), obj: {
                                                        _day: res.weekdays.day._day,
                                                        _month: res._month,
                                                        _period: res1
                                                    }, type: 'month', type2: 'weekdays'
                                                });
                                            });
                                        } else {
                                            if (res.weekdays.day.period._single_start) {
                                                str = str + ' single start at ' + res.weekdays.day.period._single_start;
                                            }
                                            else if (res.weekdays.day.period._absolute_repeat) {
                                                str = str + ' absolute repeat ' + res.weekdays.day.period._absolute_repeat;
                                            }
                                            else if (res.weekdays.day.period._repeat) {
                                                str = str + ' repeat at ' + res.weekdays.day.period._repeat;
                                            }
                                            if (res.weekdays.day.period._begin) {
                                                str = str + ', begin at ' + res.weekdays.day.period._begin;
                                            }
                                            if (res.weekdays.day.period._end) {
                                                str = str + ' and end at ' + res.weekdays.day.period._end;
                                            }

                                            vm.runtimeList.push({
                                                runTime: str, obj: {
                                                    _day: res.weekdays.day._day,
                                                    _month: res._month,
                                                    _period: res.weekdays.day.period
                                                }, type: 'month', type2: 'weekdays'
                                            });
                                        }


                                    }

                                }


                            }
                        }
                        if (!isEmpty(res.ultimos)) {

                            if (angular.isArray(res.ultimos)) {
                                angular.forEach(res.ultimos, function (value1) {
                                    if (angular.isArray(value1)) {
                                        angular.forEach(value1, function (val) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            if (val._day) {
                                                str = str + ' ultimos ' + getMonthDays(val._day) + ' - ';

                                                if (angular.isArray(val.period)) {
                                                    angular.forEach(val.period, function (res1) {
                                                        var periodStr = '';
                                                        if (res1._single_start) {
                                                            periodStr = periodStr + ' single start at ' + res1._single_start;
                                                        }
                                                        else if (res1._absolute_repeat) {
                                                            periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                        }
                                                        else if (res1._repeat) {
                                                            periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                        }
                                                        if (res1._begin) {
                                                            periodStr = periodStr + ', begin at ' + res1._begin;
                                                        }
                                                        if (res1._end) {
                                                            periodStr = periodStr + 'and end at ' + res1._end;
                                                        }

                                                        vm.runtimeList.push({
                                                            runTime: (str + periodStr),
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: res1
                                                            },
                                                            type: 'month',
                                                            type2: 'ultimos'
                                                        });
                                                    });
                                                } else {
                                                    if (val.period._single_start) {
                                                        str = str + ' single start at ' + val.period._single_start;
                                                    }
                                                    else if (val.period._absolute_repeat) {
                                                        str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                    }
                                                    else if (val.period._repeat) {
                                                        str = str + ' repeat at ' + val.period._repeat;
                                                    }
                                                    if (val.period._begin) {
                                                        str = str + ', begin at ' + val.period._begin;
                                                    }
                                                    if (val.period._end) {
                                                        str = str + 'and end at ' + val.period._end;
                                                    }

                                                    vm.runtimeList.push(
                                                        {
                                                            runTime: str,
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: val.period
                                                            },
                                                            type: 'month',
                                                            type2: 'ultimos'
                                                        });
                                                }

                                            }

                                        });
                                    } else {
                                        if (value1._day) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            str = str + ' ultimos ' + getMonthDays(value1._day) + ' - ';
                                            if (angular.isArray(value1.period)) {
                                                angular.forEach(value1.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }

                                                    vm.runtimeList.push({
                                                        runTime: (str + periodStr),
                                                        obj: {
                                                            _day: value1._day,
                                                            _month: res._month,
                                                            _period: res1
                                                        },
                                                        type: 'month',
                                                        type2: 'ultimos'
                                                    });
                                                });
                                            } else {
                                                if (value1.period._single_start) {
                                                    str = str + ' single start at ' + value1.period._single_start;
                                                }
                                                else if (value1.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + value1.period._absolute_repeat;
                                                }
                                                else if (value1.period._repeat) {
                                                    str = str + ' repeat at ' + value1.period._repeat;
                                                }
                                                if (value1.period._begin) {
                                                    str = str + ', begin at ' + value1.period._begin;
                                                }
                                                if (value1.period._end) {
                                                    str = str + ' and end at ' + value1.period._end;
                                                }

                                                vm.runtimeList.push({
                                                    runTime: str, obj: {
                                                        _day: value1._day,
                                                        _month: res._month,
                                                        _period: value1.period
                                                    },
                                                    type: 'month', type2: 'ultimos'
                                                });
                                            }


                                        }
                                    }

                                });
                            } else {

                                if (angular.isArray(res.ultimos.day)) {
                                    angular.forEach(res.ultimos.day, function (val) {
                                        var str = 'Month ';
                                        if (res._month)
                                            str = str + getMonths(res._month);
                                        if (val._day) {
                                            str = str + ' ultimos ' + getMonthDays(val._day) + ' - ';

                                            if (angular.isArray(val.period)) {
                                                angular.forEach(val.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }
                                                    vm.runtimeList.push({
                                                        runTime: (str + periodStr),
                                                        obj: {
                                                            _day: val._day,
                                                            _month: res._month,
                                                            _period: res1
                                                        },
                                                        type: 'month',
                                                        type2: 'ultimos'
                                                    });
                                                });
                                            } else {
                                                if (val.period._single_start) {
                                                    str = str + ' single start at ' + val.period._single_start;
                                                }
                                                else if (val.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                }
                                                else if (val.period._repeat) {
                                                    str = str + ' repeat at ' + val.period._repeat;
                                                }
                                                if (val.period._begin) {
                                                    str = str + ', begin at ' + val.period._begin;
                                                }
                                                if (val.period._end) {
                                                    str = str + ' and end at ' + val.period._end;
                                                }

                                                vm.runtimeList.push({
                                                    runTime: str, obj: {
                                                        _day: val._day,
                                                        _month: res._month,
                                                        _period: val.period
                                                    },
                                                    type: 'month', type2: 'ultimos'
                                                });
                                            }

                                        }
                                    });
                                } else {
                                    var str = 'Month ';
                                    if (res._month)
                                        str = str + getMonths(res._month);

                                    if (res.ultimos.day._day) {

                                        str = str + ' ultimos ' + getMonthDays(res.ultimos.day._day) + ' - ';

                                        if (angular.isArray(res.ultimos.day.period)) {
                                            angular.forEach(res.ultimos.day.period, function (res1) {
                                                var periodStr = '';
                                                if (res1._single_start) {
                                                    periodStr = periodStr + ' single start at ' + res1._single_start;
                                                }
                                                else if (res1._absolute_repeat) {
                                                    periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                }
                                                else if (res1._repeat) {
                                                    periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                }
                                                if (res1._begin) {
                                                    periodStr = periodStr + ', begin at ' + res1._begin;
                                                }
                                                if (res1._end) {
                                                    periodStr = periodStr + ' and end at ' + res1._end;
                                                }
                                                vm.runtimeList.push({
                                                    runTime: (str + periodStr),
                                                    obj: {
                                                        _day: res.ultimos.day._day,
                                                        _month: res._month,
                                                        _period: res1
                                                    },
                                                    type: 'month',
                                                    type2: 'ultimos'
                                                });
                                            });
                                        } else {
                                            if (res.ultimos.day.period._single_start) {
                                                str = str + ' single start at ' + res.ultimos.day.period._single_start;
                                            }
                                            else if (res.ultimos.day.period._absolute_repeat) {
                                                str = str + ' absolute repeat ' + res.ultimos.day.period._absolute_repeat;
                                            }
                                            else if (res.ultimos.day.period._repeat) {
                                                str = str + ' repeat at ' + res.ultimos.day.period._repeat;
                                            }
                                            if (res.ultimos.day.period._begin) {
                                                str = str + ', begin at ' + res.ultimos.day.period._begin;
                                            }
                                            if (res.ultimos.day.period._end) {
                                                str = str + ' and end at ' + res.ultimos.day.period._end;
                                            }

                                            vm.runtimeList.push(
                                                {
                                                    runTime: str,
                                                    obj: {
                                                        _day: res.ultimos.day._day,
                                                        _month: res._month,
                                                        _period: res.ultimos.day.period
                                                    },
                                                    type: 'month',
                                                    type2: 'ultimos'
                                                });
                                        }
                                    }
                                }
                            }
                        }
                        if (!isEmpty(res.monthdays)) {

                            if (angular.isArray(res.monthdays)) {
                                angular.forEach(res.monthdays, function (value1) {
                                    if (angular.isArray(value1)) {
                                        angular.forEach(value1, function (val) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            if (val._day) {
                                                str = str + ' and day of month ' + getMonthDays(val._day) + ' - ';

                                                if (angular.isArray(val.period)) {
                                                    angular.forEach(val.period, function (res1) {
                                                        var periodStr = '';
                                                        if (res1._single_start) {
                                                            periodStr = periodStr + ' single start at ' + res1._single_start;
                                                        }
                                                        else if (res1._absolute_repeat) {
                                                            periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                        }
                                                        else if (res1._repeat) {
                                                            periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                        }
                                                        if (res1._begin) {
                                                            periodStr = periodStr + ', begin at ' + res1._begin;
                                                        }
                                                        if (res1._end) {
                                                            periodStr = periodStr + 'and end at ' + res1._end;
                                                        }
                                                        vm.runtimeList.push({
                                                            runTime: (str + periodStr),
                                                            obj: {
                                                                _day: val._day,
                                                                _month: res._month,
                                                                _period: res1
                                                            },
                                                            type: 'month',
                                                            type2: 'monthdays'
                                                        });
                                                    });
                                                } else {
                                                    if (val.period._single_start) {
                                                        str = str + ' single start at ' + val.period._single_start;
                                                    }
                                                    else if (val.period._absolute_repeat) {
                                                        str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                    }
                                                    else if (val.period._repeat) {
                                                        str = str + ' repeat at ' + val.period._repeat;
                                                    }
                                                    if (val.period._begin) {
                                                        str = str + ', begin at ' + val.period._begin;
                                                    }
                                                    if (val.period._end) {
                                                        str = str + 'and end at ' + val.period._end;
                                                    }
                                                    vm.runtimeList.push({
                                                        runTime: str, obj: {
                                                            _day: val._day,
                                                            _month: res._month,
                                                            _period: val.period
                                                        }, type: 'month', type2: 'monthdays'
                                                    });
                                                }

                                            }

                                        });
                                    } else {
                                        if (value1._day) {
                                            var str = 'Month ';
                                            if (res._month) {
                                                str = str + getMonths(res._month);
                                            }
                                            str = str + ' and day of month ' + getMonthDays(value1._day) + ' - ';
                                            if (angular.isArray(value1.period)) {
                                                angular.forEach(value1.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }
                                                    vm.runtimeList.push({
                                                        runTime: (str + periodStr),
                                                        obj: {
                                                            _day: value1._day,
                                                            _month: res._month,
                                                            _period: res1
                                                        },
                                                        type: 'month',
                                                        type2: 'monthdays'
                                                    });
                                                });
                                            } else {
                                                if (value1.period._single_start) {
                                                    str = str + ' single start at ' + value1.period._single_start;
                                                }
                                                else if (value1.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + value1.period._absolute_repeat;
                                                }
                                                else if (value1.period._repeat) {
                                                    str = str + ' repeat at ' + value1.period._repeat;
                                                }
                                                if (value1.period._begin) {
                                                    str = str + ', begin at ' + value1.period._begin;
                                                }
                                                if (value1.period._end) {
                                                    str = str + ' and end at ' + value1.period._end;
                                                }
                                                vm.runtimeList.push(
                                                    {
                                                        runTime: str,
                                                        obj: {
                                                            _day: value1._day,
                                                            _month: res._month,
                                                            _period: value1.period
                                                        },
                                                        type: 'month',
                                                        type2: 'monthdays'
                                                    });
                                            }
                                        }
                                    }

                                });
                            } else {

                                if (angular.isArray(res.monthdays.day)) {
                                    angular.forEach(res.monthdays.day, function (val) {
                                        var str = 'Month ';
                                        if (res._month)
                                            str = str + getMonths(res._month);
                                        if (val._day) {
                                            str = str + ' and day of month ' + getMonthDays(val._day) + ' - ';

                                            if (angular.isArray(val.period)) {
                                                angular.forEach(val.period, function (res1) {
                                                    var periodStr = '';
                                                    if (res1._single_start) {
                                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                                    }
                                                    else if (res1._absolute_repeat) {
                                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                    }
                                                    else if (res1._repeat) {
                                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                    }
                                                    if (res1._begin) {
                                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                                    }
                                                    if (res1._end) {
                                                        periodStr = periodStr + ' and end at ' + res1._end;
                                                    }
                                                    vm.runtimeList.push({
                                                        runTime: (str + periodStr),
                                                        obj: {
                                                            _day: val._day,
                                                            _month: res._month,
                                                            _period: res1
                                                        },
                                                        type: 'month',
                                                        type2: 'monthdays'
                                                    });
                                                });
                                            } else {
                                                if (val.period._single_start) {
                                                    str = str + ' single start at ' + val.period._single_start;
                                                }
                                                else if (val.period._absolute_repeat) {
                                                    str = str + ' absolute repeat ' + val.period._absolute_repeat;
                                                }
                                                else if (val.period._repeat) {
                                                    str = str + ' repeat at ' + val.period._repeat;
                                                }
                                                if (val.period._begin) {
                                                    str = str + ', begin at ' + val.period._begin;
                                                }
                                                if (val.period._end) {
                                                    str = str + ' and end at ' + val.period._end;
                                                }

                                                vm.runtimeList.push({
                                                    runTime: str, obj: {
                                                        _day: val._day,
                                                        _month: res._month,
                                                        _period: val.period
                                                    }, type: 'month', type2: 'monthdays'
                                                });
                                            }

                                        }
                                    });
                                } else {
                                    var str = 'Month ';
                                    if (res._month)
                                        str = str + getMonths(res._month);

                                    if (res.monthdays.day._day) {

                                        str = str + ' and day of month ' + getMonthDays(res.monthdays.day._day) + ' - ';

                                        if (angular.isArray(res.monthdays.day.period)) {
                                            angular.forEach(res.monthdays.day.period, function (res1) {
                                                var periodStr = '';
                                                if (res1._single_start) {
                                                    periodStr = periodStr + ' single start at ' + res1._single_start;
                                                }
                                                else if (res1._absolute_repeat) {
                                                    periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                                }
                                                else if (res1._repeat) {
                                                    periodStr = periodStr + ' repeat at ' + res1._repeat;
                                                }
                                                if (res1._begin) {
                                                    periodStr = periodStr + ', begin at ' + res1._begin;
                                                }
                                                if (res1._end) {
                                                    periodStr = periodStr + ' and end at ' + res1._end;
                                                }
                                                vm.runtimeList.push({
                                                    runTime: (str + periodStr),
                                                    obj: {
                                                        _day: res.monthdays.day._day,
                                                        _month: res._month,
                                                        _period: res1
                                                    },
                                                    type: 'month',
                                                    type2: 'monthdays'
                                                });
                                            });
                                        } else {
                                            if (res.monthdays.day.period._single_start) {
                                                str = str + ' single start at ' + res.monthdays.day.period._single_start;
                                            }
                                            else if (res.monthdays.day.period._absolute_repeat) {
                                                str = str + ' absolute repeat ' + res.monthdays.day.period._absolute_repeat;
                                            }
                                            else if (res.monthdays.day.period._repeat) {
                                                str = str + ' repeat at ' + res.monthdays.day.period._repeat;
                                            }
                                            if (res.monthdays.day.period._begin) {
                                                str = str + ', begin at ' + res.monthdays.day.period._begin;
                                            }
                                            if (res.monthdays.day.period._end) {
                                                str = str + ' and end at ' + res.monthdays.day.period._end;
                                            }

                                            vm.runtimeList.push({
                                                runTime: str, obj: {
                                                    _day: res.monthdays.day._day,
                                                    _month: res._month,
                                                    _period: res.monthdays.day.period
                                                }, type: 'month', type2: 'monthdays'
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }

            if (run_time.weekdays && run_time.weekdays.day) {

                angular.forEach(run_time.weekdays.day, function (res) {
                    var str = '';
                    if (res._day) {
                        str = str + 'Week days ';
                        str = str + getWeekDays(res._day) + ' - ';
                        if (angular.isArray(res.period)) {
                            angular.forEach(res.period, function (value1) {
                                var periodStr = '';
                                if (value1._single_start) {
                                    periodStr = periodStr + ' single start at ' + value1._single_start;
                                }
                                else if (value1._absolute_repeat) {
                                    periodStr = periodStr + ' absolute repeat ' + value1._absolute_repeat;
                                }
                                else if (value1._repeat) {
                                    periodStr = periodStr + ' repeat at ' + value1._repeat;
                                }
                                if (value1._begin) {
                                    periodStr = periodStr + ', begin at ' + value1._begin;
                                }
                                if (value1._end) {
                                    periodStr = periodStr + ' and end at ' + value1._end;
                                }
                                vm.runtimeList.push(
                                    {
                                        runTime: (str + periodStr),
                                        obj: {
                                            _day: res._day,
                                            _period: value1
                                        },
                                        type: 'weekdays'
                                    });
                            });
                        } else {
                            if (res.period) {
                                if (res.period._single_start) {
                                    str = str + ' single start at ' + res.period._single_start;
                                }
                                else if (res.period._absolute_repeat) {
                                    str = str + ' absolute repeat ' + res.period._absolute_repeat;
                                }
                                else if (res.period._repeat) {
                                    str = str + ' repeat at ' + res.period._repeat;
                                }
                                if (res.period._begin) {
                                    str = str + ', begin at ' + res.period._begin;
                                }
                                if (res.period._end) {
                                    str = str + ' and end at ' + res.period._end;
                                }
                                vm.runtimeList.push({
                                    runTime: str, obj: {
                                        _day: res._day,
                                        _period: res.period
                                    }, type: 'weekdays'
                                });
                            }
                        }
                    }
                });
            }

            if (run_time.monthdays && run_time.monthdays.day && run_time.monthdays.day.length > 0) {

                angular.forEach(run_time.monthdays.day, function (res) {

                    var str = '';
                    if (res && res._day) {
                        str = str + 'Day of months ' + getMonthDays(res._day) + ' - ';
                        if (res.period) {
                            if (angular.isArray(res.period)) {
                                angular.forEach(res.period, function (res1) {
                                    var periodStr = '';
                                    if (res1._single_start) {
                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                    }
                                    else if (res1._absolute_repeat) {
                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                    }
                                    else if (res1._repeat) {
                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                    }
                                    if (res1._begin) {
                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                    }
                                    if (res1._end) {
                                        periodStr = periodStr + ' and end at ' + res1._end;
                                    }
                                    vm.runtimeList.push({
                                        runTime: (str + periodStr), obj: {
                                            _day: res._day,
                                            _period: res1
                                        }, type: 'monthdays'
                                    });
                                });
                            } else {
                                if (res.period) {
                                    if (res.period._single_start) {
                                        str = str + ' single start at ' + res.period._single_start;
                                    }
                                    else if (res.period._absolute_repeat) {
                                        str = str + ' absolute repeat ' + res.period._absolute_repeat;
                                    }
                                    else if (res.period._repeat) {
                                        str = str + ' repeat at ' + res.period._repeat;
                                    }
                                    if (res.period._begin) {
                                        str = str + ', begin at ' + res.period._begin;
                                    }
                                    if (res.period._end) {
                                        str = str + ' and end at ' + res.period._end;
                                    }

                                    vm.runtimeList.push({
                                        runTime: str, obj: {
                                            _day: res._day,
                                            _period: res.period
                                        }, type: 'monthdays'
                                    });
                                }
                            }


                        }
                    }

                });
            }

            if (run_time.monthdays && run_time.monthdays.weekday && run_time.monthdays.weekday.length > 0) {

                angular.forEach(run_time.monthdays.weekday, function (value) {

                    if (!angular.isArray(value)) {

                        var str = '';
                        if (value._day) {

                            str = str + getSpecificDay(value._which) + value._day + ' of month - ';

                            if (value.period) {
                                if (angular.isArray(value.period)) {
                                    angular.forEach(value.period, function (value1) {
                                        var periodStr = '';
                                        if (value1._single_start) {
                                            periodStr = periodStr + ' single start at ' + value1._single_start;
                                        }
                                        else if (value1._absolute_repeat) {
                                            periodStr = periodStr + ' absolute repeat ' + value1._absolute_repeat;
                                        }
                                        else if (value1._repeat) {
                                            periodStr = periodStr + ' repeat at ' + value1._repeat;
                                        }
                                        if (value1._begin) {
                                            periodStr = periodStr + ', begin at ' + value1._begin;
                                        }
                                        if (value1._end) {
                                            periodStr = periodStr + ' and end at ' + value1._end;
                                        }
                                        vm.runtimeList.push({
                                            runTime: (str + periodStr), obj: {
                                                _day: value._day,
                                                _period: value1,
                                                _which: value._which
                                            }, type: 'weekday'
                                        });
                                    });
                                } else {
                                    if (value.period) {
                                        if (value.period._single_start) {
                                            str = str + ' single start at ' + value.period._single_start;
                                        }
                                        else if (value.period._absolute_repeat) {
                                            str = str + ' absolute repeat ' + value.period._absolute_repeat;
                                        }
                                        else if (value.period._repeat) {
                                            str = str + ' repeat at ' + value.period._repeat;
                                        }
                                        if (value.period._begin) {
                                            str = str + ', begin at ' + value.period._begin;
                                        }
                                        if (value.period._end) {
                                            str = str + ' and end at ' + value.period._end;
                                        }

                                        vm.runtimeList.push({
                                            runTime: str, obj: {
                                                _day: value._day,
                                                _period: value.period,
                                                _which: value._which
                                            }, type: 'weekday'
                                        });
                                    }

                                }
                            }
                        }
                    } else {
                        console.log('TODO')
                    }
                });
            }

            if (run_time.ultimos) {

                angular.forEach(run_time.ultimos, function (value) {
                    angular.forEach(value, function (res) {
                        var str = '';

                        if (res._day) {
                            str = str + 'Ultimos ' + getMonthDays(res._day) + ' - ';

                            if (angular.isArray(res.period)) {
                                angular.forEach(res.period, function (res1) {
                                    var periodStr = '';
                                    if (res1._single_start) {
                                        periodStr = periodStr + ' single start at ' + res1._single_start;
                                    }
                                    else if (res1._absolute_repeat) {
                                        periodStr = periodStr + ' absolute repeat ' + res1._absolute_repeat;
                                    }
                                    else if (res1._repeat) {
                                        periodStr = periodStr + ' repeat at ' + res1._repeat;
                                    }
                                    if (res1._begin) {
                                        periodStr = periodStr + ', begin at ' + res1._begin;
                                    }
                                    if (res1._end) {
                                        periodStr = periodStr + ' and end at ' + res1._end;
                                    }
                                    vm.runtimeList.push({
                                        runTime: (str + periodStr),
                                        obj: {
                                            _day: res._day,
                                            _period: res1
                                        },
                                        type: 'ultimos'
                                    });
                                });
                            } else {
                                if (res.period) {
                                    if (res.period._single_start) {
                                        str = str + ' single start at ' + res.period._single_start;
                                    }
                                    else if (res.period._absolute_repeat) {
                                        str = str + ' absolute repeat ' + res.period._absolute_repeat;
                                    }
                                    else if (res.period._repeat) {
                                        str = str + ' repeat at ' + res.period._repeat;
                                    }
                                    if (res.period._begin) {
                                        str = str + ', begin at ' + res.period._begin;
                                    }
                                    if (res.period._end) {
                                        str = str + ' and end at ' + res.period._end;
                                    }
                                    vm.runtimeList.push(
                                        {
                                            runTime: str,
                                            obj: {
                                                _day: res._day,
                                                _period: res.period
                                            },
                                            type: 'ultimos'
                                        });
                                }
                            }


                        }
                    });
                });
            }

            if (run_time.holidays) {
                var str = '';
                angular.forEach(run_time.holidays, function (value) {
                    if (value) {
                        if (value.day) {
                            if (str) {
                                str = str + ' and';
                            }
                            str = str + ' week days ' + getWeekDays(value.day._day);
                        }
                        if (angular.isArray(value)) {
                            angular.forEach(value, function (value1) {
                                if (value1._date)
                                    str = str + value1._date + ', ';
                            });
                        } else {

                            if (value._date)
                                str = str + value._date + ', ';
                        }
                    }
                });
                if (str)
                    vm.runtimeList.push({runTime: 'Holiday on ' + str, xml: run_time.holidays, type: 'holidays'});
            }

            if (vm.order) {
                vm.order.runTime = xml;
            }
            else {
                vm.schedule.runTime = xml;
            }
        }


        vm.periodList = [];
        vm.addPeriod = function () {

            if (angular.isArray(vm.runTime.days)) {
                vm.runTime.days.sort();
            }
            if (angular.isArray(vm.runTime.months)) {
                vm.runTime.months.sort(function (a, b) {
                    return a - b
                });
            }
            if (selectedMonths.length > 0) {
                selectedMonths = selectedMonths.sort();
            }


            if (!isEmpty(vm.updateTime)) {

                if (vm.updateTime.type == 'month') {
                    if (vm.updateTime.type2 == 'weekdays') {

                        if (angular.isArray(run_time.month)) {
                            angular.forEach(run_time.month, function (res) {
                                if (angular.equals(res._month, vm.updateTime.obj._month)) {

                                    if (angular.isArray(res.weekdays.day)) {

                                        angular.forEach(res.weekdays.day, function (res1) {

                                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                                removeExistingPeriod(res1);
                                            }
                                        });
                                    } else {
                                        if (angular.equals(res.weekdays.day._day, vm.updateTime.obj._day)) {
                                            removeExistingPeriod(res.weekdays.day);
                                        }

                                    }
                                }
                            });

                        }
                    }
                    else if (vm.updateTime.type2 == 'monthdays') {
                        if (angular.isArray(run_time.month)) {
                            angular.forEach(run_time.month, function (res) {
                                if (angular.equals(res._month, vm.updateTime.obj._month)) {

                                    if (angular.isArray(res.monthdays.day)) {

                                        angular.forEach(res.monthdays.day, function (res1) {

                                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                                removeExistingPeriod(res1);
                                            }
                                        });
                                    } else {
                                        if (angular.equals(res.monthdays.day._day, vm.updateTime.obj._day)) {
                                            removeExistingPeriod(res.monthdays.day);
                                        }

                                    }
                                }
                            });
                        }
                    }
                    else if (vm.updateTime.type2 == 'ultimos') {
                        if (angular.isArray(run_time.month)) {
                            angular.forEach(run_time.month, function (res) {
                                if (angular.equals(res._month, vm.updateTime.obj._month)) {

                                    if (angular.isArray(res.ultimos.day)) {

                                        angular.forEach(res.ultimos.day, function (res1) {

                                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                                removeExistingPeriod(res1);
                                            }
                                        });
                                    } else {
                                        if (angular.equals(res.ultimos.day._day, vm.updateTime.obj._day)) {
                                            removeExistingPeriod(res.ultimos.day);
                                        }

                                    }
                                }
                            });
                        }
                    }

                }
                else if (vm.updateTime.type == 'weekdays') {
                    if (angular.isArray(run_time.weekdays.day)) {

                        angular.forEach(run_time.weekdays.day, function (res1) {

                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                removeExistingPeriod(res1);
                            }
                        });
                    } else {
                        if (angular.equals(run_time.weekdays.day._day, vm.updateTime.obj._day)) {
                            removeExistingPeriod(run_time.weekdays.day);
                        }

                    }
                }

                else if (vm.updateTime.type == 'ultimos') {
                    if (angular.isArray(run_time.ultimos.day)) {

                        angular.forEach(run_time.ultimos.day, function (res1) {

                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                removeExistingPeriod(res1);
                            }
                        });
                    } else {
                        if (angular.equals(run_time.ultimos.day._day, vm.updateTime.obj._day)) {
                            removeExistingPeriod(run_time.ultimos.day);
                        }

                    }
                }

                else if (vm.updateTime.type == 'monthdays') {
                    if (angular.isArray(run_time.monthdays.day)) {

                        angular.forEach(run_time.monthdays.day, function (res1) {

                            if (angular.equals(res1._day, vm.updateTime.obj._day)) {
                                removeExistingPeriod(res1);
                            }
                        });
                    } else {
                        if (angular.equals(run_time.monthdays.day._day, vm.updateTime.obj._day)) {
                            removeExistingPeriod(run_time.monthdays.day);
                        }

                    }

                }
                else if (vm.updateTime.type == 'weekday') {
                    if (run_time.monthdays.weekday && run_time.monthdays.weekday.length > 0) {

                        angular.forEach(run_time.monthdays.weekday, function (res1) {
                            console.log(res1);
                            if (!angular.isArray(res1)) {
                                if (angular.equals(res1._which, vm.updateTime.obj._which) && angular.equals(res1._day, vm.updateTime.obj._day)) {
                                    removeExistingPeriod(res1);
                                }
                            } else {
                                console.log('TODO');
                            }
                        });
                    }
                }

            }

            if (isEmpty(run_time.weekdays)) {
                run_time.weekdays = {};
                run_time.weekdays.day = [];
            } else {
                if (!angular.isArray(run_time.weekdays.day)) {
                    var temp = angular.copy(run_time.weekdays.day);
                    run_time.weekdays.day = [];
                    if (temp.period || temp._day)
                        run_time.weekdays.day.push(temp)
                } else {
                    if (run_time.weekdays.day)
                        angular.forEach(run_time.weekdays.day, function (value) {
                            if (!value.period && !value._day)
                                run_time.weekdays.day = [];
                        });
                }
            }


            if (isEmpty(run_time.month)) {

                run_time.month = [];
            } else {

                var temp = angular.copy(run_time.month);
                if (!angular.isArray(run_time.month)) {
                    run_time.month = [];
                    if (temp)
                        run_time.month.push(temp);
                    console.log('Month is not an array....')
                } else {

                    angular.forEach(run_time.month, function (res) {

                        if (res.weekdays) {

                            if (!angular.isArray(res.weekdays.day)) {

                                var temp = angular.copy(res.weekdays.day);
                                res.weekdays.day = [];
                                if (temp.period || temp._day)
                                    res.weekdays.day.push(temp);

                            } else {
                                if (res.weekdays.day)
                                    angular.forEach(res.weekdays.day, function (value) {

                                        if (!value.period && !value._day)
                                            res.weekdays.day = [];
                                    });
                            }

                        } else if (res.monthdays) {
                            if (!angular.isArray(res.monthdays.day)) {
                                var temp = angular.copy(res.monthdays.day);
                                res.monthdays.day = [];
                                if (temp.period || temp._day)
                                    res.monthdays.day.push(temp)
                            } else {
                                if (res.monthdays.day)
                                    angular.forEach(res.monthdays.day, function (value) {
                                        if (!value.period && !value._day)
                                            res.monthdays.day = [];
                                    });
                            }
                        } else if (res.ultimos) {
                            if (!angular.isArray(res.ultimos.day)) {
                                var temp = angular.copy(res.ultimos.day);
                                res.ultimos.day = [];
                                if (temp.period || temp._day)
                                    res.ultimos.day.push(temp)
                            } else {
                                if (res.ultimos.day)
                                    angular.forEach(res.ultimos.day, function (value) {
                                        if (!value.period && !value._day)
                                            res.ultimos.day = [];
                                    });
                            }
                        }
                    });
                }
            }

            if (isEmpty(run_time.monthdays)) {
                run_time.monthdays = {};
                run_time.monthdays.day = [];
                run_time.monthdays.weekday = [];
            } else {
                var temp = angular.copy(run_time.monthdays);

                if (!angular.isArray(run_time.monthdays.day)) {

                    run_time.monthdays.day = [];
                    run_time.monthdays.weekday = [];

                    if (temp && temp.day) {
                        run_time.monthdays.day.push(temp.day);
                    }

                    if (temp && temp.weekday) {

                        if (angular.isArray(temp.weekday)) {
                            angular.forEach(temp.weekday, function (value) {
                                if (!angular.isArray(value)) {
                                    if (!value.period && !value._day && !value._which) {
                                    } else {
                                        run_time.monthdays.weekday.push(value);
                                    }
                                } else {
                                    console.log('TODO')
                                }
                            });

                        } else {
                            run_time.monthdays.weekday.push(temp.weekday);
                        }
                    }
                } else {
                    run_time.monthdays.weekday = [];
                    if (run_time.monthdays.day)
                        angular.forEach(run_time.monthdays.day, function (value) {
                            if (!value.period && !value._day) {
                                run_time.monthdays.day = [];
                            }
                        });
                    if (temp && temp.weekday) {
                        if (angular.isArray(temp.weekday)) {
                            angular.forEach(temp.weekday, function (value) {
                                if (!angular.isArray(value)) {
                                    if (!value.period && !value._day && !value._which) {

                                    } else {
                                        run_time.monthdays.weekday.push(value);
                                    }
                                } else {
                                    console.log('TODO');
                                }
                            });

                        } else {
                            if (!temp.weekday.period && !temp.weekday._day && !temp.weekday._which)
                                run_time.monthdays.weekday.push(temp.weekday);
                        }
                    }
                }

            }

            if (isEmpty(run_time.ultimos)) {
                run_time.ultimos = {};
                run_time.ultimos.day = [];
            } else {
                if (!angular.isArray(run_time.ultimos.day)) {
                    var temp = angular.copy(run_time.ultimos.day);
                    run_time.ultimos.day = [];
                    if (temp.period || temp._day)
                        run_time.ultimos.day.push(temp)
                } else {
                    if (run_time.ultimos.day)
                        angular.forEach(run_time.ultimos.day, function (value) {
                            if (!value.period && !value._day) {
                                run_time.ultimos.day = [];
                            }
                        });
                }
            }

            if (vm.runTime.period) {
                if (vm.runTime.period._single_start) {
                    vm.runTime.period._single_start = moment(vm.runTime.period._single_start).format('HH:mm:ss');
                }
                if (vm.runTime.period._repeat) {
                    vm.runTime.period._repeat = moment(vm.runTime.period._repeat).format('HH:mm:ss');
                }
                if (vm.runTime.period._begin) {
                    vm.runTime.period._begin = moment(vm.runTime.period._begin).format('HH:mm:ss');
                }
                if (vm.runTime.period._end) {
                    vm.runTime.period._end = moment(vm.runTime.period._end).format('HH:mm:ss');
                }
                if (vm.runTime.period._absolute_repeat) {
                    vm.runTime.period._absolute_repeat = moment(vm.runTime.period._absolute_repeat).format('HH:mm:ss');
                }
            }


            var isMonth = false;

            for (var i = 0; i < run_time.month.length; i++) {
                if (run_time.month[i]._month && angular.equals(run_time.month[i]._month, vm.runTime.months) || angular.equals(run_time.month[i]._month.toString().split(' '), vm.runTime.months)) {
                    isMonth = true;
                    break;
                }
            }

            if (vm.runTime.every == 'weekDays') {
                if (vm.runTime.tab == 'weekDays') {
                    if (vm.runTime.months && vm.runTime.months.length > 0) {

                        if (run_time.month.length > 0) {

                            var flag = false;
                            angular.forEach(run_time.month, function (value) {
                                if (isMonth) {
                                    if (value.weekdays) {

                                        flag = true;
                                        var _period = [];
                                        if (angular.isArray(value.weekdays.day)) {
                                            angular.forEach(value.weekdays.day, function (value1) {

                                                if (value1._day && (angular.equals(value1._day, vm.runTime.days) || angular.equals(value1._day.toString().split(' '), vm.runTime.days))) {
                                                    if (angular.isArray(value1.period)) {
                                                        angular.forEach(value1.period, function (res) {
                                                            if (res)
                                                                _period.push(res);
                                                        })
                                                    } else {
                                                        if (value1.period)
                                                            _period.push(value1.period);

                                                    }
                                                    _period.push(vm.runTime.period);
                                                    value1.period = _period;

                                                }
                                            });
                                        } else {
                                            if (angular.equals(value.weekdays.day._day, vm.runTime.days) || angular.equals(value.weekdays.day._day.toString().split(' '), vm.runTime.days)) {

                                                if (angular.isArray(value.weekdays.day.period)) {
                                                    angular.forEach(value.weekdays.day.period, function (res) {
                                                        if (res)
                                                            _period.push(res);
                                                    })
                                                } else {
                                                    if (value.weekdays.day.period)
                                                        _period.push(value.weekdays.day.period);

                                                }

                                                _period.push(vm.runTime.period);
                                                value.weekdays.day.period = _period;
                                            }
                                        }

                                        if (_period.length == 0) {
                                            value.weekdays.day.push({
                                                '_day': vm.runTime.days,
                                                'period': vm.runTime.period
                                            });
                                        }
                                    }
                                }
                            });
                            if (!flag) {
                                if (isMonth) {
                                    for (var i = 0; i < run_time.month.length; i++) {

                                        if (run_time.month[i]._month && angular.equals(run_time.month[i]._month, vm.runTime.months) || angular.equals(run_time.month[i]._month.toString().split(' '), vm.runTime.months)) {
                                            run_time.month[i].weekdays = {day: []};
                                            run_time.month[i].weekdays.day.push({
                                                '_day': selectedMonths,
                                                'period': vm.runTime.period
                                            });
                                            break;
                                        }
                                    }

                                } else {
                                    var x = {_month: vm.runTime.months, weekdays: {day: []}};
                                    x.weekdays.day.push({'_day': vm.runTime.days, 'period': vm.runTime.period});
                                    run_time.month.push(x);
                                }

                            }
                        } else {
                            var x = {_month: vm.runTime.months, weekdays: {day: []}};
                            x.weekdays.day.push({'_day': vm.runTime.days, 'period': vm.runTime.period});
                            run_time.month.push(x);
                        }
                    } else {

                        if (run_time.weekdays.day.length > 0) {
                            var _period = [];
                            angular.forEach(run_time.weekdays.day, function (value) {
                                if (value._day && (angular.equals(value._day, vm.runTime.days) || angular.equals(value._day.toString().split(' '), vm.runTime.days))) {

                                    if (angular.isArray(value.period)) {
                                        angular.forEach(value.period, function (res) {
                                            if (res)
                                                _period.push(res);
                                        })
                                    } else {
                                        if (value.period)
                                            _period.push(value.period);

                                    }

                                    _period.push(vm.runTime.period);
                                    value.period = _period;
                                }
                            });
                            if (_period.length == 0) {
                                run_time.weekdays.day.push({'_day': vm.runTime.days, 'period': vm.runTime.period});
                            }
                        } else {
                            run_time.weekdays.day.push({'_day': vm.runTime.days, 'period': vm.runTime.period});
                        }
                    }
                } else {
                    if (run_time.monthdays.weekday.length > 0) {
                        var flag = true;
                        angular.forEach(run_time.monthdays.weekday, function (value) {
                            if (value && value._day == vm.runTime.specificWeekDay && value._which == vm.runTime.which) {
                                flag = false;
                                if (angular.isArray(value.period) && vm.runTime.period) {
                                    value.period.push(vm.runTime.period);
                                } else {
                                    value.period = [];
                                    value.period.push(vm.runTime.period);
                                }
                            }
                        });

                        if (flag) {
                            var _period = [];
                            if (vm.runTime.period) {
                                _period.push(vm.runTime.period);
                            }
                            run_time.monthdays.weekday.push({
                                '_day': vm.runTime.specificWeekDay,
                                '_which': vm.runTime.which,
                                'period': _period
                            });
                        }

                    } else {

                        var _period = [];
                        if (vm.runTime.period) {
                            _period.push(vm.runTime.period);
                        }
                        run_time.monthdays.weekday.push({
                            '_day': vm.runTime.specificWeekDay,
                            '_which': vm.runTime.which,
                            'period': _period
                        });
                    }
                }
            } else if (vm.runTime.every == 'monthDays') {

                if (selectedMonths.length > 0) {

                    if (!vm.runTime.isUltimos) {
                        if (vm.runTime.months && vm.runTime.months.length > 0) {

                            if (run_time.month.length > 0) {

                                var flag = false;
                                angular.forEach(run_time.month, function (value) {

                                    if (isMonth) {
                                        if (value.monthdays) {
                                            flag = true;
                                            var _period = [];

                                            if (angular.isArray(value.monthdays.day)) {
                                                angular.forEach(value.monthdays.day, function (value1) {
                                                    if (value1._day && (angular.equals(value1._day, selectedMonths) || angular.equals(value1._day.toString().split(' '), selectedMonths))) {
                                                        if (angular.isArray(value1.period)) {
                                                            angular.forEach(value1.period, function (res) {
                                                                if (res)
                                                                    _period.push(res);
                                                            })
                                                        } else {
                                                            if (value1.period)
                                                                _period.push(value1.period);

                                                        }
                                                        _period.push(vm.runTime.period);
                                                        value1.period = _period;
                                                    }
                                                });
                                            } else {
                                                if (angular.equals(value.monthdays.day._day, selectedMonths) || angular.equals(value.monthdays.day._day.toString().split(' '), selectedMonths)) {

                                                    if (angular.isArray(value.monthdays.day.period)) {
                                                        angular.forEach(value.monthdays.day.period, function (res) {
                                                            if (res)
                                                                _period.push(res);
                                                        })
                                                    } else {
                                                        if (value.monthdays.day.period)
                                                            _period.push(value.monthdays.day.period);

                                                    }


                                                    _period.push(vm.runTime.period);
                                                    value.monthdays.day.period = _period;
                                                }

                                            }

                                            if (_period.length == 0) {
                                                value.monthdays.day.push({
                                                    '_day': selectedMonths,
                                                    'period': vm.runTime.period
                                                });
                                            }
                                        }

                                    }
                                });
                                if (!flag) {
                                    if (isMonth) {
                                        for (var i = 0; i < run_time.month.length; i++) {

                                            if (run_time.month[i]._month && angular.equals(run_time.month[i]._month, vm.runTime.months) || angular.equals(run_time.month[i]._month.toString().split(' '), vm.runTime.months)) {
                                                run_time.month[i].monthdays = {day: []};
                                                run_time.month[i].monthdays.day.push({
                                                    '_day': selectedMonths,
                                                    'period': vm.runTime.period
                                                });
                                                break;
                                            }
                                        }

                                    } else {
                                        var x = {_month: vm.runTime.months, monthdays: {day: []}};
                                        x.monthdays.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                        run_time.month.push(x);
                                    }

                                }
                            } else {
                                var x = {_month: vm.runTime.months, monthdays: {day: []}};
                                x.monthdays.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                run_time.month.push(x);

                            }
                        } else {

                            if (run_time.monthdays.day.length > 0) {
                                var _period = [];
                                angular.forEach(run_time.monthdays.day, function (value) {
                                    if (value._day && (angular.equals(value._day, selectedMonths) || angular.equals(value._day.toString().split(' '), selectedMonths))) {


                                        if (angular.isArray(value.period)) {
                                            angular.forEach(value.period, function (res) {
                                                if (res)
                                                    _period.push(res);
                                            })
                                        } else {
                                            if (value.period)
                                                _period.push(value.period);

                                        }


                                        _period.push(vm.runTime.period);
                                        value.period = _period;
                                    }
                                });

                                if (_period.length == 0) {
                                    run_time.monthdays.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                }

                            } else {
                                run_time.monthdays.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                            }
                        }
                    } else {
                        if (vm.runTime.months && vm.runTime.months.length > 0) {

                            if (run_time.month.length > 0) {

                                var flag = false;
                                angular.forEach(run_time.month, function (value) {

                                    if (isMonth) {
                                        if (value.ultimos) {
                                            flag = true;
                                            var _period = [];

                                            if (angular.isArray(value.ultimos.day)) {
                                                angular.forEach(value.ultimos.day, function (value1) {
                                                    if (value1._day && (angular.equals(value1._day, selectedMonths) || angular.equals(value1._day.toString().split(' '), selectedMonths))) {
                                                        if (angular.isArray(value1.period)) {
                                                            angular.forEach(value1.period, function (res) {
                                                                if (res)
                                                                    _period.push(res);
                                                            })
                                                        } else {
                                                            if (value1.period)
                                                                _period.push(value1.period);
                                                        }
                                                        _period.push(vm.runTime.period);
                                                        value1.period = _period;
                                                    }
                                                });
                                            } else {
                                                if (angular.equals(value.ultimos.day._day, selectedMonths) || angular.equals(value.ultimos.day._day.toString().split(' '), selectedMonths)) {


                                                    if (angular.isArray(value.ultimos.day.period)) {
                                                        angular.forEach(value.ultimos.day.period, function (res) {
                                                            if (res)
                                                                _period.push(res);
                                                        })
                                                    } else {
                                                        if (value.ultimos.day.period)
                                                            _period.push(value.ultimos.day.period);
                                                    }


                                                    _period.push(vm.runTime.period);
                                                    value.ultimos.day.period = _period;
                                                }
                                            }

                                            if (_period.length == 0) {
                                                value.ultimos.day.push({
                                                    '_day': selectedMonths,
                                                    'period': vm.runTime.period
                                                });
                                            }
                                        }
                                    }
                                });
                                if (!flag) {
                                    if (isMonth) {
                                        for (var i = 0; i < run_time.month.length; i++) {

                                            if (run_time.month[i]._month && angular.equals(run_time.month[i]._month, vm.runTime.months) || angular.equals(run_time.month[i]._month.toString().split(' '), vm.runTime.months)) {
                                                run_time.month[i].ultimos = {day: []};
                                                run_time.month[i].ultimos.day.push({
                                                    '_day': selectedMonths,
                                                    'period': vm.runTime.period
                                                });
                                                break;
                                            }
                                        }

                                    } else {
                                        var x = {_month: vm.runTime.months, ultimos: {day: []}};
                                        x.ultimos.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                        run_time.month.push(x);
                                    }
                                }
                            } else {
                                var x = {_month: vm.runTime.months, ultimos: {day: []}};
                                x.ultimos.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                run_time.month.push(x);

                            }
                        } else {
                            if (run_time.ultimos.day.length > 0) {
                                var _period = [];
                                angular.forEach(run_time.ultimos.day, function (value) {
                                    if (value._day && (angular.equals(value._day, selectedMonths) || angular.equals(value._day.toString().split(' '), selectedMonths))) {
                                        if (angular.isArray(value.period)) {
                                            angular.forEach(value.period, function (res) {
                                                if (res)
                                                    _period.push(res);
                                            })
                                        } else {
                                            if (value.period)
                                                _period.push(value.period);
                                        }
                                        _period.push(vm.runTime.period);
                                        value.period = _period;
                                    }
                                });

                                if (_period.length == 0) {
                                    run_time.ultimos.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                                }

                            } else {
                                run_time.ultimos.day.push({'_day': selectedMonths, 'period': vm.runTime.period});
                            }
                        }
                    }
                }
            }
            if (selectedMonths.length > 0) {
                if (isEmpty(vm.runTime.days))
                    vm.runTime.days = selectedMonths;
            }
            vm.periodList.push(vm.runTime);

            vm.tempRunTime = angular.copy(run_time);

            var temp = angular.copy(vm.runTime);
            vm.runTime = {};
            vm.updateTime = {};
            vm.runTime.period = {};
            vm.runTime.every = temp.every;
            vm.runTime.tab = temp.tab;
            vm.runTime.days = temp.days;
            vm.runTime.months = temp.months;
            vm.runTime.frequency = 'single_start';
            vm.runTime.period._when_holiday = 'suppress';
            vm.runTime.specificWeekDay = temp.specificWeekDay;
            vm.runTime.which = temp.which;
        };

        vm.removePeriod = function (period, index) {

            vm.periodList.splice(index, 1);

            if (period.every == 'weekDays') {
                if (period.tab == "specificWeekDays") {
                    if (vm.tempRunTime.monthdays && vm.tempRunTime.monthdays.weekday) {
                        angular.forEach(vm.tempRunTime.monthdays.weekday, function (value) {

                            if (value._day && (angular.equals(value._day, period.specificWeekDay) && angular.equals(value._which, period.which))) {
                                if (angular.isArray(value.period)) {
                                    angular.forEach(value.period, function (val, index) {

                                        if (angular.equals(val, period.period)) {
                                            value.period.splice(index, 1);
                                        }
                                    });
                                } else {

                                    if (angular.equals(value.period, period.period)) {
                                        value.period = undefined;
                                        value._day = undefined;
                                    }
                                }
                            }
                        });
                    }
                } else {

                    if (period.months && period.months.length > 0) {
                        if (vm.tempRunTime.month && vm.tempRunTime.month.length > 0) {

                            for (var i = 0; i < vm.tempRunTime.month.length; i++) {

                                if (!isEmpty(vm.tempRunTime.month[i].weekdays)) {

                                    if (angular.equals(vm.tempRunTime.month[i]._month, period.months)) {
                                        if (vm.tempRunTime.month[i].weekdays && vm.tempRunTime.month[i].weekdays.day) {
                                            if (vm.tempRunTime.month[i].weekdays.day.length > 1) {
                                                angular.forEach(vm.tempRunTime.month[i].weekdays.day, function (value) {
                                                    if (angular.equals(value._day, period.days)) {
                                                        if (angular.isArray(value.period)) {
                                                            angular.forEach(value.period, function (val, index) {

                                                                if (angular.equals(val, period.period)) {
                                                                    value.period.splice(index, 1);
                                                                }
                                                            });
                                                        } else {

                                                            if (angular.equals(value.period, period.period)) {
                                                                value.period = undefined;
                                                                value._day = undefined;
                                                            }
                                                        }
                                                    }
                                                });
                                            } else {
                                                vm.tempRunTime.month.splice(i, 1);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (vm.tempRunTime.weekdays && vm.tempRunTime.weekdays.day) {
                            angular.forEach(vm.tempRunTime.weekdays.day, function (value) {

                                if (value._day && angular.equals(value._day, period.days)) {
                                    if (angular.isArray(value.period)) {
                                        angular.forEach(value.period, function (val, index) {

                                            if (angular.equals(val, period.period)) {
                                                value.period.splice(index, 1);
                                            }
                                        });
                                    } else {

                                        if (angular.equals(value.period, period.period)) {
                                            value.period = undefined;
                                            value._day = undefined;
                                        }
                                    }
                                }
                            });
                        }
                    }

                }
            } else if (period.every == 'monthDays') {

                if (period.months && period.months.length > 0) {
                    if (vm.tempRunTime.month && vm.tempRunTime.month.length > 0) {

                        for (var i = 0; i < vm.tempRunTime.month.length; i++) {

                            if (!isEmpty(vm.tempRunTime.month[i].monthdays)) {

                                if (angular.equals(vm.tempRunTime.month[i]._month, period.months)) {
                                    if (vm.tempRunTime.month[i].monthdays && vm.tempRunTime.month[i].monthdays.day) {
                                        if (vm.tempRunTime.month[i].monthdays.day.length > 1) {
                                            angular.forEach(vm.tempRunTime.month[i].monthdays.day, function (value) {
                                                if (angular.equals(value._day, period.days)) {
                                                    if (angular.isArray(value.period)) {
                                                        angular.forEach(value.period, function (val, index) {

                                                            if (angular.equals(val, period.period)) {
                                                                value.period.splice(index, 1);
                                                            }
                                                        });
                                                    } else {

                                                        if (angular.equals(value.period, period.period)) {
                                                            value.period = undefined;
                                                            value._day = undefined;
                                                        }
                                                    }
                                                }
                                            });
                                        } else {
                                            vm.tempRunTime.month.splice(i, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (vm.tempRunTime.monthdays && vm.tempRunTime.monthdays.day) {
                        angular.forEach(vm.tempRunTime.monthdays.day, function (value) {

                            if (value._day && angular.equals(value._day, period.days)) {
                                if (angular.isArray(value.period)) {
                                    angular.forEach(value.period, function (val, index) {

                                        if (angular.equals(val, period.period)) {
                                            value.period.splice(index, 1);
                                        }
                                    });
                                } else {
                                    if (angular.equals(value.period, period.period)) {
                                        value.period = undefined;
                                        value._day = undefined;
                                    }
                                }
                            }
                        });
                    }
                }


                if (period.months && period.months.length > 0) {
                    if (vm.tempRunTime.month && vm.tempRunTime.month.length > 0) {

                        for (var i = 0; i < vm.tempRunTime.month.length; i++) {

                            if (!isEmpty(vm.tempRunTime.month[i].ultimos)) {

                                if (angular.equals(vm.tempRunTime.month[i]._month, period.months)) {
                                    if (vm.tempRunTime.month[i].ultimos && vm.tempRunTime.month[i].ultimos.day) {
                                        if (vm.tempRunTime.month[i].ultimos.day.length > 1) {
                                            angular.forEach(vm.tempRunTime.month[i].ultimos.day, function (value) {
                                                if (angular.equals(value._day, period.days)) {
                                                    if (angular.isArray(value.period)) {
                                                        angular.forEach(value.period, function (val, index) {

                                                            if (angular.equals(val, period.period)) {
                                                                value.period.splice(index, 1);
                                                            }
                                                        });
                                                    } else {

                                                        if (angular.equals(value.period, period.period)) {
                                                            value.period = undefined;
                                                            value._day = undefined;
                                                        }
                                                    }
                                                }
                                            });
                                        } else {
                                            vm.tempRunTime.month.splice(i, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (vm.tempRunTime.ultimos && vm.tempRunTime.ultimos.day) {
                        angular.forEach(vm.tempRunTime.ultimos.day, function (value) {

                            if (value._day && angular.equals(value._day, period.days)) {
                                if (angular.isArray(value.period)) {
                                    angular.forEach(value.period, function (val, index) {

                                        if (angular.equals(val, period.period)) {
                                            value.period.splice(index, 1);
                                        }
                                    });
                                } else {
                                    if (angular.equals(value.period, period.period)) {
                                        value.period = undefined;
                                        value._day = undefined;
                                    }
                                }
                            }
                        });
                    }
                }

            }
        };


        vm.editPeriod = function (period, index) {
            console.log(period);
            var runTime = period;
            vm.runTime = {};

            if (runTime.period._single_start) {
                runTime.frequency = 'single_start';
                runTime.period._single_start = stringToTime(runTime.period._single_start);
            }
            else if (runTime.period._absolute_repeat) {
                runTime.frequency = 'absolute_repeat';
                runTime.period._absolute_repeat = stringToTime(runTime.period._absolute_repeat);
            }
            else if (runTime.period._repeat) {
                runTime.frequency = 'repeat';
                runTime.period._repeat = stringToTime(runTime.period._repeat);
            }
            if (runTime.period._begin) {
                runTime.period._begin = stringToTime(runTime.period._begin);
            }
            if (runTime.period._end) {
                runTime.period._end = stringToTime(runTime.period._end);
            }

            if (period.every != 'weekDays')
                angular.forEach(period.day.split(' '), function (val) {
                    vm.selectMonthDays(val);
                });

            promise3 = $timeout(function () {
                vm.runTime = runTime;
            }, 0);

            vm.removePeriod(period, index);
        };

        vm.back = function () {
            vm.editor.hidePervious = false;
            vm.editor.nextPage = false;
            vm.periodList = [];
            getXml2Json(vm.xml);
        };
        vm.next = function () {
            vm.editor.nextPage = true
        };
        vm.prev = function () {
            vm.editor.nextPage = false
        };

        function setDefaultFromTime(){
            var date = moment();
            date.set({hour:0,minute:0,second:0,millisecond:0});
            return date;
        }
        function setDefaultToTime(){
            var date = moment();
            date.set({hour:23,minute:59,second:59,millisecond:0});

            return date;
        }

        vm.from ={}; vm.to= {}; vm.error= {};
        vm.from.time = setDefaultFromTime();
        vm.to.time = setDefaultToTime();

        function saveSch(param) {
            if (param == 'done') {
                try {

                    var _xml = x2js.xml_str2json(vm.xml);
                    if (typeof _xml.schedule !== 'object') _xml.schedule = {};
                    if (vm.sch._substitute) {
                        _xml.schedule._substitute = vm.sch._substitute;
                    }
                    if (vm.sch._valid_from) {
                        _xml.schedule._valid_from = vm.sch._valid_from;
                    }
                    if (vm.sch._valid_to) {
                        _xml.schedule._valid_to = vm.sch._valid_to;
                    }
                    if (vm.sch._title) {
                        _xml.schedule._title = vm.sch._title;
                    }
                    var xmlStr = x2js.json2xml_str(_xml);
                    xmlStr = xmlStr.replace(/,/g, ' ');

                    vm.editor.hidePervious = false;
                    vm.editor.nextPage = false;
                    getXml2Json(xmlStr);
                } catch (e) {
                    console.log(e);
                }
            } else {
                vm.editor.hideEvery = true
            }
        }
        vm.saveScheduleDetail = function(param){

            vm.sch._valid_from = undefined;
            if (vm.from.time && vm.from.date) {
                var date = new Date(vm.from.date);
                vm.from.time = new Date(vm.from.time);
                date.setHours(vm.from.time.getHours());
                date.setMinutes(vm.from.time.getMinutes());
                date.setSeconds(vm.from.time.getSeconds());

                vm.sch._valid_from = moment(date).format('YYYY-MM-DD HH:mm:ss');
            }
            vm.sch._valid_to = undefined;
            if (vm.to.time && vm.to.date) {
                var date = new Date(vm.to.date);
                vm.to.time = new Date(vm.to.time);
                date.setHours(vm.to.time.getHours());
                date.setMinutes(vm.to.time.getMinutes());
                date.setSeconds(vm.to.time.getSeconds());
                vm.sch._valid_to = moment(date).format('YYYY-MM-DD HH:mm:ss');
            }

            if(vm.sch._valid_from || vm.sch._valid_to || vm.sch._substitute) {

                vm.error.scheduleRequired = !vm.sch._substitute;
                vm.error.validFromRequired = !vm.sch._valid_from;
                vm.error.validToRequired = !vm.sch._valid_to;
                vm.error.validDate = moment(vm.sch._valid_from).diff(moment(vm.sch._valid_to)) > 0;

                if(vm.sch._valid_from && vm.sch._valid_to && vm.sch._substitute && !vm.error.validDate) {
                        saveSch(param);
                }
            }else{
                saveSch(param);
            }

        };

        vm.holidayDates = [];
        vm.calendarFiles = [];
        vm.addHolidayDate = function (period) {
            if (vm.holidayDates.indexOf(period) === -1 && period)
                vm.holidayDates.push(period);
        };

        vm.removeHolidayDate = function (index) {
            vm.holidayDates.splice(index, 1);
        };

        vm.addCalendarFile = function (file) {
            if (vm.calendarFiles.indexOf(file) === -1 && file)
                vm.calendarFiles.push(file);
        };

        vm.removeCalendarFile = function (index) {
            vm.calendarFiles.splice(index, 1);
        };

        vm.editRunTime = function (data) {

            vm.updateTime = angular.copy(data);
            vm.periodList = [];
            vm.editor.hidePervious = true;
            vm.editor.create = false;
            vm.editor.update = true;
            vm.editor.hideEvery = true;
            vm.editor.nextPage = false;
            vm.str = vm.updateTime.runTime;
            vm.runTime = {};
            var runTime = {};
            selectedMonths = [];

            if (!isEmpty(vm.updateTime.obj) && !angular.isArray(vm.updateTime.obj)) {
                if (vm.updateTime.type == 'month') {
                    runTime.tab = 'weekDays';
                    runTime.months = vm.updateTime.obj._month.split(' ');
                    vm.showMonthRange = true;
                    if (vm.updateTime.type2 == 'weekdays') {
                        runTime.every = 'weekDays';
                        runTime.days = vm.updateTime.obj._day.split(' ');
                    }
                    else if (vm.updateTime.type2 == 'monthdays') {
                        runTime.every = 'monthDays';
                        angular.forEach(vm.updateTime.obj._day.split(' '), function (val) {
                            vm.selectMonthDays(val);
                        });
                    }
                    else if (vm.updateTime.type2 == 'ultimos') {
                        runTime.every = 'monthDays';
                        angular.forEach(vm.updateTime.obj._day.split(' '), function (val) {
                            vm.selectMonthDays(val);
                        });
                    }
                }
                else if (vm.updateTime.type == 'weekdays') {
                    runTime.every = 'weekDays';
                    runTime.tab = 'weekDays';
                    runTime.days = vm.updateTime.obj._day.split(' ');
                }

                else if (vm.updateTime.type == 'ultimos') {
                    runTime.isUltimos = true;
                    runTime.every = 'monthdays';

                    angular.forEach(vm.updateTime.obj._day.split(' '), function (val) {
                        vm.selectMonthDays(val);
                    });
                }

                else if (vm.updateTime.type == 'monthdays') {
                    runTime.every = 'monthDays';

                    angular.forEach(vm.updateTime.obj._day.split(' '), function (val) {
                        vm.selectMonthDays(val);
                    });

                }

                else if (vm.updateTime.type == 'weekday') {
                    runTime.every = 'weekDays';
                    runTime.tab = 'specificWeekDays';
                    runTime.specificWeekDay = vm.updateTime.obj._day;
                    runTime.which = vm.updateTime.obj._which;
                }

                runTime.period = vm.updateTime.obj._period;
                if (!vm.updateTime.obj._when_holiday) {
                    if (!runTime.period) {
                        runTime.period = {};
                    }
                    runTime.period._when_holiday = 'suppress';
                }


                if (runTime.period._single_start) {
                    runTime.frequency = 'single_start';
                    runTime.period._single_start = stringToTime(runTime.period._single_start);
                }
                else if (runTime.period._absolute_repeat) {
                    runTime.frequency = 'absolute_repeat';
                    runTime.period._absolute_repeat = stringToTime(runTime.period._absolute_repeat);
                }
                else if (runTime.period._repeat) {
                    runTime.frequency = 'repeat';
                    runTime.period._repeat = stringToTime(runTime.period._repeat);
                }
                if (runTime.period._begin) {
                    runTime.period._begin = stringToTime(runTime.period._begin);
                }
                if (runTime.period._end) {
                    runTime.period._end = stringToTime(runTime.period._end);
                }

            } else {
                if (vm.updateTime.type == 'holidays') {
                    vm.editor.nextPage = true;
                    runTime.every = 'weekDays';
                }
            }

            promise1 = $timeout(function () {
                vm.runTime = runTime;
            }, 0);

        };

        vm.createNewRunTime = function () {
            vm.editor.hidePervious = true;
            vm.editor.create = true;
            vm.editor.update = false;
            vm.periodList = [];
            selectedMonths = [];
            vm.runTime = {};
            vm.runTime.period = {};
            vm.runTime.every = 'weekDays';
            vm.runTime.frequency = 'single_start';
            vm.runTime.period._when_holiday = 'suppress';
            vm.runTime.tab = 'weekDays';
        };

        vm.createRunTime = function () {
            vm.editor.hidePervious = false;
            vm.editor.hideEvery = false;
            vm.editor.nextPage = false;
            vm.editor.create = false;
            vm.editor.update = false;


            if (isEmpty(vm.tempRunTime)) {
                if (isEmpty(run_time)) {

                    try {
                        var _xml = x2js.xml_str2json(vm.xml);
                    } catch (e) {
                        console.log(e);
                    }
                    run_time = _xml.run_time || _xml.schedule;
                }
                vm.tempRunTime = run_time;
            }

            vm.run_time = vm.tempRunTime;
            delete vm.run_time['_schedule'];

            if (vm.runTime1.date && vm.runTime1.date._date) {
                vm.run_time.date = {};
                vm.run_time.date._date = moment(vm.runTime1.date._date).format('YYYY-MM-DD');
            }

            if (vm.runTime1.holidays) {
                vm.run_time.holidays = {};
                vm.run_time.holidays.holiday = [];
                vm.run_time.holidays.include = [];
                if (vm.runTime1.holidays.weekdays) {
                    vm.run_time.holidays.weekdays = vm.runTime1.holidays.weekdays;
                }
                if (vm.calendarFiles.length > 0) {
                    angular.forEach(vm.calendarFiles, function (value) {
                        vm.run_time.holidays.include.push({_live_file: value});
                    });
                }
                if (vm.holidayDates.length > 0) {
                    angular.forEach(vm.holidayDates, function (value) {
                        vm.run_time.holidays.holiday.push({_date: moment(value).format('YYYY-MM-DD')});
                    });
                }

            }

            if (!isEmpty(vm.run_time.weekdays)) {
                if (!(vm.run_time.weekdays.day && (vm.run_time.weekdays.day.length > 0 || vm.run_time.weekdays.day._day))) {
                    delete vm.run_time['weekdays'];
                }
            } else {
                delete vm.run_time['weekdays'];
            }

            if (!isEmpty(vm.run_time.monthdays)) {
                if (!(vm.run_time.monthdays.weekday && vm.run_time.monthdays.weekday.length > 0)) {
                    delete vm.run_time.monthdays['weekday'];
                }
                if (!(vm.run_time.monthdays.day && (vm.run_time.monthdays.day.length > 0 || vm.run_time.monthdays.day._day))) {
                    if (!(vm.run_time.monthdays.weekday && vm.run_time.monthdays.weekday.length > 0)) {
                        delete vm.run_time['monthdays'];
                    }
                }
            } else {
                delete vm.run_time['monthdays'];
            }

            if (!isEmpty(vm.run_time.ultimos)) {
                if (!(vm.run_time.ultimos.day && (vm.run_time.ultimos.day.length > 0 || vm.run_time.ultimos.day._day))) {
                    delete vm.run_time['ultimos'];
                }
            } else {
                delete vm.run_time['ultimos'];
            }

            if (!isEmpty(vm.run_time.month)) {
                if (!(vm.run_time.month.length > 0 || vm.run_time.month._month)) {
                    delete vm.run_time['month'];
                }
            } else {
                delete vm.run_time['month'];
            }

            if (!isEmpty(vm.run_time.holidays)) {
                if (!(vm.run_time.holidays.holiday && vm.run_time.holidays.holiday.length > 0)) {
                    delete vm.run_time.holidays['holiday'];
                }
                if (!(vm.run_time.holidays.include && vm.run_time.holidays.include.length > 0)) {
                    delete vm.run_time.holidays['include'];
                }

                if (!(vm.run_time.holidays.weekdays && vm.run_time.holidays.weekdays.day && vm.run_time.holidays.weekdays.day._day.length > 0)) {
                    delete vm.run_time.holidays['weekdays'];
                }
            }
            if (isEmpty(vm.run_time.holidays)) {
                delete vm.run_time['holidays'];
            }

            if (vm.runTime1.timeZone) {
                vm.run_time._time_zone = vm.runTime1.timeZone;
            }
            if(vm.sch) {
                if (vm.sch._substitute) {
                    vm.run_time._substitute = vm.sch._substitute;
                }
                if (vm.sch._valid_from) {
                    vm.run_time._valid_from = vm.sch._valid_from;
                }
                if (vm.sch._valid_to) {
                    vm.run_time._valid_to = vm.sch._valid_to;
                }
                if (vm.sch._title) {
                    vm.run_time._title = vm.sch._title;
                }
            }


            if (vm.order) {
                vm.run_time = {run_time: vm.run_time};
            }
            else if(vm.schedule){
                  vm.run_time = {schedule: vm.run_time};
            }


            try {
                var xmlStr = x2js.json2xml_str(vm.run_time);
            } catch (e) {
                console.log(e);
            }


            xmlStr = xmlStr.replace(/,/g, ' ');

            run_time = {};
            run_time.month = [];
            run_time.weekdays = {};
            run_time.weekdays.day = [];
            run_time.monthdays = {};
            run_time.monthdays.day = [];
            run_time.ultimos = {};
            run_time.ultimos.day = [];
            vm.tempRunTime = {};
            selectedMonths = [];
            getXml2Json(xmlStr);
        };


        $scope.$on('loadXml', function () {
            if (!vm.xml) {
                if (!isEmpty(vm.order)) {
                    vm.xml = '<run_time></run_time>';
                }
                else {
                    var str = '<schedule';
                    if (vm.sch._substitute) {
                        str += ' substitute="'+ vm.sch._substitute+'"';
                    }
                    if (vm.sch._valid_from) {
                       str += ' valid_from="'+ vm.sch._valid_from+'"';
                    }
                    if (vm.sch._valid_to) {
                       str += ' valid_to="'+ vm.sch._valid_to+'"';
                    }
                    if (vm.sch._title) {
                        str += ' title="'+vm.sch._title+'"';
                    }

                    vm.xml = str + '></schedule>';

                }
            }
            getXml2Json(vm.xml);
        });

        $scope.$on('$destroy', function () {
            watcher1();
            watcher2();
            watcher3();
            if (promise1)
                $timeout.cancel(promise1);
            if (promise2)
                $timeout.cancel(promise2);
            if (promise3)
                $timeout.cancel(promise3);
        });

    }
})();