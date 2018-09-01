/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

const chai = require('chai');
const network_admin_create = require('./create_rules/network_admin_rules.json');
const super_admin_create = require('./create_rules/super_admin_rules.json');
const trial_admin_create = require('./create_rules/trial_admin_rules.json');
const sponsor_create = require('./create_rules/sponsor_rules.json');
const site_coordinator_create = require('./create_rules/site_coordinator_rules.json');
const CRO_create = require('./create_rules/cro_rules.json');
const PI_create = require('./create_rules/pi_rules.json');
const Subject_create = require('./create_rules/subject_rules.json');

const network_admin_update = require('./update_rules/network_admin_rules.json');
const super_admin_update = require('./update_rules/super_admin_rules.json');
const trial_admin_update = require('./update_rules/trial_admin_rules.json');
const sponsor_update = require('./update_rules/sponsor_rules.json');
const site_coordinator_update = require('./update_rules/site_coordinator_rules.json');
const CRO_update = require('./update_rules/cro_rules.json');
const PI_update = require('./update_rules/pi_rules.json');

chai.should();
chai.use(require('chai-as-promised'));

const namespace = 'mp.takeda.tryme';

describe.only('ACL Test Cases', () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };
    // Name of the business network card containing the administrative identity for the business network
    const adminCardName = 'admin';
    // Admin connection to the blockchain, used to deploy the business network
    let adminConnection;
    // This is the business network connection the tests will use.
    let businessNetworkConnection;
    // This is the factory for creating instances of types.
    let factory;
    let businessNetworkName;


    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    // This is called before each test is executed.
    before(async () => {
        // Generate a business network definition from the project directory.
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        
        let businessNetworkName = businessNetworkDefinition.getName();
        await adminConnection.install(businessNetworkDefinition);
        const startOptions = {
            networkAdmins: [
                {
                    userName: 'admin',
                    enrollmentSecret: 'adminpw'
                }
            ]
        };
        const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
        await adminConnection.importCard(adminCardName, adminCards.get('admin'));

        // Create and establish a business network connection
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        let events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(adminCardName);

        // Get the factory for the business network.
        factory = await businessNetworkConnection.getBusinessNetwork().getFactory();
        await init();
    });

    async function init(){
        try{
            let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            businessNetworkName = businessNetworkDefinition.getName();
            // Ptting Super Admin Identity in the systme
            let data = {
                "UserEmail" : "SU1"
            }
            await doTransaction("Participant","Add","admin","SuperAdmin",data);
            let options = { issuer : true };
            let identity = await businessNetworkConnection.issueIdentity(namespace + ".SuperAdmin" + '#SU1', 'SU', options);
            await importCardForIdentity('SU', identity);

            // Ptting Trial Admin Identity in the systme
            data = {
                "UserEmail" : "TA1",
                "UserTrial" : []
            }
            await doTransaction("Participant","Add","SU","Admin",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".Admin" + '#TA1', 'TA1', options);
            await importCardForIdentity('TA1', identity);


            await addTrials();
            await addSites();
            
             

            data = {
                "UserEmail" : "TA1",
                "UserTrial" : ["T1","T2"]
            }
            await doTransaction("Participant","Update","SU","Admin",data);
            let list = await readList('Participant', 'Admin', 'SU');


            
//-----------------------Create Identity of particpants ------------------------------------------------         

            // Putting CRO Identity in the systmem
            data = {
                "UserEmail" : "CRO1",
                "OrganizationId":"CRO",
                "UserTrial" : ["T1","T2"],
                "UserSite" : []
            };
            await doTransaction("Participant","Add","TA1","CRO",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".CRO" + '#CRO1', 'CRO1');
            await importCardForIdentity('CRO1', identity);


            // Putting PI Identity in the systmem
            data = {
                "UserEmail" : "PI1",
                "OrganizationId":"PI",
                "UserTrial" : ["T1","T2","T4","T5"],
                "UserSite" : []
            };
            await doTransaction("Participant","Add","TA1","PI",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".PI" + '#PI1', 'PI1');
            await importCardForIdentity('PI1', identity);



            
            // // Creating SPONSOR Identity in the system
            data = {
                "UserEmail" : "SPONSOR1",
                "UserTrial" : ["T1","T5","T3"],
                "OrganizationId":"Any"
                    }
            await doTransaction("Participant","Add","TA1","Sponsor",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".Sponsor" + '#SPONSOR1', 'SPONSOR1');
            await importCardForIdentity('SPONSOR1', identity);


            // // Ptting SITE COORDINATOR Identity in the systme
            data = {
                "UserEmail" : "SC1",
                "UserTrial" : ["T3"],
                "UserSite" : []
            }
            await doTransaction("Participant","Add","TA1","SiteCoordinator",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".SiteCoordinator" + '#SC1', 'SC1');
            await importCardForIdentity('SC1', identity);



            // Ptting Subject Identity in the systme
            data = {
                "UserEmail" : "patient02",
                "UserAccess" : "Alice1"
            }
            await doTransaction("Participant","Add","TA1","Subject",data);
            identity = await businessNetworkConnection.issueIdentity(namespace + ".Subject" + '#patient02', 'patient02');
            await importCardForIdentity('patient02', identity);

            //  // Ptting Subject Identity in the systme
            //  data = {
            //     "UserEmail" : "patient03",
            //     "UserAccess" : "Alice1"
            // }
            // await doTransaction("Participant","Add","TA1","Subject",data);
            // identity = await businessNetworkConnection.issueIdentity(namespace + ".Subject" + '#patient03', 'patient03');
            // await importCardForIdentity('patient03', identity);

            // data = {
            //     "UserEmail" : "patient04",
            //     "UserAccess" : "Alice1"
            // }
            // await doTransaction("Participant","Add","TA1","Subject",data);
            // identity = await businessNetworkConnection.issueIdentity(namespace + ".Subject" + '#patient04', 'patient04');
            // await importCardForIdentity('patient04', identity);





//-----------------------------------------------------------Adding Document Asset----------------------------------------------------------------------           

            await addDocuments();
            await addSubjectAsset();


//-----------------------------------------------------------Adding Subject Asset----------------------------------------------------------------------           

            // data = {
            //     "SubjectId" : "S"+2 ,
            //     "Status": "QUALIFIED",
            //     "Email": "s2@email.com",
            // }
            // await doTransaction("Asset","Add","CRO1","SubjectAsset",data);

            // data = {
            //     "SubjectId" : "S"+3 ,
            //     "Status": "QUALIFIED",
            //     "Email": "s3@email.com",
            // }
            // await doTransaction("Asset","Add","PI1","SubjectAsset",data);

            // data = {
            //     "SubjectId" : "S"+4 ,
            //     "Status": "QUALIFIED",
            //     "Email": "s4@email.com",
            // }
            // await doTransaction("Asset","Add","SPONSOR1","SubjectAsset",data);



// //-----------------------------------------------------------Adding Constant Subject Asset--------------------------------------------------------------------
          
// // ----------------------------------------- Added by CRO with differnet-2 orignaztion------------------------------------------------------------------------------------------
// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "CRO",
//     "OrganizationId": "Any",
// }
// await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);


// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "CRO",
//     "OrganizationId": "Any1",
// }
// await doTransaction("Asset","Add","CRO2","ConstSubjectAsset",data);


// // ----------------------------------------- Added by PI with differnet-2 orignaztion------------------------------------------------------------------------------------------

// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "PI",
//     "OrganizationId": "Any",
// }
// await doTransaction("Asset","Add","PI1","ConstSubjectAsset",data);

// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "PI",
//     "OrganizationId": "Any1",
// }
// await doTransaction("Asset","Add","PI2","ConstSubjectAsset",data);


// // ----------------------------------------- Added by SC with differnet-2 orignaztion------------------------------------------------------------------------------------------

// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "SC",
//     "OrganizationId": "Any",
// }
// await doTransaction("Asset","Add","SC1","ConstSubjectAsset",data);

// data = {
//     "Secret" : "Secret"+2 ,
//     "CreatedBy": "SC",
//     "OrganizationId": "Any1",
// }
// await doTransaction("Asset","Add","SC2","ConstSubjectAsset",data);



            // Update CRO with TriDocument
            // data = {
            //     "UserEmail" : "Document
            //     "OrganizationIdDocument
            //     "UserTrial" : [Document
            //     "UserSite" : []Document
            // };
            // try{
            //     await doTransacDocumentnt","Update","TA1","CRO",data);
            // }
            // catch(e){
            //     console.log(e);Document
            // }
            
            
             

            // // Creating a Site console
            // data = {console
            //     "SiteId": "Siteconsole1",
            //     "SiteName": "Siconsolete1",console
            //     "SiteLocation": "NY",console
            //     "TrialId": "resource:mp.takeda.tryconsoleme.Trial#Trial1"
            // }console
            // await doTransaction("Participant","Addconsole","TA1","Site",data);

            // // Creating PI Identity in the systmeconsole
            // data = {console
            //     "UserId" : "CRO1",consolePrepare to Blockchain
            //     "UserEmail" : "cro1@trymePrepare to Blockchain
            //     "UserName" : "CRO",consolPrepare to Blockchain
            //     "UserType" : "CRO"consolePrepare to Blockchain
            // }console
            // await doTransaction("ParticipPrepare to Blockchainconsole","TA1","TrialUser",data);
            // identity = await businessNetwPrepare to Blockchaintion.issueIdentity(namespace + ".TrialUser" + '#CRO1', 'CRO1');
            // await importCardForIdentity('Prepare to Blockchainentity);
 
            // // Creating PI Identity in thPrepare to Blockchain
            // data = {
            //     "UserId" : "PI1",
            //     "UserEmail" : "pi1@tryme"Prepare to Blockchain
            //     "UserName" : "PI1",
            //     "UserType" : "PI"
            // }
            // await doTransaction("ParticipPrepare to Blockchain","TA1","TrialUser",data);
            // identity = await businessNetwPrepare to Blockchaintion.issueIdentity(namespace + ".TrialUser" + '#CRO1', 'CRO1');
            // await importCardForIdentity('Prepare to Blockchainentity);
            
        }

        
        catch(e){
           console.log(e);
        }
        


    }

    async function addTrials(){
        let data = {
            "TrialId": "T"+1,
            "TrialName": "Trial"+1
        }
        await doTransaction("Asset","Add","TA1","Trial",data);
        data = {
            "TrialId": "T"+2,
            "TrialName": "Trial"+2
        }
        await doTransaction("Asset","Add","TA1","Trial",data);
        data = {
            "TrialId": "T"+3,
            "TrialName": "Trial"+3
        }
        await doTransaction("Asset","Add","TA1","Trial",data);
        data = {
            "TrialId": "T"+4,
            "TrialName": "Trial"+4
        }
        await doTransaction("Asset","Add","TA1","Trial",data);
        data = {
            "TrialId": "T"+5,
            "TrialName": "Trial"+5
        }
        await doTransaction("Asset","Add","TA1","Trial",data);
    }

    async function addSites(){
        let data = {
            "SiteId": "S"+1,
            "SiteName": "Site"+1,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T1"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+2,
            "SiteName": "Site"+2,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T1"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+3,
            "SiteName": "Site"+3,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T2"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+4,
            "SiteName": "Site"+4,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T3"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+5,
            "SiteName": "Site"+5,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T3"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+6,
            "SiteName": "Site"+6,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T4"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
        data = {
            "SiteId": "S"+7,
            "SiteName": "Site"+7,
            "SiteLocation":"New York",
            "OrganizationId":"Org1",
            "Trial":"T5"
        }
        await doTransaction("Asset","Add","TA1","Site",data);
    }

    async function addSubjectAsset(){


        // Qualified Subject
        let data = {
            "SubjectId": "Subject"+1,
            "Status": "QUALIFIED",
            "Email":"subject1@email.com"
        }
        await doTransaction("Asset","Add","CRO1","SubjectAsset",data);
        data = {
            "SubjectId": "Subject"+1,
            "CreatedBy": "CRO",
            "Secret":"1234",
            "OrganizationId":"CRO",
            "Trial":"T1",
            "Subject":"Subject"+1
        }
        await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);

        // With Site Added

        data = {
            "SubjectId": "Subject"+2,
            "Status": "QUALIFIED",
            "Email":"patient02",
            "Site":"S1"
        }
        await doTransaction("Asset","Add","CRO1","SubjectAsset",data);
        data = {
            "SubjectId": "Subject"+2,
            "CreatedBy": "CRO",
            "Secret":"1234",
            "OrganizationId":"CRO",
            "Trial":"T1",
            "Subject":"Subject"+2
        }
        await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);

        // Pre consented
        data = {
            "SubjectId": "Subject"+3,
            "Status": "PRE_CONSENTED",
            "Email":"subject2@email.com",
            "Site":"S2",
            "PreConsentData":"alpha"
        }
        await doTransaction("Asset","Add","CRO1","SubjectAsset",data);
        data = {
            "SubjectId": "Subject"+3,
            "CreatedBy": "CRO",
            "Secret":"1234",
            "OrganizationId":"PI",
            "Trial":"T1",
            "Subject":"Subject"+3
        }
        await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);


        // Consented
        data = {
            "SubjectId": "Subject"+3,
            "Status": "CONSENTED",
            "Email":"subject3@email.com",
            "Site":"S3",
            "PreConsentData":"alpha",
            "ConsentData":"Beta",
            "ConsentDataLocation":"user/details"
        }
        await doTransaction("Asset","Add","CRO1","SubjectAsset",data);
        data = {
            "SubjectId": "Subject"+3,
            "CreatedBy": "CRO",
            "Secret":"1234",
            "OrganizationId":"SC",
            "Trial":"T2",
            "Subject":"Subject"+3
        }
        await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);


        // Deactivated
        data = {
            "SubjectId": "Subject"+4,
            "Status": "DEACTIVATED",
            "Email":"subject3@email.com",
            "Site":"S4",
            "PreConsentData":"alpha"
        }
        await doTransaction("Asset","Add","CRO1","SubjectAsset",data);
        data = {
            "SubjectId": "Subject"+4,
            "CreatedBy": "CRO",
            "Secret":"1234",
            "OrganizationId":"Org1",
            "Trial":"T3",
            "Subject":"Subject"+4
        }
        await doTransaction("Asset","Add","CRO1","ConstSubjectAsset",data);
        
    }

    async function addDocuments(){
        let data = {
            "DocumentId": "D"+1,
            "Type": "ICF_OFFICIAL",
            "Version": "1",
            "Language": "English",
            "DocumentLocation" : "USA",
            "Hash": "hash1",
            "RelatedTrial":"T1"
        }
        await doTransaction("Asset","Add","CRO1","Document",data);
        data = {
            "DocumentId": "D"+2,
            "Type": "ICF_OFFICIAL",
            "Version": "1",
            "Language": "English",
            "DocumentLocation" : "USA",
            "Hash": "hash2",
            "RelatedTrial":"T2"
        }
        await doTransaction("Asset","Add","CRO1","Document",data);
        data = {
            "DocumentId": "D"+3,
            "Type": "ICF_OFFICIAL",
            "Version": "1",
            "Language": "English",
            "DocumentLocation" : "USA",
            "Hash": "hash3",
            "RelatedTrial":"T3"
        }
        await doTransaction("Asset","Add","CRO1","Document",data);
        data = {
            "DocumentId": "D"+4,
            "Type": "ICF_OFFICIAL",
            "Version": "1",
            "Language": "English",
            "DocumentLocation" : "USA",
            "Hash": "hash4",
            "RelatedTrial":"T4"
        }
        await doTransaction("Asset","Add","CRO1","Document",data);
    }

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
     */
    async function importCardForIdentity(cardName, identity) {
        const metadata = {
            userName: identity.userID,
            version: 1,
            enrollmentSecret: identity.userSecret,
            businessNetwork: businessNetworkName
        };
        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(cardName, card);
    }

    /**
     * Reconnect using a different identity.
     * @param {String} cardName The name of the card for the identity to use
     */
    async function useIdentity(cardName) {
        await businessNetworkConnection.disconnect();
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', (event) => {
            events.push(event);
        });
        await businessNetworkConnection.connect(cardName);
        factory = await businessNetworkConnection.getBusinessNetwork().getFactory();
    }

    // let trial1;
    // let participantRegistry;

    // async function addTrial(TiralId,TrialType){
    //     trial1.UserId = TiralId;
    //     trial1.UserType = TrialType;
    //     let success = false;
    //     try{ await participantRegistry.add(trial1); success = true; }
    //     catch(e){ success = false;}
    //     return success;
    // }

    async function doTransaction(resourceType, transactionType, transactionBy, transactionOn, transactionData, recursive){
        // if(businessNetworkConnection);
        // await businessNetworkConnection.disconnect();
        let NSS = 'org.hyperledger.composer.system';
        let transactionName = transactionType+resourceType;
        transactionData['$class'] = namespace + '.' + transactionOn;
        let transaction = {
        "$class": NSS + "." + transactionName,
        "resources": [
        transactionData
        ],
        "targetRegistry": "resource:" + NSS + "." + resourceType + "Registry" + "#" + transactionData['$class']
        };
        let businessNetworkDefinition = await businessNetworkConnection.connect(transactionBy);
        let serializer = await businessNetworkDefinition.getSerializer();
        let resource = await serializer.fromJSON(transaction);
        try{ 
            await businessNetworkConnection.submitTransaction(resource);
            return true;
        }
        catch(e){
             console.log(e);
            if(recursive){
                if( JSON.stringify(e) == "{}"){
                    return false;
                }
                else{
                    return null;
                } 
            }
            else{
                return false;
            }
  
        }
    }

    async function readList(type, name, card){
        await businessNetworkConnection.disconnect();
        await businessNetworkConnection.connect(card);
        let NS = "mp.takeda.tryme";
        let modelRegistry;
        if( type == "Asset"){
            modelRegistry = await businessNetworkConnection.getAssetRegistry(NS + '.' +name);
        }
        else{
            modelRegistry = await businessNetworkConnection.getParticipantRegistry(NS + '.' +name);
        }
        let list = await modelRegistry.getAll();
        return list;
    }

    // beforeEach( async ()=> {
    //     let participantEntity = "TrialUser";
    //     participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace +'.'+ participantEntity);
    //     // Create the participants.
    //     trial1 = factory.newResource(namespace, participantEntity, 'alice@email.com');
    //     trial1.UserId = '01';
    //     trial1.UserEmail = 'alice@email.com';
    //     trial1.UserName = 'TAK-906';
    // });

    let caseGroup = [];
    caseGroup.push({ group : 'NETWORK ADMIN :: CREATE RULES', data : network_admin_create });
    caseGroup.push({ group : 'SUPER ADMIN :: CREATE RULES', data : super_admin_create });
    caseGroup.push({ group : 'TRIAL ADMIN :: CREATE RULES', data : trial_admin_create });
    caseGroup.push({ group : 'CRO :: CREATE RULES', data : CRO_create });
    caseGroup.push({ group : 'SPONSOR :: CREATE RULES', data : sponsor_create });
    caseGroup.push({ group : 'PI :: CREATE RULES', data : PI_create });
    caseGroup.push({ group : 'clearSITE COODINATOR :: CREATE RULES', data : site_coordinator_create });
    caseGroup.push({ group : 'SUBJECT :: CREATE RULES', data : Subject_create });

    // caseGroup.push({ group : 'NETWORK ADMIN :: UPDATE RULES', data : network_admin_update });
    // caseGroup.push({ group : 'SUPER ADMIN :: UPDATE RULES', data : super_admin_update });
    // caseGroup.push({ group : 'TRIAL ADMIN :: UPDATE RULES', data : trial_admin_update });
    //  caseGroup.push({ group : 'CRO :: UPDATE RULES', data : CRO_update });
    //  caseGroup.push({ group : 'SPONSOR :: UPDATE RULES', data : sponsor_update });
    //  caseGroup.push({ group : 'PI :: UPDATE RULES', data : PI_update });
    //  caseGroup.push({ group : 'SITE COODINATOR :: UPDATE RULES', data : site_coordinator_update });


    caseGroup.forEach(function(c){
        describe(c.group, ()=>{
            c.data.forEach((cas)=>{
                it(c.group + ' > ' + (cas.expect ? 'Can':'Cannot') +' '+ cas.operation + (cas.recursive ? ' same ':' ') + cas.userType, async () => {
                        let success = await doTransaction(cas.type,cas.operation,cas.card,cas.resource,cas.data, cas.recursive);
                        success.should.be.equals(cas.expect);
                });
            });
        });
    });

    describe("Read", () => {
        it("CRO can Read its Trials",async () => {
            let list = await readList('Asset', 'Trial', 'CRO1');
            list.length.should.be.equals(2);
        });
        it("PI can Read its Trials",async () => {
            let list = await readList('Asset', 'Trial', 'PI1');
            list.length.should.be.equals(4);
        });
        it("Site Coordinator can Read its Trials",async () => {
            let list = await readList('Asset', 'Trial', 'SC1');
            list.length.should.be.equals(1);
        });
        it("Sponsor can Read its Trials", async () => {
            let list = await readList('Asset', 'Trial', 'SPONSOR1');
            list.length.should.be.equals(3);
        });
        it("Subject cannnot access any Trial Assets", async () => {
            let list = await readList('Asset', 'Trial', 'patient02');
            list.length.should.be.equals(0);
        });

        it("Admin can  read its Trials", async () => {
            let list = await readList('Asset', 'Trial', 'TA1');
            list.length.should.be.equals(2);
        });

        // Documents Access

        it("Super Admin can read All Documents", async () => {
            let list = await readList('Asset', 'Document', 'SU');
            list.length.should.be.equals(4);
        });

        it("Admin can read Trial related Documents", async () => {
            let list = await readList('Asset', 'Document', 'TA1');
           trueuld.be.equals(2);

        });

        it("trueial related Documents", async () => {
            let list = await readList('Asset', 'Document', 'CRO1');
            list.be.equals(2);
        });

        it("trueal Related Documents", async () => {
            let list = readList('Asset', 'Document', 'PI1');
           list.be.equals(3);
        });

        it("Sponsor can read Trial Related Documents", async () => {
            let list = await readList('Asset', 'Document', 'SPONSOR1');
            list.length.should.be.equals(2);
        });

        it("Site Coordinator can read Trial Related Documents", async () => {
            let list = await readList('Asset', 'Document', 'SC1');
            list.length.should.be.equals(1);
        });

        it("Subject cannnot access any Document", async () => {
            let list = awaitruet readList('Asset', 'Document', 'patient02');
            list.length.shotrueuld.be.equals(0);
        });

        // Sites Accesstrue

        it("Super Admin cantrue read All Sites", async () => {
            let list = awaitruet readList('Asset', 'Site', 'SU');
            list.length.shotrueuld.be.equals(7);
        });

        it("Admin can read trueTrial related Sites", async () => {
            let list = awaitruet readList('Asset', 'Site', 'TA1');
            list.length.shotrueuld.be.equals(2);
        });

        it("CRO can read Trtrueial related Sites", async () => {
            let list = await readList('Asset', 'Site', 'CRO1');
            list.length.should.be.equals(3);
        });

        it("PI can read Trial Related Sites", async () => {
            let list = await readList('Asset', 'Site', 'PI1');
            list.length.should.be.equals(5);
        });

        it("Sponsor can read Trial Related Sites", async () => {
            let list = await readList('Asset', 'Site', 'SPONSOR1');
            list.length.should.be.equals(5);
        });

        it("Site Coordinator can read Trial Related Sites", async () => {
            let list = await readList('Asset', 'Site', 'SC1');
            list.length.should.be.equals(2);
        });
        
        it("Subject cannnot access any Sites", async () => {
            let list = await readList('Asset', 'Site', 'patient02');
            list.length.should.be.equals(0);
        });

        // Subject Asset Access

        it("Super Admin cannot read SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'SU');
            list.length.should.be.equals(0);
        });

        it("Admin cannot read SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'TA1');
            list.length.should.be.equals(0);
        });

        it("CRO can read SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'CRO1');
            list.length.should.be.equals(4);
        });

        it("PI can read all SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'PI1');
            list.length.should.be.equals(4);
        });

        it("Sponsor cannot read SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'SPONSOR1');
            list.length.should.be.equals(0);
        });

        it("Site Coordinator can read all SubjectAsset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'SC1');
            list.length.should.be.equals(4);
        });
        
        it("Subject cann Read its Subject Asset", async () => {
            let list = await readList('Asset', 'SubjectAsset', 'patient02');
            list.length.should.be.equals(1);
        });


        // Constant Subject Asset Access

        it("Super Admin cannot read ConstSubjectAsset", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'SU');
            list.length.should.be.equals(0);
        });

        it("Admin cannot read ConstSubjectAsset", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'TA1');
            list.length.should.be.equals(0);
        });

        it("CRO can read ConstSubjectAsset if  created by = CRO || PI || SITE_COORDINATOR", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'CRO1');
            list.length.should.be.equals(2);
        });

        it("PI can read ConstSubjectAsset if created by = CRO || PI || SITE_COORDINATOR", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'PI1');
            list.length.should.be.equals(1);
        });

        it("Sponsor cannot read ConstSubjectAsset", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'SPONSOR1');
            list.length.should.be.equals(0);
        });

        it("Site Coordinator can read ConstSubjectAsset if  created by = CRO || PI || SITE_COORDINATOR", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'SC1');
            list.length.should.be.equals(4);
        });
        
        it("Subject cann Read its ConstSubjectAsset", async () => {
            let list = await readList('Asset', 'ConstSubjectAsset', 'patient02');
            list.length.should.be.equals(1);
        });
    });
    
});
// describe('#' + namespace, () => {
//     // In-memory card store for testing so cards are not persisted to the file system
//     const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

