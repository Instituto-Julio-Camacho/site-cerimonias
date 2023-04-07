"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("cheerio");
var fs = require("fs");
var client = require('https');
var moment = require("moment");
require("moment/locale/pt");
moment.locale('pt');
var file = fs.readFileSync("./html-antigo.html", 'utf8');
var $ = cheerio.load(file);
var captions = $('.caption');
var imageLinks = $('.image-viewer-link');
var descriptions = captions.map(function (_, element) {
    var el = cheerio.load(element);
    return el.text();
});
var dates = descriptions.map(CleanUpDate).map(ConvertToDate);
var hrefs = imageLinks.map(function (_, imageLink) {
    return "https://express.adobe.com/page/YFxtGInPgSq6a/" + imageLink.attribs["href"].replace("size=1024", "size=2560");
});
hrefs.toArray().filter(function (image, index) { return index % 2 != 0; }).forEach(function (el, index) {
    console.log(el);
});
hrefs.toArray().filter(function (image, index) { return index % 2 != 0; }).reverse().forEach(function (el, index) {
    var filepath = "images/".concat((index + 1).toString().padStart(3, "0"), ".png");
    //console.log(filepath);
    downloadImage(el, filepath);
});
//dates.toArray().reverse().forEach(d => console.log(d.format("DD/MM/yyyy")));
//descriptions.toArray().reverse().forEach(d => console.log(d))
function downloadImage(url, filepath) {
    return new Promise(function (resolve, reject) {
        client.get(url, function (res) {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', function () { return resolve(filepath); });
            }
            else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error("Request Failed With a Status Code: ".concat(res.statusCode)));
            }
        });
    });
}
function ConvertToDate(_, dateString) {
    return moment(dateString, "LL");
}
function CleanUpDate(_, description) {
    var findDateString = function () {
        if (description.lastIndexOf("Brasil") != -1) {
            var date = description.substring(description.lastIndexOf("Brasil") + 6);
            if (date.lastIndexOf("em Rio de Janeiro") != -1) {
                return date.substring(20);
            }
            return date;
        }
        return description.substring(description.lastIndexOf("Angola") + 6);
    };
    var dateString = findDateString();
    return dateString.indexOf("em ") != -1 ? dateString.substring(4) : dateString;
}
