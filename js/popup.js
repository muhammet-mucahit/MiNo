// The DOMContentLoaded event is fired when the initial HTML document has been completely loaded and parsed
document.addEventListener('DOMContentLoaded', function () {

    // When the popup HTML has been completely loaded, 
    // initPopupPage function will be called and the popup JS file will be started
    initPopupPage();
});

// To store utils JS file from background
var utils;

// Initializes the popup page
function initPopupPage() {
    // It stores utils JS file to utils variable
    // Namely we can use utils JS file's functions in this page with utils variable
    utils = chrome.extension.getBackgroundPage().utils;

    // Calls setAppDetails function (initial settings)
    setAppDetails();

    // Calls initPopupStatus function (initial configurations)
    initPopupStatus();

    // Gets element which has id 'enableButton' from popup HTML file
    // Add an event listener to the button (click event)
    // When the button clicked, -->
    document.getElementById('enableButton').addEventListener('click', function (e) {

        // Sends message to background JS file
        // The message is sent with '_Enable' label (action)
        chrome.runtime.sendMessage({action: '_Enable'}, utils.noop);

        // Updates icon to 'on' status
        chrome.extension.getBackgroundPage().updateIcon(true);

        // Reloads all tabs
        chrome.tabs.reload();

        // Closes the popup window
        window.close();
    });

    // Gets element which has id 'disableButton' from popup HTML file
    // Add an event listener to the button (click event)
    // When the button clicked, -->
    document.getElementById('disableButton').addEventListener('click', function (e) {

        // Sends message to background JS file
        // The message is sent with '_Disable' label (action)
        chrome.runtime.sendMessage({action: '_Disable'}, utils.noop);

        // Updates icon to 'off' status
        chrome.extension.getBackgroundPage().updateIcon(false);

        // Reloads all tabs
        chrome.tabs.reload();

        // Closes the popup window
        window.close();
    });

    // Gets element which has id 'settingsButton' from popup HTML file
    // Add an event listener to the button (click event)
    document.getElementById('settingsButton').addEventListener('click', function (e) {

        // Opens options page of add-on  
        chrome.runtime.openOptionsPage();

        // Closes the popup window
        window.close();
    });

    // Gets element which has id 'historyButton' from popup HTML file
    // Add an event listener to the button (click event)
    document.getElementById('historyButton').addEventListener('click', function (e) {

        // Opens history of add-on  
        window.open('../history.html');

        // Closes the popup window
        window.close();
    });
}

// Inits popup status according to current active tab on browser
function initPopupStatus() {
    
    // Gets active tabs from current window of Google Chrome to function parameter 'tabs'
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        
        // If tabs parameter is empty the function will return, namely will do nothing
        if(!tabs) {
            return;
        }
        
        // If tabs parameter is okay, gets the current tab from tabs parameter
        // The active tab is which user is looking at now
        // tabs[0] equals to the current tab
        var currentTab = tabs[0];
        
        // Calls initButtonStatus function with current tab's id
        initButtonStatus(currentTab.id);
    });
}

// Inits button status (Enable/Disable)
function initButtonStatus(tabId) {

    // Gets _runStatus option to value parameter of function 
    // (_runStatus option shows whether the add-on is enabled or not)
    // getOption function will send the value parameter's value with callback
    // If the add-on is enabled, value will be true or vice versa
    utils.getOption('_runStatus', function(value) {

        // Calls setButtonStatus function with value parameter
        setButtonStatus(value);

        // Updates icon according to the value parameter (on / off)
        chrome.extension.getBackgroundPage().updateIcon(value);
    });
}

// Sets app details to popup html file
// Collects add-on informations from manifest file and set them to this page
function setAppDetails() {

    // Gets app detais from manifest.json file
    var appDetails = chrome.runtime.getManifest();

    // Gets element which has id 'main-title' from popup HTML file
    // Sets text of the element to name of add-on
    document.getElementById('main-title').innerText =  appDetails.name;

    // Gets element which has id 'title' from popup HTML file
    // Sets text of the element to name of add-on
    document.getElementById('title').innerText = appDetails.name;

    // Gets element which has id 'version' from popup HTML file
    // Sets text of the element to version number of add-on
    document.getElementById('version').innerText = "Version " + appDetails.version;
}

// Sets button status according to 'status' parameter
// Says which button will be shown in what time
// If the parameter status is true (Add-on is active) disable button is active or vice versa
function setButtonStatus(status) {

    // Gets element which has id 'disableButton' from popup HTML file
    // Changes display style according to status parameter
    // Namely if add-on is running (status = true), disable button appears on the popup page or vice versa
    // See popup HTML file
    document.getElementById('disableButton').style.display = (status === true) ? '' : 'none';
    
    // Gets element which has id 'enableButton' from popup HTML file
    // Changes display style according to status parameter
    // Namely if add-on is running (status = false), enable button appears on the popup page or vice versa
    // See popup HTML file
    document.getElementById('enableButton').style.display = (status === true) ? 'none' : '';
}