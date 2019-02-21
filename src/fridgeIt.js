// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();
var storage = firebase.storage();

var currentList;
var currentListName;

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
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });

  db.collection("posts").doc(listId.value).set({
    postsArray: []
  })

  db.collection("posts").doc(listId.value).set({
    updateArray: []
  })
    .then(function(docRef) {
      console.log("Document written successfully");
      window.location.assign("#shoppingLists");
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
    var actionData = "created";
    createUpdate(actionData);
    loadUpdates();
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
  var itemID = stringToCamelCase(itemName);
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
              $("ul.itemList").append('<li><a class="topic">'+ $('#addItemId').val() +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            });

            $("input.addItem").val("");
            db.collection("lists").doc(currentList).collection("items").doc(itemID).set(data).then(function(docRef){
              
              //used to update count
              var sfDocRef = db.collection("lists").doc(currentList);

              return db.runTransaction(function(transaction) {
                // This code may get re-run multiple times if there are conflicts.
                return transaction.get(sfDocRef).then(function(sfDoc) {
                    if (!sfDoc.exists) {
                        throw "Document does not exist!";
                    }

                    var newTotal = sfDoc.data().totalItems + 1;
                    transaction.update(sfDocRef, { totalItems: newTotal });

                    var actionData = "added an item to";
                    createUpdate(actionData);
                    loadUpdates();
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
  welcome = document.getElementsByClassName("welcomeMessage");
  updatePostToOptions();
  for (i = 0; i < welcome.length; i++) {
    welcome[i].innerHTML = "Welcome, "+user.email;
  } 
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
              $("ul.itemList").append('<li><a class="topic">'+ doc.data().item.name +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            })
          })
          $('#myShoppingPanel').panel('close');
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
              $("ul.itemList").append('<li><a class="topic">'+ doc.data().item.name +'</a><a href="#" class="delete">Delete</a></li>').listview().listview('refresh');
            })
          })
          $('#myShoppingPanel').panel('close');
      }
    }).catch(function(errors) {
          console.log(errors);
    });
    document.getElementById("shoppingPageTitle").innerHTML = docName;
    currentList = docId;
    currentListName = docName;
    loadCards();
    loadUpdates();
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
          $("ul.shareItem").append("<li data-icon = "+"delete"+"><a>"+ email +"</a></li>").listview().listview('refresh');
          var actionData = "shared";
          createUpdate(actionData);
          loadUpdates();
      }
    }).catch(function(errors) {
          console.log(errors);
    });
}

function updatePostToOptions(){
  var value = 0;
  document.getElementById("postingTo").innerHTML= currentListName;
  var user = firebase.auth().currentUser;
  db.collection("lists").where("creator","==",user.email).get()
    .then(function(querySnapshot){
     querySnapshot.forEach(function(doc){
        $(function(){
              $("optgroup#myListOpt").append('<option value='+(value+1)+'>'+ doc.data().name+'</option>');         
              $("optgroup#myListOptImg").append('<option value='+(value+1)+'>'+ doc.data().name+'</option>');   
            });
     });    
  });
  db.collection("lists").where("sharedWith","array-contains",user.email)
    .onSnapshot(function(querySnapshot){
     querySnapshot.forEach(function(doc){
        $(function(){
             $("optgroup#mySharedListOpt").append('<option value='+(value+1)+'>'+ doc.data().name+'</option>');
             $("optgroup#mySharedListOptImg").append('<option value='+(value+1)+'>'+ doc.data().name+'</option>');
        });
     });    
  });
}

function uploadImage(){
  $("#imageUpload:hidden").trigger('click');
  var imgFile = document.getElementById("imageUpload");
  imgFile.addEventListener('change',function(e){
    var file = e.target.files[0];
    //currently does not account for files with similar names from different or the same user
    var storeRef = storage.ref('posts/' + currentList + '/' + file.name);
    window.location.assign("#posts");
    storeRef.put(file).on('state_changed',

      function progress(snapshot){
        var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
      },

      function error(err){
        console.error("Error adding document: ", err);
      },

      function complete(){
        createPostWImage(file.name);
      })
  });
}

