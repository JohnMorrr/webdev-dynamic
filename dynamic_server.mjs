import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

const db = new sqlite3.Database(path.join(__dirname, 'assignment2.sqlite3'), sqlite3.OPEN_READONLY,(err)=> {
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


//John Morrison's Dynamic Route
app.get('/major_category/:category', (req, res) => { 
    let cat  = req.params.category;
    if(cat=="Biology"){
      cat = "Biology & Life Science";
    }else if(cat=="CompSci"){
      cat = "Computers & Mathematics";
    }

  
    let prom1 = dbSelect('SELECT * FROM recent_grads WHERE  major_category = ?', [cat]);
    let prom2 = dbSelect('SELECT * FROM all_ages WHERE  major_category = ?', [cat]);
    let prom3 = fs.promises.readFile(path.join(template, 'major_category.html'), 'utf-8');
    Promise.all([prom1,prom2,prom3]).then((results) => {
      let response = results[2].replace('$$MAJOR_CATEGORY$$',cat);  // results[2] = index where p3 is, results[1] is index where p2 is in Promise.all() list
      let table_body = '';
      results[0].forEach((major, index) =>{
          let table_row = '<tr>';
          table_row += '<td>' + major.major + '</td>';
          table_row += '<td>' +major.major_code + '</td>';
          table_row += '<td>' + major.employed + '</td>';
          table_row += '<td>' + major.unemployed+ '</td>';
          table_row += '<td>' + major.college_jobs; + '</td>';
          table_row += '<td>' + major.non_college_jobs + '</td>';
          table_row += '</tr>';
          table_body += table_row;
      });
      if(table_body==''){
        alert(`404 Error: Major Category Not Found: '${cat}' `);
      }
      response = response.replace('$$TABLE_BODY$$', table_body);
  
      res.status(200).type('html').send(response);
  
    }).catch((error)=>{
      res.status(404).type('txt').send(`404 Error: Major Category Not Found '${cat}' `);
    });
  });



/* Brian Do's dynamic route */
app.get('/median/:median', (req, res) => {
    let median = req.params.median;

    let prom1 = dbSelect('SELECT * FROM ALL_AGES WHERE median=?', [median]);
    let prom2 = fs.promises.readFile(path.join(template, 'median.html'), 'utf-8');
    Promise.all([prom1, prom2]).then((results) => {
        let response = results[1].replace('$$MEDIAN$$', results[0][0].median);
        let table_body = '';
        results[0].forEach((median, index) => {
            let table_row = '<tr>';
            table_row += '<td>' + median.major;
            table_row += '<td>' + median.major_category;
            table_row += '<td>' + median.total;
            table_row += '<td>' + median.employed;
            table_row += '<td>' + median.unemployed;
            table_row += '<td>' + median.median;

            table_row += '<tr>';
            table_body += table_row;
        });
        response = response.replace('$$TABLE_BODY$$', table_body);

        res.status(200).type('html').send(response);

    }).catch((error) => {
        res.status(400).type('txt').send(`404 Error: Median Not Found: '${median}' `);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
