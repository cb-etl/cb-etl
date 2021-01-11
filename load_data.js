var today = new Date();
var dd_today = String(today.getDate()).padStart(2, '0');
var dd_yesterday = String(today.getDate() - 1).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = `${yyyy}${mm}${dd_today}`;
yesterday = `${yyyy}${mm}${dd_yesterday}`;

function doesFileExist(urlToFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();
     
    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}

var result = doesFileExist(`./json/news_keyword_top50_${today}.json`);

if (result == true) {
    var data_time = today;
    console.log('today' , today);
} else if (doesFileExist(`./json/news_keyword_top50_${yesterday}.json`) == true){
    var data_time = yesterday;
    console.log('yesterday' , yesterday);
} else {
    var data_time = '20210111';
    console.log('20210111' , '20210111');
}


var theme = "news" // default theme

window.onload= select_theme();


// Select Theme and Set Default Keyword and Sentiment and SubKeyword and URL
function select_theme(){
    console.log(data_time);
    //Select theme from theme toggle
    var theme_element = document.getElementById("theme");
    var theme = theme_element.options[theme_element.selectedIndex].value; 
    console.log(theme);


    // Keyword
    fetch(`./json/${theme}_keyword_top50_${data_time}.json`)
    .then(response => {
        return response.json();
        })
    .then(keyword_top50_data => {
        // Change JSON data format
        keyword_top50_data = keyword_top50_data.map(function(obj, index){
            // Assign new key 
            obj['text'] = obj['keyword'];
            obj['weight'] = obj['percentage']; 

            if (theme == "news"){
                var index_range = 30;
            } else {
                var index_range = 10;
            }

            if (index < index_range){
                obj['link'] = '#keyword_text';
                obj['handlers'] = {click: function(){
                    select_keyword(this);
                }};
            } else {
                obj['link'] = {href: `https://www.google.com/search?q=${obj['keyword']}&tbs=qdr:d2`, target: "_blank"};
            };    

            // obj['weight'] = obj['weight'] * 100
            // Delete old key 
            delete obj['keyword'];
            delete obj['percentage']; 
            delete obj['theme'];
            return obj;
        });

        // LeaderBoard
        $(".keyword_leaderboard").empty();
        for (data in keyword_top50_data){
            if (data == 0){
                var keyword_selected = keyword_top50_data[data]["text"]; //default keyword
                var keyword_leaderboard_li = `<a href="#keyword_selected" onclick='select_keyword(this)'>
                                                <li class="top1_keyword active"><span>${keyword_selected}</span></li>
                                            </a>`
                $(".keyword_leaderboard").append(keyword_leaderboard_li);

                document.getElementById("keyword_text").textContent = `${keyword_selected}`;
                select_sentiment(keyword_selected, theme);
                select_subkeyword(keyword_selected, theme);
                select_url(keyword_selected, theme);
            }
            if (data > 0 && data <= 9){
                var keyword = keyword_top50_data[data]["text"];
                var keyword_leaderboard_li = `<a href="#subkeyword" onclick='select_keyword(this)'>
                                                <li><span>${keyword}</span></li>
                                            </a>`
                $(".keyword_leaderboard").append(keyword_leaderboard_li);
            }
        };
        
        // Word Cloud
        $('#keyword_cloud').jQCloud(keyword_top50_data, {
            autoResize: true,
            // shape: "rectangular",
            // fontSize: [90,80,70,60,50,45,40,30,20,15,10,5,3],
            });
        $('#keyword_cloud').jQCloud('update', keyword_top50_data);

        console.log(keyword_top50_data);
        });
};

// Select Keyword -> set keyword, sentiment, subkeyword, url
function select_keyword(word){
    $("li").removeClass("active");
    // $(word).find('> li').addClass("active");
    var keyword_span = word.getElementsByTagName("SPAN")[0] || word.getElementsByTagName("a")[0];
    var keyword_selected = keyword_span.innerText || keyword_span.textContent;
    $(`li:contains(${keyword_selected})`).addClass("active");
    document.getElementById("keyword_text").textContent = `${keyword_selected}`;
    var theme_element = document.getElementById("theme");
    var theme = theme_element.options[theme_element.selectedIndex].value; 
    select_sentiment(keyword_selected, theme);
    select_subkeyword(keyword_selected, theme);
    select_url(keyword_selected, theme);
};

