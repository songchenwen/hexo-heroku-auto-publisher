var sys = require('sys');
var child_process = require('child_process');
var request = require('request');
var fs = require('fs');
var exec = child_process.exec;
var async = require('async');

var files_to_download = [
{
    src: 'https://gist.github.com/emptyzone/63a27d4653d1f3b82c1c/raw/41381f988aa541e12698b8e76f7b2fb7b94828bb/app.js',
    dest: 'app.js'
},
{
    src: 'https://gist.github.com/emptyzone/63a27d4653d1f3b82c1c/raw/3c4f43810805c88cac91497ec8e45ce713643e23/Procfile',
    dest: 'Procfile'
},
{
    src: 'https://gist.github.com/emptyzone/63a27d4653d1f3b82c1c/raw/138000bac2859bdfd590fb467cfe383ad89b598b/known_hosts',
    dest: '.ssh/known_hosts'
}];

var commands = [
'ssh-keygen -t rsa -f .ssh/id_rsa -q -N ""',
'npm install hexo async express body-parser hexo-migrator-issue --save'
];

var transform = function(args, callback){
    if(fs.existsSync('.ssh')){
        sys.puts('cleaning...');
        exec('rm -rf .ssh', function(error, stdout, stderr){
                afterClean();
             });
    }else{
        afterClean();
    }
}

function afterClean(){
    fs.mkdirSync('.ssh');
    downloadFiles(function(error){
                  if(!error){
                  runCommands(function(error){
                              if(!error){
                              sys.puts('Add the following ssh key to https://github.com/settings/ssh \n');
                              exec('cat .ssh/id_rsa.pub', function(error, stdout, stderr){
                                   sys.puts(stdout);
                                   if(!error){
                                   sys.puts('\nTransform success.\nFor the next steps, check here\n   https://emptyzone.github.io');
                                   }else{
                                   sys.puts('error: ' + error + '\n' + stderr);
                                   }
                                   });
                              }
                              });
                  }
    });
}

function runCommands(callback){
    async.eachSeries(commands, function(command, next){
                        sys.puts(command);
                        exec(command, function(error, stdout, stderr){
                             sys.puts(stdout);
                             if(error){
                                sys.puts('error: ' + error + '\n' + stderr);
                                callback(error);
                             }else{
                                next();
                             }
                        });
                     }, callback);
}

function downloadFiles(callback){
    sys.puts('downloading files');
    async.each(files_to_download, function(file, next){
                     download(file.src, file.dest, function(error){
                              if(error){
                                sys.puts('error downloading ' + file.dest);
                                callback(error);
                              }else{
                                next();
                              }
                              });
                     }, callback);
}

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    request(url, function(error, response, body){
                if (!error && response.statusCode == 200) {
                    file.write(body);
                    file.close(cb);
                    sys.puts(dest + ' downloaded');
                }else{
                    fs.unlink(dest);
                    if (cb) cb(error);
                }
            });
};


hexo.extend.console.register('make_auto_publisher', 'Transform to heroku auto publisher', {alias : 'mp'}, transform);