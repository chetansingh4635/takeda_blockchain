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
 * See the License for the specific language governing permissions and]
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
chai.should();
chai.use(require('chai-as-promised'));

const namespace = 'mp.takeda.tryme';


describe('#NetworAdmin Or SuperAdmin', () => {
    console.log("Super Admin Test Cases");
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore({ type: 'composer-wallet-inmemory' });

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };
    // Name of the business network card containing the administrative identity for the business network
    const adminCardName = 'admin';
    // const trailCardName = 'prashant_trial'
    // Admin connection to the blockchain, used to deploy the business network
    let adminConnection;
    // This is the business network connection the tests will use.
    let businessNetworkConnection;
    // This is the factory for creating instances of types.
    let factory;


    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: ['PeerAdmin', 'ChannelAdmin']
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });
    /*
    before(async () => {
        // Generate a business network definition from the project directory.
        console.log('-------------------------> before each implemented ');
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
        console.log('trail ------->',adminCards)

        console.log('trail cardds get ------->',adminCards)

        await adminConnection.importCard(trailCardName, adminCards.get('prashant_trial'));

        // Create and establish a business network connection
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        let events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(trailCardName);

        // Get the factory for the business network.
        factory = await businessNetworkConnection.getBusinessNetwork().getFactory();
        
    });
    */




    // This is called before each test is executed.
    before(async () => {
        // Generate a business network definition from the project directory.
        //  console.log('-------------------------> before each implemented ');
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        // console.log(businessNetworkDefinition);
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

        factory = await businessNetworkConnection.getBusinessNetwork().getFactory();

        //Create Trial Admin
        let participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
        // Create the participants.
        let triallocal = factory.newResource(namespace, participantEntity, 'alice5@email.com');
        triallocal.UserId = 'alice5@email.com';
        triallocal.UserEmail = 'alice5@email.com';
        triallocal.UserName = 'alice5@email.com';
        triallocal.UserType = 'TRIAL_ADMIN';
        let success = false;
        try { await participantRegistry.add(triallocal); success = true; }
        catch (e) { success = false; }

        let identity = await businessNetworkConnection.issueIdentity(namespace + '.TrialUser' + '#alice5@email.com', 'alice5@email.com');
        await importCardForIdentity('alice5@email.com', identity);
/*

         await useIdentity('alice5@email.com')

         await businessNetworkConnection.connect('alice5@email.com');


        //Create CRO
         triallocal = factory.newResource(namespace, participantEntity, 'TRYME_CRO');
        triallocal.UserId = 'TRYME_CRO';
        triallocal.UserEmail = 'cro@email.com';
        triallocal.UserName = 'cro';
        triallocal.UserType = 'CRO';
       
        try { await participantRegistry.add(triallocal); success = true; }
        catch (e) { success = false;  console.log("CRO FAILED-----------",e) }
         identity = await businessNetworkConnection.issueIdentity(namespace + '.TrialUser' + '#TRYME_CRO', 'TRYME_CRO');
        await importCardForIdentity('TRYME_CRO', identity);


        //Create PI
        triallocal = factory.newResource(namespace, participantEntity, 'TRYME_PI');
        triallocal.UserId = 'TRYME_PI';
        triallocal.UserEmail = 'pi@email.com';
        triallocal.UserName = 'pi';
        triallocal.UserType = 'PI';
        try { await participantRegistry.add(triallocal); success = true; }
        catch (e) { success = false; }
         identity = await businessNetworkConnection.issueIdentity(namespace + '.TrialUser' + '#TRYME_PI', 'TRYME_PI');
        await importCardForIdentity('TRYME_PI', identity);


        //Create SPONSOR
        triallocal = factory.newResource(namespace, participantEntity, 'TRYME_SPONSOR');
        triallocal.UserId = 'TRYME_SPONSOR';
        triallocal.UserEmail = 'sponsor@email.com';
        triallocal.UserName = 'sponsor';
        triallocal.UserType = 'SPONSOR';
        try { await participantRegistry.add(triallocal); success = true; }
        catch (e) { success = false; }
         identity = await businessNetworkConnection.issueIdentity(namespace + '.TrialUser' + '#TRYME_SPONSOR', 'TRYME_SPONSOR');
        await importCardForIdentity('TRYME_SPONSOR', identity);




        

         //Create SITE_ADMIN
         triallocal = factory.newResource(namespace, participantEntity, 'TRYME_SITE_ADMIN');
         triallocal.UserId = 'TRYME_SITE_ADMIN';
         triallocal.UserEmail = 'siteadmin@email.com';
         triallocal.UserName = 'siteadmin';
         triallocal.UserType = 'SITE_ADMIN';
         try { await participantRegistry.add(triallocal); success = true; }
         catch (e) { success = false; }
          identity = await businessNetworkConnection.issueIdentity(namespace + '.TrialUser' + '#SITE_ADMIN', 'SITE_ADMIN');
        await importCardForIdentity('SITE_ADMIN', identity);

        */

    });


    

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
     */
    async function importCardForIdentity(cardName, identity) {
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        // console.log(businessNetworkDefinition);
        let businessNetworkName = businessNetworkDefinition.getName();

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
        // events = [];
        // businessNetworkConnection.on('event', (event) => {
        //     events.push(event);
        // });

        try {
            await businessNetworkConnection.connect(cardName);

        }
        catch(e){
            console.log("Failed use identity  on connection----",cardName,e)
        }

        factory = await businessNetworkConnection.getBusinessNetwork().getFactory();
    }

    async function issueCard(cardName , participant) {
        await useIdentity(adminCardName);
        let identity = await businessNetworkConnection.issueIdentity(namespace + '.'+ participant + '#'+cardName, cardName);
        //issueIdentity(NS + '.TrialUser#'+cardName, cardName)
       // console.log('-------------------------> identity', identity);
        await importCardForIdentity(cardName, identity);
    }

    let trial1;
    let participantRegistry;

    async function addTrial(TiralId, TrialType) {
        //useIdentity('admin')
        trial1.UserId = TiralId;
        trial1.UserType = TrialType;
        let success = false;
        try { await participantRegistry.add(trial1); success = true; }
        catch (e) { success = false; }
        return success;
    }

    async function addTrialRole(PatientID, ParticpantType, PatientUserName, PatientEmail) {
        await useIdentity('alice5@email.com')
        let participantEntity = "TrialUser";

        if (ParticpantType == 'Patient') {
            participantEntity = "Patient";

        }
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
        // Create the participants.
        // console.log('factor-------',factory)
        let participant = factory.newResource(namespace, participantEntity, PatientID);
        participant.UserEmail = PatientEmail;
        participant.UserName = PatientUserName;

        participant.UserId = PatientID;
        participant.UserType = ParticpantType;
        if (ParticpantType == 'Patient') {
            let TrialforSite = await factory.newRelationship(namespace, 'Trial', '22');
            participant.Trial = TrialforSite;
            participant.UserAccess = 'false'
            participant.UserType = 'PATIENT'
            
        }

      

        // console.log('Role Print---- ',trial10)
        let success = false;
        try { await participantRegistry.add(participant); success = true; }
        catch (e) { success = false; 
            console.log(e);
        }
        return success;
    }



    async function addAllParticipant(participantID, ParticipantType, userID) {
        await issueCard(participantID,'TrialUser')
        await useIdentity(participantID)


        let success = false;

        // ---- ADD PI-----
        let participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
        let participant = factory.newResource(namespace, participantEntity, userID);
        participant.UserEmail = 'pi@email.com';
        participant.UserName = 'PI';
        participant.UserId = userID;
        participant.UserType = 'PI';
        
        // console.log('Role Print---- ',trial10)
        try { await participantRegistry.add(participant); success = true; }
        catch (e) { success = false; 
          //  console.log(e);
        }

        // ---- ADD CRO-----
         participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
         participant = factory.newResource(namespace, participantEntity, userID);
        participant.UserEmail = 'cro@email.com';
        participant.UserName = 'cro';
        participant.UserId = userID;
        participant.UserType = 'CRO';
        
        // console.log('Role Print---- ',trial10)
        try { await participantRegistry.add(participant); success = true; }
        catch (e) { success = false; 
          //  console.log(e);
        }


        // ---- ADD SPONSOR-----
         participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
         participant = factory.newResource(namespace, participantEntity, userID);
        participant.UserEmail = 'sponsor@email.com';
        participant.UserName = 'sponsor';
        participant.UserId = userID;
        participant.UserType = 'SPONSOR';
        
        // console.log('Role Print---- ',trial10)
        try { await participantRegistry.add(participant); success = true; }
        catch (e) { success = false; 
          //  console.log(e);
        }

        // ---- ADD SITE ADMIN-----
         participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
         participant = factory.newResource(namespace, participantEntity, userID);
        participant.UserEmail = 'siteadmin@email.com';
        participant.UserName = 'site admin';
        participant.UserId = userID;
        participant.UserType = 'SITE_ADMIN';
        
        // console.log('Role Print---- ',trial10)
        try { await participantRegistry.add(participant); success = true; }
        catch (e) { success = false; 
           // console.log(e);
        }


         // ---- ADD PATIENT-----
          participantEntity = "Patient";
         participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
          participant = factory.newResource(namespace, participantEntity, userID);
         participant.UserEmail = 'patient@email.com';
         participant.UserName = 'patient';
         participant.UserId = userID;
         participant.UserType = 'PATIENT';
         let TrialforSite = await factory.newRelationship(namespace, 'Trial', '22');
         participant.Trial = TrialforSite;
         participant.UserAccess = 'false'
         participant.UserType = 'PATIENT'
         
         // console.log('Role Print---- ',trial10)
         try { await participantRegistry.add(participant); success = true; }
         catch (e) { success = false; 
            // console.log(e);
         }




        return success;
    }

    async function addTrialAsset(AssetId, AssetType) {
        await useIdentity('alice5@email.com')


        let assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + AssetType);
        let asset = await factory.newResource(namespace, AssetType, AssetId);

        if (AssetType == 'Trial') {
            asset.TrialName = "TAK-906";
            //console.log(Trial)
            asset.TrialId = AssetId;
        }
        else if (AssetType == 'PatientAsset') {
            asset.Email = "patient@email.com";
            // let trialAsset = await businessNetworkConnection.getAssetRegistry(namespace + '.Trial');
            let TrialforSite = await factory.newRelationship(namespace, 'Trial', '22');

            // let TrialforSite = await trialAsset.get('22');

            asset.Trial = TrialforSite;
        }
        else {
            asset.SiteName = "TAK-Site-1";
            //console.log(Trial)
            asset.SiteId = AssetId;
            asset.SiteLocation = "NewYork";
            // let trialAsset = await businessNetworkConnection.getAssetRegistry(namespace + '.Trial');
            let TrialforSite = await factory.newRelationship(namespace, 'Trial', '22');

            asset.TrialId = TrialforSite;
        }

        let success = false

        try {
            if (AssetType != 'Trial') {
                // console.log('assetRegistry#################### -------', assetRegistry);
                // console.log('asset#################### -------', asset);
 

            }
            let trial = await assetRegistry.add(asset);
            success = true;
        }
        catch (e) {
            // console.log(e);
            success = false;
        }
        return success;
    }





    beforeEach(async () => {
        let participantEntity = "TrialUser";
        participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.' + participantEntity);
        // Create the participants.
        trial1 = factory.newResource(namespace, participantEntity, 'alice@email.com');
        trial1.UserId = '01';
        trial1.UserEmail = 'alice@email.com';
        trial1.UserName = 'TAK-906';
    });

    it('SuperAdmin > Trial_User > Can Add of Type=TRIAL_ADMIN', async () => {
        let success = await addTrial('01', 'TRIAL_ADMIN');
        success.should.be.true;
    });

    it('SuperAdmin > Trial_User > Cannot Add of same TrialId', async () => {
        let success = await addTrial('01', 'TRIAL_ADMIN');
        success.should.be.false;
    });
    it('SuperAdmin > Trial_User > Cannot Add of Type=CRO', async () => {
        let success = await addTrial('02', 'CRO');
        success.should.be.false;
    });
    it('SuperAdmin > Trial_User > Cannot Add of Type=PI', async () => {
        let success = await addTrial('03', 'PI');
        success.should.be.false;
    });
    it('SuperAdmin > Trial_User > Cannot Add of Type=SITE_ADMIN', async () => {
        let success = await addTrial('02', 'SITE_ADMIN');
        success.should.be.false;
    });
    it('SuperAdmin > Trial_User > Can Add of Type=SPONSOR', async () => {
        let success = await addTrial('05', 'SPONSOR');
        success.should.be.true;
    });

    //----- Trial Admin -> Participent----------------------

    it('Trial Admin > Trial_User > can Add of Type=PI', async () => {
        let success = await addTrialRole('TRYME_PI', 'PI', 'pi@email.com', 'op');
        success.should.be.true;
    });

    it('Trial Admin > Trial_User > Can Add of Type=SPONSOR', async () => {
        let success = await addTrialRole('TRYME_SPONSOR', 'SPONSOR', 'sponsor@email.com', 'ww');
        success.should.be.true;

    });

    it('Trial Admin > Trial_User > Can Add of Type=CRO', async () => {
        let success = await addTrialRole('TRYME_CRO', 'CRO', 'cro@email.com', 'er');
        success.should.be.true;
    });

    it('Trial Admin > Patient > Can not add patient', async () => {
        let success = await addTrialRole('22', 'Patient', 'patient21', 'patient@email.com');
        success.should.be.false;
    });


    it('Trial Admin > Site Admin > Can NOT add  site admin', async () => {
        let success = await addTrialRole('TRYME_SITEADMIN', 'SITE_ADMIN', 'siteadmin21', 'siteadmin@email.com');
        success.should.be.false;
    });

    it('Trial Admin > Trial Admin > Can not Add Another Trial admin', async () => {
        let success = await addTrialRole('22', 'TRIAL_ADMIN', 'patient21', 'patient@email.com');
        success.should.be.false;
    });

    


    //----- Trial Admin -> Assets ----------------------

    it('Trial Admin > Trial > Can Add Trial', async () => {
        let success = await addTrialAsset('22', 'Trial');
        success.should.be.true;
    });
    it('Trial Admin > Trial > Can not Add Same Trial id', async () => {
        let success = await addTrialAsset('22', 'Trial');
        success.should.be.false;
    });

    it('Trial Admin > Trial > Can not Add Patient Asset', async () => {
        let success = await addTrialAsset('25', 'PatientAsset');
        success.should.be.false;
    });

    it('Trial Admin > Trial > Can Add site', async () => {
        let success = await addTrialAsset('25', 'Site');
        success.should.be.true;
    });

    

   

    it('PI > Participant > Can Not create any participant', async () => {
        let success = await addAllParticipant('TRYME_PI', 'PI','29');
        success.should.be.false;
    });

    it('CRO > Participant > Can Not create any participant', async () => {
        let success = await addAllParticipant('TRYME_CRO', 'CRO','30');
        success.should.be.false;
    });

    const newLocal = it('SPONSOR > Participant > Can Not create any participant', async () => {
        let success = await addAllParticipant('TRYME_SPONSOR', 'SPONSOR', '31');
        success.should.be.false;
    });

    

    // it('SPONSOR > Participant > Can Not create any participant', async () => {
    //     let success = await addAllParticipant('TRYME_SITEADMIN', 'SPONSOR','31');
    //     success.should.be.false;
    // });


    //----- Trial Admin -> Participent----------------------



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

