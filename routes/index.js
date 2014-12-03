var ip = require('ip').address();
module.exports = function Routes (app){
	app.get('/', function (req, res){
	  res.render('index', { title: 'The Twitter Globe' });
	});
}


