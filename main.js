// ==UserScript==
// @name         Post Subscriber
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Get notified when there are new comments in a post.
// @author       aki108
// @match        https://www.pillowfort.social/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pillowfort.social
// @updateURL    https://raw.githubusercontent.com/Aki-108/pf-post-subscriber/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Aki-108/pf-post-subscriber/main/main.js
// @supportURL   https://www.pillowfort.social/posts/2878877
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* Initialize */
    var loadingIndicator = document.getElementById("home_loading") || document.getElementById("comments_loading");
    var commentContainer = document.getElementsByClassName("comments-container")[0];
    var styleObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutationRecord) {
            if (loadingIndicator.style.display == "none") {//for home-feed and blogs
                initGeneral();
            }
            if (commentContainer) {//for single posts
                initComments();
            }
        });
    });
    if (loadingIndicator) {
        styleObserver.observe(loadingIndicator, {
            attributes: true,
            attributeFilter: ["style"]
        });
    }
    if (commentContainer) {
        styleObserver.observe(commentContainer, {
            childList: true
        });
    }

    var postID = "";
    var subscribed = false;
    var subscriptionList = [];
    var postData = [];
    var commentCount = 0;
    var postUser = "";
    var postTitle = "";
    var postDate = "";
    var openTime = new Date().getTime();
    var updateIndex = 0;

    var icon = document.createElement("div");
    icon.innerHTML = "<svg style='filter:var(--iconColor);overflow:visible;' class='sidebar-img' viewBox='0 0 14 14' style='overflow:visible;'><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M5.5 13.5h-3q-2 0 -2 -2v-8.5q0 -2 2 -2h8.5q2 0 2 2v5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 4h7.5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 7h4.5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 10h4'></path><g xmlns='http://www.w3.org/2000/svg' transform='scale(0.5),translate(10,10)'><path xmlns='http://www.w3.org/2000/svg' d='M19.653 33.124h-2.817c-.289 0-.578-.02-.867-.04a.436.436 0 01-.307-.561c.177-.319.359-.635.544-.949.274-.466.559-.926.828-1.4.349-.609.7-1.217 1.022-1.839a2.149 2.149 0 00.185-.661 9.817 9.817 0 00.068-1.471c0-.871.011-1.743.02-2.614a6.175 6.175 0 01.5-2.445 6.93 6.93 0 01.986-1.622 6.661 6.661 0 013.694-2.288c.089-.022.127-.053.123-.151a2.576 2.576 0 01.081-.835 1.2 1.2 0 01.982-.915 1.319 1.319 0 011.068.219 1.282 1.282 0 01.514.863c.032.23.033.464.044.7 0 .059.012.087.082.1a7.247 7.247 0 011.569.574 6.471 6.471 0 011.342.888 7.087 7.087 0 011.473 1.787 5.493 5.493 0 01.564 1.28 7.837 7.837 0 01.226 1.125c.05.431.052.868.067 1.3.013.374.015.747.022 1.121l.021 1.216c.006.29.007.579.022.869a3.2 3.2 0 00.073.669 3.043 3.043 0 00.281.634c.2.375.42.742.636 1.11.288.491.583.977.871 1.468q.363.62.716 1.246a.4.4 0 01-.159.507.549.549 0 01-.358.084q-3.194.015-6.388.022c-.165 0-.159 0-.179.171a2.233 2.233 0 01-.607 1.324 2.071 2.071 0 01-1.319.672 2.211 2.211 0 01-1.678-.454 2.243 2.243 0 01-.822-1.365 1.308 1.308 0 01-.023-.217c0-.092-.03-.134-.134-.134-.99.013-1.978.012-2.966.012z' transform='translate(-15.024 -14.708)' style='fill:none;stroke:#58b6dd;stroke-width:1.6px'></path></g></svg>";
    //var iconUnsub = "<svg width='20px' height='23px' viewBox='0 0 20 20'><path xmlns='http://www.w3.org/2000/svg' d='M19.653 33.124h-2.817c-.289 0-.578-.02-.867-.04a.436.436 0 01-.307-.561c.177-.319.359-.635.544-.949.274-.466.559-.926.828-1.4.349-.609.7-1.217 1.022-1.839a2.149 2.149 0 00.185-.661 9.817 9.817 0 00.068-1.471c0-.871.011-1.743.02-2.614a6.175 6.175 0 01.5-2.445 6.93 6.93 0 01.986-1.622 6.661 6.661 0 013.694-2.288c.089-.022.127-.053.123-.151a2.576 2.576 0 01.081-.835 1.2 1.2 0 01.982-.915 1.319 1.319 0 011.068.219 1.282 1.282 0 01.514.863c.032.23.033.464.044.7 0 .059.012.087.082.1a7.247 7.247 0 011.569.574 6.471 6.471 0 011.342.888 7.087 7.087 0 011.473 1.787 5.493 5.493 0 01.564 1.28 7.837 7.837 0 01.226 1.125c.05.431.052.868.067 1.3.013.374.015.747.022 1.121l.021 1.216c.006.29.007.579.022.869a3.2 3.2 0 00.073.669 3.043 3.043 0 00.281.634c.2.375.42.742.636 1.11.288.491.583.977.871 1.468q.363.62.716 1.246a.4.4 0 01-.159.507.549.549 0 01-.358.084q-3.194.015-6.388.022c-.165 0-.159 0-.179.171a2.233 2.233 0 01-.607 1.324 2.071 2.071 0 01-1.319.672 2.211 2.211 0 01-1.678-.454 2.243 2.243 0 01-.822-1.365 1.308 1.308 0 01-.023-.217c0-.092-.03-.134-.134-.134-.99.013-1.978.012-2.966.012z' transform='translate(-15.024 -14.708)' style='fill:none;stroke:#58b6dd;stroke-width:1.7px'/><path stroke='#58b6dd' stroke-width='2px' d='M1 5.5l15 15'/><path stroke='white' stroke-width='1.5px' d='M0 2l20 20'/></svg>";
    var iconUnsub = "<svg style='filter:var(--iconColor);' width='20px' height='23px' viewBox='0 0 20 20'><path xmlns='http://www.w3.org/2000/svg' transform='translate(-15.024 -14.708)' style='fill:none;stroke:#58b6dd;stroke-width:1.7px' d='M19.653 33.124h-2.817c-.289 0-.578-.02-.867-.04a.436.436 0 01-.307-.561c.177-.319.359-.635.544-.949.274-.466.559-.926.828-1.4.349-.609.7-1.217 1.022-1.839a2.149 2.149 0 00.185-.661 9.817 9.817 0 00.068-1.471c0-.871.011-1.743.02-2.614a6.175 6.175 0 01.5-2.445 6.93 6.93 0 01.986-1.622 6.661 6.661 0 013.694-2.288c.089-.022.127-.053.123-.151a2.576 2.576 0 01.081-.835 1.2 1.2 0 01.982-.915 1.319 1.319 0 011.068.219 1.282 1.282 0 01.514.863c.032.23.033.464.044.7 0 .059.012.087.082.1a7.247 7.247 0 011.569.574 6.471 6.471 0 011.342.888 7.087 7.087 0 011.473 1.787 5.493 5.493 0 01.564 1.28 7.837 7.837 0 01.226 1.125c.05.431.052.868.067 1.3.013.374.015.747.022 1.121l.021 1.216c.006.29.007.579.022.869a3.2 3.2 0 00.073.669 3.043 3.043 0 00.281.634c.2.375.42.742.636 1.11.288.491.583.977.871 1.468q.363.62.716 1.246a.4.4 0 01-.159.507.549.549 0 01-.358.084q-3.194.015-6.388.022c-.165 0-.159 0-.179.171a2.233 2.233 0 01-.607 1.324 2.071 2.071 0 01-1.319.672 2.211 2.211 0 01-1.678-.454 2.243 2.243 0 01-.822-1.365 1.308 1.308 0 01-.023-.217c0-.092-.03-.134-.134-.134-.99.013-1.978.012-2.966.012z'/><path stroke='#58b6dd' stroke-width='2px' d='M3 3l14 17'/></svg>";

    //run once when the post is loaded
    function initGeneral() {
        //only run once
        if (document.getElementsByClassName("postSubscriberIcon").length > 0) return;

        //add button to collapsed sidebar
        let sidebarSmall = document.getElementsByClassName("sidebar-collapsed")[1];
        let subscriptionSmall = document.createElement("a");
        subscriptionSmall.classList.add("postSubscriberIcon", "sidebar-icon");
        subscriptionSmall.title = "Subscriptions";
        subscriptionSmall.style.cursor = "pointer";
        subscriptionSmall.appendChild(icon.cloneNode(true));
        subscriptionSmall.children[0].style.height = "40px";
        let notificationBubble = document.createElement("div");
        notificationBubble.setAttribute("style", "background:#F377B3;width:8px;height:8px;border-radius:10px;position:relative;top:-10px;right:-35px;display:none;");
        notificationBubble.id = "postSubscriberNotificationBubble";
        subscriptionSmall.children[0].appendChild(notificationBubble);
        subscriptionSmall.addEventListener("click", showPopup);
        sidebarSmall.appendChild(subscriptionSmall);

        //add button to expanded sidebar
        let sidebarBig = document.getElementsByClassName("sidebar-expanded")[1];
        sidebarBig.children[8].firstChild.style.paddingBottom = "0";
        let subscriptionBigWrapper = document.createElement("a");
        subscriptionBigWrapper.addEventListener("click", showPopup);
        subscriptionBigWrapper.style.cursor = "pointer";
        let subscriptionBig = document.createElement("div");
        subscriptionBig.classList.add("postSubscriberIcon", "sidebar-topic");
        subscriptionBig.appendChild(icon.cloneNode(true).children[0]);
        subscriptionBig.innerHTML += "Subscriptions";
        let counter = document.createElement("div");
        counter.classList.add("sidebar-num");
        counter.style.paddingTop = "7px";
        counter.id = "postSubscriberNotificationCounter";
        counter.innerHTML = "0";
        subscriptionBig.appendChild(counter);
        subscriptionBigWrapper.appendChild(subscriptionBig);
        sidebarBig.appendChild(subscriptionBigWrapper);

        getData();
        if (document.URL.search("/posts/") == 29) {
            //check if this post is subscribed
            postID = document.URL.substring(36);
            if (postID.indexOf("/") >= 0) postID = postID.substring(0, postID.indexOf("/"));
            if (postID.indexOf("?") >= 0) postID = postID.substring(0, postID.indexOf("?"));
            subscribed = false;
            subscriptionList.forEach(function(item) {
                if (item[0] == postID) subscribed = true;
            });

            //add button to post navigation
            let postNav = document.getElementsByClassName("post-nav")[0];
            let subscriptionNav = document.createElement("span");
            subscriptionNav.id = "postSubscriberToggle";
            subscriptionNav.title = subscribed ? "unsubscribe" : "subscribe";
            subscriptionNav.classList.add("nav-tab");
            subscriptionNav.style.cursor = "pointer";
            subscriptionNav.appendChild(icon.cloneNode(true));
            subscriptionNav.firstChild.firstChild.style.width = "22px";
            subscriptionNav.addEventListener("click", toggleSubscription);
            postNav.appendChild(subscriptionNav);
            if (subscribed) {
                document.getElementById("postSubscriberToggle").firstChild.classList.add("svg-pink-light");
                document.getElementById("postSubscriberToggle").firstChild.firstChild.lastChild.firstChild.style.fill = "rgb(88, 182, 221)";
            }

            //get posts information in preparation for a new subscription
            $.getJSON("https://www.pillowfort.social/posts/"+postID+"/json", function(data) {
                commentCount = data.comments_count;
                postUser = data.username || "ERROR";
                postTitle = data.title || "";
                postDate = data.timestamp || "ERROR";
            });
        }

        //update one post from the subscription list every two minutes, starting at a random position
        updateIndex = Math.floor(Math.random()*subscriptionList.length);
        checkPost(subscriptionList[updateIndex][0]);
        window.setInterval(function() {
            updateIndex++;
            if (updateIndex >= subscriptionList.length) updateIndex = 0;
            if (postID == subscriptionList[updateIndex][0]) updateIndex++;
            if (updateIndex >= subscriptionList.length) updateIndex = 0;
            checkPost(subscriptionList[updateIndex][0]);
        }, 120000);
    }

    //run everytime the comment section is loaded
    function initComments() {
        if (subscribed) {
            highlightComments();

            //remeber when the comments were viewed to detect new ones accordingly
            //source: https://stackoverflow.com/a/14746878
            window.addEventListener("beforeunload", function(evt) {
                evt.returnValue = '';
                getData();
                subscriptionList.forEach(function(item, index) {
                    if (item[0] == postID) {
                        subscriptionList[index] = [postID, commentCount, commentCount, openTime];
                    }
                });
                setData();
            });
        }
    }

    //(un-)subscribe to a post
    function toggleSubscription() {
        if (subscribed) {
            unsubscribe(postID);
            //change state of the button in the post navigation
            document.getElementById("postSubscriberToggle").firstChild.classList.remove("svg-pink-light");
            document.getElementById("postSubscriberToggle").firstChild.firstChild.lastChild.firstChild.style.fill = "none";
            document.getElementById("postSubscriberToggle").title = "subscribe";
        } else {
            //save post data locally
            getData();
            let commentData = [postID, commentCount, commentCount, openTime];
            subscriptionList.push(commentData);
            //remove , and ; from the data so it can't mess with the array formating
            postUser = postUser.replaceAll(",",".").replaceAll(";",":");
            postTitle = postTitle.replaceAll(",",".").replaceAll(";",":");
            postDate = postDate.replaceAll(",",".").replaceAll(";",":");
            let newPostData = [postID, postUser + ": " + postTitle + " (" + postDate + ")"];
            let list = [];
            postData.push(newPostData);
            postData.forEach(function(value) {
                list.push(value.toString().replaceAll(",",";"));
            });
            list = list.toString();
            localStorage.setItem("postsubscriptiondata", list);
            //change state of the button in the post navigation
            document.getElementById("postSubscriberToggle").firstChild.classList.add("svg-pink-light");
            document.getElementById("postSubscriberToggle").firstChild.firstChild.lastChild.firstChild.style.fill = "rgb(88, 182, 221)";
            document.getElementById("postSubscriberToggle").title = "unsubscribe";
            setData();
        }
        subscribed = !subscribed;
    }

    //load data from localstorage and make it an array
    function getData() {
        subscriptionList = [];
        if (localStorage.getItem("postsubscriptions")) {
            let list = localStorage.getItem("postsubscriptions").split(",");
            list.forEach(function(value){
                subscriptionList.push(value.split(";"));
            });
        }
        postData = [];
        if (localStorage.getItem("postsubscriptiondata")) {
            let list = localStorage.getItem("postsubscriptiondata").split(",");
            list.forEach(function(value){
                postData.push(value.split(";"));
            });
        }
    }

    //make data a string and store it locally
    function setData() {
        let list = [];
        subscriptionList.forEach(function(value) {
            list.push(value.toString().replaceAll(",",";"));
        });
        list = list.toString();
        localStorage.setItem("postsubscriptions", list);
    }

    //add the "new" marking to comments
    function highlightComments() {
        let pivotTime = 0;
        subscriptionList.forEach(function(data) {
            if (data[0] == postID) pivotTime = data[3];
        });
        let comments = document.getElementsByClassName("comment");
        for (let a = 0; a < comments.length; a++) {
            if (comments[a].classList.contains("postSubscriberProcessed")) continue;
            comments[a].classList.add("postSubscriberProcessed");
            let timeString = comments[a].getElementsByClassName("header")[0].children[1].children[1].title;
            let time = new Date(timeString.replace("@", "")).getTime();
            if (time > pivotTime) {
                let newIcon = document.createElement("div");
                newIcon.innerHTML = "new";
                newIcon.setAttribute("style", "height:0;margin:-25px -53px;color:#ff7fc5;font-weight:bold;font-size:1.5em;");
                comments[a].children[0].appendChild(newIcon);
            }
        }
    }

    //get data from a post
    function checkPost(id) {
        $.getJSON("https://www.pillowfort.social/posts/"+id+"/json", function(json) {
            getData();
            let counter = 0;
            document.getElementById("postSubscriberNotificationBubble").style.display = "none";
            subscriptionList.forEach(function(data, index) {
                if (data[0] == id) {
                    subscriptionList[index][2] = json.comments_count;
                }
                if (data[1] < subscriptionList[index][2]) {
                    document.getElementById("postSubscriberNotificationBubble").style.display = "block";
                    counter += (subscriptionList[index][2]-data[1]);
                    console.log("new found");
                }
            });
            document.getElementById("postSubscriberNotificationCounter").innerHTML = counter;
            setData();
        });
    }

    //toggle the popup
    function showPopup() {
        checkPost(subscriptionList[0][0]);
        if (document.getElementById("postSubscriberBackground")) {
            //remove the popup if it's already there
            document.getElementsByTagName("body")[0].classList.remove("modal-open");
            document.getElementsByTagName("nav")[0].style.paddingRight = "0";
            document.getElementById("postSubscriberBackground").remove();
            document.getElementById("postSubscriberModal").remove();
        } else {
            document.getElementsByTagName("body")[0].classList.add("modal-open");
            document.getElementsByTagName("nav")[0].style.paddingRight = "11px";

            //generate background
            let bg = document.createElement("div");
            bg.id = "postSubscriberBackground";
            bg.classList.add("modal-backdrop", "in");
            document.getElementsByTagName("body")[0].appendChild(bg);

            //generate modal basis
            let modal = document.createElement("div");
            modal.id = "postSubscriberModal";
            modal.classList.add("modal", "in");
            modal.setAttribute("style", "display:block;z-index:3;overflow:auto;");
            //set the header
            modal.innerHTML = "<div class='modal-dialog'><div class='modal-content' id='postSubscriberModalContent'><div style='padding:10px 15px 0 40px;border-bottom:2px solid #e3e3e3;'><button class='close' type='button' title='Close'><span style='color:var(--postFontColor);'>x</span></button><div style='float:right;margin:10px 20px 0 0;color:var(--postFontColor);cursor:pointer;' id='postSubscriberClear'>unsubscribe all</div><h4 class='modal-title'>Subscriptions</h4></div></div></div>";
            document.getElementsByTagName("body")[0].appendChild(modal);
            document.getElementById("postSubscriberModal").addEventListener("click", showPopup);
            document.getElementById("postSubscriberClear").addEventListener("click", function() {
                localStorage.setItem("postsubscriptions", "");
                localStorage.setItem("postsubscriptiondata", "");
            });

            //generate post entries
            getData();
            subscriptionList.forEach(function(data, index) {
                let entry = document.createElement("div");
                entry.style.padding = "10px";
                let unsubIcon = document.createElement("div");
                unsubIcon.innerHTML = iconUnsub;
                unsubIcon.style.display = "inline-block";
                unsubIcon.style.cursor = "pointer";
                unsubIcon.title = "unsubscribe";
                unsubIcon.setAttribute("postid", data[0]);
                entry.appendChild(unsubIcon);
                let titleData = "<span style='display:inline-block;overflow:hidden;text-overflow:ellipsis;max-width:330px;white-space:nowrap;line-height:1em;'>";
                titleData += postData[index][1].slice(0, postData[index][1].length-26);
                titleData += "</span><span style='display:inline-block;overflow:hidden;line-height:1em;padding-left:5px;'>";
                titleData += postData[index][1].slice(postData[index][1].length-26);
                titleData += "</span>";
                entry.innerHTML += "<a href='https://www.pillowfort.social/posts/"+data[0]+"' class='title font-nunito-bold' style='padding-left:10px;display:inline-block;'>"+titleData+"</a>";
                let info = document.createElement("p");
                info.style.paddingLeft = "30px";
                info.style.marginBottom = "0";
                if (data[1] < data[2]) info.innerHTML = (data[2]-data[1])+" new comment(s) • ";
                info.innerHTML += "<span style='color:var(--postFontColor);'>last visit: " + new Date(data[3]*1).toLocaleString()+"</span>";
                entry.appendChild(info);
                document.getElementById("postSubscriberModalContent").appendChild(entry);
                document.getElementById("postSubscriberModalContent").lastChild.firstChild.addEventListener("click", function(){unsubscribe(this.getAttribute("postid"));});
            });
        }
    }

    //remove a subscription
    function unsubscribe(id) {
        getData();
        subscriptionList.forEach(function(data, index) {
            if (data[0] == id) {
                subscriptionList.splice(index, 1);
                postData.splice(index, 1);
                let list = [];
                postData.forEach(function(value) {
                    list.push(value.toString().replaceAll(",",";"));
                });
                list = list.toString();
                localStorage.setItem("postsubscriptiondata", list);
            }
        });
        setData();
        if (document.getElementById("postSubscriberBackground")) showPopup();
    }
})();