//     it.only(); success.should.be.false;

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
//     async function importCardForIdentity(cardName, identity) {
//         const metadata = {
//             userName: identity.userID,
//             version: 1,
//             enrollmentSecret: identity.userSecret,
//             businessNetwork: businessNetworkName
//         };
//         const card = new IdCard(metadata, connectionProfile);
//         await adminConnection.importCard(cardName, card);
//     }

//     // This is called before each test is executed.
//     beforeEach(async () => {
//         // Generate a business network definition from the project directory.
//         let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
//         businessNetworkName = businessNetworkDefinition.getName();
//         await adminConnection.install(businessNetworkDefinition);
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
//         // Create the participants.aliceCardName
//         const alice = factory.newResource(namespace, partaliceCardNameicipantType, 'alice@email.com');
//         alice.firstName = 'Alice';aliceCardName
//         alice.lastName = 'A';aliceCardName

//         const bob = factory.newResource(namespace, particaliceCardNameipantType, 'bob@email.com');
//         bob.firstName = 'Bob';aliceCardName
//         bob.lastName = 'B';aliceCardName

//         participantRegistry.addAll([alice, bob]);aliceCardName

//         const assetRegistry = await businessNetworkConnecaliceCardNametion.getAssetRegistry(assetNS);
//         // Create the assets.aliceCardName
//         const asset1 = factory.newResource(namespace, assaliceCardNameetType, '1');
//         asset1.owner = factory.newRelationship(namespace,aliceCardName participantType, 'alice@email.com');
//         asset1.value = '10';aliceCardName

