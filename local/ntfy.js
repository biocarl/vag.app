const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const fs = require('fs');
const path = require('path'); // Add this line
const base64 = require('base-64');
const EventSource = require('eventsource');
// const NTFY_URL = "https://ntfy.sh"
const NTFY_URL = "http://localhost:80"

async function publish(topic, messageJsonFile) {
  const message = JSON.parse(fs.readFileSync(path.join(__dirname, messageJsonFile), 'utf8')); // Update this line
  const base64Message = base64.encode(JSON.stringify(message));

  try {
    const response = await axios.post(NTFY_URL, {
      topic: topic,
      message: base64Message,
      title: 'Event published',
      tags: message.tags || [],
      attach: message.attach || '',
    });
    console.log(`Status: ${response.status}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}


async function subscribe(topic) {
  try {
    const response = await axios.get(`${NTFY_URL}/${topic}/json?poll=1`);
    const base64Message = response.data.message;

    if (base64Message) {
      const messageJson = JSON.parse(Buffer.from(base64Message, 'base64').toString('utf-8'));
      console.log("Decoded Message:", messageJson);
    } else {
      console.error("No message received from the topic");
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}


async function subscribeLive(topic) {
  try {
    const eventSource = new EventSource(`${NTFY_URL}/${topic}/sse`);
    eventSource.onmessage = (e) => {
      const decodedData = JSON.parse(e.data);
      const decodedMessage = atob(decodedData.message);
      console.log('Decoded Message:', decodedMessage);
    };
    console.log('Subscribing to live updates...');
  } catch (err) {
    console.error('An error occurred:', err);
  }
}
function printHelp() {
  console.log(`
Usage:
Publish message to presenter/client topic

Note that the topic name is the channel name and presenter/client (with / delimiter) value (e.g. java-2022/presenter or java-2022/client)
npm run publish -- <channel/audience> <message.json>
Listen to client/presenter topic

npm run subscribeLive -- <channel/audience>
Retrieve last published event

npm run subscribe -- <channel/audience>

Options:
  node ntfy.js --help                                 Show this help message

Examples:
  node ntfy.js --publish meinThema message.json       Publish a message to 'meinThema' topic
  node ntfy.js --subscribe meinThema                  Receive messages from 'meinThema' topic
  node ntfy.js --subscribe-live meinThema             Receive live updates of messages from 'meinThema' topic

Note:
A sample message.json file is available in the scripts/ntfy folder. You can use it as a reference or modify it according to your needs.
  `);
}

const command = process.argv[2];
let topicBasename = process.argv[3];
let components = topicBasename.split("/");
let hasError = false;

if(components.length != 2){
  hasError = true;
}

let topic;
if(components[1] === "presenter"){
  topic =  components[0] + "_presenter_topic";
} else if (components[1] === "client"){
  topic = components[0] + "_presenter_client";
}else{
  hasError = true;
}

if(hasError){
  console.error('Ungültige Eingabe. Verwenden Sie "--help", um Anweisungen zur Verwendung des Skripts anzuzeigen.');
  return;
}

if (command === '--publish') {
  const messageJsonFile = process.argv[4];
  publish(topic, messageJsonFile);
} else if (command === '--subscribe-live') {
  subscribeLive(topic);
} else if (command === '--subscribe') {
    subscribe(topic);
} else if (command === '--help') {
  printHelp();
} else {
  console.error('Ungültige Eingabe. Verwenden Sie "--help", um Anweisungen zur Verwendung des Skripts anzuzeigen.');
}