function createPost(){
  var postLocation = document.getElementById("selectOpt");
  var postText = document.getElementById("writePostId");
  var user = firebase.auth().currentUser;

  var postData = {
    text: postText.value,
    creator: user.email,
    list:stringToCamelCase(postLocation.options[postLocation.selectedIndex].text),
    imageFile: "NULL",
    timestamp: getDate()
  };

  db.collection("posts").doc(currentList).update({
    postsArray: firebase.firestore.FieldValue.arrayUnion(postData)
  })
  loadCards();
  var actionData = "made a post in";
  createUpdate(actionData);
  loadUpdates();
  postText.value = "";
  window.location.assign("#posts");
}

function createPostWImage(fileName){

  // create post
  var postLocation = document.getElementById("selectOpt");
  var postText = document.getElementById("writePostId");
  var user = firebase.auth().currentUser;

  var postData = {
    text: postText.value,
    creator: user.email,
    list:stringToCamelCase(postLocation.options[postLocation.selectedIndex].text),
    imageFile: fileName,
    timestamp: getDate()
  };

  db.collection("posts").doc(currentList).update({
    postsArray: firebase.firestore.FieldValue.arrayUnion(postData)
  })
  loadCards();
  var actionData = "made a post in";
  createUpdate(actionData);
  loadUpdates();
  postText.value = "";
  window.location.assign("#posts");
}

function loadCards(){
  $("div.column").empty();
  db.collection("posts").doc(currentList).get()
    .then(function(doc){
      if(doc.exists){
        var arr = doc.data().postsArray;
        var cols = document.getElementsByClassName("column");
        for (i = 0;i<arr.length;i++){
          if (i%4==3){
            cols[0].innerHTML = '<div class="card"><img src='+arr[i].imageFile+'style="width:100%"><div class="container"><h4><strong>'+arr[i].creator+'</strong></h4><h5>'+arr[i].timestamp+'</h5><p>'+arr[i].text+'</p></div></div>' + cols[0].innerHTML;
          }
          if (i%4==2){
            cols[1].innerHTML = '<div class="card"><img src='+arr[i].imageFile+'style="width:100%"><div class="container"><h4><strong>'+arr[i].creator+'</strong></h4><h5>'+arr[i].timestamp+'</h5><p>'+arr[i].text+'</p></div></div>' + cols[1].innerHTML;
          }
          if (i%4==1){
            cols[2].innerHTML = '<div class="card"><img src='+arr[i].imageFile+'style="width:100%"><div class="container"><h4><strong>'+arr[i].creator+'</strong></h4><h5>'+arr[i].timestamp+'</h5><p>'+arr[i].text+'</p></div></div>' + cols[2].innerHTML;
          }
          if (i%4==0){
            cols[3].innerHTML = '<div class="card"><img src='+arr[i].imageFile+'style="width:100%"><div class="container"><h4><strong>'+arr[i].creator+'</strong></h4><h5>'+arr[i].timestamp+'</h5><p>'+arr[i].text+'</p></div></div>' + cols[3].innerHTML;
          }
        }
        
      }else{
        console.log("No such document");
      }
    }).catch(function(e){
      console.log("Error getting document: ", e);
    });
}

function getTime(){
  var today = new Date();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  return time
}

function getDate(){
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  return date
}

