//both client and server
Drinks = new Meteor.Collection("drinks");
Users = new Meteor.Collection("users");
if (Meteor.isClient) {
  var day;
  Meteor.subscribe( 'users' );
  Meteor.subscribe( 'drinks' );

  $(function () {
    $("#delete_button").click( function(){ 
      $.each($("[name='drink']"),function(index,element){
	if($(element).hasClass("active")){
	  var id = $(element).attr("drink_id");
	  Drinks.remove(id);
	}  
      });
    });
    
    $("#new_pregame").click( function(e){
      day = new Date()
    });
  });

  Template.user.events = {
    'click': function(e){
      element = $(e.target).closest("[name='user']").find("input[type='checkbox']")

      if($(element).prop("checked"))
	$(element).prop("checked",false);
      else $(element).prop("checked",true);
      
      $("[name='drink']").removeClass("active");

      $(element).click(function(e) {
	e.stopPropagation();
      });

      // if( !$(e.target).find("input[type='checkbox']") )
      // 	element = $(e.target).parent().find("input[type='checkbox']")
      // else

    }
    
  };
  // $("[name='price']").keypress(function(event) {
  //         console("HIII SHITHEAD");
  //   if (event.which == 13) {
  //     event.preventDefault();
  //     $("#drink_form").submit();
  //   }
  // });
  function addDrinks(checkedElements,drinkId){
    $.each(checkedElements,function(index,element){
      var userId = $(element).attr("user_id");

      // var user = Users.find(user_id).fetch("user_name")[0]["something"] = "assfuck";
      // Go through an array of drinks, each drink is a hash. Each drink hash
      // has a number of drinks purchases, a day that they were purchased,
      // the drink name, the drink id, and the drink price.
      var drink_found = false; 
      var drinkName = Drinks.find(drinkId).fetch()[0]["drink_name"];
      var drinks = Users.find(userId).fetch()[0]["drinks"];
      if(!drinks) drinks = [];
      $.each(drinks,function(index,drink){
	if( drink ) {
	  if( !drink["day"] ) drink["day"] = new Date();
	  if( !day ) day = new Date();
	  
	  var sameDay = drink["day"].getTime() === day.getTime(); 
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
	  'number': 1
	}
	drinks.push(data);
      }
      console.log(drinks);
      Users.update(userId,{$set: {drinks: drinks}});
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
      var data = {
	drink_name: drink_name.value,
	price: price.value,
	timestamp: new Date()
      };
      priceFloat = parseFloat(data['price']);
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
	timestamp: new Date()
      };

      if (user_name == "")
	alert("You're a cocksucker. Put an actual name in. Go home Bobby, you're drunk");
      else Users.insert(data);

      user_name.value="";
    }
  }});

  Template.user.users = function() {
    return Users.find({}, {sort: {user_name: 1}});
  };

  
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
