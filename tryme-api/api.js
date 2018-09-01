const express    = require('express');
const app        = express();
var cors         = require('cors');
var bodyParser   = require('body-parser');
var jwt          = require('jsonwebtoken');
var path         = require('path');
const fs         = require('fs');
var TrymeNetwork = require('./api/lib/trymeNetwork');
var MiddleWare   = require('./api/lib/middleware');
var ErrorFilter  = require('./api/lib/errorFilter');
var crypto       = require('sha256');
const port = 3097;
const appSecret = "wqXZF/I+LU[2l/=31DeA,%LX<nKkz@z!#2bkm,l<!FyvMk#Q:H,H3pDqDCsQ6md~";
const trialId = "25";
const superAdmin = crypto("shubhdeep.singh@mobileprogrammingllc.com"); //"9dea63105e323a5e201e01cc947fe93b6a9fc018323cfe62df83ea137621fde5";
const admin = crypto("admin@takeda.com"); //"hf17fda18c680984b48e9e1eaaf983aab87759c8a7c1250203053e40e753623e"; // Shubdeep
const cro = crypto("admin@takeda.com");
// const userTypes = {
//     "SuperAdmin" : 1,
//     "Admin":2,
//     "Sponsor":3,
//     "CRO":4,
//     "PI":5,
//     "SiteCoordinator":6
// };


app.use(bodyParser.urlencoded({ extended: true }));
app.use( bodyParser.json() );
app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});

async function initNetwork(){
    console.log("Initializing Blockchain Default Data");
    InitializeNetworkArtifacts();
}

initNetwork();




// Currently this API only gives access to Singup
app.post('/api/adminTransaction', async function (req, res) {
    let transactionName = req.headers.transaction;
    let network = new TrymeNetwork();
    let hash  = network.getHash(admin,'Admin');
    var transactionData = req.body;
    console.log('Admin Transaction Start: '+transactionName);
    try{
        transactionData['Trial'] = trialId;
        let response = await network.doTransaction(transactionData,transactionName, hash+'@tryme');
        // let accessKey = Math.random().toString(36).substring(2,15);
        var token = jwt.sign({ Secret : response.Secret, AccessKey : response.AccessKey, Email : transactionData.Email }, trialId);
        await network.identityIssue(req.body.Email, 'Subject',hash+'@tryme');
        console.log('Admin Transaction Done: '+transactionName);
        res.json({ success: true, token: token });
    }
    catch(e){
        console.log('Admin Transaction Error: '+transactionName);
        let ef = new ErrorFilter(e).filterError();
        res.status(500).json({ error: ef });
    }
});


app.post('/api/trialTransaction', async function (req, res) {
    let token = req.headers.accesstoken;
    let transactionName = req.headers.transaction;
    let cardName = superAdmin+"@tryme";
    var transactionData = req.body;
    let network = new TrymeNetwork();
    if(token){
        try{
            let data = jwt.verify(token, appSecret);
            cardName = data.Card+'@tryme';
            if(transactionName == "QualifySubject")
                transactionData["Trial"] = trialId;
            let response = await network.doTransaction(transactionData,transactionName, cardName);
            
            res.json({ success: true, subjectId : response });
        }
        catch(e){
            let ef = new ErrorFilter(e).filterError();
            res.status(500).json({ error: ef });
        }
    }
    else{
        res.status(500).json({error: "Token Missing"});
    }
});

app.post('/api/getList', async function (req, res) {
    let token = req.headers.accesstoken;
    let cardName = superAdmin+"@tryme";
    var transactionData = req.body;
    let network = new TrymeNetwork();
    if(token){
        try{
            console.log("Get List Called !!");
            let data = jwt.verify(token, appSecret);
            cardName = data.Card+'@tryme';
            let response = await network.getList(req.body , cardName);
            
            res.json({ success: true, list : response });
        }
        catch(e){
            console.log("Get List Call Failed !!");
            res.status(500).json({error: e.toString()});
        }
    }
    else{
        console.log("Get List Call Failed !!");
        res.status(500).json({error: "Token Missing"});
    }
});

app.post('/api/queryArray', async function (req, res) {
    let token = req.headers.accesstoken;
    let cardName = superAdmin+"@tryme";
    var transactionData = req.body;
    let network = new TrymeNetwork();
    if(token){
        try{
            console.log("Query Array Called !!");
            let data = jwt.verify(token, appSecret);
            cardName = data.Card+'@tryme';
            let response = await network.queryArray(req.body , cardName);
            res.json({ success: true, list : response });
        }
        catch(e){
            console.log("Query Array Failed Failed !!");
            res.status(500).json({error: e.toString()});
        }
    }
    else{
        console.log("Query Array Call Failed !!");
        res.status(500).json({error: "Token Missing"});
    }
});


