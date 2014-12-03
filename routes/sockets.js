var util = require('util'),
    Twitter = require('twit'),
    config = require('../config.json'),
    twitter = new Twitter({
     	consumer_key: config.consumer_key || process.env.CONSUMER_KEY,
	    consumer_secret: config.consumer_secret || process.env.CONSUMER_SECRET,
	    access_token: config.access_token_key || process.env.ACCESS_TOKEN_KEY,
	    access_token_secret: config.access_token_secret || process.env.ACCESS_TOKEN_SECRET
    }),
    YQL = require('yql-weather-location'),
    user={},
    currentWorldHashtags=[];

function tweetFilter(search, tweet){
	if((tweet).indexOf(search) >= 0){
		return true;
	}
}
function twitterTrends(socket, location, locationType, callback){
	twitter.get('trends/place', {id: location}, function (error, trends, response){
		if (typeof trends !== "undefined"){
			socket.emit(locationType, {
				"trends": trends[0].trends
			});
			if (callback){
				callback(trends[0].trends);
			}
		}
	})
}
function twitterStream(socket, track){
	var search = track;
	var stream = twitter.stream('statuses/filter',{location: [180,90,-180,-90], track: track, filter: "medium"});
	user[socket.id] = {currentTwitterStream: stream};
	console.log("Twitter stream started.");
	stream.on('error', function (error){
		console.log(error);
	})
	stream.on('end', function (response) {
	  socket.emit('end', {response: response})
	});
	stream.on('destroy', function (response) {
	  socket.emit('destroy', {response: response})
	});
	stream.on('delete', function (deleteMessage) {
			console.log(deleteMessage)
	})
	stream.on('tweet', function (data){
		if (data.coordinates && data.coordinates !== null && data.entities.hashtags[0] && data.user.screen_name && data.text) {
	    socket.emit('stream', {
			  "geo": data.coordinates,
	  		"profile": data.user.screen_name,
	  		"tweet": data.text,
	  		"image": data.user.profile_image_url
	  	})
      // for(var i=0; i<Object.keys(search).length; i++){
      // 	if (tweetFilter(search[i], data.text)){
    		// 	socket.emit('stream', {
      // 		  "geo": data.coordinates,
      //   		"profile": data.user.screen_name,
      //   		"tweet": data.text,
      //   		"image": data.user.profile_image_url
      //   	})
      //   	break;
      // 	}
      // }
    }
  });
  setTimeout(function (){
  	stream.stop();
  	console.log("Twitter stream stopped.");
  	socket.emit('inactivity', {response: "Twitter stream closed due to inactivity."});
  }, 180000)
}
module.exports = function Sockets (io){
	io.sockets.on('connection', function(socket) {
		socket.emit('user', {user_id: socket.id});
		console.log("User connected id: ", socket.id);

		socket.on('twitter-stream', function (data){
			YQL.location(data.country)
			.then(function (res){
				var country = res.query.results.Result.country,
				woeid = res.query.results.Result.woeid;
				socket.emit('country', {"country": country});
				twitterTrends(socket, woeid, "countryTrends");
			});
			twitterTrends(socket, 1, "worldTrends", function (world){
				var trendingHashtags = [];
				for (var i = 0; i < Object.keys(world).length; i++) {
					trendingHashtags.push(world[i].name);
				}
				currentWorldHashtags = trendingHashtags;
				twitterStream(socket, trendingHashtags);
			});
		});
		socket.on('hashtagFilter', function (data){
			user[socket.id].currentTwitterStream.stop()
			var hashtags = data.filter;
			if (hashtags.length==0){
				hashtags = currentWorldHashtags;
			}
			twitterStream(socket, hashtags);
		})
		socket.on('search', function (data){
			user[socket.id].currentTwitterStream.stop()
			var search = [];
			search.push(data.filter);
			if (search.length==0){
				search = currentWorldHashtags;
			}
			twitterStream(socket, search);
		})
		socket.on('disconnect', function (){
			console.log("User disconnected id: ", socket.id);
			if(typeof user[socket.id] != 'undefined'){
				user[socket.id].currentTwitterStream.stop();
				delete user[socket.id];
				console.log("Twitter stream closed.");
			}
		})
	});
}