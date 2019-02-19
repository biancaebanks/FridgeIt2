// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

var currentList = "";

//add item to list when enter key pressed
$(function(){ 
  $("input.addItem").bind("enterKey",function(e){
    addItemToList($('#addItemId').val());
  });
  $("input.addItem").keyup(function(e){
    if(e.keyCode == 13){
      $(this).trigger("enterKey");
    }
  });
});

//add user to  share list when enter key pressed
document.getElementById("findUser").onkeydown = function(e){
  if (e.keyCode == 13){
    shareList(document.getElementById("findUser").value);
    document.getElementById("findUser").value = "";
  }
}

// if user log in to home
firebase.auth().onAuthStateChanged(function(user){
  if (user){
    //user is signed in
    updatePanel(user);
    window.location.assign("#shoppingLists");

    var user = firebase.auth().currentUser;

      if(user != null){

        var email_id = user.email;
    }
  }

  else{
    //no user signed in
    window.location.assign("#home");
  }
});

function login(){
  var userEmail = document.getElementById("email").value;
  var userPassword = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(userEmail, userPassword).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;

  window.alert("Error :\n" + errorMessage);
  // ...
}); 

}

function googleLogin(){
  let value = "some";
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      var query =  db.collection("users").where("email","==",user.email).get()
      var data = {
        email:user.email,
        username:user.displayName
      };
      reusableAddToCollection("users",query,data);
    });
}

 function signUp() {
      var userEmail = document.getElementById('signUpEmail').value;
      var userName = document.getElementById('signUpName').value;
      var userPassword = document.getElementById('signUpPassword').value;
      var userPasswordCheck = document.getElementById('signUpPasswordCheck').value;
      
      if (userEmail.length < 4) {
        alert('Please enter an email address.');
        return;
      }
      if (userPassword.length < 4) {
        alert('Please enter a password.');
        return;
      }
      if (userPassword != userPasswordCheck){
        alert('Passwords do not match.');
        userPasswordCheck.value = "";
        return;
      }
      var query = db.collection("users").where("email","==",userEmail).get()
      var data = {
              email:userEmail,
              displayName:userName
            };
      reusableAddToCollection("users",query,data);
      // Sign in with email and pass.
      // [START createwithemail]
      firebase.auth().createUserWithEmailAndPassword(userEmail, userPassword).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/weak-password') {
          alert('The password is too weak.');
        } else {
          alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
      });
      // [END createwithemail]
      sendEmailVerification();
      window.location.assign("#home");
    }


    /**
     * Sends an email verification to the user.
     */
    function sendEmailVerification() {
      // [START sendemailverification]
      firebase.auth().currentUser.sendEmailVerification().then(function() {
        // Email Verification sent!
        // [START_EXCLUDE]
        alert('Email Verification Sent!');
        // [END_EXCLUDE]
      });
      // [END sendemailverification]
    }

function logout(){
  $("ul.userList").empty();
  $("ul.userSharedLists").empty();
  firebase.auth().signOut();
}

var listName = document.getElementById("listNameId");
  var listId = document.getElementById("listId");
  listName.oninput = function(){
    let stcc = stringToCamelCase(listName.value)
    if (stcc=="undefined"){
      listId.value = "";
    }
    else{
      listId.value = stcc;
    }
  }

