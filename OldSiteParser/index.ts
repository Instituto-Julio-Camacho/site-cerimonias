import * as cheerio from 'cheerio';
import * as fs from 'fs';
const client = require('https');

import * as moment from 'moment';
import 'moment/locale/pt'

moment.locale('pt');

const file = fs.readFileSync("./html-antigo.html", 'utf8');

const $ = cheerio.load(file);

const captions = $('.caption');
const imageLinks = $('.image-viewer-link');

const descriptions = captions.map((_, element) => {
    const el = cheerio.load(element);

    return el.text();    
});

const dates = descriptions.map(CleanUpDate).map(ConvertToDate);

const hrefs = imageLinks.map((_, imageLink) => {
    return "https://express.adobe.com/page/YFxtGInPgSq6a/" + imageLink.attribs["href"].replace("size=1024", "size=2560");
});

hrefs.toArray().filter((image, index) => index % 2 != 0).forEach((el, index) => {
    console.log(el);    
});

hrefs.toArray().filter((image, index) => index % 2 != 0).reverse().forEach((el, index) => {    
    var filepath = `images/${(index + 1).toString().padStart(3, "0")}.png`;
    //console.log(filepath);
    downloadImage(el, filepath);
});


//dates.toArray().reverse().forEach(d => console.log(d.format("DD/MM/yyyy")));

//descriptions.toArray().reverse().forEach(d => console.log(d))


function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

function ConvertToDate(_, dateString) {        
    return moment(dateString, "LL");
}

function CleanUpDate(_, description) {    
    const findDateString = () => {
        if(description.lastIndexOf("Brasil") != -1) {     
            const date = description.substring(description.lastIndexOf("Brasil") + 6);

            if(date.lastIndexOf("em Rio de Janeiro") != -1) {
                return date.substring(20);
            }

            return date;
        }
        
        return description.substring(description.lastIndexOf("Angola") + 6); 
    }

    const dateString = findDateString();

    return dateString.indexOf("em ") != -1 ? dateString.substring(4) : dateString;
}