//     // Embedded connection used for local testing
//     const connectionProfile = {
//         name: 'embedded',
//         'x-type': 'embedded'
//     };

//     // Name of the business network card containing the administrative identity for the business network
//     const adminCardName = 'admin';

//     // Admin connection to the blockchain, used to deploy the business network
//     let adminConnection;

//     // This is the business network connection the tests will use.
//     let businessNetworkConnection;

//     // This is the factory for creating instances of types.
//     let factory;

//     // These are the identities for Alice and Bob.
//     const aliceCardName = 'alice';
//     const bobCardName = 'bob';

//     // These are a list of receieved events.
//     let events;

//     let businessNetworkName;

//     it.only();

//     before(async () => {
//         // Generate certificates for use with the embedded connection
//         const credentials = CertificateUtil.generate({ commonName: 'admin' });

//         // Identity used with the admin connection to deploy business networks
//         const deployerMetadata = {
//             version: 1,
//             userName: 'PeerAdmin',
//             roles: [ 'PeerAdmin', 'ChannelAdmin' ]
//         };
//         const deployerCard = new IdCard(deployerMetadata, connectionProfile);
//         deployerCard.setCredentials(credentials);
//         const deployerCardName = 'PeerAdmin';

//         adminConnection = new AdminConnection({ cardStore: cardStore });

