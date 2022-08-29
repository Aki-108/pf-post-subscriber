// ==UserScript==
// @name         Post Subscriber
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get notified when there are new comments in a post.
// @author       aki108
// @match        https://www.pillowfort.social/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pillowfort.social
// @updateURL    
// @downloadURL  
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

    function initGeneral() {
        if (document.getElementsByClassName("subscriptionIcon").length > 0) return;
        let sidebarSmall = document.getElementsByClassName("sidebar-collapsed")[1];
        let subscriptionSmall = document.createElement("a");
        subscriptionSmall.classList.add("subscriptionIcon");
        subscriptionSmall.classList.add("sidebar-icon");
        subscriptionSmall.setAttribute("data-toggle", "tooltip");
        subscriptionSmall.setAttribute("data-placement", "right");
        subscriptionSmall.setAttribute("data-delay", '{"show":"200", "hide":"0"}');
        subscriptionSmall.setAttribute("data-original-title", "Subscriptions");
        subscriptionSmall.style.cursor = "pointer";
        subscriptionSmall.innerHTML = "<img class='sidebar-img' src='/assets/global/ic_compose-b86a23243e060c1c7ea896b40e55ee115841c6fc1632a2137a91c8ad996c5922.svg'>";
        sidebarSmall.appendChild(subscriptionSmall);

        let sidebarBig = document.getElementsByClassName("sidebar-expanded")[2];
        let subscriptionBig = document.createElement("div");
        subscriptionBig.classList.add("subscriptionIcon");
        subscriptionBig.classList.add("sidebar-topic");
        subscriptionBig.innerHTML = "<img class='sidebar-img' src='/assets/global/ic_compose-b86a23243e060c1c7ea896b40e55ee115841c6fc1632a2137a91c8ad996c5922.svg'><a style='cursor: pointer'>Subscriptions</a>";
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
            subscriptionNav.classList.add("nav-tab");
            subscriptionNav.style.cursor = "pointer";
            let class_ = subscribed? " class='svg-pink-light' " : " ";
            subscriptionNav.innerHTML = "<img"+ class_ + "src='/assets/global/ic_compose-b86a23243e060c1c7ea896b40e55ee115841c6fc1632a2137a91c8ad996c5922.svg'>";
            subscriptionNav.addEventListener("click", toggleSubscription);
            postNav.appendChild(subscriptionNav);
        }
    }

    function initComments() {

    }

    function toggleSubscription() {
        getData();
        if (subscribed) {
            subscriptionList.forEach(function(data, index) {
                if (data[0] == postID) subscriptionList.splice(index, 1);
            });
            document.getElementById("subscribebutton").firstChild.classList.remove("svg-pink-light");
            setData();
        } else {
            $.getJSON("https://www.pillowfort.social/posts/"+postID+"/json", function(data) {
                let count = data.comments_count;
                let postData = [postID, count, count, Date.now()];
                subscriptionList.push(postData);
                setData();
                document.getElementById("subscribebutton").firstChild.classList.add("svg-pink-light");
            });
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
    }

    function setData() {
        let list = [];
        subscriptionList.forEach(function(value) {
            list.push(value.toString().replaceAll(",",";"));
        });
        list = list.toString();
        localStorage.setItem("postsubscriptions", list);
    }
})();
