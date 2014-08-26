/**
 * Created by jvecchioli on 8/25/2014.
 */
var amqp = require('amqp');
var amqpmock = require('..');

var scope = amqpmock(amqp,{url: 'amqp://guest:guest@localhost:5672'})
        .exchange('topic_animals', {type: 'topic'})
        .publish('quick.orange.rabbit', 'Hello')
        .publish('lazy.brown.fox', 'World')
        .exchange('work', {type: 'fanout'})
        .publish('', 'approve', {ack: true}) // expect to be acknowledged
        .publish('', 'disapprove', {ack: false}) // expect to be not acknowledged
    ;

var connection = amqp.createConnection({url: 'amqp://guest:guest@localhost:5672'});

connection.on('ready', function(){
    connection.exchange('topic_animals', {type:'topic'}, function(exchange){
        connection.queue('', function(queue){

            queue.bind(exchange.name, '*.*.rabbit');
            queue.bind(exchange.name, 'lazy.#');

            queue.subscribe({ack: false}, function(message){
                console.log(message.data);
            });
        });
    });
    connection.exchange('work', {type:'fanout'}, function(exchange){
        connection.queue('', function(queue){

            queue.bind(exchange.name, '');

            queue.subscribe({ack: true}, function(message){
                console.log(message.data);
                if (message.data === 'approve')
                    queue.shift();
            });
        });
    });
});

setTimeout(function(){
    // This will assert that all specified calls on the scope were performed.
    scope.done();
}, 10);