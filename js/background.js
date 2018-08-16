/*
############################# HIGH CPU USAGE TABLE BY NUMBER OF PROCESSORS #############################
1 Core --> 80
2 Core --> 80
3 Core --> 80
4 Core --> 80
5 Core --> 80
6 Core --> 80
7 Core --> 80
8 Core --> 80
########################################################################################################
*/

var disableIcon = 'icons/icon_off.png',	// When add-on is disabled icon will be updated with this variable
	enableIcon = 'icons/icon.png',		// When add-on is enabled icon will be updated with this variable
	_BlackUrls = [],					// Stores black urls/scripts
	_CpuHungryProcesses = [],			// Stores cpu-hungry processes
	_Settings,							// Stores settings from options
	_NumOfProcessors,					// Stores the number of processors of a user's computer
	_HighCpuLimit,						/* Stores the highest limit of cpu usage to understand
										a process is whether if a cpu-hungry process or not */
	
	// The variables used for controlling only one suspicious process at the same time
	_Access = true,
	_BadProcess = false,
	_BadProcessId = -1,
	counter = 1,
	totalCpuUsage = 0,
	_CreatedProcess = [];

// Inits the background JS file (this)
function initBackground() {

	setCpuHungryProcessesToStorage();

	// Gets number of processors of a system and assign the high cpu usage limit according to it
	chrome.system.cpu.getInfo(function(info) {
		_NumOfProcessors = info.numOfProcessors;

		// If cpu rate limit is set in options page, it stores that value in the _HighCpuLimit otherwise the value will be 80 as default
		if (_NumOfProcessors > 0) _HighCpuLimit = (localStorage._HighCpuLimit === undefined) ? 80 : parseInt(localStorage._HighCpuLimit);
	});

	// Updates configurations and the function will callback the value parameter
	// The value parameter equals to the all settings
	updateConfigurations(function(value) {

		// Inits listeners according to whether if the add-on is running or not
		initListeners(value['_runStatus']);
	});
}

// Gets response from sent by HTTPGetText function()
// Gets urls/scripts from filters.txt
// Constructs all of the configurations
function updateConfigurations(callback) {

	// Gets all settings through getSettings function of utils JS file
	// (value come from utils.getSettings function with callback)
	utils.getSettings(function(value) {

		// _Settings stores all settings thanks to value
		_Settings = value;

		// Reads filters.txt
		HTTPGetText(chrome.runtime.getURL('assets/filters.txt'), function() {

			// If _Settings['_filters'] is true
			if(_Settings['_filters']) {

				// data variable stores the response text (filters.txt)
				var data = this.responseText;

				// data variable is being divided with new line character (\n)
				// data is an array anymore
				data = data.split('\n');

				// Cleans unnecessary elements from filters
				data = utils.cleanArray(data);

				// The concat function combines two arrays
				// Namely whole filters are added to _BlackUrls array
				_BlackUrls = _BlackUrls.concat(data);
			}

			// Sends back the value parameter
			callback(value);

		}, handleReqError);
		// If any error
	});
}

// Gets all filters from filters.txt file with request
function HTTPGetText(url, handleReqListener, handleReqError) {

	var request = new XMLHttpRequest();

	// When request object is onload situation handleReqListener is called
	request.onload = handleReqListener;

	// If there is any error, we will handle it here
	request.onerror = handleReqError;

	// We 'gets' the file with url parameter
	request.open('get', url, true);

	// Request is being sent
	request.send();
}

// Handles response of request by HTTPGetText function
function handleReqListener() {
	var data = this.responseText;
}

// Handles errors of request by HTTPGetText function if any
function handleReqError(err) {
	console.log('Error: ', err);
}

// Updates add-on icon where is right top corner of Chrome when the extension enabled / disabled
function updateIcon(status) {

	// If status is true (add-on is enabled), icon variable will be enableIcon variable (Original icon - on)
	// If status is false (add-on is disabled), icon variable will be disableIcon variable (Gray icon - off)
	var icon = (status === true) ? enableIcon : disableIcon;

	// Sets icon path with icon variable
	chrome.browserAction.setIcon({path: icon});
}