//         await adminConnection.importCard(deployerCardName, deployerCard);
//         await adminConnection.connect(deployerCardName);
//     });

//     /**
//      *
//      * @param {String} cardName The card name to use for this identity
//      * @param {Object} identity The identity details
//      */
//     async function impotruerdForIdentity(cardName, identity) {
//         const metadata true
//             userName: itrueity.userID,
//             version: 1,true
//             enrollmentSecret: identity.userSecret,
//             businessNetwork: businessNetworkName
//         };
//         const card = new IdCard(metadata, connectionProfile);
//         await adminConnection.importCard(cardName, card);
//     }

//     // This is called before each test is executed.
//     beforeEach(async () => {
// //         // Generate a business network definition from the projecead its Trials
// tory.
// //         let businessNetworkDefinition = await BusinessNetworkDefiead its Trials
// fromDirectory(path.resolve(__dirname, '..'));
//         businessNetworkName = businessNetworkDefinition.getName()ead its Trials

//         await adminConnection.install(businessNetworkDefinition);ead its Trials

//         const startOptions = {
//             networkAdmins: [
//                 {
//                     userName: 'admin',
//                     enrollmentSecret: 'adminpw'
//                 }
//             ]
//         };
//         const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
//         await adminConnection.importCard(adminCardName, adminCards.get('admin'));

