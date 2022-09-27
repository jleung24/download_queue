let downloads_list; // bug: sometimes paused download is removed from list and never resumed
let current;

function initialize() {
    downloads_list = [];
    current = "";
}

chrome.downloads.onCreated.addListener((downloadItem) => {
    console.log(downloadItem);
    // filter out google drive downloads
    // initialize if needed and check download priorities
    if(typeof downloadItem.finalUrl !== 'undefined' && fromGoogleDrive(downloadItem) == false){
        if (typeof downloads_list === 'undefined') {
            initialize();
        }
        updateDownloads(downloadItem);
    }
})

chrome.downloads.onChanged.addListener((downloadItem) => {
    // make sure download is not new 
    // downloads from google drive have issue when pausing is involved so filter them out
    if (typeof downloads_list === 'undefined') {
        initialize();
    }
    const i = downloads_list.findIndex(item => item.id === downloadItem.id);
    if(i> -1 && fromGoogleDrive(downloads_list[i]) == false){
        // checking if download complete or interrupted
        if(typeof downloadItem.state !== 'undefined' && typeof downloads_list !== 'undefined'){
            // if complete, remove from list and find next download
            if(downloadItem.state.current == "complete"){
                downloads_list.splice(i, 1);
                nextDownloads();  
            }else{
                // if interrupted, remove from list
                // check to see if interrupted download was the current download
                if(downloadItem.state.current == "interrupted"){
                    downloads_list.splice(i, 1);
                    if(downloadItem.id == current.id){
                        nextDownloads();  
                    }else{
                        console.log('Total downloads: ', downloads_list.length ,'\n')
                    }
                }else{
                    // do not let users manually pause or resume downloads
                    if(typeof downloadItem.paused !== 'undefined' && typeof downloads_list !== 'undefined'){
                        if(downloadItem.paused.current == true && downloadItem.id == current.id){
                            chrome.downloads.resume(downloadItem.id);
                        }else{
                            if(downloadItem.paused.current == false && downloadItem.id != current.id){
                                chrome.downloads.pause(downloadItem.id);
                            }
                        }
                    }
                }
            }
        }else{
            // do not let users manually pause or resume downloads
            if(typeof downloadItem.paused !== 'undefined' && typeof downloads_list !== 'undefined'){
                if(downloadItem.paused.current == true && downloadItem.id == current.id){
                    chrome.downloads.resume(downloadItem.id);
                }else{
                    if(downloadItem.paused.current == false && downloadItem.id != current.id){
                        chrome.downloads.pause(downloadItem.id);
                    }
                }
            }
        }
    }
})

function updateDownloads(downloadItem){
    // add new download to download list
    downloads_list.push(downloadItem);
    if (typeof current === 'undefined' || current == "") {
        current = downloadItem;
    }
    // check for shortest job in download queue
    if(downloads_list.length > 1){
        chrome.downloads.pause(downloadItem.id);
        checkDownloads();
    }
}

async function checkDownloads(){
    // update download info and search for shortest download
    await updateListAll();
    if (typeof current !== 'undefined' && current != "") {
        await updateCurrent();
    }
    let current_low = current;
    for(const item of downloads_list){
        if(remainingBytes(item) < remainingBytes(current_low)){
            current_low = item;
        }
    }
    chrome.downloads.pause(current.id);
    chrome.downloads.resume(current_low.id);
    current = current_low;
}

function remainingBytes(downloadItem){
    return downloadItem.totalBytes - downloadItem.bytesReceived;
}

async function nextDownloads(){
    //update download info and choose next download if needed
    await updateListAll();
    if(downloads_list.length == 0){
        current = "";
    }
    if(downloads_list.length == 1){
        current = downloads_list[0];
        chrome.downloads.resume(current.id);
    }else if(downloads_list.length > 1){
        current = downloads_list[0];
        checkDownloads();
    }
}

async function updateListItem(id){
    // update download info given id
    // make sure download still exists
    let search = await chrome.downloads.search({id});
    if(typeof search[0] === 'undefined'){
        const i = downloads_list.findIndex(item => item.id === id);
        downloads_list.splice(i,1);
    }else{
        const i = downloads_list.findIndex(item => item.id === id);
        downloads_list[i] = search[0];
    }
}

function updateListAll(){
    // update all downloads in the list
    for(const item of downloads_list){
        updateListItem(item.id);
    }
    console.log('Total downloads in queue: ', downloads_list.length ,'\n');
}

async function updateCurrent(){
    // update info for the current download
    let id = current.id;
    let search = await chrome.downloads.search({id});
    current = search[0];

}

function fromGoogleDrive(downloadItem){
    // check if download is from google drive
    if((downloadItem.finalUrl).includes("googleusercontent")){
        return true;
    }else{
        return false;
    }
}