console.log("HN labeler extension is working")
// if you ever read this source: this is my first javascript project, please don't cry

const hn_label_classnames = {'1': "labeled-like", '0': "unlabeled", '-1': "labeled-dislike"}

function getData() {
    return new Promise((resolve, reject) => {
    chrome.storage.local.get('hnItems', (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.hnItems || {});
      }
    });
  });
}

function setData(data) {
    return new Promise((resolve, reject) => {
    chrome.storage.local.set({hnItems: data}, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });  
}

function label(hnItems, story_element, label) {
    let itemId = story_element.getAttribute('id');
    console.log("Labeling " + itemId + " as " + label)
    if (label == 0) {
        if (hnItems.hasOwnProperty(itemId)) { delete hnItems[itemId] }
    } else {
        hnItems[itemId] = label;
    }
    showLabel(story_element, label);
    setData(hnItems);
}

function showLabel(story_element, label) {
    story_element.className = "athing " + hn_label_classnames[label] // remove all other classes except for 'athing'
}

window.addEventListener("load", async function() {    
    // Load hn-items.json into local storage
    let hnItems = await getData() || {};
    console.log(Object.keys(hnItems).length + " items and labels loaded from storage")
    
    // Add extra labelling menu
    let page_space = document.getElementById("pagespace");
    let hn_menu_tr = page_space.parentElement
    
    var label_menu = document.createElement("tr")
    label_menu.class = "pagetop"
    let label_menu_text = document.createTextNode("Label menu")
    label_menu.append(label_menu_text)
    hn_menu_tr.insertBefore(label_menu, page_space)
    
    // Add special button(s) to HN menu
    // var hn_menu = document.getElementsByClassName("pagetop")[0];
    // dislike all button
    let dislike_button = document.createElement("span")
    dislike_button.addEventListener("click", function() {
        console.log("Labeling all unlabeled stories on this page as 'dislike!'");
        let stories = document.getElementsByClassName("athing");
        for (let story of stories) {
            itemId = story.getAttribute("id");
            //if (hnItems[itemId] == 0) {
            if (!hnItems.hasOwnProperty(itemId)) {
                label(hnItems, story, -1);
            }
        }
        setData(hnItems);
    })
    let button_text = document.createTextNode("dislike all unlabeled");
    let separator_text = document.createTextNode(" | ");
    dislike_button.appendChild(button_text)
    label_menu.appendChild(separator_text);
    label_menu.appendChild(dislike_button);

    // unlabel all button
    let reset_button = document.createElement("span")
    reset_button.addEventListener("click", function() {
        console.log("Resetting all labels of items on this page");
        let stories = document.getElementsByClassName("athing");
        for (let story of stories) {
            label(hnItems, story, 0);
        }
        setData(hnItems);
    })
    let rbutton_text = document.createTextNode("reset page");
    let separator_text_2 = document.createTextNode(" | ");
    reset_button.appendChild(rbutton_text)
    label_menu.appendChild(separator_text_2);
    label_menu.appendChild(reset_button);

    // export button
    let export_button = document.createElement("span")
    export_button.addEventListener("click", function() {
        console.log(hnItems);
    })
    let export_button_text = document.createTextNode("export");
    let separator_text_3 = document.createTextNode(" | ");
    export_button.appendChild(export_button_text)
    label_menu.appendChild(separator_text_3);
    label_menu.appendChild(export_button);
    
    // nuke button to delete all data
    let nuke_button = document.createElement("span")
    nuke_button.addEventListener("click", function() {
        let alert_text = "Clicking 'reset all' will delete all your data.";
        if (confirm(alert_text) == true) {
            hnItems = {};
            setData(hnItems);
        }
    })
    let nuke_button_text = document.createTextNode("reset all");
    let separator_text_4 = document.createTextNode(" | ");
    nuke_button.appendChild(nuke_button_text)
    label_menu.appendChild(separator_text_4);
    label_menu.appendChild(nuke_button);


    // Get every hn item on the page
    var stories = document.getElementsByClassName("athing");

    for (let story of stories) {
        let itemId = story.getAttribute('id');
        
        if (hnItems.hasOwnProperty(itemId)) {
            showLabel(story, hnItems[itemId]);
        }

        // Create a new td element for the labeling buttons
        let td = document.createElement("td");
        td.className = "label-buttons";

        // Create SVG images for each label and add event listeners
        let thumbsUpSvg = document.createElement("img");
        thumbsUpSvg.className = "label-button"
        thumbsUpSvg.src = chrome.runtime.getURL("assets/thumbs_up.svg");
        thumbsUpSvg.addEventListener("click", function() {
            label(hnItems, story, 1);
        });

        let neutralSvg = document.createElement("img");
        neutralSvg.className = "label-button"
        neutralSvg.src = chrome.runtime.getURL("assets/neutral.svg");
        neutralSvg.addEventListener("click", function() {
            label(hnItems, story, 0);
        });

        let thumbsDownSvg = document.createElement("img");
        thumbsDownSvg.className = "label-button"
        thumbsDownSvg.src = chrome.runtime.getURL("assets/thumbs_down.svg");
        thumbsDownSvg.addEventListener("click", function() {
            label(hnItems, story, -1);
        });

        // Add SVG images to the td element
        td.appendChild(thumbsUpSvg);
        td.appendChild(thumbsDownSvg);
        td.appendChild(neutralSvg);

        // Insert the new td element into the story element at the first position
        story.insertBefore(td, story.firstChild);
        
        // Insert blank td in next row as well
        let td_blank = document.createElement("td");
        let next_row = story.nextSibling
        next_row.insertBefore(td_blank, next_row.firstChild);
    }

    // Save any changes back to hn-items.json
    setData(hnItems);
});