//         // Create and establish a business network connection
//         businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
//         events = [];
//         businessNetworkConnection.on('event', event => {
//             events.push(event);
//         });
//         await businessNetworkConnection.connect(adminCardName);

//         // Get the factory for the business network.
//         factory = businessNetworkConnection.getBusinessNetwork().getFactory();

//         const participantRegistry = await businessNetworkConnection.getParticipantRegistry(participantNS);
//         // Create the participants.
//         const alice = factory.newResource(namespace, participantType, 'alice@email.com');
//         alice.firstName = 'Alice';
//         alice.lastName = 'A';

//         const bob = factory.newResource(namespace, participantType, 'bob@email.com');
//         bob.firstName = 'Bob';
//         bob.lastName = 'B';

//         participantRegistry.addAll([alice, bob]);

//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         // Create the assets.
//         const asset1 = factory.newResource(namespace, assetType, '1');
//         asset1.owner = factory.newRelationship(namespace, participantType, 'alice@email.com');
//         asset1.value = '10';

//         const asset2 = factory.newResource(namespace, assetType, '2');
//         asset2.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//         asset2.value = '20';

//         assetRegistry.addAll([asset1, asset2]);

//         // Issue the identities.
//         let identity = await businessNetworkConnection.issueIdentity(participantNS + '#alice@email.com', 'alice1');
//         await importCardForIdentity(aliceCardName, identity);
//         identity = await businessNetworkConnection.issueIdentity(participantNS + '#bob@email.com', 'bob1');
//         await importCardForIdentity(bobCardName, identity);
//     });

