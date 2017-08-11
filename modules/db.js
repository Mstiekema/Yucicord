var mysql = require("mysql");
var config = require("../config.js")
var connection;

module.exports = {
  mysqlConn: function() {
    if (!connection) {
      connection = mysql.createConnection({
        host: 'localhost',
        user: config.info.user,
        password: config.info.password,
        database: config.info.database,
        port: 3306
      });
      connection.connect(function(err) {
        if(err) {
          console.log('Database connection error: ', err);
          process.exit(1)
        }
      });
    }
    return connection;
  }
}

module.exports.mysqlConn()
module.exports.connection = connection