//both client and server
Drinks = new Meteor.Collection("drinks");
Users = new Meteor.Collection("users");
if (Meteor.isClient) {
  var currentDay;
  Meteor.subscribe( 'users' );
  Meteor.subscribe( 'drinks' );

  $(function () {
    
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
    
  });

  Template.user.events = {
    'click': function(e){
      element = $(e.target).closest("[name='user']")
      var userId = $(e.target).closest("[name='user']").attr("user_id");
      var active = Users.find(userId).fetch()[0]["active"];
      var activeBool = active ==="active";

      if(activeBool){
	var thing = Users.update(userId,{$set: {active: ""}});
      }
      else
	Users.update(userId,{$set: {active: "active"}});

      $(element).toggleClass("active")
      
      $("[name='drink']").removeClass("active");

      $(element).click(function(e) {
	e.stopPropagation();
      });
     
    }
    
  };

  function addDrinks(activeElements,drinkId){
    $.each(activeElements,function(index,element){
      var userId = $(element).attr("user_id");

      // var user = Users.find(user_id).fetch("user_name")[0]["something"] = "assfuck";
      // Go through an array of drinks, each drink is a hash. Each drink hash
      // has a number of drinks purchases, a day that they were purchased,
      // the drink name, the drink id, and the drink price.
      var drink_found = false; 
      var drinkName = Drinks.find(drinkId).fetch()[0]["drink_name"];
      var drinkPrice = Drinks.find(drinkId).fetch()[0]["price"];

      var user = Users.find(userId).fetch()[0];
      var drinks = user["drinks"];

      var userName = user["user_name"];
      var newCredit = parseFloat(user["credit"])-parseFloat(drinkPrice);
      if( newCredit < 0 ) alert("Hey "+userName+" you fucking deadbeat, you're out of credit. Also, you're a cocksucker");
      else{
	if(!drinks) drinks = [];
	$.each(drinks,function(index,drink){
	  if( drink ) {
	    if( !drink["day"] ) drink["day"] = new Date();
	    if( !currentDay ) currentDay = new Date();
	    
	    var sameDay = drink["day"].getDate() === currentDay.getDate(); 
	    var sameName = drink["name"] === drinkName;
	    var sameId = drink["drink_id"] === drinkId;
	    
	    if( sameDay && sameName && sameId ) {
	      drink["number"] = parseFloat(drink["number"])+1;
	      drink_found = true;
	    }
	  }
	});
	if(!drink_found){
	  var data = {
	    'day': currentDay,
	    'name': drinkName,
	    'drink_id': drinkId,
	    'number': 1,
	    'price': drinkPrice
	  }
	  drinks.push(data);
	}

	Users.update(userId,{$set: {drinks: drinks}});
	Users.update(userId,{$inc: {credit: -drinkPrice}});
	Drinks.update(drinkId,{$set: {timestamp: new Date().getTime()}});
      }
      Users.update(userId,{$set: {active: ""}});
      // Users.update(user);
      // console.log(user);
    });
  }
  
  Template.drink.events = {
    'click [name="drink"]' : function(e){
      $(e.target).closest("[name='drink']").toggleClass("active");
      var elements = $("[name='user']")

      var activeElements = [];
      users = Users.find({active: "active"}).fetch();
      $.each(users,function(index,user){
	activeElements.push($("[user_id='"+user["_id"]+"']"));
      });
      
      console.log(activeElements);
      if(activeElements.length > 0){
	$(e.target).closest("[name='drink']").toggleClass("active");
	var drinkId = $(e.target).closest("[name='drink']").attr("drink_id");
	console.log(drinkId);
	addDrinks(activeElements,drinkId);
      }
    }
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
	timestamp: new Date().getTime()
      };

      console.log();
      drinkNameExists = Drinks.find({drink_name: drink_name.value}).fetch().length > 0
      if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 100 || drinkNameExists)
	alert("You're a cocksucker. Put an actual number in. Go home Bobby, you're drunk");
      else Drinks.insert(data);

      drink_name.value="";
      price.value="";
    }
  }});

  Template.drink.drinks = function() {
    return Drinks.find({}, {sort: {timestamp: -1, drink_name: 1}});
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
	active: ""
      };

      if (user_name.value === "")
	alert("You're a cocksucker. Put an actual name in. Go home Bobby, you're drunk");
      else Users.insert(data);

      user_name.value="";
    }
  }});

  Template.user.users = function() {
    return Users.find({}, {sort: {user_name: 1}});
  };

  Template.drink_table.users = function() {
    var userElement = $("[name='user']")
    // var ids = [];
    // if ( $(userElement).find("[input='checkbox']").prop("checked") ){
    //   ids.push( $(element).attr("user_id") ) 
    // }
    day = Session.get("day")
    users = Users.find({active: "active"}, {sort: {user_name: 1}}).fetch();
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
      }
    });
    return users;
    
  };

  Template.add_cash.events({'keypress #add_cash' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#add_cash")
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("You're a cocksucker, put a number in");
      }else{
	users = Users.find({active: "active"}).fetch();
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
    return displayDates;
  } 

  
  Template.dates_selector.dates = function(){
    return getDates();
  };

  Template.dates_selector.events({'click' : function(event,template){
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