// Changes the add-on running status (enabled/disabled)
function change_Status(status) {

	// Sets '_runStatus' to status parameter
	_Settings['_runStatus'] = status;

	// Sets '_runStatus' to status parameter (true/false) in _Settings
	utils.setOption('_runStatus', status, utils.noop);

	// Inits main background listeners
	initListeners(status);
}

// The function notifies user about cryptominer scripts/urls/processes
// isProcess parameter says where the function was called from (From process or from scripts mechanism)
function notifyUser(details, isProcess) {

	// The variables change according to coming details parameter
	var tabId,
		process,
		_title,
		_message;

	// If the function is called from {blocking scripts} mechanism
	// First protection mechanism = {blocking scripts}
	if (!isProcess) {
		tabId = details.tabId;
		_title = 'Script URL';
		_message = `${details.url}`;
	}

	// If the function is called from {cpu-hungry processes} mechanism
	// Second protection mechanism = {cpu-hungry processes}
	else {
		process = details;
		tabId = process.tasks[0].tabId;
		_title = 'Process';
		_message = `${process.tasks[0].title.split(": ")[1]}`;
	}

	if (tabId < 0 || tabId == undefined) { return; }

	// Gets information on the tab which requested cryptominer script/process
	chrome.tabs.get(tabId, function (tab) {

		// For debug
		callbackForRuntimeErrors();

	    // Specifies notification features which will be showed
	    options = {
	    	type: 'list',
	      	title: 'MINER DETECTED!',
	      	message:`${tab.title}`,
	      	items: [
	      		{ title: 'Title', message: `${tab.title}` },
	        	{ title: 'URL', message: `${tab.url}` },
	        	{ title: _title, message: _message }
	      	],
	      	iconUrl: 'icons/icon_128.png',
	      	buttons: [{ title: 'Disable Notifications' }]
	    }

	    // Creates notification (null parameter represents the notification's id)
	    // The id isn't important that's why it is 'null'
	    chrome.notifications.create(null, options, utils.noop)

	    // Gets present time (now)
	    current_time = new Date().getTime();

	    // historyItemId stores the history item's id (block_{current_time}_{random_number})
	    // Unique id
	    historyItemId = 'block_' + current_time + '_' + Math.round(Math.random() * 10e10);

	    // historyItemData stores the history item's details
	    historyItemData = { page: tab, request: details, date: current_time };

	    // Creates historyItemObject and add historyItemData to historyItemObject
	    historyItemObject = {};
	    historyItemObject[historyItemId] = historyItemData;

	    // Stores the all historyItemObject(all history) in Chrome Local Storage
	    chrome.storage.local.set(historyItemObject, utils.noop);
  	});

	// Adds listener on button clicks (Disable Notifications button)
	chrome.notifications.onButtonClicked.addListener(function (notifId, btnIndex) {

	    // Closes all currently open or waiting notifications
	    chrome.notifications.getAll(function (notifications) {

	    	// Travels through all notifications
	    	for (var notif in notifications) {

	    		// Clears notifications
	    		if (notifications.hasOwnProperty(notif)) {
	    			chrome.notifications.clear(notif)
	    		}
	    	}
	    });

	    // _Settings variable is updated
	    _Settings['_ShowNotification'] = false;

	    // Sets the _ShowNotification option
	    // Disables the notification setting checkbox in option page
	    utils.setOption('_ShowNotification', false, utils.noop);
    });
}

// First one of the main listeners
// It is handled on before any requests
// Blocks black urls and scripts on before request
// Black scripts won't be able to start
function handleOnBeforeRequest(details) {

	// If the first protection mechanism was disabled from settings page
	if (!_Settings['_filters']) {

		// Do nothing
		return {cancel: false};
	}

	// If show badge warning checkbox is checked in option (settings) page
	// and if the add-on is active (enabled)
	if(_Settings['_ShowBadgeWarning'] && _Settings['_runStatus']) {

		// Updates the icon which is in the right top corner of the chrome
		// Shows a 'X' in front of the icon if the current tab includes a cryptominer script/url/process
		updateBadge('X', details.tabId);
	}

	// If show notification checkbox is checked in option page
	if (_Settings['_ShowNotification']) {

		// Notifies user about cryptominers
		notifyUser(details, false);
	}

	// {cancel: true} means "block it!"
	return {cancel: true};
}

