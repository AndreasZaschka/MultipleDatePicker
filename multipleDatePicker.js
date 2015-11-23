/*
 @author : Maelig GOHIN For ARCA-Computing - www.arca-computing.fr
 @date: July 2014
 @version: 1.3.2

 @description:  MultipleDatePicker is an Angular directive to show a simple calendar allowing user to select multiple dates.
 Css style can be changed by editing less or css stylesheet.
 See scope declaration below for options you can pass through html directive.
 Feel free to edit and share this piece of code, our idea is to keep it simple ;)
 */
angular.module('multipleDatePicker', [])
    .factory('multipleDatePickerBroadcast', ['$rootScope', function ($rootScope) {
        var sharedService = {};

        sharedService.calendarId = null;
        sharedService.message = '';

        sharedService.resetOrder = function (calendarId) {
            this.message = 'reset';
            this.calendarId = calendarId;
            this.broadcastItem();
        };

        sharedService.broadcastItem = function () {
            $rootScope.$broadcast('handleMultipleDatePickerBroadcast');
        };

        return sharedService;
    }])
    .directive('multipleDatePicker', ['$log', 'multipleDatePickerBroadcast', function ($log, multipleDatePickerBroadcast) {
        "use strict";
        return {
            restrict: 'AE',
            scope: {
                /*
                 * Type : String/Long (avoid 0 value)
                 * Will be used to identified calendar when using broadcast messages
                 * */
                calendarId: '=?',
                /*
                 * DEPRECATED : use dayClick
                 * Type: function(timestamp, boolean)
                 * Will be called when un/select a date
                 * Param timestamp will be the date at midnight
                 * */
                callback: '&',
                dayClick: '=?',
                dayHover: '=?',

                /*
                 * Type: moment date
                 * Month to be displayed
                 * Default is current month
                 */
                month: '=?',

                /*
                 * Type: function(newMonth, oldMonth)
                 * Will be called when month changed
                 * Param newMonth/oldMonth will be the first day of month at midnight
                 * */
                monthChanged: '=?',
                /*
                 * Type: array of milliseconds timestamps
                 * Days already selected
                 * */
                daysSelected: '=?',
                /*
                 * Type: array of integers
                 * Recurrent week days not selectables
                 * /!\ Sunday = 0, Monday = 1 ... Saturday = 6
                 * */
                weekDaysOff: '=?',
                /*
                 * DEPRECATED : use highlightDays
                 * Type: array of milliseconds timestamps
                 * Days not selectables
                 * */
                daysOff: '=?',
                /*
                 * Type: array of objects cf doc
                 * Days highlights
                 * */
                highlightDays: '=?',
                /*
                 * Type: boolean
                 * Set all days off
                 * */
                allDaysOff: '=?',
                /*
                 * Type: boolean
                 * Sunday be the first day of week, default will be Monday
                 * */
                sundayFirstDay: '=?',
                /*
                 * Type: boolean
                 * if true can't go back in months before today's month
                 * */
                disallowBackPastMonths: '=',
                /*
                 * Type: boolean
                 * if true can't go in futur months after today's month
                 * */
                disallowGoFuturMonths: '=',
                /*
                 * Type: boolean
                 * if true empty boxes will be filled with days of previous/next month
                 * */
                showDaysOfSurroundingMonths: '='
            },
            template: '<div class="multiple-date-picker">' +
            '<div class="picker-top-row">' +
            '<div class="text-center picker-navigate picker-navigate-left-arrow" ng-class="{\'disabled\':disableBackButton}" ng-click="previousMonth()">&lt;</div>' +
            '<div class="text-center picker-month">{{month.format(\'MMMM YYYY\')}}</div>' +
            '<div class="text-center picker-navigate picker-navigate-right-arrow" ng-class="{\'disabled\':disableNextButton}" ng-click="nextMonth()">&gt;</div>' +
            '</div>' +
            '<div class="picker-days-week-row">' +
            '<div class="text-center" ng-repeat="day in daysOfWeek">{{day}}</div>' +
            '</div>' +
            '<div class="picker-days-row">' +
            '<div class="text-center picker-day {{day.css}}" title="{{day.title}}" ng-repeat="day in days" ng-click="toggleDay($event, day)" ng-mouseover="hoverDay($event, day)" ng-mouseleave="dayHover($event, day)" ng-class="{\'picker-selected\':day.selected, \'picker-off\':!day.selectable, \'today\':day.today,\'past\':day.past,\'future\':day.future, \'picker-empty\':day.otherMonth}">{{day ? day.otherMonth && !showDaysOfSurroundingMonths ? \'&nbsp;\' : day.format(\'D\') : \'\'}}</div>' +
            '</div>' +
            '</div>',
            link: function (scope) {

                /*utility functions*/
                var checkNavigationButtons = function () {
                        var today = moment(),
                            previousMonth = moment(scope.month).subtract(1, 'month'),
                            nextMonth = moment(scope.month).add(1, 'month');
                        scope.disableBackButton = scope.disallowBackPastMonths && today.isAfter(previousMonth, 'month');
                        scope.disableNextButton = scope.disallowGoFuturMonths && today.isBefore(nextMonth, 'month');
                    },
                    getDaysOfWeek = function () {
                        /*To display days of week names in moment.lang*/
                        var momentDaysOfWeek = moment().localeData()._weekdaysMin,
                            days = [];

                        for (var i = 1; i < 7; i++) {
                            days.push(momentDaysOfWeek[i]);
                        }

                        if (scope.sundayFirstDay) {
                            days.splice(0, 0, momentDaysOfWeek[0]);
                        } else {
                            days.push(momentDaysOfWeek[0]);
                        }

                        return days;
                    },
                    reset = function () {
                        var daysSelected = scope.daysSelected || [],
                            momentDates = [];
                        daysSelected.map(function (timestamp) {
                            momentDates.push(moment(timestamp));
                        });
                        scope.convertedDaysSelected = momentDates;
                        scope.generate();
                    };

                /* broadcast functions*/
                scope.$on('handleMultipleDatePickerBroadcast', function () {
                    if (multipleDatePickerBroadcast.message === 'reset' && (!multipleDatePickerBroadcast.calendarId || multipleDatePickerBroadcast.calendarId === scope.calendarId)) {
                        reset();
                    }
                });

                /*scope functions*/
                scope.$watch('daysSelected', function (newValue) {
                    if (newValue) {
                        reset();
                    }
                }, true);

                scope.$watch('weekDaysOff', function () {
                    scope.generate();
                }, true);

                scope.$watch('daysOff', function (value) {
                    if (value !== undefined) {
                        $log.warn('daysOff option deprecated since version 1.1.6, please use highlightDays');
                    }
                    scope.generate();
                }, true);

                scope.$watch('highlightDays', function () {
                    scope.generate();
                }, true);

                scope.$watch('allDaysOff', function () {
                    scope.generate();
                }, true);

                //default values
                scope.month = scope.month || moment().startOf('day');
                scope.days = [];
                scope.convertedDaysSelected = scope.convertedDaysSelected || [];
                scope.weekDaysOff = scope.weekDaysOff || [];
                scope.daysOff = scope.daysOff || [];
                scope.disableBackButton = false;
                scope.disableNextButton = false;
                scope.daysOfWeek = getDaysOfWeek();

                /**
                 * Called when user clicks a date
                 * @param Event event the click event
                 * @param Moment momentDate a moment object extended with selected and isSelectable booleans
                 * @see #momentDate
                 * @callback dayClick
                 * @callback callback deprecated
                 */
                scope.toggleDay = function (event, momentDate) {
                    event.preventDefault();

                    if(momentDate.otherMonth){
                        return;
                    }

                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayClick == 'function') {
                        scope.dayClick(event, momentDate);
                    }

                    if (momentDate.selectable && !prevented) {
                        momentDate.selected = !momentDate.selected;

                        if (momentDate.selected) {
                            scope.convertedDaysSelected.push(momentDate);
                        } else {
                            scope.convertedDaysSelected = scope.convertedDaysSelected.filter(function (date) {
                                return date.valueOf() !== momentDate.valueOf();
                            });
                        }

                        if (typeof(scope.callback) === "function") {
                            $log.warn('callback option deprecated, please use dayClick');
                            scope.callback({timestamp: momentDate.valueOf(), selected: momentDate.selected});
                        }
                    }
                };

                /**
                 * Hover day
                 * @param Event event
                 * @param Moment day
                 */
                scope.hoverDay = function (event, day) {
                    event.preventDefault();
                    var prevented = false;

                    event.preventDefault = function () {
                        prevented = true;
                    };

                    if (typeof scope.dayHover == 'function') {
                        scope.dayHover(event, day);
                    }

                    if (!prevented) {
                        day.hover = event.type === 'mouseover' ? true : false;
                    }
                };

                /*Navigate to previous month*/
                scope.previousMonth = function () {
                    if (!scope.disableBackButton) {
                        var oldMonth = moment(scope.month);
                        scope.month = scope.month.subtract(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Navigate to next month*/
                scope.nextMonth = function () {
                    if (!scope.disableNextButton) {
                        var oldMonth = moment(scope.month);
                        scope.month = scope.month.add(1, 'month');
                        if (typeof scope.monthChanged == 'function') {
                            scope.monthChanged(scope.month, oldMonth);
                        }
                        scope.generate();
                    }
                };

                /*Check if the date is off : unselectable*/
                scope.isDayOff = function (scope, date) {
                    return scope.allDaysOff ||
                        (angular.isArray(scope.weekDaysOff) && scope.weekDaysOff.some(function (dayOff) {
                            return date.day() === dayOff;
                        })) ||
                        (angular.isArray(scope.daysOff) && scope.daysOff.some(function (dayOff) {
                            return date.isSame(dayOff, 'day');
                        })) ||
                        (angular.isArray(scope.highlightDays) && scope.highlightDays.some(function (highlightDay) {
                            return date.isSame(highlightDay.date, 'day') && !highlightDay.selectable;
                        }));
                };

                /*Check if the date is selected*/
                scope.isSelected = function (scope, date) {
                    return scope.convertedDaysSelected.some(function (d) {
                        return date.isSame(d, 'day');
                    });
                };

                /*Generate the calendar*/
                scope.generate = function () {
                    var previousDay = moment(scope.month).date(0).day(scope.sundayFirstDay ? 0 : 1).subtract(1, 'days'),
                        firstDayOfMonth = moment(scope.month).date(1),
                        days = [],
                        now = moment(),
                        lastDay = moment(firstDayOfMonth).endOf('month'),
                        createDate = function () {
                            var date = moment(previousDay.add(1, 'days'));
                            if (angular.isArray(scope.highlightDays)) {
                                var hlDay = scope.highlightDays.filter(function (d) {
                                    return date.isSame(d.date, 'day');
                                });
                                date.css = hlDay.length > 0 ? hlDay[0].css : '';
                                date.title = hlDay.length > 0 ? hlDay[0].title : '';
                            }
                            date.selectable = !scope.isDayOff(scope, date);
                            date.selected = scope.isSelected(scope, date);
                            date.today = date.isSame(now, 'day');
                            date.past = date.isBefore(now, 'day');
                            date.future = date.isAfter(now, 'day');
                            if (!date.isSame(scope.month, 'month')) {
                                date.otherMonth = true;
                                date.selectable = false;
                            }
                            return date;
                        },
                        maxDays = lastDay.diff(previousDay, 'days'),
                        lastDayOfWeek = scope.sundayFirstDay ? 6 : 0;

                    if (lastDay.day() !== lastDayOfWeek) {
                        maxDays += (scope.sundayFirstDay ? 6 : 7) - lastDay.day();
                    }

                    for (var j = 0; j < maxDays; j++) {
                        days.push(createDate());
                    }

                    scope.days = days;
                    checkNavigationButtons();
                };

                scope.generate();
            }
        };
    }]);