app.post('/api/getItem', async function (req, res) {
    let token = req.headers.accesstoken;
    let cardName = superAdmin+"@tryme";
    var transactionData = req.body;
    let network = new TrymeNetwork();
    if(token){
        try{
            console.log("Get Item Called !!");
            let data = jwt.verify(token, appSecret);
            cardName = data.Card+'@tryme';
            let response = await network.getItem(req.body , cardName);
            
            res.json({ success: true, list : response });
        }
        catch(e){
            console.log("Get Item Call Failed !!");
            res.status(500).json({error: e.toString()});
        }
    }
    else{
        console.log("Get Item Call Failed !!");
        res.status(500).json({error: "Token Missing"});
    }
});

// Complete
app.post('/api/createTrialUser', async function (req, res) {
    let token = req.headers.accesstoken;
    let cardName = superAdmin+"@tryme";
    let transactionData = req.body;
    let userType = req.body.UserType;
    delete transactionData.UserType;
    if(token){
        let data = jwt.verify(token, appSecret);
        cardName = data.Card+'@tryme';
    }
    let network = new TrymeNetwork();
    
    try{
        console.log('Adding Trial User');
        await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry',userType,cardName);
        console.log('Issueing Identity to Trial User');
        let issueIdentity = false;
        if(transactionData.UserType == "Admin" || transactionData.UserType == "SuperAdmin")
            issueIdentity = true;
        await network.identityIssue(transactionData.UserEmail, userType,cardName, issueIdentity);
        res.json({ success: true });
    }
    catch(e){
        let ef = new ErrorFilter(e).filterError();
        res.status(500).json({ error: ef });
    }
});




app.post('/api/createTrialUsers', async function (req, res) {
    let token = req.headers.accesstoken;
    let cardName = superAdmin+"@tryme";
    let transactionData = req.body;
    let userType = req.body.UserType;
    delete transactionData.UserType;
    if(token){
        let data = jwt.verify(token, appSecret);
        cardName = data.Card+'@tryme';
    }
    let network = new TrymeNetwork();
    
    try{
        console.log('Adding Trial User');
        await network.addResourceGroup(transactionData,'AddParticipant', 'ParticipantRegistry',userType,cardName);
        console.log('Issueing Identity to Trial User');
        let issueIdentity = false;
        if(transactionData.UserType == "Admin" || transactionData.UserType == "SuperAdmin")
            issueIdentity = true;
        transactionData.Users.forEach(async (tran) => {
            await network.identityIssue(tran.UserEmail, userType,cardName, issueIdentity);
        });
        res.json({ success: true });
    }
    catch(e){
        let ef = new ErrorFilter(e).filterError();
        res.status(500).json({ error: ef });
    }
});

// Complete
app.post('/api/createAsset', async function (req, res) {
    let token = req.headers.accesstoken;
    if(req.headers.asset == "Document")
        req.body["RelatedTrial"] = trialId;
    if(token){
        let data = jwt.verify(token, appSecret);
        cardName = data.Card+'@tryme';
        let network = new TrymeNetwork();
        try{
            await network.doGeneralTransaction(req.body,'AddAsset', 'AssetRegistry',req.headers.asset,cardName);
            res.json({ success: true });
        }
        catch(e){
            let ef = new ErrorFilter(e).filterError();
            res.status(500).json({ error: ef });
        }
    }
    else{
        res.status(500).json({error:'Token Missing'});
    }
});