// Updates badge if it finds cryptominer
// Shows a badge over the icon which is in the right top corner of the chrome
// Badge: a bit of text that is layered over the icon
function updateBadge(warning, tabId) {

	// Sets badge background color for current tab
	// Red
	chrome.browserAction.setBadgeBackgroundColor({
		color: '#FA2A2A',
		tabId: tabId
	});

	// Sets badge text for current tab
	chrome.browserAction.setBadgeText({
	    text: warning,
	    tabId: tabId
	});
}

// Says if a process is malicious or not
function isBadProcess(process) {
	// If the process parameter's type is not browser and gpu, and process uses more than limit of high cpu usage rate
	// Facebook, Youtube and Google were added
	// TODO: Add WhiteList for this situtation
	if (process.cpu > _HighCpuLimit &&
		process.type != "browser" && process.type != "gpu" &&
		!process.tasks[0].title.toLowerCase().includes("google") && 
		!process.tasks[0].title.toLowerCase().includes("facebook") && 
		!process.tasks[0].title.toLowerCase().includes("youtube")) {

		return true;
	}
	return false;
}

// Second one of the main listeners
// Triggered when any process updates its resources
// Travels all of the chrome processes and controls them
// Catches the suspicious processes who exceed the cpu rate limit first time
function handleOnUpdatedProcess2(processes) {

	// If the add-on is active
	if (_Access && _Settings['_runStatus']) {
		for (pid in processes) {
			if (isBadProcess(processes[pid])) {
				// If any process is malicious, it is added to the FIFO stack
				// FIFO = First In First Out
				if (!_CreatedProcess.includes(pid))
					_CreatedProcess.push(pid);
			}
		}
	}

	// If there is any suspicious process it turns _Access to false
	// Because only one process can be controlled completely (for 10 seconds) at the same time
	// If two or more process exceed the cpu rate limit at the same time only one of them will be controlled
	// And the others will wait in the _CreatedProcess FIFO stack
	if (_Access && _CreatedProcess.length > 0) {
		_BadProcessId = _CreatedProcess.shift();
		_Access = false;
		_BadProcess = true;
		totalCpuUsage = 0;
		counter = 1;
	}
}

// Third one of the main listeners
// Triggered when any process updates its resources
// Only works when there is at least one suspicious process
// Takes averages cpu usage rate of any suspicious process for 10 seconds
// If the average value is higher than set cpu limit, the process is malicious
function handleOnUpdatedProcess(processes) {

	// If there is any malicious process
	if (_BadProcess) {
		var process = processes[_BadProcessId];

		if (process !== undefined) {
			_BadProcess = false;

			totalCpuUsage += process.cpu;

			// Debug
			console.log("Process: " + process.id + " totalCpuUsage: " + totalCpuUsage);

			if (counter > 9) {
				if ((totalCpuUsage / counter) >= _HighCpuLimit) {
					actToProcessAsBad(process);
				}
				_Access = true;
			}
			else {
				wait(1000);
				_BadProcess = true;
			}

			counter++;
		}
		else {
			_Access = true;
			_BadProcess = false;
		}
	}
}

// Waits the add-on according to the seconds parameter
function wait(seconds) {
	// countDownTime stores the seconds after of the present time (now + seconds)
	var countDownTime = new Date().getTime() + seconds;

	// Updates the count down every second (Count down)
	var x = setInterval(function() {

		// Gets present time (now)
		var now = new Date().getTime();

		// Find the interval between now an the countDownTime
		// Interval will be like 10, 9, 8, 7, 6, 5 ...
		var interval = countDownTime - now;

	    // If interval smaller than 0 (If the countdown is over for 10 seconds)
	    if (interval < 0) {

	    	// Clears interval (finished the countdown)
	    	clearInterval(x);
	    }
	}, 1000);
	// The 1000 represents the second, namely the 10 is decreased 1 every second (1000 ms = 1 s)
	// For example if we give 2000 it will count every 2 seconds like 10, 8, 6, 4, 2 ...
}