function createList(){
  var listName = document.getElementById("listNameId");
  var listId = document.getElementById("listId");
  var shareId = document.getElementById("shareId");
  shareIdArray = shareId.value.split(",");
  var user = firebase.auth().currentUser;

  var data = {
    name: listName.value,
    creator: user.email,
    totalItems:  0,
    sharedWith: shareIdArray
  };

  db.collection("lists").doc(listId.value).set(data)
    .then(function(docRef) {
      console.log("Document written successfully");
      window.location.assign("#shoppingLists");
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
}

function stringToCamelCase(input){
  var camelCase = "";
  //var input = document.getElementById("listNameId").value;
  var letterNumber = /^[0-9a-zA-Z\s]*$/;
  if (input.match(letterNumber)){
    var result = input.split(" ");
    for (i=0; i<result.length;i++){
      if (i>0){
        updatedResult = result[i].charAt(0).toUpperCase() + result[i].slice(1);
      }
      else if (i==0){
        updatedResult = result[i].charAt(0).toLowerCase() + result[i].slice(1);
      }
      camelCase = camelCase + updatedResult;
    }

    return camelCase;
  }else{
    alert("Only Numbers or Letters Accepted");
  }
  
}


function addItemToList(itemName){
  var user = firebase.auth().currentUser;
  var data = {
    item: {
      name: itemName,
      quantity: 1,
      who: user.email
    }
  };
  var query = db.collection("lists").doc(currentList).collection("items").where("item.name","==",itemName)
        .onSnapshot((snapshot) =>{
          if (snapshot.empty) {
            console.log('empty result');
            $(function(){
              $("ul.itemList").append("<li><a>"+ $('#addItemId').val() +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            });

            $("input.addItem").val("");
            db.collection("lists").doc(currentList).collection("items").add(data).then(function(docRef){
              var sfDocRef = db.collection("lists").doc(currentList);

              return db.runTransaction(function(transaction) {
                // This code may get re-run multiple times if there are conflicts.
                return transaction.get(sfDocRef).then(function(sfDoc) {
                    if (!sfDoc.exists) {
                        throw "Document does not exist!";
                    }

                    var newTotal = sfDoc.data().totalItems + 1;
                    transaction.update(sfDocRef, { totalItems: newTotal });
                });
            })
            }).catch(function(error){
              console.error("Error adding document: ",error);
            });
          } else {
            $("input.addItem").val("");
          }
        });
        $("ul.userList").empty();
        $("ul.userSharedLists").empty();
}

function updatePanel(user){
  // $("ul.userList").empty();
  // $("ul.userSharedList").empty();
  db.collection("lists").where("creator","==",user.email).get()
    .then(function(querySnapshot){
     querySnapshot.forEach(function(doc){
        $(function(){
              $("ul.userList").append('<li id='+doc.id+'><a href="javascript:loadList('+"'"+doc.id+"','"+doc.data().name+"'"+')">'+ doc.data().name+'<span class="ui-li-count">'+doc.data().totalItems+"</span></a></li>").listview().listview('refresh');
        });
     });
      
      
  });
  db.collection("lists").where("sharedWith","array-contains",user.email)
    .onSnapshot(function(querySnapshot){
     querySnapshot.forEach(function(doc){
        $(function(){
            $("ul.userSharedLists").append('<li id='+doc.id+'><a href="javascript:loadList('+"'"+doc.id+"','"+doc.data().name+"'"+')">'+ doc.data().name+'<span class="ui-li-count">'+doc.data().totalItems+"</span></a></li>").listview().listview('refresh');
        });
     });
      
      
  });
}

function reusableAddToCollection(collName, queryData, data){
  var query = queryData
        .then((snapshot) =>{
          if (snapshot.empty) {
            console.log('empty result');
            db.collection(collName).add(data).then(function(docRef){
              console.log("Document written with ID: ",docRef.id);
            }).catch(function(error){
              console.error("Error adding document: ",error);
            });
          } else {
            // snapshot.docs.forEach(doc => {
            //   value = (doc.data().email);
            //   console.log(value);
            // });
          }
          // console.log("email is ",user.email);
        }).catch(function(errors) {
          console.log(errors);
        });
}

function loadList(docId, docName){
  $("ul.itemList").empty();
  var user = firebase.auth().currentUser;
  db.collection("lists").where("creator","==",user.email).get()
    .then((snapshot) =>{
      if (!snapshot.empty){   
        db.collection("lists").doc(docId).collection("items").get()
          .then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
              $("ul.itemList").append("<li><a>"+ doc.data().item.name +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            })
            console.log(doc.data().name);
          })
      }
    }).catch(function(errors) {
          console.log(errors);
    });
    db.collection("lists").where("sharedWith","array-contains",user.email).get()
    .then((snapshot) =>{
      if (!snapshot.empty){   
        //myShoppingList to the specifier
        db.collection("lists").doc(docId).collection("items").get()
          .then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
              $("ul.itemList").append("<li><a>"+ doc.data().item.name +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            })
          })
      }
    }).catch(function(errors) {
          console.log(errors);
    });
    document.getElementById("shoppingPageTitle").innerHTML = docName;
    currentList = docId;

}

function shareList(email){
  //need to pass in specifier to say which document from user to open
  var user = firebase.auth().currentUser;
  db.collection("lists").where("creator","==",user.email).get()
    .then((snapshot) =>{
      if (!snapshot.empty){   
        //myShoppingList to the specifier
        db.collection("lists").doc("myShoppingList").update({
          sharedWith: firebase.firestore.FieldValue.arrayUnion(email)
        })
          $("ul.shareItem").append("<li data-icon = "+"delete"+"><a>"+ email +"</a></li>").liatview().listview('refresh');
      }
    }).catch(function(errors) {
          console.log(errors);
    });
}