//         const assetaliceCardName = factory.newResource(namespace, assaliceCardNameetType, '2');
//         asset2.ownealiceCardName = factory.newRelationship(namespace,aliceCardName participantType, 'bob@email.com');
//         asset2.valualiceCardName = '20';aliceCardName

//         assetRegistaliceCardNamey.addAll([asset1, asset2]);aliceCardName

//         // Issue thaliceCardName identities.aliceCardName
//         let identitaliceCardName = await businessNetworkConnection.isaliceCardNamesueIdentity(participantNS + '#alice@email.com', 'alice1');
//         await imporaliceCardNameCardForIdentity(aliceCardName, identialiceCardNamety);
//         identity = aliceCardNamewait businessNetworkConnection.issueIaliceCardNamedentity(participantNS + '#bob@email.com', 'bob1');
//         await imporaliceCardNameCardForIdentity(bobCardName, identityaliceCardName);
//     });

//     /**
//      * Reconnect usaliceCardNameng a different identity.
//      * @param {StrialiceCardNameg} cardName The name of the card for the identity to use
//      */
//     async function aliceCardNameseIdentity(cardName) {
//         await businaliceCardNamessNetworkConnection.disconnect();
//         businessNetaliceCardNameorkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
//         events = []aliceCardName
//         businessNetaliceCardNameorkConnection.on('event', (event) => {
//             events.aliceCardNameush(event);
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
//         const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//         await assetRegistry.add(asset3);