// Applies bad procedures to any malicious process (cpu-hungry process)
function actToProcessAsBad(process) {

	// If show badge warning checkbox is checked in option page
	if(_Settings['_ShowBadgeWarning'] && _Settings['_runStatus']) {

		// Calls updateBadge function
		// Shows a 'X' if the current tab includes a cryptominer script/url,
		if (process.tasks[0].tabId != undefined)
			updateBadge('X', process.tasks[0].tabId);
	}

	// If _BlockCpuHungryProcess checkbox is checked in options page
	if (_Settings['_BlockCpuHungryProcess']) {

		// Blocks the process
		blockProcess(process);
	}

	// Marks the process as cpu-hungry process
	markAsCpuHungryProcess(process);
}

// Sets _CpuHungryProcesses to Chrome Local Storage
function setCpuHungryProcessesToStorage() {

	chrome.storage.sync.set({list : _CpuHungryProcesses}, function() {
		// debug
	    console.log("added to list");
	});
}

// Gets _CpuHungryProcesses from Chrome Local Storage
function getCpuHungryProcessesFromStorage() {

    // Gets _CpuHungryProcesses variable from Chrome Local Storage to res parameter
    chrome.storage.sync.get({list : []}, function(data) {
    	// debug
    	console.log(data.list);
    	_CpuHungryProcesses = data.list;
	});
}

// Marks process parameter as cpu-hungry process
// Namely add the process to cpu-hungry processes list
function markAsCpuHungryProcess(process) {

	getCpuHungryProcessesFromStorage();

	// hungryProcessTitle stores the title of the cpu-hungry process
	hungryProcessTitle = process.tasks[0].title.split(": ")[1];

	// If cpu-hungry processes list (_CpuHungryProcesses) doesn't include the hungryProcessTitle
	if (!_CpuHungryProcesses.includes(hungryProcessTitle)) {

		// Push the hungryProcessTitle to cpu-hungry processes list
		_CpuHungryProcesses.push(hungryProcessTitle);
		setCpuHungryProcessesToStorage();

		// If show notification checkbox is checked in option page
		if (_Settings['_ShowNotification']) {

			// Notifies user about the cpu-hungry process
			notifyUser(process, true);
		}
	}
}

// Last one of the main listeners
// Triggered when any process is created
// When a process is created, it is controlled
// If that process is marked as malicious before, it is directly blocked
function handleOnCreatedProcess(process) {
	// debug
	console.log("A process created");

	if (_Settings['_runStatus']) {
		// Searches whether if the process is malicious or not
		searchBlackProcess(process);
	}
}

// Searches whether if the process is malicious or not
function searchBlackProcess(process) {

	// If the process is malicious process
	if (isBlackProcess(process)) {

		// Applies bad procedures to the malicious process (cpu-hungry process)
		applyProceduresToBadProcess(process);
	}
}

// Returns true if the process is black process or vice versa
function isBlackProcess(process) {

	getCpuHungryProcessesFromStorage();

	// processTitle stores the process parameter's title
	var processTitle = process.tasks[0].title;

	// Searches the process in cpu-hungry processes list
	for (var i = 0; i < _CpuHungryProcesses.length; i++) {

		// If the cpu-hungry processes list includes the process title, return true
	  	if (processTitle.includes(_CpuHungryProcesses[i])) return true;
	}

	// Process is not black, return false
	return false;
}

// The function acts according to user's choices in option part and applies the procedures to bad process
function applyProceduresToBadProcess(process) {

	// If show badge warning checkbox is checked and the add-on is running
	if(_Settings['_ShowBadgeWarning'] && _Settings['_runStatus']) {

		// Shows a 'X' if the current tab includes a cryptominer script/url/process
		if (process.tasks[0].tabId != undefined)
			updateBadge('X', process.tasks[0].tabId);
	}

	// If _BlockCpuHungryProcess is checked in options page
	if (_Settings['_BlockCpuHungryProcess']) {

		// Block process
		blockProcess(process);
	}

	// If _ShowNotification is checked in options page
	if (_Settings['_ShowNotification']) {

		// Notifies user
		notifyUser(process, true);
	}
}