async function InitializeNetworkArtifacts(req, res) {
    // Create Once Single Super Admin
    var network = new TrymeNetwork();
    try{
        let transactionData = {
            "UserEmail" : superAdmin
        };
        console.log('Adding Super Admin using Network Admin');
        await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry','SuperAdmin','admin@tryme');
        console.log('Issueing Identity to Super Admin');
        await network.identityIssue(transactionData.UserEmail, 'SuperAdmin','admin@tryme', true);
    }
    catch(e){
        console.log(e);
        console.log("Super Admin Already Created !!");
    }

    let sa = network.getHash(superAdmin,'SuperAdmin');
    try{
        // Creating Trial Admin
        var transactionData = {
            "UserEmail" : admin,
            "UserTrial" : '',
            "UserTrial" : [trialId]
        };
        console.log('Adding Trial Admin using Super Admin');
        await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry','Admin',sa+'@tryme');
        console.log('Issueing Identity to Trial Admin');
        await network.identityIssue(transactionData.UserEmail, 'Admin',sa+'@tryme', true);
    }
    catch(e){
        // console.log(e);
        console.log("Trial Admin Already Created !!");
    }

    let ad = network.getHash(admin,'Admin');
    try{
        // Creating CRO
        var transactionData = {
            "UserEmail" : cro,
            "OrganizationId" : 'Org1',
            "UserTrial" : [trialId],
            "UserSite" : ["S1"]
        };
        console.log('Adding CRO using Admin');
        await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry','CRO',ad+'@tryme');
        console.log('Issueing Identity to CRO');
        await network.identityIssue(transactionData.UserEmail, 'CRO',ad+'@tryme', false);
    }
    catch(e){
        // console.log(e);
        console.log("CRO Already Created !!");
    }

    // ad = network.getHash(admin,'Admin');
    try{
        // Creating CRO
        var transactionData = {
            "UserEmail" : cro,
            "UserTrial" : [trialId],
            "UserSite" : ["S1"]
        };
        console.log('Adding Site Coordinator using Admin');
        await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry','SiteCoordinator',ad+'@tryme');
        console.log('Issueing Identity to Site Coordinator');
        await network.identityIssue(transactionData.UserEmail, 'SiteCoordinator',ad+'@tryme', false);
    }
    catch(e){
        // console.log(e);
        console.log("Site Coordinator Already Created !!");
    }

    // try{
    //     // Creating CRO
    //     let adminEmail = "9ebe6289b3da633b2bea58d6625cd85ffcf6636c41ce99e44b043f4e9be1b35d@tryme";
    //     var transactionData = {
    //         UserEmail : "hf17fda18c680984b48e9e1eaaf983aab87759c8a7c1250203053e40e753623e",
    //         UserTrial : '',
    //         UserSite : '',
    //         OrganizationId:'Org1'
    //     };
    //     console.log('Adding CRO using Trial Admin');
    //     await network.doGeneralTransaction(transactionData,'AddParticipant', 'ParticipantRegistry','CRO',adminEmail);
    //     console.log('Issueing Identity to CRO');
    //     await network.identityIssue(transactionData.UserEmail, 'CRO',adminEmail);
    // }
    // catch(e){
    //     console.log(e);
    //     console.log("CRO Already Created !!");
    // }

    try{
        // Creating Trial
        var card = network.getHash(admin,'Admin');
        var transactionData = {
            TrialId : trialId,
            TrialName : 'TAK-906'
        };
        console.log('Adding Trial');
        await network.doGeneralTransaction(transactionData,'AddAsset', 'AssetRegistry','Trial', card+'@tryme');
    }
    catch(e){
        // console.log(e);
        console.log("Trial Already Created !!");
    }
    // try{
    //     // Creating Site
    //     var transactionData = {
    //         SiteId : 'SA1-'+trialId,
    //         SiteName : 'TAK-906-S1',
    //         SiteLocation:'NEW YORK',
    //         TrialId : "resource:mp.takeda.tryme.Trial#"+trialId
    //     };
    //     console.log('Adding Site');
    //     await network.doGeneralTransaction(transactionData,'AddAsset', 'AssetRegistry','Site', trialId+'@tryme');
    //     console.log('Complete!!');
    // }
    // catch(e){
    //     console.log(e);
    //     console.log("Site Already Created !!");
    //     console.log('Complete!!');
    // }
};