// Sentiment
function select_sentiment(keyword, theme){
    fetch(`./json/${theme}_keyword_sentiment_${data_time}.json`)
    .then(response => {
        return response.json();
        })
    .then(subkeyword_data => {
        $(".sentiment_progress").empty();
        var ctx = $('#sentiment_chart');

        for (data in subkeyword_data){
            if (keyword == subkeyword_data[data]["keyword"]){
                var sentiment_str = subkeyword_data[data]["sentiment"].replaceAll(`'`,`"`)
                var sentiment_json = JSON.parse(sentiment_str);
                console.log(sentiment_json)
                var pos = sentiment_json["positive"]
                var neu = sentiment_json["neutral"]
                var neg = sentiment_json["negative"]
                var mean = pos + neu + neg

                var myChart = new Chart(ctx, {
                    type: 'polarArea',
                    data: {
                        labels: ['正面', '中立', '負面'],
                        datasets: [{
                            label: '# of Votes',
                            data: [Number((pos/mean*100).toFixed(2)), Number((neu/mean*100).toFixed(2)), Number((neg/mean*100).toFixed(2))],
                            backgroundColor: [
                                '#9cb383',
                                '#73a7a3',
                                '#dda49b',
                            ],
                            borderColor: [
                                '#8c9c6b50',
                                '#6f858250',
                                '#ac5f5350',
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        startAngle : Math.PI,
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            labels: {
                                // This more specific font property overrides the global property
                                fontColor: 'white',
                                fontFamily: "'Montserrat', sans-serif",
                                fontStyle: 'bold'
                            }
                        },
                        scale: {
                            gridLines: {
                                color: 'white'
                            }
                        }
                    }
                });

                // var progess_bar = `<h5>相關輿論情緒<br>(社群留言)</h5>
                //                     <div class="progress">
                //                         <div class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width:${Number((pos/mean*100).toFixed(2))}%">正面</div>
                //                         <div class="pull-right align-self-center">${Number((pos/mean*100).toFixed(2))}%</div>
                //                     </div>
                //                     <div class="progress">
                //                         <div class="progress-bar progress-bar-striped bg-info" role="progressbar" style="width:${Number((neu/mean*100).toFixed(2))}%">中立</div>
                //                         <div class="pull-right align-self-center">${Number((neu/mean*100).toFixed(2))}%</div>

                //                     </div>
                //                     <div class="progress">
                //                         <div class="progress-bar progress-bar-striped bg-danger" role="progressbar" style="width:${Number((neg/mean*100).toFixed(2))}%">負面</div>
                //                         <div class="pull-right align-self-center">${Number((neg/mean*100).toFixed(2))}%</div>
                //                     </div>`
                                    
                // $(".sentiment_progress").append(progess_bar);

                
            };
        };
    });
};



// SubKeyword
function select_subkeyword(keyword, theme){
    fetch(`./json/${theme}_subkeyword_${data_time}.json`)
    .then(response => {
        return response.json();
        })
    .then(subkeyword_data => {
        var cloud_data = [];
        for (data in subkeyword_data){
            if (keyword == subkeyword_data[data]["keyword"]){
                var subkeyword = subkeyword_data[data]["subkeyword"];
                var weight = subkeyword_data[data]["weight"];
                var href = `https://www.google.com/search?q=${subkeyword}&tbs=qdr:d2`;
                cloud_data.push(JSON.parse(`{"text": "${subkeyword}", "weight": ${weight}, "link": {"href": "${href}", "target": "_blank"}}`));
            };
        };

        // LeaderBoard
        $(".keyword_subkeyword_leaderboard").empty();
        for (data in cloud_data){
            if (data <= 9){
                var subkeyword = cloud_data[data]["text"];
                var subkeyword_leaderboard_li = `<li><span>${subkeyword}</span></li>`
                $(".keyword_subkeyword_leaderboard").append(subkeyword_leaderboard_li);
            }
        };
        
        // Word Cloud
        $('#subkeyword_cloud').jQCloud(cloud_data, {
            autoResize: true,
            // shape: "rectangular",
            // fontSize: [90,80,70,60,50,45,40,30,20,15,10,5,3],
            colors: [
                '#e0876a',
                '#e0876a',
                '#f4a688',
                '#f4a688',
                '#d9ad7c',
                '#d9ad7c',
                '#f9ccac',
                '#f9ccac',
                '#fbefcc',
            ],
            });
        $('#subkeyword_cloud').jQCloud('update', cloud_data);

        console.log(cloud_data);
    });
};


// URL
// API key (https://my.linkpreview.net)
var key = "11a60440155ee44551f3ab7b7f7aad18",
    key1 = "ad7353749a449d713dfa52264f0a369a",
    key2 = "be16d1e359c20f951efce2cf786fd700";

function select_url(keyword, theme){
    console.log(keyword);

    fetch(`./json/${theme}_keyword_url_preview_${data_time}.json`)
    .then(response => {
        return response.json();
        })
    .then(subkeyword_data => {
        var url_count = 0;

        $(`.grid`).empty();
        $(`.grid`).append(`<div class="grid-sizer col-sm-4"></div>`);
        // init masonry
        $('.grid').masonry();
        // destroy masonry
        $('.grid').masonry('destroy');
        $('.grid').removeData('masonry'); // This line to remove masonry's data

        for (data in subkeyword_data){

            if (subkeyword_data[data]["keyword"].startsWith(keyword) && url_count < 12){ //restrict to 12 articles(urls) 
                url_count += 1;
                var url = subkeyword_data[data]["url"];
                var title = subkeyword_data[data]["title"];
                var description = subkeyword_data[data]["description"];
                var image = subkeyword_data[data]["image"];
                if (image == null){
                    var image = "./image/unknown.jpg"
                }
                // console.log(url)


                var card = `<div class="grid-item col-md-4 md-4 box">
                            <a href="${url}">
                                <div class="card" >
                                    <img src="${image}" class="card-img-top" alt="${title}">
                                    <div class="card-body">
                                        <h5 class="card-title">${title}</h5>
                                        <p class="card-text">${description.substring(0, 200)} ...</p>
                                        <a href="${url}" class="card-link" target="_blank">${url.split("/")[2]}</a>
                                    </div>
                                </div>
                            </a>
                            </div>`;
                $(`.grid`).append(card);

                // // Rotate key
                // [key, key1, key2] = [key1, key2, key];
                // [key1, key2, key] = [key2, key, key1];
                
                // // https://my.linkpreview.net
                // var api = `https://api.linkpreview.net/?key=${key}&q=${url}`;
                // console.log(api);

                // $.ajax({
                //     url: api,
                //     type:"GET",
                //     crossDomain : true,
                //     async: true,
                //     contentType: "application/json; charset=utf-8",
                //     dataType: "json",
                //     jsonpCallback: "myJsonMethod",
                //     success: function(json) {

                //         var card = `<div class="grid-item col-md-4 md-4 box">
                //                         <a href="${json["url"]}">
                //                         <div class="card" >
                //                             <img src="${json["image"]}" class="card-img-top" alt="${json["title"]}">
                //                             <div class="card-body">
                //                                 <h5 class="card-title">${json["title"]}</h5>
                //                                 <p class="card-text">${json["description"].substring(0, 200)} ...</p>
                //                                 <a href="${json["url"]}" class="card-link" target="_blank">${json["url"].split("/")[2]}</a>
                //                             </div>
                //                         </div>
                //                     </a>
                //                     </div>`;
                //         $(`.grid`).append(card);

                //     },
                //     error: function(e) {
                //         console.log(e);
                //     }
                // });
            };
        };

        //test Data
        // var json_array = [
        //     {
        //         "title": "Jaguar 小改款 F-Type P300 R-Dynamic 試駕｜美型依舊，2.0T動力表現恰到好處！ - Mobile01",
        //         "description": "如果外型的美可以用數據表示，那麼F-Type肯定是我認為C/P值最高的一輛車。於上週公佈雙車型定價的小改款F-Type，改以2.0升四缸渦輪增壓與5.0升八缸機械增壓作為首發車型，定價分別是366萬元與486萬元。P300四缸車型與過往六缸車型價格差異不大，倒是八缸低輸出版本P450...(Jaguar 第1頁)",
        //         "image": "./image/unknown.jpg",
        //         "url": "https://www.mobile01.com/topicdetail.php?f=603\u0026t=6274801"
        //     },
        //     {
        //         "title": "觀察站／誰讓民進黨丟失了旗幟？ | 聯合新聞網：最懂你的新聞網站",
        //         "description": "昨晚「守護食安之夜」，資深社運人楊祖珺身子很小，站在台上，話卻說得很凶，口裡批評國民黨辦反萊豬晚會，竟因為疫情，臨時取消...",
        //         "image": "https://pgw.udn.com.tw/gw/photo.php?u=https://uc.udn.com.tw/photo/2020/12/24/realtime/9880620.jpg\u0026s=Y\u0026x=114\u0026y=0\u0026sw=1050\u0026sh=700\u0026exp=3600",
        //         "url": "https://udn.com/news/story/9750/5117418"
        //     },
        //     {
        //         "title": "一黨獨大情勢已過？ 民進黨反譏國民黨支持度首度跌破2成",
        //         "description": "國民黨智庫今天(23日)公布最新民調，在政黨支持度方面，民進黨支持度跌至22.6％，國民黨支持度19％，雙方差距僅3.6％，代表民進黨今年上半年一黨獨大的情勢已經結束。對使，民進黨發言人劉康彥回應指出，支持度是對政黨「總體表現」最直接的反應，國民黨今天公布的最新民調顯示，從8月以來，國民黨這5個月來...",
        //         "image": "https://static.rti.org.tw/assets/thumbnails/2020/11/18/045db56c6e6275e4cd86082e1bb4946b.jpg",
        //         "url": "https://www.rti.org.tw/news/view/id/2087464"
        //     },
        //     {
        //         "title": "民進黨：國民黨支持度跌破兩成 反映民眾不滿 | 政治 | 中央社 CNA",
        //         "description": "民進黨發言人劉康彥表示，國民黨今天公布的最新民調顯示，從8月以來，國民黨的政黨支持度首度跌破兩成，支持度是對政黨「總體表現」最直接的反應，反映民眾對國民黨這5個月表現的不滿。",
        //         "image": "https://imgcdn.cna.com.tw/www/images/pic_fb.jpg",
        //         "url": "https://www.cna.com.tw/news/aipl/202012230175.aspx"
        //     },
        //     {
        //         "title": "民進黨：國民黨支持度跌破兩成 反映民眾不滿",
        //         "description": "（中央社記者葉素萍台北23日電）民進黨發言人劉康彥表示，國民黨今天公布的最新民調顯示，從8月以來，國民黨的政黨支持度首度跌破兩成，支持度是對政黨「總體表現」最直接的反應，反映民眾對國民黨這5個月表現的不滿。",
        //         "image": "https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo-1200x1200.png",
        //         "url": "https://tw.news.yahoo.com/%E6%B0%91%E9%80%B2%E9%BB%A8-%E5%9C%8B%E6%B0%91%E9%BB%A8%E6%94%AF%E6%8C%81%E5%BA%A6%E8%B7%8C%E7%A0%B4%E5%85%A9%E6%88%90-%E5%8F%8D%E6%98%A0%E6%B0%91%E7%9C%BE%E4%B8%8D%E6%BB%BF-064733968.html"
        //     },
        //     {
        //         "title": "飛碟聯播網《飛碟早餐 唐湘龍時間》2020.12.23 民進黨面有「蔡」色！台灣人好不「蘇」服！",
        //         "description": "主持人：唐湘龍 節目時間：週一至週五 08:00-09:00 ◎節目內容大綱： ●「飛碟早餐 唐湘龍時間」，網路直播 ● 民進黨面有「蔡」色！台灣人好不「蘇」服！ ▶ 飛碟聯播網Youtube頻道 http://bit.ly/2Pz4Qmo ▶ 飛碟早餐唐湘龍時間 https://www.facebook.com/ufobreakfast/ ▶ 飛碟聯播網FB粉絲團 https://www.facebook.com/ufonetwork921/ ▶ 網路線上收聽 http://www.uforadio.com.tw/stream/str... ▶ 飛碟APP，讓你收聽零距離 Android：https://reurl.cc/j78ZKm iOS：https://reurl.cc/ZOG3LA ▶ 飛碟Podcast SoundOn : https://bit.ly/30Ia8Ti Apple Podcasts : https://apple.co/3jFpP6x Spotify : https://spoti.fi/2CPzneD Google 播客：https://bit.ly/3gCTb3G #民進黨 #台灣人 #唐湘龍",
        //         "image": "https://i.ytimg.com/vi/h_k87WHKo9k/maxresdefault.jpg",
        //         "url": "https://www.youtube.com/watch?v=h_k87WHKo9k"
        //     },
        //     ];
        

        // for (json in json_array){
        //         var json = json_array[json];
        //         var card = `<div class="grid-item col-md-4 md-4 box">
        //                     <a href="${json["url"]}">
        //                         <div class="card" >
        //                             <img src="${json["image"]}" class="card-img-top" alt="${json["title"]}">
        //                             <div class="card-body">
        //                                 <h5 class="card-title">${json["title"]}</h5>
        //                                 <p class="card-text">${json["description"].substring(0, 200)} ...</p>
        //                                 <a href="${json["url"]}" class="card-link" target="_blank">${json["url"].split("/")[2]}</a>
        //                             </div>
        //                         </div>
        //                     </a>
        //                     </div>`;
        //         $(`.grid`).append(card);
        //     };
        // test data end

        // re-initialize Masonry after all cards have been loaded.
        var $grid = $('.grid').masonry({
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            percentPosition: true
        });
        // $('.grid').masonry({
        //     itemSelector: '.grid-item',
        //     columnWidth: '.grid-sizer',
        //     percentPosition: true
        //     });
        $grid.imagesLoaded().progress( function() {
            $grid.masonry('layout');
        });
    });
};

$( document ).ajaxComplete(function() {
    $('.grid').removeData('masonry'); // This line to remove masonry's data
    var $grid = $('.grid').masonry({
        itemSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true
    });
    $grid.imagesLoaded().progress( function() {
        $grid.masonry('layout');
    });
});


// Masonry grid will have to change size when bootstrap card changes
window.onresize = resize_grid;
function resize_grid(){
    $('.grid').removeData('masonry'); // This line to remove masonry's data

    // re-initialize Masonry after all cards have been loaded.
    var $grid = $('.grid').masonry({
        itemSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true
        });
    // $('.grid').masonry({
    //     itemSelector: '.grid-item',
    //     columnWidth: '.grid-sizer',
    //     percentPosition: true
    //     });
    $grid.imagesLoaded().progress( function() {
        $grid.masonry('layout');
    });
}


var timeout;
$(window).on("load scroll resize", function() {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
        var $window = $(window),
        hitbox_top = $window.scrollTop() + $window.height() * .4,
        hitbox_bottom = $window.scrollTop() + $window.height() * .6;
        $(".card").each(function() {
        var $element = $(this),
            element_top = $element.offset().top,
            element_bottom = $element.offset().top + $element.height();
        $element.toggleClass("middle-viewport", hitbox_top < element_bottom && hitbox_bottom > element_top);
        });
    }, 200);
    });