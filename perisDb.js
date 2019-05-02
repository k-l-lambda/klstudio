
import mysql from "mysql";
import mysqlBackbone from "mysql-backbone";



const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

connection.connect();
//console.log("connection:", connection);


const Label = mysqlBackbone.Model.extend({
	connection,
	tableName: "album",
});


const Labels = mysqlBackbone.Collection.extend({
	model: Label,
	connection,
	tableName: "album",
});
const labels = new Labels();


const File = mysqlBackbone.Model.extend({
	connection,
	tableName: "file_register",
});


const Files = mysqlBackbone.Collection.extend({
	model: File,
	connection,
	tableName: "file_register",
});
const files = new Files();



export {
	Label,
	labels,
	File,
	files,
	connection,
};