// Blocks the process
function blockProcess(process) {
	chrome.processes.terminate(process.id, callbackForRuntimeErrors);
}

// The callback function is for dealing with runtime errors
function callbackForRuntimeErrors() {
	if (chrome.runtime.lastError) console.log(chrome.runtime.lastError.message);
}


// Inits main background listeners if stat variable is true (If MiNo is active)
function initListeners(stat) {

	// If _BlackUrls is empty return (Do nothing)
	if(_BlackUrls.length === 0) {
		return;
	}

	// ------------------------------------------------------------------------------------
	// # This part required because if the add-on starts and has these listeners,
	// # when you disable the add-on, the add-on will still has the listeners and it will continue to block
	// # It shouldn't continue to block, that's why the listeners must be deleted if they are present

	// If chrome.webRequest.onBeforeRequest has listener with same name deletes it
	if(chrome.webRequest.onBeforeRequest.hasListener(handleOnBeforeRequest)) {
		chrome.webRequest.onBeforeRequest.removeListener(handleOnBeforeRequest);
	}

	// If chrome.processes.onUpdated has listener with same name deletes it
	if(chrome.processes.onUpdated.hasListener(handleOnUpdatedProcess)) {
		chrome.processes.onUpdated.removeListener(handleOnUpdatedProcess);
	}

	// If chrome.processes.onUpdated has listener with same name deletes it
	if(chrome.processes.onUpdated.hasListener(handleOnUpdatedProcess2)) {
		chrome.processes.onUpdated.removeListener(handleOnUpdatedProcess2);
	}

	// If chrome.processes.onCreated has listener with same name deletes it
	if(chrome.processes.onCreated.hasListener(handleOnCreatedProcess)) {
		chrome.processes.onCreated.removeListener(handleOnCreatedProcess);
	}
	// # ------------------------------------------------------------------------------------

	// If stat is true (If MiNo is active)
	if(stat == true) {

		// Add event listener
		// Fires when a request is about to occur
		// This event is sent before any TCP connection is made and can be used to cancel or redirect requests
		// If browser faces with any black url/script, event will be triggered and handleOnBeforeRequest function will be called
		// handleOnBeforeRequest function called as a parameter and gives requested page/tab details to its parameter details
		// Namely on the background of Chrome the function will callback the details and we will handle it on handleOnBeforeRequest function
		chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequest, {urls: _BlackUrls}, ['blocking']);

		// Add event listener
		// When processes updated, the event is triggered and calls handleOnUpdatedProcess function
		// On the background of Chrome the function will callback the all processes and they will be handled on handleOnUpdatedProcess function
		chrome.processes.onUpdated.addListener(handleOnUpdatedProcess);

		// Add event listener
		// When processes updated, the event is triggered and calls handleOnUpdatedProcess2 function
		// On the background of Chrome the function will callback the all processes and they will be handled on handleOnUpdatedProcess2 function
		chrome.processes.onUpdated.addListener(handleOnUpdatedProcess2);

		// Add event listener
		// When a process created, the event is triggered and calls handleOnCreatedProcess function
		// On the background of Chrome the function will callback a process and the process will be handled on handleOnCreatedProcess function
		chrome.processes.onCreated.addListener(handleOnCreatedProcess);
	}
}

// Listens coming messages (For example messages which are popup JS file send, is catched here)
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

	// If coming message's action is '_Disable', changes {running status} of add-on to false 
    if(message.action == '_Disable') {
        change_Status(false);
    }

    // If coming message's action is '_Enable', changes {running status} of add-on to true
    else if(message.action == '_Enable') {
    	change_Status(true);

    // If coming message's action is '_OptionUpdated', restarts the add-on
    // Namely if options updated, restart everything
    } else if(message.action == '_OptionUpdated') {
    	_BlackUrls = [];
		initBackground();
    }
});

// Inits background
initBackground();