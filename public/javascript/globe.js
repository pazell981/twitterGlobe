d3.select("#tweet_globe")
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);

        var size,
            width = $("#tweet_globe").width(),
            height = $("#tweet_globe").height(),
            arrayC = [],
            origin = [71, -42],
            velocity = .005,
            t0 = Date.now(),
            rotating = true,
            tweetId=0,
            removeTweetId=0;
        if (width<481){
          size=5000;
        } else if (width<768){
          size=1000;
        } else if (width<1200){
          size=1500;
        } else {
          size=2000;
        }
        for (var i=0; i<size; i++){          
          arrayC.push({
              geometry: {
                  type: 'Point',
                  coordinates: [Math.random()*360-180, Math.random()*180-90]
              },
              type: 'Feature',
              properties: {
                  radius: Math.random() * 1.5
              }
          });
        }

        var outerSpace = d3.geo.azimuthalEquidistant()
            .translate([width / 2, height / 2]);
        var space = outerSpace.scale(outerSpace.scale()*3);
        var starsPath = d3.geo.path()
            .projection(space)
            .pointRadius(1);

        var proj = d3.geo.orthographic()
            .translate([width/2,height/2])
            .clipAngle(90);
        var globe = proj.scale(200);
        var path = d3.geo.path()
            .projection(globe);
        var graticule = d3.geo.graticule();

        var svg = d3.select("#tweet_globe")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("id", "starry")
            .attr("x-axis", 0)
            .attr("y-axis",0)
            .on("mousedown", mousedown)

        queue()
          .defer(d3.json, "world-110m.json")
          .await(ready);

        function ready(error, world) {
          var ocean_fill = svg.append("defs")
            .append("radialGradient")
            .attr("id", "ocean_fill")
            .attr("cx", "75%")
            .attr("cy", "25%");
          ocean_fill.append("stop")
            .attr("offset", "5%")
            .attr("stop-color", "#333333");
          ocean_fill.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#000000");

          var globe_highlight = svg.append("defs")
            .append("radialGradient")
            .attr("id", "globe_highlight")
            .attr("cx", "75%")
            .attr("cy", "25%");
          globe_highlight.append("stop")
            .attr("offset", "5%")
            .attr("stop-color", "#ffd")
            .attr("stop-opacity","0.2");
          globe_highlight.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ba9")
            .attr("stop-opacity","0.1");

          var globe_shading = svg.append("defs")
            .append("radialGradient")
            .attr("id", "globe_shading")
            .attr("cx", "55%")
            .attr("cy", "45%");
          globe_shading.append("stop")
            .attr("offset","30%")
            .attr("stop-color", "#fff")
            .attr("stop-opacity","0");
          globe_shading.append("stop")
            .attr("offset","100%")
            .attr("stop-color", "#505962")
            .attr("stop-opacity","0.1");        

          var drop_shadow = svg.append("defs")
            .append("radialGradient")
            .attr("id", "drop_shadow")
            .attr("cx", "50%")
            .attr("cy", "50%");
          drop_shadow.append("stop")
            .attr("offset","20%")
            .attr("stop-color", "#000")
            .attr("stop-opacity",".5")
          drop_shadow.append("stop")
            .attr("offset","100%")
            .attr("stop-color", "#000")
            .attr("stop-opacity","0")

          svg.append("circle")
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("r", outerSpace.scale())
            .attr("id", "galaxy")
          svg.append("g")
            .attr("class", "stars")
            .selectAll("g")
            .data(arrayC)
            .enter()
            .append("path")
                .attr("class", "star")
                .attr("d", starsPath)
                .style("fill","rgb(255,255,255)");

          svg.append("ellipse")
            .attr("cx", 440)
            .attr("cy", 450)
            .attr("rx", proj.scale()*.90)
            .attr("ry", proj.scale()*.25)
            .attr("class", "noclicks")
            .style("fill", "url(#drop_shadow)");

          svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class", "noclicks")
            .style("fill", "url(#ocean_fill)");

          svg.append("path")
            .datum(topojson.feature(world, world.objects.land))
            .attr("class", "land noclicks")
            .attr("d", path);

          svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class","noclicks")
            .style("fill", "url(#globe_highlight)");

          svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class","noclicks")
            .style("fill", "url(#globe_shading)");

          refresh();

          d3.timer(function() {
            if (rotating){
              var angle = velocity * (Date.now() - t0);
              proj.rotate([angle,0,0]);
              outerSpace.rotate([-angle,0,0]);
              svg.selectAll(".star")
                .attr("d", starsPath.projection(outerSpace));
              svg.selectAll(".land")
                .attr("d", path.projection(proj));
              svg.selectAll(".points")
                .attr("d", path.projection(proj));
            }
          });
        }

        function refresh() {
          svg.selectAll(".star").attr("d", starsPath);
          svg.selectAll(".land").attr("d", path);
          svg.selectAll(".points").attr("d", path);
        }

        var m0, o0, g0, mouse_rotation;
        function mousedown() {
          if (rotating!=false){
            rotating = false
          } else {
            mouse_rotation = false
          }
          m0 = [d3.event.pageX, 0,0];
          g0 = outerSpace.rotate();
          o0 = proj.rotate();
          d3.event.preventDefault();
        }
        function mousemove() {
          if (m0) {
            var m1 = [d3.event.pageX, 0,0]
            , o1 = [o0[0] + (m1[0] - m0[0])/12, 0,0]
            , g1 = [g0[0] + (m1[0] - m0[0])/12, 0,0];
            proj.rotate(o1);
            outerSpace.rotate(g1);
            refresh();
          }
        }
        function mouseup() {
          if (m0) {
            mousemove();
            m0 = null;
            if (mouse_rotation != false){
              rotating = true;
            }
            mouse_rotation = null;
          }
        }
        function tweet(stream) {
          svg.append("path")
            .datum(stream.geo)
            .attr("class","points")
            .attr("id", "tweet_" + tweetId)
            .attr("data-function", "popover")
            .attr("data-trigger", "click")
            .attr("title", stream.profile)
            .attr("data-content", "<div class=popover_tweet><img src='" + stream.image + "' class='img-circle'><div class='tweet_text'>"+stream.tweet +"</div></div>")
            .attr("d", path.pointRadius(5))
            .style("stroke", "#0000FF")
            .style("fill", "#00a5ff");
          setTimeout(function(){
            d3.selectAll("#tweet_"+removeTweetId)
            .remove();
            removeTweetId++;
          },10000);
          tweetId++;
        }