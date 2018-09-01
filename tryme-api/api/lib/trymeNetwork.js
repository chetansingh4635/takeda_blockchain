const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const IdCard = require('composer-common').IdCard;
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const AdminConnection = require('composer-admin').AdminConnection;
var crypto       = require('sha256');


const NS = 'mp.takeda.tryme';

const cardStore = NetworkCardStoreManager.getCardStore({ 'type': 'composer-wallet-filesystem' });


var businessNetworkCardStore = new BusinessNetworkCardStore();
var adminConnection = new AdminConnection();



class TrymeNetwork {
  constructor(cardName) {
    this.currentParticipantId;
    this.cardName = cardName;
    this.connection = new BusinessNetworkConnection();
  }
  async ping() {
    // var _this = this;
    this.businessNetworkDefinition = await this.connection.connect(this.cardName);
    return await this.connection.ping();
    // return this.connection.ping().then(function (result) {
    //   return result;
    // })
  }

  getHash(Email, UserType){
    let variables = Email+UserType;
    let hash = crypto(variables);
    return hash;
  }
  

  // async identityIssue(cardName,participant, useCard, issuer = false) {
  //   let newIdCard;
  //   await this.connection.connect(useCard);
  //   let options = { issuer : issuer };
  //   let idCard = await cardStore.get(useCard);
  //   let connectionProfile = idCard.getConnectionProfile();
  //   let networkName = idCard.getBusinessNetworkName();
  //   let hash = this.getHash(cardName, participant);

  //   let cardHash = hash;
    
  //   let id = await this.connection.issueIdentity(NS + '.'+ participant +'#'+cardName, cardName, options);
  //   //cardName = id.userID+'@';
    
    
  //   let metadata = {version: 1, userName: id.userID ,enrollmentSecret: id.userSecret,businessNetwork: networkName};
  //   newIdCard = new IdCard(metadata, connectionProfile);
  //   await cardStore.put(cardHash, newIdCard);
  //   await adminConnection.importCard(cardHash, newIdCard);
  //   await this.connection.disconnect();
  // }

  async identityIssue(cardName, participant, useCard, issuer = false) {
    let newIdCard;
    await this.connection.connect(useCard);
    let options = { issuer : issuer };
    
    //cardName = id.userID+'@';
    let idCard = await cardStore.get(useCard);
    let connectionProfile = idCard.getConnectionProfile();
    let networkName = idCard.getBusinessNetworkName();
    // let id;
    let hashName;
    if(participant != 'Subject'){
      let hash = this.getHash(cardName, participant);
      hashName = hash; //+'@'+networkName;
      
    }
    else{
      hashName = cardName; //+'@'+networkName;
    }
    let id = await this.connection.issueIdentity(NS + '.'+ participant +'#'+cardName, hashName, options);
    let metadata = {version: 1, userName: id.userID ,enrollmentSecret: id.userSecret,businessNetwork: networkName};
    newIdCard = new IdCard(metadata, connectionProfile);
    await cardStore.put(hashName+'@tryme', newIdCard);
    await adminConnection.importCard(hashName+'@tryme', newIdCard);
    await this.connection.disconnect();
  }

  async doTransaction(transactionData, transactionName, cardName) {
    let transactionPrototype = NS + "." + transactionName;
    transactionData['$class'] = transactionPrototype;
    this.businessNetworkDefinition = await this.connection.connect(cardName);
    this.serializer = await this.businessNetworkDefinition.getSerializer();
    let resource = await this.serializer.fromJSON(transactionData);
    if(transactionName !== "DeregisterByUser"){
      let result =  await this.connection.submitTransaction(resource);
      // if(transactionName == "SignUp" || transactionName == "Login")
      //   result = await this.getSecret(transactionData);
      // if(transactionName == "QualifySubject")
      //   result = await this.getSubjectId(transactionData);
      //if( typeof )
      if(transactionName == "SignUp" || transactionName == "Login")
        result = this.serializer.toJSON(result);
      this.connection.disconnect();
      return result;
    }
    else{
      await this.connection.submitTransaction(resource);
      let result =  await adminConnection.deleteCard(cardName);
      this.connection.disconnect();
      return result;
    }
  }

  // async getSecret(transactionData){
  //   let query = await this.connection.buildQuery('SELECT mp.takeda.tryme.SubjectAsset WHERE (Email==_$email)');
  //   let assets = await this.connection.query(query, { email: transactionData.Email });
  //   // let asset = await this.connection.getAssetRegistry(NS + '.SubjectAsset');
  //   let constA = await this.connection.getAssetRegistry(NS + '.ConstSubjectAsset');
  //   // let a = await asset.getAll();
  //   let assetFound = assets[0].SubjectId;
  //   // a.forEach((item) => {
  //   //   if( item.Email == transactionData.Email){
  //   //     assetFound = item.SubjectId;
  //   //   }
  //   // });
  //   let p = await constA.get(assetFound);
  //   return p.Secret;
  // }

