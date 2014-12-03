$(document).ready(function(){
        var stream = true,
            user;
        var popOverSettings = {
            placement: 'top',
            container: '#tweet_globe',
            html: true,
            selector: '.points',
            content: function () {
                return $('#popover-content').html();
            }
        }
        io = io.connect(window.location.host);
          $('.points').popover(popOverSettings);
          $('#starry').on('DOMNodeInserted', function () {
            $("#"+$(this).attr("id")).popover(popOverSettings);
          });
          
          io.on('end', function (response){
            alert(response.response);
          })
          io.on('destroy', function (response){
            alert(response.response);
          })
          io.on('inactivity', function (response){
            alert(response.response);
          })
          $.get("http://ipinfo.io", function(response) {
            io.emit('twitter-stream', {"country": response.country});
          }, "jsonp");
          io.on('country', function(country){
            $("#cntry").html(country.country);
          })
          io.on('countryTrends', function (trends){
            for(i=1; i<Object.keys(trends.trends).length; i++){
              $("#chf"+i).val(trends.trends[i].name)
              $("#chf"+i).after("#" + i + ":  " + trends.trends[i].name)
            }
          })
          io.on('worldTrends', function (trends){
            for(i=1; i<Object.keys(trends.trends).length; i++){
              $("#whf"+i).val(trends.trends[i].name)
              $("#whf"+i).after("#" + i + ":  " + trends.trends[i].name)
            }
          })
          io.on('stream', function (data){
            tweet(data);
            if (stream == true){
              $("#tweets").prepend("<div class='tweet'><span class='user'>@"+data.profile+"</span>:  "+data.tweet+"</div>")
            }
          })
          $(document).on("click",".points",function(){
            $("#"+$(this).attr("id")).popover("show");
          })
          $(document).on("click",".popover",function(){
            $("#"+$(this).attr("id")).popover("hide");
          })
          if(rotating){
            $("#rotation .buttontext").html("Turn Rotation Off");
          } else {
            $("#rotation .buttontext").html("Turn Rotation On");
          }
          $("#rotation").click(function(){
            if (rotating==true){
              rotating = false;
              rotation = "Turn Rotation On";
              $("#rotation").css("background-color", "#00a5ff")
            } else {
              rotating = true;
              rotation = "Turn Rotation Off";
              $("#rotation").css("background-color", "#000000")
            }
            $("#rotation .buttontext").html(rotation);
          })
          if(stream){
            $("#stream .buttontext").html("Turn Stream Off");
          } else {
            $("#stream .buttontext").html("Turn Stream On");
          }
          $("#stream").click(function(){
            if (stream==true){
              stream = false;
              stream_toggle = "Turn Stream On";
              $("#stream").css("background-color", "#64C51E")
            } else {
              stream = true;
              stream_toggle = "Turn Stream Off";
              $("#stream").css("background-color", "#b30000")
            }
            $("#stream .buttontext").html(stream_toggle);
          })
          $(document).on("click","[name='hashtagFilter']",function(){
            return false
            var filter = []
            $("[name='hashtagFilter']").each(function (index){
              if($(this).is(":checked")){
                filter.push($(this).val())
              }
            })
            io.emit('hashtagFilter', {filter: filter})
          })
          $("#hash_tag").keyup(function(){
            io.emit('search', {filter: $("#hash_tag").val()})
          })
        })