//     /**
//      * Reconnect using a different identity.
//      * @param {String} cardName The name of the card for the identity to use
//      */
//     async function useIdentity(cardName) {
//         await businessNetworkConnection.disconnect();
//         businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
//         events = [];
//         businessNetworkConnection.on('event', (event) => {
//             events.push(event);
//         });
//         await businessNetworkConnection.connect(cardName);
//         factory = businessNetworkConnection.getBusinessNetwork().getFactory();
//     }

//     it('Alice can read all of the assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         const assets = await assetRegistry.getAll();

//         // Validate the assets.
//         assets.should.have.lengthOf(2);
//         const asset1 = assets[0];
//         asset1.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
//         asset1.value.should.equal('10');
//         const asset2 = assets[1];
//         asset2.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//         asset2.value.should.equal('20');
//     });

//     it('Bob can read all of the assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         const assets = await assetRegistry.getAll();

//         // Validate the assets.
//         assets.should.have.lengthOf(2);
//         const asset1 = assets[0];
//         asset1.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
//         asset1.value.should.equal('10');
//         const asset2 = assets[1];
//         asset2.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//         asset2.value.should.equal('20');
//     });

//     it('Alice can add assets that she owns', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Create the asset.
//         let asset3 = factory.newResource(namespace, assetType, '3');
//         asset3.owner = factory.newRelationship(namespace, participantType, 'alice@email.com');
//         asset3.value = '30';

