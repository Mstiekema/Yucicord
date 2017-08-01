var db = require('./modules/db.js').connection

db.query(
	'CREATE TABLE songrequest (' +
	'id INT AUTO_INCREMENT PRIMARY KEY,' +
	'time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
	'name VARCHAR(30),' +
	'title VARCHAR(100),' +
	'thumb VARCHAR(250),' +
	'length INT,' +
	'songid VARCHAR(30),' +
	'playState INT DEFAULT FALSE)',
	function (err, result) {if (err) {return}}
)

db.query(
	'CREATE TABLE user (' +
	'name VARCHAR(32),' +
	'userId VARCHAR(20) PRIMARY KEY,' +
	'points INT,' +
	'time INT)',
	function (err, result) {if (err) {return}}
)

db.end();