$( document ).on( "pagecreate", "#shoppingLists", function() {
    // Swipe to remove list item
    $( document ).on( "swipeleft swiperight", "#thislist li", function( event ) {
        var listitem = $( this ),
            // These are the classnames used for the CSS transition
            dir = event.type === "swipeleft" ? "left" : "right",
            // Check if the browser supports the transform (3D) CSS transition
            transition = $.support.cssTransform3d ? dir : false;
            confirmAndDelete( listitem, transition );
    });
    // If it's not a touch device...
    if ( ! $.mobile.support.touch ) {
        // Remove the class that is used to hide the delete button on touch devices
        $( "#thislist" ).removeClass( "touch" );
        // Click delete split-button to remove list item
        $( ".delete" ).on( "click", function() {
            var listitem = $( this ).parent( "li" );
            confirmAndDelete( listitem );
        });
    }
    function confirmAndDelete( listitem, transition ) {
        // Highlight the list item that will be removed
        var toDelete = listitem[0].innerText;
        listitem.children( ".ui-btn" ).addClass( "ui-btn-active" );
        // Inject topic in confirmation popup after removing any previous injected topics
        $( "#confirm .topic" ).remove();
        listitem.find( ".topic" ).clone().insertAfter( "#question" );
        // Show the confirmation popup
        $( "#confirm" ).popup( "open" );
        // Proceed when the user confirms
        $( "#confirm #yes" ).on( "click", function() {            // Remove with a transition
            if ( transition ) {
                listitem
                    // Add the class for the transition direction
                    .addClass( transition )
                    // When the transition is done...
                    .on( "webkitTransitionEnd transitionend otransitionend", function() {
                        // ...the list item will be removed
                        listitem.remove();
                        deleteListItem(toDelete);
                        loadList(currentList,currentListName);
                        // ...the list will be refreshed and the temporary class for border styling removed
                        $( "#thislist" ).listview( "refresh" ).find( ".border-bottom" ).removeClass( "border-bottom" );
                    })
                    // During the transition the previous button gets bottom border
                    .prev( "li" ).children( "a" ).addClass( "border-bottom" )
                    // Remove the highlight
                    .end().end().children( ".ui-btn" ).removeClass( "ui-btn-active" );
            }
            // If it's not a touch device or the CSS transition isn't supported just remove the list item and refresh the list
            else {
                listitem.remove();
                $( "#thislist" ).listview( "refresh" );
                deleteListItem(toDelete);
                loadList(currentList,currentListName);
            }
        });
        // Remove active state and unbind when the cancel button is clicked
        $( "#confirm #cancel" ).on( "click", function() {
            listitem.children( ".ui-btn" ).removeClass( "ui-btn-active" );
            $( "#confirm #yes" ).off();
        });
    deleteListItem(toDelete);
    loadList(currentList,currentListName);
    }

});

function deleteListItem(deleteThis){
  var itemId = stringToCamelCase(deleteThis);
  db.collection("lists").doc(currentList).collection("items").doc(itemId).delete()
    .then(function(){
      console.log("Document deleted successfully");
      var sfDocRef = db.collection("lists").doc(currentList);

              return db.runTransaction(function(transaction) {
                // This code may get re-run multiple times if there are conflicts.
                return transaction.get(sfDocRef).then(function(sfDoc) {
                    if (!sfDoc.exists) {
                        throw "Document does not exist!";
                    }

                    var newTotal = sfDoc.data().totalItems - 1;
                    transaction.update(sfDocRef, { totalItems: newTotal });

                    var actionData = "deleted an item from";
                    createUpdate(actionData);
                    loadUpdates();
                });
            })
    }).catch(function(error){
      console.error("Error removing document: ",error);
    });

}

function createUpdate(actionData){
  var thisUser = firebase.auth().currentUser;

  var data = {
    user: thisUser.email,
    time: getTime(),
    date: getDate(),
    list: currentListName,
    thisAction: actionData
  };

  db.collection("updates").doc(currentList).update({
    updateArray: firebase.firestore.FieldValue.arrayUnion(data)
  })
}

function loadUpdates(){
  $("ul.listUpdates").empty();
  db.collection("updates").doc(currentList).get()
    .then(function(doc){
      if(doc.exists){
        var arr = doc.data().updateArray;
        var updates = document.getElementById("updatesList");
        for (i=0;i<arr.length;i++){
          $("ul.listUpdates").prepend('<li><a href="#"><p><strong> '+arr[i].user+' </strong> '+arr[i].thisAction+' '+arr[i].list+' </p><p class="ui-li-aside"><strong>'+arr[i].time+'</strong>PM</p></a></li>').listview().listview('refresh');
        }
      }
    });
  

}