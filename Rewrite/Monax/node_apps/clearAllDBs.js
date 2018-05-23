'use strict';
//this is for sending a request for superagent
const request = require('superagent');
//db server location
var webAddress = 'http://localhost:';
var port = '5984';

request("GET", webAddress + port + '/_all_dbs')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .end((err, res) => {
        if (res) {
            console.log(res.text);
            var dbs = res.text.replace('[', '').replace(']', '').split(',');
            //console.log(dbs[0].substring(1,dbs[j].length-1));
            for (let j = 0; j < dbs.length; j++) {
                console.log(j + ' -> ' + (dbs[j]));
                request("DELETE", webAddress + port + '/' + dbs[j].substring(1, dbs[j].length - 1))
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .end((err, res) => {
                        if (res) {
                            console.log(res.text);
                        }
                        else { console.log(err.text) }
                    });//req
            }//for

        }//if
        else { console.log(err.text) }
    });