//         // Add the asset, then get the asset.
//         const assetRegistry updatessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.update

//         // Validate the asseupdate
//         asset3 = await assetupdate3');
//         asset3.owner.getFullupdatetifier().should.equal(participantNS + '#alice@email.com');
//         asset3.value.should.update
//     });

//     it('Alice cannot add assupdatewns', async () => {
//         // Use the identity update
//         await useIdentity(alupdate

//         // Create the asset.update
//         const asset3 = factoupdate(namespace, assetType, '3');
//         asset3.owner = factoupdateship(namespace, participantType, 'bob@email.com');
//         asset3.value = '30';update

//         // Try to add the asupdateil.
//         const assetRegistry updateessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.add(asupdatee.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Bob can add assets tupdateasync () => {
//         // Use the identity update
//         await useIdentity(boupdate

//         // Create the asset.update
//         let asset4 = factory.newResource(namespace, assetType, '4');
//         asset4.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//         asset4.value = '40';

//         // Add the asset, then get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.add(asset4);

//         // Validate the asset.
//         asset4 = await assetRegistry.get('4');
//         asset4.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//         asset4.value.should.equal('40');
//     });

//     it('Bob cannot add assets that Alice owns', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Create the asset.
//         const asset4 = factory.newResource(namespace, assetType, '4');
//         asset4.owner = factory.newRelationship(namespace, participantType, 'alice@email.com');
//         asset4.value = '40';