//         // Validate the asset.
//         asset3 = await assetRegistry.get('3');
//         asset3.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
//         asset3.value.should.equal('30');
//     });

//     it('Alice cannot add assets that Bob owns', async () => {
//         // Use the identity for Alice.
//         await useIdentity(aliceCardName);

//         // Create the asset.
//         const asset3 = factory.newResource(namespace, assetType, '3');
//         asset3.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//         asset3.value = '30';

//         // Try to add the asset, should fail.
//         const assetRegistry = await  businessNetworkConnection.getAssetRegistry(assetNS);
//         assetRegistry.add(asset3).should.be.rejectedWith(/does not have .* access to resource/);
//     });

//     it('Bob can add assets that he owns', async () => {
//         // Use the identity for Bob.
//         await useIdentity(bobCardName);

//         // Create the asset.
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
 
//          // Create the asset.
//          let asset2 = factory.newResource(namespace, assetType, '2');
//          asset2.owner = factory.newRelationship(namespace, participantType, 'bob@email.com');
//          asset2.value = '60';
 
//          // Update the asset, then get the asset.
//          const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
//          await assetRegistry.update(asset2);
 
//          // Validate the asset.
//          asset2 = await assetRegistry.get('2');
//          asset2.owner.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
//          asset2.value.should.equal('60');
//     }); 
 
//     it( 'Bob cannot update Alice\'s assets', async () => {
//          // Use the identity for Bob.
//          await useIdentity(bobCardName);
 
//          // Create the asset.
//          const asset1 = factory.newResource(namespace, assetType, '1');
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