app.post('/api/subjectTransaction', async function (req, res) {
    let transactionName = req.headers.transaction;
    let cardName;
    try{
        console.log('Subject Transaction Start: '+transactionName);
        if(transactionName == "Login" || transactionName == "ForgotPassword"){
            cardName = req.body.Email+"@tryme";
        }
        else{
            var data = jwt.verify(req.headers.accesstoken, trialId);
            cardName = data.Email+"@tryme";
        }
        
        if(transactionName == "Login"){
            // try{
            req.body["Trial"] = trialId;
            let network = new TrymeNetwork();
            let transactionData = req.body;

            let response = await network.doTransaction(transactionData,transactionName, cardName);
            // console.log(__dirname, path.resolve(__dirname));
            // let accessKey = Math.random().toString(36).substring(2,15);
            let token = jwt.sign({ Secret : response.Secret, AccessKey : response.AccessKey, Email : transactionData.Email }, trialId);
            
            console.log('Subject Transaction Done: '+transactionName);
            res.json({ success: true, token: token });
        }
        else{
            let transactionData = req.body;
            transactionData["Email"] = cardName.split('@tryme').join('');
            let network = new TrymeNetwork();
            
            if( transactionName == "ESignature"){
                // let esignContent = transactionData.ConsentData;
                // transactionData.ConsentData = esignContent;
                transactionData.ConsentDataHash = crypto(transactionData.ConsentData);
                let response = await network.doTransaction(transactionData, transactionName, cardName);
                
                console.log('Subject Transaction Done: '+transactionName);
                res.json({ success: true });
            }
            else{
                console.log('Subject Transaction Error: '+transactionName);
                let response = await network.doTransaction(transactionData, transactionName, cardName);
                res.json({ success: true });
            }
                
        }
    }
    catch(e){
        let ef = new ErrorFilter(e).filterError();
        res.status(500).json({ error: ef });
    }
});


// app.post('/api/trialTransaction', async function (req, res) {
//     var transactionName = req.headers.transaction;
//     var cardName;
//     if(transactionName == "Login"){
//         cardName = req.body.Email+"@tryme";
//     }
//     else{
//         var data = jwt.verify(req.headers.accesstoken, appSecret);
//         cardName = data.Email+"@tryme";
//     }
//     var network = new TrymeNetwork(cardName);
//     var transactionData = req.body;
//     try{
//         await network.doTransaction(transactionData,transactionName);
//         if(transactionName == "LoginUser"){
//             try{
//                 console.log(__dirname, path.resolve(__dirname));
//                 var token = jwt.sign({ Email : req.body.Email }, appSecret);
//                 res.json({ success: true, token : token });
//             }
//             catch(error){
//                 res.json({ msg: "can't read card file" });
//             }
//         }
//         else{
//             res.json({ success: true });
//         }
//     }
//     catch(e){
//         res.status(500).json({error: e.toString()});
//     }
// });


// app.post('/api/qualifySubject', async function (req, res) {
//     var cardName;
//     var transactionData = req.body;
//     try{
//         var data = jwt.verify(req.headers.accesstoken, trialId);
//         cardName = data.id+"@tryme";
//         var network = new TrymeNetwork(cardName);
//         var transactionData = {
//             SubjectId : req.body.SubjectId,
//             Email : req.body.Email,
//             Trial : "resource:mp.takeda.tryme.Trial#"+trialId,
//             Secret : "",
//             CreatedBy : "resource:mp.takeda.tryme.TrialUser#"+data.id
//         };
//         await network.doGeneralTransaction(transactionData,'AddAsset', 'AssetRegistry','SubjectAsset', cardName);
//         res.json({ success: true });
//     }
//     catch(e){
//         res.status(500).json({error: e.toString()});
//     }
// });

// complete
app.post('/api/getToken', async function (req, res) {
    var network = new TrymeNetwork();
    let response = {};
    try{
        let hash = network.getHash(req.body.Email, req.body.UserType);
        let token = jwt.sign({ Card : hash }, appSecret);
        response = { token : token, success: true  };
        res.json(response);
    }
    catch(e){
        res.status(500).json({error: e.toString()});
    }
});

// app.post('/api/loginTrialUser', async function (req, res) {
//     var cardName;
//     // var data = jwt.verify(req.headers.access-token, trialId);
//     // cardName = data.Id+"@tryme";
//     cardName = req.headers.id+"@tryme";
//     var network = new TrymeNetwork(cardName);
//     // var transactionData = req.body;
//     try{
//         // var transactionData = {
//         //     SubjectId : req.body.SubjectId,
//         //     Email : req.body.Email,
//         //     Trial : "resource:mp.takeda.tryme.Trial#"+trialId,
//         //     Secret : "",
//         //     CreatedBy : "resource:mp.takeda.tryme.TrialUser#"+req.headers.id
//         // };
//         await network.loginTrialUser(req.body);
//         res.json({ success: true });
//     }
//     catch(e){
//         res.status(500).json({error: e.toString()});
//     }
// });

app.get('/view',function( req, res){
   res.sendFile(__dirname+'/view/index.html');
});

// fs.readdir('view', (err, files) => {
//     files.forEach(file => {
//         app.get('/'+file,function(req,res){
//             res.sendFile(__dirname +'/view/'+file);
//         });
//     });
// });

app.listen(port);
console.log('REST api running on port'+port);