//         // Try to add the asset, should fail.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.add(asset4).should.be.rejectedWith(/does not have .* access to resource/);

//     });

//     it('Alice can update her assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Create the asset.
//         let asset1 = factory.newResource(namespace, assetType, '1');
//         asset1.owner = factory.newRelationship(namespace, participantType, 'alice@email.com');
//         asset1.value = '50';

//         // Update the asset, then get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.update(asset1);

//         // Validate the asset.
//         asset1 = await assetRegistry.get('1');
//         asset1.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
//         asset1.value.should.equal('50');
//     });

//     it('Alice cannot update Bob\'s assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Create the asset.
//         const asset2 = factory.newResource(namespace, assetType, '2');
//         asset2.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//         asset2.value = '50';

//         // Try to update the asset, should fail.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.update(asset2).should.be.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Bob can update his assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Create the asset.
//         let asset2 = factory.newResource(namespace, assetType, '2');
//         asset2.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//         asset2.value = '60';

//         // Update the asset, then get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.update(asset2);

//         // Validate the asset.
//         asset2 = await assetRegistry.get('2');
//         asset2.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//         asset2.value.should.equal('60');
//     });

//     it('Bob cannot update Alice\'s assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Create the asset.
//         const asset1 = factory.newResource(namespace, assetType, '1');
//         asset1.owner = factory.newRelationship(namespace, participantType, 'alice@email.com');
//         asset1.value = '60';

