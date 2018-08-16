var utils;

//  Gets options HTML file elements according to their class name
function getElements(className, callback) {
    Array.prototype.forEach.call(document.getElementsByClassName(className), callback);
}

// Inits the options page
function initOptionPage() {

    // Calls setAppDetails function (initial settings)
    setAppDetails();

    document.getElementById("_HighCpuLimit").value = localStorage._HighCpuLimit;

    utils = chrome.extension.getBackgroundPage().utils;

    // Default configuration for tab, first tab will be selected as default
    toggleTab(document.getElementsByClassName('tablinks')[0], 0);
    
    // Gets options HTML file 'tablinks' elements and add Click Listener them
    // call addTabClickListener function
    getElements('tablinks', addTabClickListener);

    // Gets elements whose class name is 'opt', from options HTML file
    getElements('opt', function(element) {

        // Get option value of element
        // The value parameter will come with callback from getOption function
        utils.getOption(element.id, function(value) {

            // Call updateOption function and updates the checkbox value
            updateOption(element, value);
        });

        // If element is a checkbox, then add an event listener to checkbox
        // The event will be fired, when the checkbox is checked
        if(element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {

            // When the event fired, toggleCheckBox function will be called
            element.addEventListener('click', toggleCheckBox);
        }
    });
}

// Event function
// When checkboxes situation is changed, this function is triggered
// Informs the background about changes on checkboxes
function toggleCheckBox(element) {
    var targetElement = element.target;

    // # This part is for gray/black text of checkboxes
    // ------------------------------------------------------------------------------------------------------------------------
    if (targetElement.id === '_filtersLabel') {
        document.getElementById("_filters").style.color = (targetElement.checked) ? 'black' : 'graytext';
    } else if (targetElement.id === '_ShowBadgeWarningLabel') {
        document.getElementById("_ShowBadgeWarning").style.color = (targetElement.checked) ? 'black' : 'graytext';
    } else if (targetElement.id === '_ShowNotification') {
        document.getElementById("_ShowNotificationLabel").style.color = (targetElement.checked) ? 'black' : 'graytext';
    } else if (targetElement.id === '_BlockCpuHungryProcess') {
        document.getElementById("_BlockCpuHungryProcessLabel").style.color = (targetElement.checked) ? 'black' : 'graytext';
        document.getElementById("_HighCpuLimit").disabled = !(targetElement.checked);
    }
    // ------------------------------------------------------------------------------------------------------------------------
    // #

    // Updates checkbox value and notify background about the changes
    utils.setOption(targetElement.id, targetElement.checked, function() {
        notifyBackground();
    });
}

// Updates checkboxes value (on / off)
function updateOption(element, value) {

    // If element is a checkbox, then configure its {checked} value
    if(element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {
        element.checked = value;
    }
}

// Adds tab click listener
function addTabClickListener(el ,index) {
    el.addEventListener('click', function () {

        // Call toggleTab function
        toggleTab(el, index);
    });
}

// The function says what will happen when a tab clicked
// Color configurations
function toggleTab(elm, elIndex) {
    elm.style.backgroundColor = '#fff';
    elm.style.borderBottom = '1px solid #fff';

    getElements('tablinks', function(el, index) {
        if(index === elIndex) {
            return;
        }
        el.style.backgroundColor = '#eee';
        el.style.borderBottom = '1px solid #ccc';
        toggleContainers(elIndex);
    });
}

// The function says what will happen when a tab clicked
// Block / None configurations
function toggleContainers(activeIndex) {
    getElements('tab-cnt', function(e, i) {
        if(i === activeIndex) {
            e.style.display = 'block';
        } else {
            e.style.display = 'none';
        }
    });
}


// Sets app details to options html file
// Collects add-on informations from manifest file and set them to this page
function setAppDetails() {

    // Gets app detais from manifest.json file
    var appDetails = chrome.runtime.getManifest();

    // Gets element which has id 'main-title' from options HTML file
    // Sets text of the element to name of add-on
    document.getElementById('main-title').innerText =  appDetails.name + " - Settings";

    // Gets element which has id 'title' from options HTML file
    // Sets text of the element to name of add-on
    document.getElementById('title').innerText =  appDetails.name + " Options";

    // Gets element which has id 'version' from options HTML file
    // Sets text of the element to version number of add-on
    document.getElementById('version').innerText = appDetails.name + ' v' + appDetails.version;
}


// If there is any change in options, the function notifies the background about it
function notifyBackground() {

    // Send message to background JS file
    // The message is sent with '_OptionUpdated' label (action)
    // The second parameter {callbackForRuntimeErrors function} is for runtime errors
    chrome.runtime.sendMessage({action: '_OptionUpdated'}, chrome.extension.getBackgroundPage().callbackForRuntimeErrors());
}

// If cpu rate limit is changed, informs the background
document.getElementById("_HighCpuLimit").onchange = function() {
    localStorage._HighCpuLimit = document.getElementById("_HighCpuLimit").value;
    notifyBackground()
}

// Inits the options page
initOptionPage();