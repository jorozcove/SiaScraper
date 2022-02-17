// fetch the items stored in entension localStorage and load into the popup
function fetchItems(){

    var version = "v1.0.0"
    document.getElementById("title").innerText = "SIA SCRAPER "+version

    const itemsList = document.querySelector("div#todo-container")
    itemsList.innerHTML = ""
    var newInnerHtml = " "

    try{
        var itemsStorage = localStorage.getItem("todo-items")
        var itemsArr = JSON.parse(itemsStorage)
        var itemStatus;

        if(itemsArr.length == 0){
            itemsList.innerHTML = `<div class="d-flex justify-content-center">
                                <div>Agrega asignaturas desde el catalogo</div>
                                <br></br>
                            </div>`
        }
        else{

            var currDate = new Date()
            var courseDate
            var dateCondition = false

            for(var i = 0; i<itemsArr.length; i++){

                currDate = new Date()
                courseDate = new Date(itemsArr[i].fechaObtencion)
                currDate.setDate(currDate.getDate() - 1)
                dateCondition = currDate > courseDate

                itemStatus = itemsArr[i].status ? "checked" : ""
                newInnerHtml += `
                <div class="col col-12 p-2 todo-item" todo-id="${i}">
                    <div class="input-group">
                        <div class="input-group-text">
                            <input class = "itemCheck" type="checkbox" ${itemStatus}>
                        </div>
                        
                        <input type="text" readonly class="form-control" aria-label="Text input with checkbox" ${dateCondition && 'style = "border-color: #e90000 !important; color: #e90000;"'}
                        value="${itemsArr[i].nombreAsignatura}" data-bs-toggle="tooltip" data-bs-placement="top" title="${dateCondition ? "Asignatura desactualizada " : ""}[${itemsArr[i].fechaObtencion}]">
                        <div class="input-group-append">

                        <button todo-id="${i}" class="itemDownload btn btn-outline-secondary bg-info text-white" type="button"
                             id="button-addon1 "><i class="fa fa-download"></i>
                        </button>

                        <button todo-id="${i}" class="itemDelete btn btn-outline-secondary bg-danger text-white" type="button"
                            id="button-addon2 ">X
                        </button>
                        </div>
                    </div>
                </div>
                `
            }

            itemsList.innerHTML = newInnerHtml;
        
            var iList = document.querySelector("div#todo-container").children
    
            //add specific functionality for each item
            for(var i = 0; i<iList.length; i++){
                // save everytime checked something
                iList[i].querySelector(".itemCheck").addEventListener("click", (function(i){
                    return function(){
                        changeCheckValue(i)
                    }
                })(i))
    
                // add download function
                iList[i].querySelector(".itemDownload").addEventListener("click", (function(i){
                    return function(){
                        itemDownload(i)
                    }
                })(i))
    
                // add delete function
                iList[i].querySelector(".itemDelete").addEventListener("click", (function(i){
                    return function(){
                        itemDelete(i)
                    }
                })(i))
            }
        }
        
        
    }catch(e){
        console.error(e)
    }
    

}

//save the given object to the storage
function saveItems(obj){
    var string = JSON.stringify(obj)
    localStorage.setItem("todo-items", string)
}

//change the check value and save the new one by index
function changeCheckValue(index){
    var itemsStorage = localStorage.getItem("todo-items")
    var itemsArr = JSON.parse(itemsStorage)
    itemsArr[index].status = !itemsArr[index].status
    saveItems(itemsArr)
}

//delete the item from the popup and the stoage by index
function itemDelete(index){
    var itemsStorage = localStorage.getItem("todo-items")
    var itemsArr = JSON.parse(itemsStorage)

    itemsArr.splice(index, 1)
    saveItems(itemsArr)

    document.querySelector('div#todo-container .todo-item[todo-id="'+index+'"]').remove()

    const itemsList = document.querySelector("div#todo-container")
    if(itemsArr.length == 0){
        itemsList.innerHTML = `<div class="d-flex justify-content-center">
                            <div>Agrega asignaturas desde el catalogo</div>
                            <br></br>
                        </div>`
    }

}

//donwload the item from the stoage by index
function itemDownload(index){
    var itemsStorage = localStorage.getItem("todo-items")
    var itemsArr = JSON.parse(itemsStorage)
    downloadJSON(itemsArr[index],itemsArr[index].nombreAsignatura)
}

//download a JSON object
function downloadJSON(obj,name){
    obj = JSON.stringify(obj,null,4);
    var vLink = document.createElement('a'),
    vBlob = new Blob([obj], {type: "octet/stream"}),
    vName = name+".json",
    vUrl = window.URL.createObjectURL(vBlob);
    vLink.setAttribute('href', vUrl);
    vLink.setAttribute('download', vName );
    vLink.click();
}

//get all the checkef items 
function getChkItems(){
    var itemsStorage = localStorage.getItem("todo-items")
    var itemsArr = JSON.parse(itemsStorage)
    var checkedItems = []
    for(var item of itemsArr){
        if(item.status){
            checkedItems.push(item)
        }
    }
    return checkedItems
}

function main(){

    //set empty list in local storage if it don't exist
    if(localStorage.getItem('todo-items')==undefined) localStorage.setItem('todo-items','[]')

    //add listener to send actual local storage to content.js to perform load operation
    document.querySelector("#btn1").addEventListener('click', function(){
        var data = localStorage.getItem("todo-items")
        chrome.tabs.query({currentWindow: true, active: true},
        function(tabs){
            chrome.tabs.sendMessage(tabs[0].id,{
                "operation":"LOAD",
                "data": data
            })
        })

    }, false)

    //send save operation msg to content.js
    document.querySelector("#btn2").addEventListener('click', function(){
        chrome.tabs.query({currentWindow: true, active: true},
            function(tabs){
                chrome.tabs.sendMessage(tabs[0].id,{
                    "operation":"SAVE",
                    "data": ""
                })
            })
    }, false)

    // add listener to get course data from content.js
    chrome.runtime.onMessage.addListener(function (request){
        var itemsStorage = localStorage.getItem("todo-items")
        var itemsArr = JSON.parse(itemsStorage)
        request.status = false
        console.log(request)
        itemsArr.push(request)
        saveItems(itemsArr)
        fetchItems()
    })

    // set functionality for download all button
    const dwnAllBtn = document.querySelector('#downloadAllBtn')
    dwnAllBtn.addEventListener("click", function(){
        var checkedItems = getChkItems()
        if(checkedItems.length>0){
            downloadJSON(checkedItems,"Asignaturas")
        }  
    })

    //fetch the items when the popup is opened
    fetchItems()
}

main()