//         // Update the asset, then get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.update(asset1).should.be.rejectedWith(/does not have .* access to resource/);

//     });

//     it('Alice can remove her assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Remove the asset, then test the asset exists.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.remove('1');
//         const exists = await assetRegistry.exists('1');
//         exists.should.be.false;
//     });

//     it('Alice cannot remove Bob\'s assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Remove the asset, then test the asset exists.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.remove('2').should.be.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Bob can remove his assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Remove the asset, then test the asset exists.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.remove('2');
//         const exists = await assetRegistry.exists('2');
//         exists.should.be.false;
//     });

//     it('Bob cannot remove Alice\'s assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Remove the asset, then test the asset exists.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.remove('1').should.be.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Alice can submit a transaction for her assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Submit the transaction.
//         const transaction = factory.newTransaction(namespace, 'SampleTransaction');
//         transaction.asset = factory.newRelationship(namespace, assetType, '1');
//         transaction.newValue = '50';
//         await businessNetworkConnection.submitTransaction(transaction);

//         // Get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         const asset1 = await assetRegistry.get('1');

//         // Validate the asset.
//         asset1.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
//         asset1.value.should.equal('50');

//         // Validate the events.
//         events.should.have.lengthOf(1);
//         const event = events[0];
//         event.eventId.should.be.a('string');
//         event.timestamp.should.be.an.instanceOf(Date);
//         event.asset.getFullyQualifiedIdentifier().should.equal(assetNS + '#1');
//         event.oldValue.should.equal('10');
//         event.newValue.should.equal('50');
//     });

//     it('Alice cannot submit a transaction for Bob\'s assets', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Submit the transaction.
//         const transaction = factory.newTransaction(namespace, 'SampleTransaction');
//         transaction.asset = factory.newRelationship(namespace, assetType, '2');
//         transaction.newValue = '50';
//         businessNetworkConnection.submitTransaction(transaction).should.be.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Bob can submit a transaction for his assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Submit the transaction.
//         const transaction = factory.newTransaction(namespace, 'SampleTransaction');
//         transaction.asset = factory.newRelationship(namespace, assetType, '2');
//         transaction.newValue = '60';
//         await businessNetworkConnection.submitTransaction(transaction);

//         // Get the asset.
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         const asset2 = await assetRegistry.get('2');

//         // Validate the asset.
//         asset2.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//         asset2.value.should.equal('60');

//         // Validate the events.
//         events.should.have.lengthOf(1);
//         const event = events[0];
//         event.eventId.should.be.a('string');
//         event.timestamp.should.be.an.instanceOf(Date);
//         event.asset.getFullyQualifiedIdentifier().should.equal(assetNS + '#2');
//         event.oldValue.should.equal('20');
//         event.newValue.should.equal('60');
//     });

//     it('Bob cannot submit a transaction for Alice\'s assets', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Submit the transaction.
//         const transaction = factory.newTransaction(namespace, 'SampleTransaction');
//         transaction.asset = factory.newRelationship(namespace, assetType, '1');
//         transaction.newValue = '60';
//         businessNetworkConnection.submitTransaction(transaction).should.be.rejectedWith(/does not have .* access to resource/);
//     });

// });
