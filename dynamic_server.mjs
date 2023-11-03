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

//Gullet's Dynamic Route
app.get('/p25th.html', (req, res) => { 
    let number  = req.params.number;
  
    let prom1 = dbSelect('SELECT * FROM ALL_AGES ORDER BY p25th ASC');
    let prom2 = fs.promises.readFile(path.join(template, 'percent.html'), 'utf-8');
    Promise.all([prom1,prom2]).then((results) => {
        let response = results[1].replace('$$P25TH$$');     
      let table_body = '';
      results[0].forEach((number, index) =>{
          let table_row = '<tr>';
          table_row += '<td>' + number.major + '</td>';
          table_row += '<td>' +number.employed + '</td>';
          table_row += '<td>' + number.unemployed + '</td>';
          table_row += '<td>' + number.unemployed_rate+ '</td>';
          table_row += '<td>' + number.median; + '</td>';
          table_row += '<td>' + number.p25th + '</td>';
  
          table_row += '</tr>';
          table_body += table_row;
      });
      response = response.replace('$$TABLE_BODY$$', table_body);
  
      res.status(200).type('html').send(response);
  
    }).catch((error)=>{
      res.status(400).type('txt').send(`404 Error: number Not Found: '${number}' `);
    });
  });


app.get('/p25th/:number', (req, res) => {
    let number = req.params.number;

    let prom1 = dbSelect('SELECT * FROM ALL_AGES WHERE p25th = ? ORDER BY p25th ASC', [number.toUpperCase()]);
    let prom2 = fs.promises.readFile(path.join(template, 'percent.html'), 'utf-8');
    Promise.all([prom1,prom2]).then((results) => {
        let response = results[1].replace('$$P25TH$$', results[0][0].number);        // results[2] = index where p3 is, results[1] is index where p2 is in Promise.all() list
      let table_body = '';
      results[0].forEach((number, index) =>{
          let table_row = '<tr>';
          table_row += '<td>' + number.major + '</td>';
          table_row += '<td>' +number.employed + '</td>';
          table_row += '<td>' + number.unemployed + '</td>';
          table_row += '<td>' + number.unemployed_rate+ '</td>';
          table_row += '<td>' + number.median; + '</td>';
          table_row += '<td>' + number.p25th + '</td>';
  
          table_row += '</tr>';
          table_body += table_row;
      });
      response = response.replace('$$TABLE_BODY$$', table_body);
  
      res.status(200).type('html').send(response);
  
    }).catch((error)=>{
      res.status(400).type('txt').send(`404 Error: Number Not Found: '${number}' `);
    });
  });


//John Morrison's Dynamic Route
//John Morrison's Dynamic Route
app.get('/major_category/:category', (req, res) => { 
    let cat  = req.params.category;
    if(cat=="Biology"){
      cat = "Biology & Life Science";  
    }else if(cat=="CompSci"){
      cat = "Computers & Mathematics";
    }

    //promises
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

      //Text generation
      if(cat == "Biology & Life Science"){
        response = response.replace('No information available', 'Biology is the scientific study of life. It is a natural science with a broad scope but has several unifying themes that tie it together as a single, coherent field. For instance, all organisms are made up of cells that process hereditary information encoded in genes, which can be transmitted to future generations. Another major theme is evolution, which explains the unity and diversity of life. Energy processing is also important to life as it allows organisms to move, grow, and reproduce. Finally, all organisms are able to regulate their own internal environments. *via wikipedia' );
        response=response.replace('$$image.png$$', 'https://t.ly/tyRPo');
      }else if(cat =="Computers & Mathematics"){
        response=response.replace('No information available', 'Computer science is the study of computation, information, and automation. Computer science spans theoretical disciplines (such as algorithms, theory of computation, and information theory) to applied disciplines (including the design and implementation of hardware and software). Though more often considered an academic discipline, computer science is closely related to computer programming. *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/gG_Xy');
      }else if(cat=="Arts"){
        response = response.replace('No information available', 'Arts in education is an expanding field of educational research and practice informed by investigations into learning through arts experiences. In this context, the arts can include Performing arts education (dance, drama, music), literature and poetry, storytelling, Visual arts education in film, craft, design, digital arts, media and photography. *via wikipedia ');
        response=response.replace('$$image.png$$', 'https://t.ly/1g4M9');
      }else if(cat=="Engineering"){
        response = response.replace('No information available', 'Engineering is the practice of using natural science, mathematics, and the engineering design process to solve technical problems, increase efficiency and productivity, and improve systems. Modern engineering comprises many subfields which include designing and improving infrastructure, machinery, vehicles, electronics, materials, and energy systems. *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/wFzoc');
      }else if(cat=="Health"){
        response = response.replace('No information available', 'Health sciences – those sciences that focus on health, or health care, as core parts of their subject matter. Health sciences relate to multiple academic disciplines, including STEM disciplines and emerging patient safety disciplines (such as social care research). *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/jYN84');
      }else if(cat=="Business"){
        response = response.replace('No information available', 'Business studies, often simply called business, is a field of study that deals with the principles of business, management, and economics. It combines elements of accountancy, finance, marketing, organizational studies, human resource management, and operations. Business studies is a broad subject,[2] where the range of topics is designed to give the student a general overview of the various elements of running a business. The teaching of business studies is known as business education *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/tpMYw');
      }else if(cat=="Physical Sciences"){
        response = response.replace('No information available','Physical science is a branch of natural science that studies non-living systems, in contrast to life science. It in turn has many branches, each referred to as a "physical science", together is called the "physical sciences" history of the branch of natural science that studies non-living systems, in contrast to the life sciences. It in turn has many branches, each referred to as a "physical science", together called the "physical sciences". However, the term "physical" creates an unintended, somewhat arbitrary distinction, since many branches of physical science also study biological phenomena (organic chemistry, for example). The four main branches of physical science are astronomy, physics, chemistry, and the Earth sciences, which include meteorology and geology *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/mtKLA');
      }else if(cat=="Education"){
        response = response.replace('No information available','Education is the transmission of knowledge, skills, and character traits. Its precise definition is disputed and there are disagreements about what the aims of education are and to what extent education is different from indoctrination by fostering critical thinking. These disagreements affect how to identify, measure, and improve forms of education. The term "education" can also refer to the mental states and qualities of educated people and the academic field studying educational phenomena. *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/qzDnZ');
      }else if(cat=="Humanities & Liberal Arts"){
        response = response.replace('No information available','Liberal arts education (from Latin liberalis "free" and ars "art or principled practice") is the traditional academic course in Western higher education. Liberal arts takes the term art in the sense of a learned skill rather than specifically the fine arts. Liberal arts education can refer to studies in a liberal arts degree course or to a university education more generally. Such a course of study contrasts with those that are principally vocational, professional, or technical, as well as religiously based courses. *via wikipedia');
        response=response.replace('$$image.png$$', 'https://t.ly/LEX09');
        }

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
