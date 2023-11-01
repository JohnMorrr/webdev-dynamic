import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

const db = new sqlite3.Database(path.join(__dirname, 'college_majors.sqlite3'), sqlite3.OPEN_READONLY,(err)=> {
    if (err){
        console.log('Error connecting to database');
    }
    else {
        console.log('Connected to Database');
    }
});

function dbSelect(query,params){
    let p = new Promise((resolve, reject) =>{
        db.all(query, params, (err, rows) => {
            if(err){
                reject(err)
            }else {
                resolve(rows);
            }
        });
    });
    return p;
}

let app = express();
app.use(express.static(root));


/*  John Morrison's dynamic route

app.get('/major/:major_category', (req, res) => { 
    let major  = req.params.major;
  
    let prom1 = dbSelect('SELECT * FROM MAJORS_LIST WHERE  major_category = ?', [major.toUpperCase()]);
    let prom2 = dbSelect('SELECT * FROM RECENT_GRADS WHERE major=?', [major.toUpperCase()]);
    let prom3 = fs.promises.readFile(path.join(template, 'major_category.html'), 'utf-8');
    Promise.all([prom1,prom2,prom3]).then((results) => {
      let response = results[2].replace('$$MAJOR_CATEGORY$$',results[1][0].major);  // results[2] = index where p3 is, results[1] is index where p2 is in Promise.all() list
      let table_body = '';
      results[0].forEach((major, index) =>{
          let table_row = '<tr>';
          table_row += '<td>' + major.major + '</td>';
          table_row += '<td>' + major.employed + '</td>';
          table_row += '<td>' + major.unemployed + '</td>';
          table_row += '<td>' + major.unemployed_rate+ '</td>';
          table_row += '<td>' + major.college_jobs; + '</td>';
          table_row += '<td>' + major.non_college_jobs + '</td>';
  
          table_row += '</tr>';
          table_body += table_row;
      });
      response = response.replace('$$TABLE_BODY$$', table_body);
  
      res.status(200).type('html').send(response);
  
    }).catch((error)=>{
      res.status(400).type('txt').send(`404 Error: Major Not Found: '${major}' `);
    });
  });
*/


/* Brian Do's Dynamic Route*/
app.get('/major/:median', (req, res) => {
    let major = req.params.major;

    let prom1 = dbSelect('SELECT * FROM MAJORS_LIST WHERE median = ?', [major.toUpperCase()]);
    let prom2 = dbSelect('SELECT * FROM ALL_AGES WHERE major=?', [major.toUpperCase()]);
    let prom3 = fs.promises.readFile(path.join(template, 'median.html'), 'utf-8');
    Promise.all([prom1, prom2, prom3]).then((results) => {
        let response = results[2].replace('$$MEDIAN$$', results[1][0].major);
        let table_body = '';
        results[1].forEach((major, index) => {
            let table_row = '<tr>';
            table_row += '<td>' + major.major + '<td>';
            table_row += '<td>' + major.major_category + '<td>';
            table_row += '<td>' + major.total + '<td>';
            table_row += '<td>' + major.employed + '<td>';
            table_row += '<td>' + major.unemployed + '<td>';
            table_row += '<td>' + major.unemployed_rate + '<td>';
            table_row += '<td>' + major.median + '<td>';

            table_row += '<tr>';
            table_body += table_row;
        });
        response = response.replace('$$TABLE_BODY$$', table_body);

        res.status(200).type('html').send(response);

    }).catch((error) => {
        res.status(400).type('txt').send(`404 Error: Major Not Found: '${major}' `);
    });
});





app.listen(port, () => {
    console.log('Now listening on port ' + port);
});