  // async getSubjectId(transactionData){
  //   let query = await this.connection.buildQuery('SELECT mp.takeda.tryme.SubjectAsset WHERE (Email==_$email)');
  //   let assets = await this.connection.query(query, { email: transactionData.Email });
  //   // let asset = await this.connection.getAssetRegistry(NS + '.SubjectAsset');
  //   // let a = await asset.getAll();
  //   // let assetFound = "";
  //   // a.forEach((item) => {
  //   //   if( item.Email == transactionData.Email){
  //   //     assetFound = item.SubjectId;
  //   //   }
  //   // });
  //   return assets[0].SubjectId;
  // }

  async getList(asset, cardName){
    let model;
    await this.connection.connect(cardName);
    if(asset.Type == "Asset")
      model = await this.connection.getAssetRegistry(NS + '.'+asset.Name);
    else if(asset.Type == "Participant")
      model = await this.connection.getParticipantRegistry(NS + '.'+asset.Name);
    let list = model.getAll();
    await this.connection.disconnect();
    return list;
  }

  async queryArray(asset, cardName){
    await this.connection.connect(cardName);
    let itemArray = asset.Item.map(function(i){ return "("+asset.Property+" == '"+i+"')"});
    // let itemArray = asset.Item;
    itemArray = itemArray.join(' OR ');
    // let queryString = "SELECT mp.takeda.tryme."+asset.Name+ " WHERE ("+asset.Property+" CONTAINS ["+itemArray+"])";
    let queryString = "SELECT mp.takeda.tryme."+asset.Name+ " WHERE ( "+itemArray+" )";
    let query = await this.connection.buildQuery(queryString);
    let assets = await this.connection.query(query);
    return assets;
  }


  async getItem(asset, cardName){
    let model;
    await this.connection.connect(cardName);
    if(asset.Type == "Asset")
      model = await this.connection.getAssetRegistry(NS + '.'+asset.Name);
    else if(asset.Type == "Participant")
      model = await this.connection.getParticipantRegistry(NS + '.'+asset.Name);
    let list = model.get(asset.AssetId);
    await this.connection.disconnect();
    return list;
  }

  async getUserID(Email, UserType){
    this.businessNetworkDefinition = await this.connection.connect("9dea63105e323a5e201e01cc947fe93b6a9fc018323cfe62df83ea137621fde5@tryme");
    let participantRegistry = await this.connection.getParticipantRegistry(NS + '.'+UserType);
    
    let participants = await participantRegistry.getAll();
    let userID;
    participants.forEach((item) =>{
      if( item.UserEmail == Email)
        userID = item.UserId;
    });
    return userID;
  }

  async generateSubjectSecret(Id){
    this.connection.disconnect();
    this.businessNetworkDefinition = await this.connection.connect(Id+'@tryme');
    let assetRegistry = await this.connection.getAssetRegistry(NS + '.'+'SubjectAsset');
    
    let all = await assetRegistry.getAll();
    let subjectAsset = await assetRegistry.get(Id);
    subjectAsset.Secret = Math.random().toString(36).substring(2,15);
    await assetRegistry.update(subjectAsset);
    return subjectAsset.Secret;
  }

  // async getRelationship(asset , assetId){
  //   let factory = await this.connection.getBusinessNetwork().getFactory();
  //   return await factory.newRelationship(NS, asset, assetId);
  // }

  /**
   * @argument transactionData // Definition about transaction data needed to be used
   * @argument transactionName // ie. AddParticipant
   * @argument registry // ie. ParticipantRegistry
   * @argument assetIdentifier // ie. TrialUser
   */
  async doGeneralTransaction(transactionData, transactionName, registry , assetIdentifier, useCard) {
    var resource;
    var NSS = 'org.hyperledger.composer.system';
    transactionData['$class'] = NS + '.' + assetIdentifier;
    var transaction = {
      "$class": NSS + "." + transactionName,
      "resources": [
        transactionData
      ],
      "targetRegistry": "resource:" + NSS + "." + registry + "#" + transactionData['$class']
    };
    this.businessNetworkDefinition = await this.connection.connect(useCard);
    this.serializer = await this.businessNetworkDefinition.getSerializer();
    resource = await this.serializer.fromJSON(transaction);
    return await this.connection.submitTransaction(resource);
  }

  async addResourceGroup(resource, transactionName, registry, assetIdentifier, useCard) {
    var resource;
    var NSS = 'org.hyperledger.composer.system';
    let transactions = [];
    resource.Users.forEach((tran) => {
      tran['$class'] = NS + '.' + assetIdentifier;
      transactions.push(tran);
    })
    // transactionData['$class'] = NS + '.' + assetIdentifier;
    var transaction = {
      "$class": NSS + "." + transactionName,
      "resources": transactions,
      "targetRegistry": "resource:" + NSS + "." + registry + "#" + NS + '.' + assetIdentifier
    };
    this.businessNetworkDefinition = await this.connection.connect(useCard);
    this.serializer = await this.businessNetworkDefinition.getSerializer();
    resource = await this.serializer.fromJSON(transaction);
    return await this.connection.submitTransaction(resource);
  }

  async loginTrialUser(data){

  }

  revokeIdentity(identity){

  }

}

module.exports = TrymeNetwork;