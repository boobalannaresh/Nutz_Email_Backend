import express from "express";
import bodyParser from "body-parser";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import * as dotenv from "dotenv";
import cors from "cors";


dotenv.config()
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// IMAP configuration
const imapConfig = {
    user: process.env.EMAIL ,
    password: process.env.PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
};

app.get("/", function (req, res) {
    res.send({ message: "Welcome to email app retrieve the data from inbox" })
})

// Route for retrieving emails
app.get('/emails', (req, res) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                return res.status(500).json({ error: 'Error opening mailbox' });
            }

            let emails = [];
            let total = []
            imap.search(['ALL'], (searchErr, results) => {
                if (searchErr) {
                    return res.status(500).json({ error: 'Error searching for emails' });
                }

                const fetch = imap.fetch(results, { bodies: '' });

                fetch.on('message', (msg, seqno) => {
                    const email = {id: seqno };

                    msg.on('body', (stream, info) => {
                        simpleParser(stream,  (parseErr, parsed) => {
                      
                            if (parseErr) {
                                return res.status(500).json({ error: 'Error parsing email' });
                            }

                            email.from = parsed.from.text;
                            email.to = parsed.to.text;
                            email.subject = parsed.subject;
                            email.date = parsed.date;
                            email.text = parsed.text;

                            emails.push(email);
                            //In Decending order:

                            // var arr =[10,3,50,100,23]

                            // var res = emails.id.sort(function(a,b){

                            //  return b-a
                            // })
                            // // console.log(res) //[ 100, 50, 23, 10, 3 ]

                            // emails += res

                            // console.log(emails);
                            // total += await client.db("Email").collection("inbox").insertMany(emails);
                        });
                    });

                    msg.once('end', () => {
                        // Handle any additional processing after fetching an email
                    });
                });

                fetch.once('error', (err) => {
                    res.status(500).json({ error: 'Error fetching emails' });
                });

                fetch.once('end', () => {
                    imap.end();
                    res.json(emails);
                });
            });
        });
    });

    imap.once('error', (err) => {
        res.status(500).json({ error: 'Error connecting to IMAP server' });
    });

    imap.connect();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});