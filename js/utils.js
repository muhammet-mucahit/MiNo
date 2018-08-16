(function (window) {

    var utils = {

        // No operation function
        // Do nothing
        // It is used when callback required in some cases
        noop: function() {},

        // Sets default settings of the add-on
        getDefaultSettings: function() {
            
            // Default settings variable
            var dfSettings = {};

            // Sets default settings (true/false)
            dfSettings['_ShowBadgeWarning'] = true;
            dfSettings['_ShowNotification'] = true;
            dfSettings['_BlockCpuHungryProcess'] = true;
            dfSettings['_runStatus'] = true;
            dfSettings['_filters'] = true;

            return dfSettings;
        },

        // Gets all settings
        getSettings: function(callback) {
            var self = this;

            // Gets _Settings variable from Chrome Local Storage to res parameter
            chrome.storage.local.get('_Settings', function(res) {

                // If res parameter is empty (_Settings variable wasn't set before)
                if((Object.keys(res).length) === 0) {

                    // Stores default settings to res parameter (Calls getDefaultSettings function)
                    res = self.getDefaultSettings();

                    // Sets all settins with res parameter (Calls setSettings function)
                    self.setSettings(res);

                    // Sends back the res parameter
                    callback(res);
                } 

                // If res parameter is not empty (_Settings variable was set before)
                else {
                    // Sends back the pre-stored settings
                    callback(res._Settings);
                }
            });
        },

        // Sets all settings
        setSettings: function(settings, callback) {
            callback = (callback === undefined) ? this.noop : callback;

            // Stores _Settings variable in Chrome Local Storage
            chrome.storage.local.set({'_Settings' : settings}, callback);
        },

        // Sets only one option element
        setOption: function(option, value, callback) {
            var self = this;

            // Gets all settings
            // getSettings function will send back a value which will be stored in res parameter (callbacks)
            this.getSettings(function(res) {

                // The res parameter's option set to the value parameter (true/false)
                res[option] = value;

                // Sets all settings 
                self.setSettings(res, callback);
            });
        },

        // Gets one option's value from settings
        getOption: function(option, callback) {
            var self = this;

            // Gets all settings
            // getSettings function will send back a value which will be stored in res parameter (callbacks)
            this.getSettings(function(res) {

                // If res[option] wasn't defined before
                if(typeof(res[option]) === 'undefined') {

                    // Stores default settings to dfSettings variable (Gets default settings)
                    var dfSettings = self.getDefaultSettings();

                    // Stores option parameter's value as res[option]
                    res[option] = dfSettings[option];

                    // Sets the option which is specified as a parameter
                    self.setOption(option, dfSettings[option], function() {

                        // Sends back the value of the option parameter
                        callback(dfSettings[option]);
                    });
                } 

                // Sends back the value of the option parameter
                else {
                    callback(res[option]);
                }
            });
        },

        // Cleans unnecessary elements from filters
        // For example, a description about filters, it is unnecessary
        // That's why the function cleans it
        cleanArray: function(arr) {
            return arr.map(function(e) {
                return e.trim();
            }).filter(function(str) { 
                return /^[^#]\S/.test(str);
            });
        },

        // Gets domain from a url
        // For example: https://mining.freebitco.in/mining.html?userid=276838
        // It gets only the 'mining.freebitco.in' part.
        getDomain: function(url) {
            return (url.split('/')[2] || url.split('/')[0]).split(':')[0];
        }
    };

    window.utils = utils;

}(window));