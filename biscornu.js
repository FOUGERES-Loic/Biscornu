const tmi = require('tmi.js');
const reactions = require('./reactions.js');
const options = require('./options.js');

const client = new tmi.client(options); // Create a client with our options
const prefix = "!"; // Define the prefix used to identify a command for the bot

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot

    // Remove whitespace from chat message
    const trimedMessage = msg.trim();
    const fullCommand = commandParser(trimedMessage);
    const cooldownRoll = cooldown(client, client.say, 5000);

    if(fullCommand){
        let command = fullCommand[1];
        let param = fullCommand[2].trim();
        let executed = true;

        switch(command){
            case "roll":
                client.say(target, roll(param, context['display-name'], false));
                break;
            case "rolls":
                client.say(target, roll(param, context['display-name'], true));
                break;
            /*case "help":
                client.say(target, `Désolé, pas encore de page d'aide!`);
                break;*/
            default:
                executed = false;
            //    client.say(target, `Commande '${command}' non reconnue. Tapez ${prefix}help pour la liste des commandes de ` + client.getUsername());
        }
        if (executed) {
            console.log(`* Executed ${command} command`);
        } else {
            console.log(`* Unknown command ${command}`);
        }
    } else {
        let words = trimedMessage.toLowerCase().split(" ");
        for(let word of words) {
            if (word === 'bonjour') {
                client.say(target, "Bonjour à toi " + context['display-name']);
            } else {
                let reaction = reactions[word];
                if (reaction) {
                    client.say(target, reaction);
                }
            }
        }
    }
}

// Function called when the "roll" command is issued
function roll (param, username, multiple) {
    if (!param) {
        param = "1d20";
    }
    const separator = param.indexOf('-') !== -1 ? '-' : '+';
    const bonusParts = param.split(separator);
    const parts = bonusParts[0].trim().split('d');

    let bonus = bonusParts.length === 2 && Number.isInteger(bonusIntValue = parseInt(bonusParts[1])) ? bonusIntValue = parseInt(bonusParts[1]) : 0;
    if (separator === '-') {
        bonus = 0 - bonus;
    }

    if (parts.length !== 2 || parseInt(parts[1]) === 0 || !Number.isInteger(parseInt(parts[0])) && parts[0] !== '' || !Number.isInteger(parseInt(parts[1]))) {
        return `Bien tenté, ${username}... mais non.`;
    }

    const sides = parts[1];
    const numberOfDices = parseInt(parts[0]) !== 0 && parts[0] !== '' ? parts[0] : 1;

    const result = multiple ? rollSeparateDices (sides, numberOfDices, bonus) : rollDice (sides, numberOfDices, bonus);
    const returnMsg = multiple ? "des jets" : "du jet";

    return `Résultat ${returnMsg} de ${param} : ${result}`;
}

function rollDice (sides, numberOfDices, bonus) {
    let result = 0;
    for (let i = 0; i < numberOfDices ; i++) {
        result += Math.floor(Math.random() * sides) + 1;
    }
    result += bonus;

    return result;
}

function rollSeparateDices (sides, numberOfDices, bonus) {
    let result = "";
    for (let i = 0; i < numberOfDices ; i++) {
        result += Math.floor(Math.random() * sides) + 1 + bonus;
        result += ", ";
    }
    result = result.substr(0,result.length - 2);

    return result;
}

function commandParser(message){
    let prefixEscaped = prefix.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let regex = new RegExp("^" + prefixEscaped + "([a-zA-Z]+)\s?(.*)");
    return regex.exec(message);
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}

function cooldown(thisArg, fn, timeout) {
    var onCooldown = false;

    // return a function that can be called the same way as the wrapped function
    return function (/* args */) {

        // only call the original function if it is not on cooldown
        if (!onCooldown) {

            // not on cooldown, so call the function with the correct context
            // and the arguments with which this wrapper was called
            fn.apply(thisArg, arguments);

            // set the cooldown flag so subsequent calls will not execute the function
            onCooldown = true;

            // wait <timeout> milliseconds before allowing the function to be called again
            setTimeout(function () {
                onCooldown = false;
            }, timeout);
        }
    }
}