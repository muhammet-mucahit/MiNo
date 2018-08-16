var _History = [],			// Stores history
	historyItemIds = [],	// Stores history items' id
	table = '';				// Stores the table which hold whole history

// Gets all history from Chrome Local Storage
chrome.storage.local.get(null, function(history) {

    // Travels through all history and add them to history array
    for (var itemId in history) {
        if (history.hasOwnProperty(itemId) && itemId.startsWith('block_')) {
            _History.push(history[itemId]);
            historyItemIds.push(itemId);

            // Constructs datas of table and store it in the table variable
            table += constructTableData(history[itemId]);
        }
    }

    // If there is any history, gets history element from history HTML file and writes to its text
    if (_History.length > 0) document.getElementsByClassName('_History')[0].innerHTML = constructTable(table);
});

// Constructs datas of table (history table to history HTML file)
function constructTableData(itemObject) {

	// If coming object is process go to first situation otherwise use the second
	request_url = (itemObject.request.url === undefined) ? itemObject.request.tasks[0].title.split(": ")[1] : itemObject.request.url;
    
	// Returns HTML table datas with some properties
    return `
	<tr>
	    <td>${new Date(itemObject.date).toLocaleString()}</td>
	    <td>${itemObject.page.title}</td>
	    <td><a href="${itemObject.page.url}">${itemObject.page.url}</a></td>
	    <td>${request_url}</td>
	</tr>
	`;
}

// Constructs HTML table base with all tableData
function constructTable(tableData) {
    return `
    <table>
	    <thead>
	        <th>Date and Time</th>
	        <th>Page Title</th>
	        <th>Page URL</th>
	        <th>Bad Script / Process</th>
	    </thead>
	    <tbody>${tableData}</tbody>
	</table>
	`;
}

// Adds click event listener to {clear-history} button
document.getElementsByClassName('_ClearHistory')[0].addEventListener('click', function (event) {

	// If the button is clicked, confirm one more time for guarantee
	// If user give up (namely if user select cancel to delete history) the transaction will be cancelled
	// Then function will return, will do nothing more
    if (!confirm("Are you sure you want to delete the Blocked History?")) return;

    // Removes history from Chrome Local Storage
    chrome.storage.local.remove(historyItemIds, function () {

    	// Reloads the history
        location.reload();
    });
});