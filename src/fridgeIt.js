// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

$(function(){
  $("input.addItem").bind("enterKey",function(e){
    addItemToList($('#addItemId').val());
    // $("ul.itemList").append("<li><a>"+ $('#addItemId').val() +"</a></li>").listview('refresh');
    // alert($('#addItemId').val() + " already added to this list.");
    // $("input.addItem").val("");
  });
  $("input.addItem").keyup(function(e){
    if(e.keyCode == 13){
      $(this).trigger("enterKey");
    }
  });
});

document.getElementById("findUser").onkeydown = function(e){
  if (e.keyCode == 13){
    shareList(document.getElementById("findUser").value);
    document.getElementById("findUser").value = "";
  }
}

firebase.auth().onAuthStateChanged(function(user){
  if (user){
    //user is signed in
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
              username:userName
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
  firebase.auth().signOut();
}

function createShoppingList(){

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
  var query = db.collection("lists").doc("myShoppingList").collection("items").where("item.name","==",itemName).get()
        .then((snapshot) =>{
          if (snapshot.empty) {
            console.log('empty result');
            $(function(){
              $("ul.itemList").append("<li><a>"+ $('#addItemId').val() +"</a></li>").listview('refresh');
            });
            $("input.addItem").val("");
            db.collection("lists").doc("myShoppingList").collection("items").add(data).then(function(docRef){
              console.log("Document written with ID: ",docRef.id);
            }).catch(function(error){
              console.error("Error adding document: ",error);
            });
          } else {
            $("input.addItem").val("");
          }
        }).catch(function(errors) {
          console.log(errors);
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

function loadList(){
  //need to pass in specifier to say which document from user to open
  var user = firebase.auth().currentUser;
  db.collection("lists").where("creator","==",user.email).get()
    .then((snapshot) =>{
      if (!snapshot.empty){   
        //myShoppingList to the specifier
        db.collection("lists").doc("myShoppingList").collection("items").get()
          .then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
              $("ul.itemList").append("<li><a>"+ doc.data().item.name +"</a></li>").listview('refresh');
            })
          })
      }
    }).catch(function(errors) {
          console.log(errors);
    });
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
          $("ul.shareItem").append("<li data-icon = "+"delete"+"><a>"+ email +"</a></li>").listview('refresh');
      }
    }).catch(function(errors) {
          console.log(errors);
    });
}
