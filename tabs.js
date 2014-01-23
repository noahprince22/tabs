//both client and server
Drinks = new Meteor.Collection("drinks");
Users = new Meteor.Collection("users");
if (Meteor.isClient) {
  var currentDay;
  Session.set("day",new Date().getDate());
  Session.set("activeUsers",{});
  Meteor.subscribe( 'users' );
  Meteor.subscribe( 'drinks' );

  function getActiveUsers(){
    hash = Session.get("activeUsers")
    returnUsers = [];

    users = Users.find({},{sort: {user_name: 1}});
    users.forEach(function(user){
      if(hash[user._id]) returnUsers.push(user);
    });
    return returnUsers; 
      // {sort: {user_name: 1}
  }
  
    function setAllUsers(cursors,data){
      var ids = [];
      cursors.forEach( function(cursor){
	ids.push( cursor._id );
      });
      
      ids.forEach( function(id){
	Users.update(id,{$set: data});
      });
      
    }

    function setAllDrinks(cursors,data){
      var ids = [];
      cursors.forEach( function(cursor){
	ids.push( cursor._id );
      });
      
      ids.forEach( function(id){
	Drinks.update(id,{$set: data});
      });
      
    }

  $(function () {
    //lets get fucked up song
    $("#fucked_up").click(function(e){
      var win=window.open('http://www.youtube.com/watch?v=xSAxR6BgW3I', '_blank');
      win.focus();
    });
    
    $("a").click(function(e) {
      var x = e.pageX - this.offsetLeft - 20;
      var y = e.pageY - this.offsetTop + 22;
      $(".tooltip").show().css({
	left: x,
	top: y
      }).delay(3000).fadeOut();
      return false;
    });

    $(".tooltip").click(function() {
      $(this).hide();
    });
    
    $("#delete_button").click( function(){
      var retVal = confirm("Do you want to continue? Shit gon get deleted. Don't press OK unless you're sober");
      if( retVal == true ){

	$.each($("[name='drink']"),function(index,element){
	  if($(element).hasClass("active")){
	    var id = $(element).attr("drink_id");
	    Drinks.remove(id);
	  }
	});

	$.each($("[name='user']"),function(index,element){
	  if($(element).hasClass("active")){
	    var id = $(element).attr("user_id");	   
	    Users.remove(id);
	  }
	});

	return true;
      }else{
	return false;
      }
   
    });


    $("#hide_button").click( function(){
      var retVal = confirm("We're just gonna shove this somewhere....");
      if( retVal == true ){

	$.each($("[name='drink']"),function(index,element){
	  if($(element).hasClass("active")){
	    var id = $(element).attr("drink_id");
	    Drinks.update(id,{$set:{hidden:true}});
	  }
	});

	hash = Session.get("activeUsers");
	$.each(getActiveUsers(),function(index,user){
	  if(hash[user._id]){
	    Users.update(user._id,{$set: {hidden:true}});
	    hash[user._id] = false;
	  }
	});
	Session.set("activeUsers",hash);
	
	return true;
      }else{
	return false;
      }
   
    });

    $("#split_tab").click( function(e){
      $(this).toggleClass("active");
    });
    
    $(".select-all").click( function(e){
      $(this).toggleClass("active");
      users = Users.find({hidden: false});
      hash = Session.get("activeUsers");
      
      if( $(this).hasClass("active") ){
	users.forEach(function(user){
	  hash[user._id] = true;
	  $("[user_id='"+user._id+"']").addClass("active");
	});

	Session.set("activeUsers",hash);
	// setAllUsers(users,{active:"active"});
      }else{
	users.forEach(function(user){
	  hash[user._id] = false;
	  $("[user_id='"+user._id+"']").removeClass("active");
	});

	Session.set("activeUsers",hash);
      }

    });

   });

  Template.user.events = {
    'click': function(e){
      element = $(e.target).closest("[name='user']");
      hash = Session.get("activeUsers");
      
      var userId = $(e.target).closest("[name='user']").attr("user_id");
      var active = hash[userId]
      //toggling the active on the user
      if(active){
	hash[userId] = false; 
	// var thing = Users.update(userId,{$set: {active: ""}});
      }
      else
	hash[userId] = true;

      $(element).toggleClass("active");
      Session.set("activeUsers",hash);
      $("[name='drink']").removeClass("active");

      $(element).click(function(e) {
	e.stopPropagation();
      });
     
    }
    
  };

  function verifyFunds(users,drinkPrice){
    var falseFound = false;
    users.forEach(function(user){
      var newCredit = parseFloat(user.credit)-parseFloat(drinkPrice);
      if( newCredit < 0 ) {
	alert("Hey "+user.user_name+" you fucking deadbeat, you're out of credit.");
	falseFound=true;
      }
    });
    return !falseFound;

  }
  
  function addDrinks(activeElements,drinkId){
    debugger;
    var drinkName = Drinks.find(drinkId).fetch()[0]["drink_name"];
    var drinkPrice = Drinks.find(drinkId).fetch()[0]["price"];
    var numUsersSelected = Object.keys(Session.get("activeUsers")).length
    
    splitTabMode = $("#split_tab").hasClass("active");
    
    if( splitTabMode ){
      drinkPrice = (parseFloat(drinkPrice)/numUsersSelected).toFixed(2);
      drinkName = drinkName+" (splitTab)";
    }

    fundsFound = verifyFunds(getActiveUsers(),drinkPrice);
    if(fundsFound){
      $.each(activeElements,function(index,element){
	var userId = $(element).attr("user_id");

	// var user = Users.find(user_id).fetch("user_name")[0]["something"] = "assfuck";
	// Go through an array of drinks, each drink is a hash. Each drink hash
	// has a number of drinks purchases, a day that they were purchased,
	// the drink name, the drink id, and the drink price.
	var drink_found = false; 

	var user = Users.find(userId).fetch()[0];
	var drinks = user["drinks"];

	var userName = user["user_name"];
	
	//set drinks if it's not there (defensive programming)
	if(!drinks) drinks = [];
	
	$.each(drinks,function(index,drink){
	  if( drink ) {
	    //defensive programming stuff. make sure drink.day and currentDay have something
	    if( !drink["day"] ) drink.day = new Date();
	    if( !currentDay ) currentDay = new Date();
	    
	    var sameDay = drink["day"].getDate() === currentDay.getDate(); 
	    var sameName = drink["name"] === drinkName;
	    var sameId = drink["drink_id"] === drinkId;
	    var samePrice = drink.price === drinkPrice;
	    
	    if( sameDay && sameName && sameId && samePrice) {
	      drink["number"] = parseFloat(drink["number"])+1;
	      drink_found = true;
	    }
	  }
	});
	
	//if the drink didn't already exist make a blank one
	if(!drink_found){
	  var data = {
	    'day': new Date(),
	    'name': drinkName,
	    'drink_id': drinkId,
	    'number': 1,
	    'price': drinkPrice
	  };
	  drinks.push(data);
	}

	Users.update(userId,{$set: {drinks: drinks}});
	Users.update(userId,{$inc: {credit: -drinkPrice}});
	Drinks.update(drinkId,{$set: {timestamp: new Date().getTime()}});
        
	// Users.update(userId,{$set: {active: ""}});
	hash = Session.get("activeUsers");
	hash[userId] = false;
	Session.set("activeUsers",hash);
      // Users.update(user);p
	     // console.log(user);
      });
      $("#split_tab").removeClass("active");
      $(".select-all").removeClass("active");
    }
   
  }
  
  Template.drink.events = {
    'click [name="drink"]' : function(e){
      $(e.target).closest("[name='drink']").toggleClass("active");
      var elements = $("[name='user']");

      var activeElements = [];
      hash = Session.get("activeUsers");
      debugger;
      for(var id in hash){
	if(hash[id]){
	  activeElements.push($("[user_id='"+id+"']"));
	}
      }
      
      console.log(activeElements);
      if(activeElements.length > 0){
	$(e.target).closest("[name='drink']").toggleClass("active");
	var drinkId = $(e.target).closest("[name='drink']").attr("drink_id");
	console.log(drinkId);
	addDrinks(activeElements,drinkId);
      }
    }
  };
  //************************//
  //TYPEAHEAD STUFF        //
  //***********************//

  Template.drink.rendered = function(){
    // if(this.rendered){
      var hiddenDrinks = Drinks.find( {hidden: true} ).fetch();
      var names = [];
      
      hiddenDrinks.forEach( function(drink){
    	names.push(drink.drink_name);
      });
    $("#drink_form .typeahead").first().typeahead({
	source: names
    });
    $("#drink_form .typeahead").first().data('typeahead').source = names;
    // }
  };

  Template.user.rendered = function(){
    // if(this.rendered){
      var hiddenUsers = Users.find( {hidden: true} ).fetch();
      var names = [];
      
      hiddenUsers.forEach( function(user){
    	names.push(user.user_name);
      });
    $("#user_form .typeahead").first().typeahead({
	source: names
    });
    $("#user_form .typeahead").first().data('typeahead').source = names;
    // }
  };


  Template.drink_form.events({'keypress #drink_form' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      price = template.find("input[name='price']");
      drink_name = template.find("input[name='drink_name']");

      // XXX Do form validation
      priceFloat = parseFloat(price.value).toFixed(2);
      var data = {
	drink_name: drink_name.value,
	price: priceFloat,
	timestamp: new Date().getTime(),
	hidden: false
      };

      drinksWithName = Drinks.find({drink_name: drink_name.value}).fetch();
      if ( drinksWithName.length > 0 && isNaN(priceFloat)) Drinks.update(drinksWithName[0]._id,{$set:{hidden: false}});
      else if (drinksWithName.length > 0) Drinks.update(drinksWithName[0]._id,{$set: {hidden:false,price:priceFloat}});
      else if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 100)
	alert("You're a cocksucker. Put an actual number in. Go home Bobby, you're drunk");
      else Drinks.insert(data);

      drink_name.value="";
      price.value="";
    }
  }});

  Template.drink.drinks = function() {
    return Drinks.find({hidden: false}, {sort: {timestamp: -1, drink_name: 1}});
  };
  
  Template.user_form.events({'keypress #user_form' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      user_name = template.find("input[name='user-name']");

      // XXX Do form validation
      var data = {
	user_name: user_name.value,
	timestamp: new Date(),
	credit: 0,
	active: "",
	hidden: false
      };

      if (user_name.value === "")
	alert("You're a cocksucker. Put an actual name in. Go home Bobby, you're drunk");
      else if ( Users.find({user_name: user_name.value}).fetch()[0] ){
	userId = Users.find({user_name: user_name.value}).fetch()[0]._id;
	Users.update(userId,{$set: {hidden: false}});
      }
      else Users.insert(data);

      user_name.value="";
    }
  }});

  Template.user.users = function() {
    return Users.find({hidden: false}, {sort: {user_name: 1}});
  };
  
  Template.drink_table.users = function() {
    //if the day isn't selected, just use the current day
    // if( !Session.get("day") ) 
    var userElement = $("[name='user']");
    // var ids = [];
    // if ( $(userElement).find("[input='checkbox']").prop("checked") ){
    //   ids.push( $(element).attr("user_id") ) 
    // }
    day = Session.get("day");
    
    users = getActiveUsers();
    users.forEach( function(user){
      if(user.drinks){
	var now = new Date();
	var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
	
	var newDrinks = user.drinks.slice();
	user.drinks.forEach( function(drink,index){
	  if(!drink["day"]) drink["day"] = new Date();
	  if( drink["day"].getDate() !== day || drink.day.getTime() < aMonthBack) newDrinks.splice(newDrinks.indexOf(drink),1);
	});

	user.drinks = newDrinks;

	//clip credit to two decimals
	user.credit = user.credit.toFixed(2);
      }
    });
    return users;
    
  };

  Template.add_cash.events({'keypress #add_cash' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#add_cash");
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("You're a cocksucker, put a number in");
      }else{
	users = getActiveUsers();
	$.each(users,function(index,user){
	  Users.update(user["_id"],{$inc: {credit: value}});
	});
	
      }
      credit.value = "";
      
    }
    
  }});


  function getDates() {
    users = Users.find();
    var dates = [];
    var displayDates =[];
    users.forEach( function(user){
      if(user.drinks){
	user.drinks.forEach( function(drink){
	  var now = new Date();
	  var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
	  if(drink.day.getTime() > aMonthBack && dates.indexOf(drink.day.getDate()) == -1){
	    dates.push( drink.day.getDate() );
	    displayDates.push( drink.day.toLocaleDateString() );	    
	  }

	});
      }
    });
    
    return displayDates.sort().reverse();
  } 

  
  Template.dates_selector.dates = function(){
    return getDates();
  };

  Template.dates_selector.events({'click, touchend' : function(event,template){
    index = template.find(".form-control").selectedIndex;
    date = template.find(".form-control").options[index].value.split('/')[1];
    Session.set("day",parseFloat(date));
  }});

}

// code to run on server at startup
if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.publish('users',function(){
      return Users.find();
    });

    Meteor.publish('drinks',function(){
      return Drinks.find();
    });		   
  });

}
