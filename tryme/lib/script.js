let NS = 'mp.takeda.tryme';
let MW_VER = 'v1.0.2';
let MW_ENV = 'DEV'
let MW = 'http://tm4udev.eastus2.cloudapp.azure.com:3090/'+MW_VER+'/'+MW_ENV+'/';

async function onDeregisterUserBySite(tx){
  let subjectAsset = await getAssetRegistry(NS + '.SubjectAsset');
  let assetExist = await subjectAsset.exists(tx.Email);
  if(assetExist){
    console.log("User Asset Exist");
    let subjectItem =  await subjectAsset.get(tx.Email);
    
    let site = await getParticipantRegistry(NS + '.Patient');
    let siteItem = await site.get('0000');
    
    subjectItem.Site = siteItem;
    await subjectAsset.update(subjectItem);
  }
  else{
    throw new Error("User Asset Don't Exist");
  }
}


async function onDeregisterByUser(tx){
    let patientRegistry = await getParticipantRegistry(NS + '.Patient');
    await patientRegistry.remove(tx.Email);
}

async function onChangePassword(tx){
console.log('calling change password');
let subjectRegistry = await getParticipantRegistry(NS + '.Subject');
  //console.log(subjectRegistry);
  let subject = await subjectRegistry.get(tx.Email);
  //console.log(subject);
  if(subject.UserAccess === tx.OldPassword){
        if(tx.NewPassword !== tx.OldPassword){
          if(tx.NewPassword == tx.RepeatPassword){
             subject.UserAccess = tx.NewPassword;
             await subjectRegistry.update(subject);
          }
          else{
            throw new Error("Repeat Password does not match ");
          }
        }
    else {
      throw new Error("New Password is same to Old Password.");
    }
  }
  else {
    throw new Error("Your current Password is not correct");
  }
}

async function onForgotPassword(tx){
console.log('calling Forget password');
let subjectRegistry = await getParticipantRegistry(NS + '.Subject');
  console.log(subjectRegistry);
  let subject = await subjectRegistry.get(tx.Email);
  if(subject.UserAccess !== tx.NewPassword){
    subject.UserAccess = tx.NewPassword;
    await subjectRegistry.update(subject);
  }
  else{
        throw new Error("This is your Current Password");
      }
  }


async function onLogin(tx){
    let subjectAssetRegistry = await getAssetRegistry(NS + '.SubjectAsset');
    let subjectAsset = await subjectAssetRegistry.getAll();
  
    let assetFound = "";
    subjectAsset.forEach((item) =>{
      console.log(item.UserId,item.UserEmail);
      if( item.Email == tx.Email)
        assetFound = item.SubjectId;
    });
   console.log(assetFound);
   if(assetFound){
      let subjectConstRegistry = await getAssetRegistry(NS + '.ConstSubjectAsset');
      let subjectA = await subjectConstRegistry.get(assetFound);
      console.log('----->',subjectA.Trial.$identifier);
      if( subjectA.Trial.$identifier == tx.Trial){
        let subjectRegistry = await getParticipantRegistry(NS + '.Subject');
        let subject = await subjectRegistry.get(tx.Email);
        if(subject.UserAccess === tx.Password){
          console.log("Successfully LoggedIn");
          console.log(subjectA.Secret);
          let accessKey = Math.random().toString(36).substring(2,15);
          try{
            let formData = { "userId" : tx.Email, "accessKey" : accessKey };
            const stock = await request.put({ uri: MW+'users/addAccessKey', json : formData });
          }
          catch(e){
            let msg = JSON.parse(e.message.split('-')[1]);
            throw new Error(msg.message);
          }
          const access = await getFactory().newConcept(NS, 'Access');
          access.AccessKey = accessKey;
          access.Secret = subjectA.Secret;
          return access;
        }
        else{
          throw new Error("Subject's Email/Password don't match, Login Failed");
        }
      }
      else{
        throw new Error('Invalid Trial');
      }
    }
  	else{
      throw new Error('User Not Qualified');
    }
}

