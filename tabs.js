//both client and server
Drinks = new Meteor.Collection("drinks");
Users = new Meteor.Collection("users");
if (Meteor.isClient) {
  var day;
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
	  if ( $(element).find("input[type='checkbox']").prop("checked") ){
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
      element = $(e.target).closest("[name='user']").find("input[type='checkbox']")
      var userId = $(e.target).closest("[name='user']").attr("user_id");
      var checked = Users.find(userId).fetch()[0]["checked"]
      var checkedBool = checked ==="checked"

      if(checkedBool)
	Users.update(userId,{$set: {checked: ""}});
      else
	Users.update(userId,{$set: {checked: "checked"}});

      $(element).prop("checked",!checkedBool);
      
      $("[name='drink']").removeClass("active");

      $(element).click(function(e) {
	e.stopPropagation();
      });



    }
    
  };

  function addDrinks(checkedElements,drinkId){
    $.each(checkedElements,function(index,element){
      var userId = $(element).attr("user_id");

      // var user = Users.find(user_id).fetch("user_name")[0]["something"] = "assfuck";
      // Go through an array of drinks, each drink is a hash. Each drink hash
      // has a number of drinks purchases, a day that they were purchased,
      // the drink name, the drink id, and the drink price.
      var drink_found = false; 
      var drinkName = Drinks.find(drinkId).fetch()[0]["drink_name"];
      var drinkPrice = Drinks.find(drinkId).fetch()[0]["price"];

      var user = Users.find(userId).fetch()[0]
      var drinks = user["drinks"];

      var userName = user["user_name"];
      var newCredit = parseFloat(user["credit"])-parseFloat(drinkPrice);
      if( newCredit < 0 ) alert("Hey "+userName+" you fucking deadbeat, you're out of credit. Also, you're a cocksucker");
      else{
	if(!drinks) drinks = [];
	$.each(drinks,function(index,drink){
	  if( drink ) {
	    if( !drink["day"] ) drink["day"] = new Date();
	    if( !day ) day = new Date();
	    
	    var sameDay = drink["day"].getDay() === day.getDay(); 
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
	    'day': day,
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
      Users.update(userId,{$set: {checked: ""}});
      // Users.update(user);
      // console.log(user);
    });
  }
  
  Template.drink.events = {
    'click [name="drink"]' : function(e){
      $(e.target).closest("[name='drink']").toggleClass("active");
      var checked = false
      var elements = $("[name='user']")
      var checkedElements = [];
      $.each(elements,function(index,element){
	if ( $(element).find("[type='checkbox']").prop("checked") ){
	  checked=true;
	  checkedElements.push( element )
	}
	
      });
      
      console.log(checkedElements);
      if(checked){
	$(e.target).closest("[name='drink']").toggleClass("active");
	var drinkId = $(e.target).closest("[name='drink']").attr("drink_id");
	console.log(drinkId);
	addDrinks(checkedElements,drinkId);
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
	checked: ""
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
    return Users.find({checked: "checked"}, {sort: {user_name: 1}});
  };

  Template.add_cash.events({'keypress #add_cash' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#add_cash")
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("You're a cocksucker, put a number in");
      }else{
	users = Users.find({checked: "checked"}).fetch();
	$.each(users,function(index,user){
	  Users.update(user["_id"],{$inc: {credit: value}});
	});
	
      }
      credit.value = "";
      
    }
    
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
