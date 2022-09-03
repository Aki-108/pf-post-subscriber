// ==UserScript==
// @name         Post Subscriber
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Get notified when there are new comments in a post.
// @author       aki108
// @match        https://www.pillowfort.social/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pillowfort.social
// @updateURL    https://raw.githubusercontent.com/Aki-108/pf-post-subscriber/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Aki-108/pf-post-subscriber/main/main.js
// @supportURL
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
    var commentCount = 0;
    var postUser = "";
    var postTitle = "";
    var postDate = "";
    var postData = [];
    var openTime = new Date().getTime();
    var updateIndex = 0;

    var icon = document.createElement("div");
    icon.innerHTML = "<svg class='sidebar-img' viewBox='0 0 14 14' style='overflow:visible;'><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M5.5 13.5h-3q-2 0 -2 -2v-8.5q0 -2 2 -2h8.5q2 0 2 2v5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 4h7.5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 7h4.5'></path><path xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#58b6dd' stroke-width='.8' d='M3 10h4'></path><g xmlns='http://www.w3.org/2000/svg' transform='scale(0.5),translate(10,10)'><path xmlns='http://www.w3.org/2000/svg' d='M19.653 33.124h-2.817c-.289 0-.578-.02-.867-.04a.436.436 0 01-.307-.561c.177-.319.359-.635.544-.949.274-.466.559-.926.828-1.4.349-.609.7-1.217 1.022-1.839a2.149 2.149 0 00.185-.661 9.817 9.817 0 00.068-1.471c0-.871.011-1.743.02-2.614a6.175 6.175 0 01.5-2.445 6.93 6.93 0 01.986-1.622 6.661 6.661 0 013.694-2.288c.089-.022.127-.053.123-.151a2.576 2.576 0 01.081-.835 1.2 1.2 0 01.982-.915 1.319 1.319 0 011.068.219 1.282 1.282 0 01.514.863c.032.23.033.464.044.7 0 .059.012.087.082.1a7.247 7.247 0 011.569.574 6.471 6.471 0 011.342.888 7.087 7.087 0 011.473 1.787 5.493 5.493 0 01.564 1.28 7.837 7.837 0 01.226 1.125c.05.431.052.868.067 1.3.013.374.015.747.022 1.121l.021 1.216c.006.29.007.579.022.869a3.2 3.2 0 00.073.669 3.043 3.043 0 00.281.634c.2.375.42.742.636 1.11.288.491.583.977.871 1.468q.363.62.716 1.246a.4.4 0 01-.159.507.549.549 0 01-.358.084q-3.194.015-6.388.022c-.165 0-.159 0-.179.171a2.233 2.233 0 01-.607 1.324 2.071 2.071 0 01-1.319.672 2.211 2.211 0 01-1.678-.454 2.243 2.243 0 01-.822-1.365 1.308 1.308 0 01-.023-.217c0-.092-.03-.134-.134-.134-.99.013-1.978.012-2.966.012z' transform='translate(-15.024 -14.708)' style='fill:none;stroke:#58b6dd;stroke-width:1.6px'></path></g></svg>";
    var iconUnsub = "<svg width='20px' height='23px' viewBox='0 0 20 20'><path xmlns='http://www.w3.org/2000/svg' d='M19.653 33.124h-2.817c-.289 0-.578-.02-.867-.04a.436.436 0 01-.307-.561c.177-.319.359-.635.544-.949.274-.466.559-.926.828-1.4.349-.609.7-1.217 1.022-1.839a2.149 2.149 0 00.185-.661 9.817 9.817 0 00.068-1.471c0-.871.011-1.743.02-2.614a6.175 6.175 0 01.5-2.445 6.93 6.93 0 01.986-1.622 6.661 6.661 0 013.694-2.288c.089-.022.127-.053.123-.151a2.576 2.576 0 01.081-.835 1.2 1.2 0 01.982-.915 1.319 1.319 0 011.068.219 1.282 1.282 0 01.514.863c.032.23.033.464.044.7 0 .059.012.087.082.1a7.247 7.247 0 011.569.574 6.471 6.471 0 011.342.888 7.087 7.087 0 011.473 1.787 5.493 5.493 0 01.564 1.28 7.837 7.837 0 01.226 1.125c.05.431.052.868.067 1.3.013.374.015.747.022 1.121l.021 1.216c.006.29.007.579.022.869a3.2 3.2 0 00.073.669 3.043 3.043 0 00.281.634c.2.375.42.742.636 1.11.288.491.583.977.871 1.468q.363.62.716 1.246a.4.4 0 01-.159.507.549.549 0 01-.358.084q-3.194.015-6.388.022c-.165 0-.159 0-.179.171a2.233 2.233 0 01-.607 1.324 2.071 2.071 0 01-1.319.672 2.211 2.211 0 01-1.678-.454 2.243 2.243 0 01-.822-1.365 1.308 1.308 0 01-.023-.217c0-.092-.03-.134-.134-.134-.99.013-1.978.012-2.966.012z' transform='translate(-15.024 -14.708)' style='fill:none;stroke:#58b6dd;stroke-width:1.7px'/><path stroke='#58b6dd' stroke-width='2px' d='M1 5.5l15 15'/><path stroke='white' stroke-width='1.5px' d='M0 2l20 20'/></svg>";

    function initGeneral() {
        if (document.getElementsByClassName("subscriptionicon").length > 0) return;
        let sidebarSmall = document.getElementsByClassName("sidebar-collapsed")[1];
        let subscriptionSmall = document.createElement("a");
        subscriptionSmall.classList.add("subscriptionicon");
        subscriptionSmall.classList.add("sidebar-icon");
        subscriptionSmall.title = "Subscriptions";
        subscriptionSmall.style.cursor = "pointer";
        subscriptionSmall.appendChild(icon.cloneNode(true));
        subscriptionSmall.children[0].style.height = "30px";
        let notificationBubble = document.createElement("div");
        notificationBubble.setAttribute("style", "background:#F377B3;width:8px;height:8px;border-radius:10px;position:relative;top:-10px;right:-24px;display:none;");
        notificationBubble.id = "subscriptionnotification";
        subscriptionSmall.children[0].appendChild(notificationBubble);
        subscriptionSmall.addEventListener("click", showPopup);
        sidebarSmall.appendChild(subscriptionSmall);

        let sidebarBig = document.getElementsByClassName("sidebar-expanded")[2];
        sidebarBig.children[9].style.paddingBottom = "0";
        let subscriptionBig = document.createElement("div");
        subscriptionBig.classList.add("subscriptionicon");
        subscriptionBig.classList.add("sidebar-topic");
        subscriptionBig.appendChild(icon.cloneNode(true).children[0]);
        let title = document.createElement("a");
        title.addEventListener("click", showPopup);
        title.innerHTML = "Subscriptions";
        title.style.cursor = "pointer";
        subscriptionBig.appendChild(title);
        let counter = document.createElement("div");
        counter.classList.add("sidebar-num");
        counter.style.paddingTop = "4px";
        counter.id = "subscriptionnotificationcounter";
        counter.innerHTML = "0";
        subscriptionBig.appendChild(counter);
        sidebarBig.appendChild(subscriptionBig);


        if (document.URL.search("/posts/") == 29) {
            postID = document.URL.substring(36);
            if (postID.indexOf("?") >= 0) postID = postID.substring(0, postID.indexOf("?"));
            subscribed = false;
            getData();
            subscriptionList.forEach(function(item) {
                if (item[0] == postID) subscribed = true;
            });

            let postNav = document.getElementsByClassName("post-nav")[0];
            let subscriptionNav = document.createElement("span");
            subscriptionNav.id = "subscribebutton";
            subscriptionNav.title = subscribed ? "unsubscribe" : "subscribe";
            subscriptionNav.classList.add("nav-tab");
            subscriptionNav.style.cursor = "pointer";
            subscriptionNav.appendChild(icon.cloneNode(true));
            subscriptionNav.addEventListener("click", toggleSubscription);
            postNav.appendChild(subscriptionNav);
            if (subscribed) document.getElementById("subscribebutton").firstChild.classList.add("svg-pink-light");

            $.getJSON("https://www.pillowfort.social/posts/"+postID+"/json", function(data) {
                commentCount = data.comments_count;
                postUser = data.username;
                postTitle = data.title || "";
                postDate = data.timestamp;
            });
        }

        getData();
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

    function initComments() {
        if (subscribed) {
            highlightComments();
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

    function toggleSubscription() {
        if (subscribed) {
            unsubscribe(postID);
            document.getElementById("subscribebutton").firstChild.classList.remove("svg-pink-light");
            document.getElementById("subscribebutton").title = "subscribe";
        } else {
            getData();
            let commentData = [postID, commentCount, commentCount, openTime];
            subscriptionList.push(commentData);
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
            document.getElementById("subscribebutton").firstChild.classList.add("svg-pink-light");
            document.getElementById("subscribebutton").title = "unsubscribe";
            setData();
        }
        subscribed = !subscribed;
    }

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

    function setData() {
        let list = [];
        subscriptionList.forEach(function(value) {
            list.push(value.toString().replaceAll(",",";"));
        });
        list = list.toString();
        localStorage.setItem("postsubscriptions", list);
    }

    function highlightComments() {
        let pivotTime = 0;
        subscriptionList.forEach(function(data) {
            if (data[0] == postID) pivotTime = data[3];
        });
        let comments = document.getElementsByClassName("comment");
        for (let a = 0; a < comments.length; a++) {
            if (comments[a].classList.contains("postsubscriberprocessed")) continue;
            comments[a].classList.add("postsubscriberprocessed");
            let timeString = comments[a].getElementsByClassName("header")[0].children[1].children[1].title;
            let time = new Date(timeString.replace("@", "")).getTime();
            if (time > pivotTime) {
                let newIcon = document.createElement("div");
                newIcon.innerHTML = "new";
                newIcon.style.height = 0;
                newIcon.style.margin = "-25px -53px";
                newIcon.style.color = "#ff7fc5";
                newIcon.style.fontWeight = "bold";
                newIcon.style.fontSize = "1.5em";
                comments[a].children[0].appendChild(newIcon);
            }
        }
    }

    function checkPost(id) {
        $.getJSON("https://www.pillowfort.social/posts/"+id+"/json", function(json) {
            getData();
            let counter = 0;
            document.getElementById("subscriptionnotification").style.display = "none";
            subscriptionList.forEach(function(data, index) {
                if (data[0] == id) {
                    subscriptionList[index][2] = json.comments_count;
                }
                if (data[1] < subscriptionList[index][2]) {
                    document.getElementById("subscriptionnotification").style.display = "block";
                    counter += (subscriptionList[index][2]-data[1]);
                }
            });
            document.getElementById("subscriptionnotificationcounter").innerHTML = counter;
            setData();
        });
    }

    function showPopup() {
        if (document.getElementById("postsubscriberbackground")) {
            document.getElementById("postsubscriberbackground").remove();
            document.getElementById("postsubscribermodal").remove();
        } else {
            //document.getElementById("subscriptionnotification").style.display = "none";
            // Generate background
            let bg = document.createElement("div");
            bg.id = "postsubscriberbackground";
            bg.classList.add("modal-backdrop");
            bg.classList.add("in");
            document.getElementsByTagName("body")[0].appendChild(bg);

            let modal = document.createElement("div");
            modal.id = "postsubscribermodal";
            modal.classList.add("modal");
            modal.classList.add("in");
            modal.style.display = "block";
            modal.style.zIndex = "3";
            modal.style.overflow = "auto";
            modal.innerHTML = "<div class='modal-dialog'><div class='modal-content' id='postsubscribermodalcontent'></div></div>";
            document.getElementsByTagName("body")[0].appendChild(modal);
            document.getElementById("postsubscribermodal").addEventListener("click", showPopup);

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
                info.innerHTML += "<span style='color:#575757;'>last visit: " + new Date(data[3]*1).toLocaleString()+"</span>";
                entry.appendChild(info);
                document.getElementById("postsubscribermodalcontent").appendChild(entry);
                document.getElementById("postsubscribermodalcontent").lastChild.firstChild.addEventListener("click", function(){unsubscribe(this.getAttribute("postid"));});
            });
        }
    }

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
        if (document.getElementById("postsubscriberbackground")) showPopup();
    }
})();