async function onSignUp(tx){
  let subject  = await getFactory().newResource(NS, 'Subject', tx.Email);
  subject.UserEmail = tx.Email;
  subject.UserAccess = tx.Password;

  // Check if Patient Asset Exists
  let subjectAssetRegistry = await getAssetRegistry(NS + '.SubjectAsset');
  let constAssetRegistry = await getAssetRegistry(NS + '.ConstSubjectAsset');
  let subjectAsset = await subjectAssetRegistry.getAll();
  console.log(subjectAsset.length, subjectAsset);
  let assetFound = false;
  let subjectId = "";
  subjectAsset.forEach((item) =>{
    //console.log(item.SubjectId,item.Subject);
    if( item.Email == tx.Email){
      assetFound = true;
      subjectId = item.SubjectId
    }
  });
  
  if(assetFound){
    let subjectRegistry = await getParticipantRegistry(NS + '.Subject');
    //let participant = await subjectRegistry.exists(tx.Email);
    let trialRegistry = await getAssetRegistry(NS + '.Trial');
    let trial = await trialRegistry.get(tx.Trial);
    await subjectRegistry.add(subject);
    let constAsset = await constAssetRegistry.get(subjectId);
    console.log('----->', constAsset.Secret);
    let accessKey = Math.random().toString(36).substring(2,15);
    const access = await getFactory().newConcept(NS, 'Access');
    access.AccessKey = accessKey;
    access.Secret = constAsset.Secret;
    try{
      let formData = { "userId" : tx.Email, "accessKey" : accessKey };
      const stock = await request.put({ uri: MW+'users/addAccessKey', json : formData });
    }
    catch(e){
      let msg = JSON.parse(e.message.split('-')[1]);
      throw new Error(msg.message);
    }
    return access;
  }
  else{
    throw new Error('User Not Qualified');
  }
}

async function onWetSignature(tx){
  try{
    let subjectRegistry = await getAssetRegistry(NS + '.SubjectAsset');
  	let sub = await subjectRegistry.get(tx.SubjectId);
    if(sub.Status == "PRE_CONSENTED"){
      sub.Status = "CONSENTED";
      sub.ConsentData = tx.ConsentData;
      sub.ConsentDataLocation = tx.ConsentDataLocation;
      subjectRegistry.update(sub);
    }
    else{
      throw new Error("Subject Not Pre Consented, current Status = "+sub.Status);
    }
  }
  catch(e){
    throw new Error(e);
  }
}

async function onAssignSite(tx){
  try{
    let subjectRegistry = await getAssetRegistry(NS + '.SubjectAsset');
  	let sub = await subjectRegistry.get(tx.SubjectId);
    let siteRegistry = await getAssetRegistry(NS + '.Site');
    let site = await siteRegistry.get(tx.SiteId);
    sub.Site = site;
    await subjectRegistry.update(sub);
  }
  catch(e){
    throw new Error(e);
  }
}

async function onESignature(tx){
  let subjectRegistry = await getAssetRegistry(NS + '.SubjectAsset');
  
  let q = await buildQuery('SELECT '+NS+'.SubjectAsset WHERE (Email==_$email)');
  let qResult = await query(q, { email: tx.Email });
  console.log('--->',q,' = ', qResult);
  if(qResult.length != 1){
    throw new Error("Subject Not Qualified");
  }
  
  let subject = await subjectRegistry.get(qResult[0].SubjectId);
  if(subject.Status == "QUALIFIED"){
    	subject.Status = "PRE_CONSENTED";
        subject.PreConsentData = tx.ConsentDataHash;
    	try{
          let formData = { "userId" : tx.Email, "EsignContent" : tx.ConsentData };
          let stock = await request.put({ uri: MW+'users/addEsignDetails', json: formData });
        }
        catch(e){
          let msg = JSON.parse(e.message.split('-')[1]);
          throw new Error(msg.message);
        }
    	subjectRegistry.update(subject);
  }
  else{
    throw new Error("Subject Status to be Qualified, current status = "+subject.Status);
  }
}

async function onQualifySubject(tx){
  let subjectRegistry = await getAssetRegistry(NS + '.SubjectAsset');
  // Get All Subject Assets
  let allSubject = await subjectRegistry.getAll();
  let calcHash = hash(tx.Trial+'-'+tx.Email);
  console.log(calcHash);
  let subjectId = calcHash.toString();
  let subjectAsset  = await getFactory().newResource(NS, 'SubjectAsset', subjectId);
  subjectAsset.SubjectId = subjectId;
  subjectAsset.Status = 'QUALIFIED';
  subjectAsset.Email = tx.Email;
  await subjectRegistry.add(subjectAsset);
  
  let trialRegistry = await getAssetRegistry(NS + '.Trial');
  let trial = await trialRegistry.get(tx.Trial);
  
  let constAsset  = await getFactory().newResource(NS, 'ConstSubjectAsset', subjectId);
  constAsset.SubjectId = subjectId;
  constAsset.Secret = Math.random().toString(36).substring(2,15);
  constAsset.Trial = trial;
  constAsset.CreatedBy = tx.CreatedBy;
  constAsset.OrganizationId = tx.OrganizationId;
  constAsset.Subject = subjectAsset;
  
  let constRegistry = await getAssetRegistry(NS + '.ConstSubjectAsset');
  await constRegistry.add(constAsset);
  // console.log(subjectId);
  return subjectId;
}

function hash(key, seed = 1) {
    let remainder, bytes, h1, h1b, c1, c2, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1:
            k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}


