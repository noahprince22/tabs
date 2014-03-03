/* @author Noah Prince
 * 
 * 
 */


//both client and server
// Users = new Meteor.Collection("users");
  Drinks = new Meteor.Collection("drinks");
  Clients = new Meteor.Collection("clients");

Meteor.absoluteUrl("/",{'rootUrl':"http://tabber.ngrok.com/"});
if (Meteor.isClient) {
  var currentDay;
    Session.set('data-loaded',false);
  Session.set("day",new Date().getDate());
  Session.set("activeClients",{});
  Session.set("confirmActives",[]);
  Session.set("confirmDrink","");
  Session.set("confirmPrice",0);
  Session.set("confirmed",false);

    Meteor.subscribe( 'clients' ,function(){
	Session.set('data-loaded',true);
    });
  Meteor.subscribe( 'drinks' );
  Meteor.subscribe( 'users' );

  function JSON2CSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

	var str = '';
	var line = '';

	if ($("#labels").is(':checked')) {
	  var head = array[0];
	  if ($("#quote").is(':checked')) {
		for (var index in array[0]) {
		  var value = index + "";
		  line += '"' + value.replace(/"/g, '""') + '",';
		}
	  } else {
		for (var index in array[0]) {
		  line += index + ',';
		}
	  }

	  line = line.slice(0, -1);
	  str += line + '\r\n';
	}

	for (var i = 0; i < array.length; i++) {
	  var line = '';

	  if ($("#quote").is(':checked')) {
		for (var index in array[i]) {
		  var value = array[i][index] + "";
		  line += '"' + value.replace(/"/g, '""') + '",';
		}
	  } else {
		for (var index in array[i]) {
		  line += array[i][index] + ',';
		}
	  }

	  line = line.slice(0, -1);
	  str += line + '\r\n';
	}
	return str;

  }

  $("#convert").click(function() {
	var json = $.parseJSON($("#json").val());
	var csv = JSON2CSV(json);
	$("#csv").val(csv);
  });

  $("#download").click(function() {
	var json = $.parseJSON($("#json").val());
	var csv = JSON2CSV(json);
	window.open("data:text/csv;charset=utf-8," + escape(csv))
  });
  

  function isMobile(){
    return $(window).width() < 650;
  }

  function getInactiveClients(){
      hash = Session.get("activeClients");
      returnClients = [];
  }
  /*************************
   * General Use Functions!*
   ************************/
  /** Sets all meteor drink objects to the given data
   *
   * @param cursors [Meteor Cursor Array] the cursors of the drinks to be altered
   * @param data [Hash] a hash representing the alteration. Example: {$set: {price: 0.50}}
   */
  function setAllDrinks(cursors,data){
    var ids = [];
    cursors.forEach( function(cursor){
	  ids.push( cursor._id );
    });
    
    ids.forEach( function(id){
	  Drinks.update(id,{$set: data});
    });
    
  }

  //@return [Boolean] whether a user is currently signed in through Facebook or Twitter
  function isUser(){
    return !!Meteor.users.find().fetch()[0];
  }
  
  /** Verifies all clients passed can afford the given price
   *
   * @param clients [Array] An array of Meteor Client objects to be checked
   * @param drinkPrice [int] the price of the drink
   * @param quiet [Boolean] Whether the client is alerted when there aren't enough funds available [OPTIONAL]
   */
  function verifyFunds(clients,drinkPrice,quiet){
    if(arguments.length==2) quiet = false;
    var falseFound = false;
    clients.forEach(function(client){
      var newCredit = parseFloat(client.credit)-parseFloat(drinkPrice);
      if( newCredit < 0 ) {

		if( !quiet ){
		  alert("Hey "+client.client_name+", you deadbeat, you're out of credit.");
		}
		
		falseFound=true;
      }
    });
    return !falseFound;

  }

  // Sets the size of the slide in container
  function setSlideSize(){
    var p = $("#slide_div");
    var oldHeight = $("#slide_div").height();
    var oldWidth = $("#slide_div").width();
    if(p.length != 0){
      var offset = p.offset();
      $("#hidden_container").offset({ top: offset.top, left: offset.left});
      
      $("#confirm_container").width( oldWidth +10);
      $("#confirm_container").height( oldHeight );
    }
  }


  /** Hides the main container and slides in the confirmation
  *
  * @param f [Function] the function to execute on confirmation (usually addDrinks())
  */
  function hideMain(f){
    $("#slide_div").promise().done(function(){
      $("#slide_div").toggle("slide",{"direction": "left"});
      $("#hidden_container").toggle("slide",{"direction":"right"});
      // $("#slide_div").animate({"margin-left": '-=2000'});
    });
    $("#slide_div").promise().done(function(){
      // $("#hidden_container").css("z-index", 4);
      $(".confirm").bind("click.confClick", function(){
		
		f();
		$(".confirm").unbind("click.confClick");
		$(".cancel").unbind("click.confClick");
							 showMain();
      });

      $(".cancel").bind("click.confClick", function(){
		showMain();
		$(".confirm").unbind("click.confClick");
		$(".cancel").unbind("click.confClick");
      });
    });
  }

  // Shows the main container and slides the confirmation out
  function showMain(){    
    $("#hidden_container").toggle("slide",{"direction":"right"});
    $("#slide_div").promise().done(function(){
      // will be called when all the animations on the queue finish
      $("#slide_div").toggle("slide",{"direction":"left"});
    });
  };

  //@return [Boolean] whether the person signed in is an admin
  function isAdminMode(){
    user = Meteor.users.find({}).fetch()[0];
    if( user && user.profile && (user.profile.name === "Noah Prince" || user.profile.name === "Robert D Hartmann") ) return true;
    return false;     
  }
  /** Adds the given drink (by drink id) to all selected clients
   *
   * @param drinkId [String] the Mongo ID of the drink to add 
   */
  function addDrinks(activeElements,drinkId){
	var drinkName = Drinks.find(drinkId).fetch()[0]["drink_name"];
	var drinkPrice = Drinks.find(drinkId).fetch()[0]["price"];
	var numClientsSelected = Object.keys(Session.get("activeClients")).length;

	splitTabMode = $("#split_tab").hasClass("active");

	if( splitTabMode ){
	  drinkPrice = (parseFloat(drinkPrice)/numClientsSelected).toFixed(2);
	  drinkName = drinkName+" (splitTab)";
	  Drinks.update(drinkId,{$inc: {available: -1}});
	}
	fundsFound = verifyFunds(getActiveClients(),drinkPrice);
	// $("[name='client']").removeClass("active");
	if(fundsFound){
	  Session.set("confirmActives",getActiveClients());
	  Session.set("confirmDrink",drinkName);
	  Session.set("confirmPrice",drinkPrice);
	  hideMain(function(){
		$.each(getActiveClients(),function(index,client){
		  var clientId = client._id

		  // Go through an array of drinks, each drink is a hash. Each drink hash
		  // has a number of drinks purchases, a day that they were purchased,
		  // the drink name, the drink id, and the drink price.
		  var drink_found = false;

		  var client = client
		  var drinks = client.drinks

		  var clientName = client["client_name"];

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

		  Clients.update(clientId,{$set: {drinks: drinks}});
		  Clients.update(clientId,{$inc: {credit: -drinkPrice}});
		  Drinks.update(drinkId,{$set: {timestamp: new Date().getTime()}});
		  if( !splitTabMode ){
			Drinks.update(drinkId,{$inc: {available: -1}});
		  }
		  // Clients.update(clientId,{$set: {active: ""}});
		  if( !isMobile() ){
			hash = Session.get("activeClients");
			hash[clientId] = false;
			Session.set("activeClients",hash);
		  }
		  // Clients.update(client);p
		  // console.log(client);
		});
		$("#split_tab").removeClass("active");
		$(".select-all").removeClass("active");

		// $("#main_container").animate({width: 'toggle'})
		//set
		// $("#slide_div").animate({"margin-left": '+=2000'});
		// $("#hidden_container").toggleClass("hidden");
		// // $lefty.animate({
		// left: parseInt($lefty.css('left'),10) == 0 ?
		//   -$lefty.outerWidth() :
		//   0
		// });
		// $lefty.animate({
		// left: parseInt($lefty.css('left'),10) == 0 ?
		//   -$lefty.outerWidth() :
		//   0
		// });

	  });
	}
  }
  /** Parses a dates array for a given day
  *
  * @param dates [Array[][]] Array of two dimensional arrays containing a [0] a time, and [1] a day
  * @param day [int] The day we're looking for
  * NOTE: This function was created specifically as a helper for the getDates() function 
  */
  function datesHasDate(dates, day){
    var now = new Date();
    var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, now.getDate()+1).getTime();
    bool = false;
    dates.forEach(function(arr){
	if( arr[0].getDate() === day.getDate() && day.getTime()>aMonthBack ) bool =  true;
    });
    return bool;
  }

  // Retrieves the available dates for the pull down date selector
  function getDates() {
    clients = Clients.find().fetch();
    var dates = [];
    // var displayDates =[];
    clients.forEach( function(client){
      if(client.drinks){
	client.drinks.forEach( function(drink){
	  var now = new Date();
	  var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, now.getDate()+1).getTime();
// if( drink.day.getDate() == 1)
	// debugger;
	  if( drink.day && (drink.day.getTime() > aMonthBack) && !datesHasDate(dates,drink.day) ){
	    dates.push( [drink.day,drink.day.toLocaleDateString()] );
	    // displayDates.push( drink.day.getTime() );	    
	  }

	});
      }
    });

    if( !datesHasDate(dates,new Date()) ){
      dates.push([new Date(),(new Date()).toLocaleDateString()]);
    }
    
      return dates.sort(function(arr,arr2){ return arr[0].getTime() - arr2[0].getTime(); } ).reverse();
    // return [displayDates.sort().reverse().map(function(obj){ return ( new Date(obj) ).toLocaleDateString(); }), dates.sort().reverse()]; 
  }


  function getActiveClients(){
	hash = Session.get("activeClients");
	returnClients = [];

	clients = Clients.find({},{sort: {client_name: 1}});
	clients.forEach(function(client){
	  if(hash[client._id]) returnClients.push(client);
	});
	return returnClients;
	// {sort: {client_name: 1}

  }

  function setAllClients(cursors,data){
	var ids = [];
	cursors.forEach( function(cursor){
	  ids.push( cursor._id );
	});

	ids.forEach( function(id){
	  Clients.update(id,{$set: data});
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

  function getInactiveClients(){
	hash = Session.get("activeClients");
	returnClients = [];

	clients = Clients.find({},{sort: {client_name: 1}});
	clients.forEach(function(client){
	  if(!hash[client._id]) returnClients.push(client);
	});
	return returnClients;

  }

  /*************************
   * To Be Run Once        *
   ************************/
  if(isMobile()){
	hash = Session.get("activeClients");
	user = Meteor.users.find().fetch();
	if(user)
	  client = Clients.find({user_id: user._id}).fetch()[0];
	if( client ){
	  hash[client._id] = true;
	  Session.set("activeClients",hash);					
	}
	
  }

  /*********************************
   * CONFIRMATION TEMPLATE         *
   *********************************/
  Template.confirmation.rendered = function(){
    setSlideSize();
  };
  
  Template.confirmation.clients = function(){
    if(Session.get("confirmActives").length > 0){
      data = [];
    }else{
      return null;
    }
    var i = 0;
    Session.get("confirmActives").forEach(function(client){
      data[i] = {
	"drink-name":Session.get("confirmDrink"),
	"credit":(parseFloat(client.credit) - Session.get("confirmPrice")).toFixed(2),
	"name":client.client_name
      };
      i++;
    });

    return data;
  };

  /*******************************
   * Drink Template Stuff        *
   ******************************/
  Template.drink.events = {
    'touchstart' : function(e){ e.stopImmediatePropagation(); },
    'click [name="drink"]' : function(e){
      $(e.target).closest("[name='drink']").toggleClass("active");
      var elements = $("[name='client']");

      var activeElements = [];
      hash = Session.get("activeClients");

      for(var id in hash){
	if(hash[id]){
	  activeElements.push($("[client_id='"+id+"']"));
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


  Template.drink.drinks = function() {
	return Drinks.find({hidden: false,available: {$gt: 0}}, {sort: {timestamp: -1, drink_name: 1}});
  }


  /****************************
   * drink_form Template stuff *
   ***************************/
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
		hidden: false,
	    available: 1
      };

      drinksWithName = Drinks.find({drink_name: drink_name.value}).fetch();
      if ( drinksWithName.length > 0 && isNaN(priceFloat)){
		Drinks.update(drinksWithName[0]._id,{$set:{hidden: false}});

		available = Drinks.find(drinksWithName[0]._id).fetch()[0].available;
		if( available <= 0 ) Drinks.update( drinksWithName[0]._id, {$set: {available: 1}} );
      }
      else if (drinksWithName.length > 0){
		Drinks.update(drinksWithName[0]._id,{$set: {hidden:false,price:priceFloat}});

		available = Drinks.find(drinksWithName[0]._id).fetch()[0].available;
		if( available <= 0 ) Drinks.update( drinksWithName[0]._id, {$set: {available: 1}} );
      }
      else if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 100)
		alert("Put an actual number in. Go home Bobby, you're drunk");
      else Drinks.insert(data);

      drink_name.value="";
      price.value="";
    }
  }});


  //************************//
  // TYPEAHEAD STUFF        //
  //***********************//

  Template.client.rendered = function(){
    // if(this.rendered){
      var hiddenclients = Clients.find( {hidden: true} ).fetch();
      var names = [];
      
      hiddenclients.forEach( function(client){
    	names.push(client.client_name);
      });

    $("#client_form .typeahead").first().typeahead({
	source: names
    });
    $("#client_form .typeahead").first().data('typeahead').source = names;


    if(isMobile()){
	$(document).load(function(){
	user = Meteor.users.find().fetch()[0];
	if(user){
	    hash = Session.get("activeClients");
	    
	    // while(!Clients.find({user_id: user._id}).fetch()[0]){
	    // 	Thread.sleep(200);
	    // }
	    client = Clients.find({user_id: user._id}).fetch()[0];
	    if( client ){
		hash[client._id] = true;
		Session.set("activeClients",hash);					
	    }
	}
	});

    }

    // }
  };


  Template.drink.rendered = function(){
	// if(this.rendered){
	var hiddenDrinks = Drinks.find({$or: [{hidden: true},{available: {$lte: 0}}] }).fetch();
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


  /************************
   * client Template stuff*
   ***********************/
  Template.client.clients = function() {
    return Clients.find({hidden: false}, {sort: {client_name: 1}});
  };

  Template.client.events = {
	'touchstart' : function(e){ e.stopImmediatePropagation(); },
	'click': function(e){
	  element = $(e.target).closest("[name='client']");
	  hash = Session.get("activeClients");

	  var clientId = $(e.target).closest("[name='client']").attr("client_id");
	  var active = hash[clientId];
	  //toggling the active on the client
	  if(active){
		hash[clientId] = false;
		// var thing = Clients.update(clientId,{$set: {active: ""}});
	  }
	  else{
		hash[clientId] = true;
	  }

	  Session.set("activeClients",hash);
	  $("[name='drink']").removeClass("active");

	}

  };
  
  /*****************************
   * client_form Template stuff*
   ****************************/
  Template.client_form.events({'keypress #client_form' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      client_name = template.find("input[name='client-name']");

      // XXX Do form validation
      var data = {
	client_name: client_name.value,
	timestamp: new Date(),
	credit: 0,
	active: "",
	drinks : [],
	hidden: false
      };

      if (client_name.value === "")
	alert("Put an actual name in. Go home Bobby, you're drunk");
      else if ( Clients.find({client_name: client_name.value}).fetch()[0] ){
	clientId = Clients.find({client_name: client_name.value}).fetch()[0]._id;
	Clients.update(clientId,{$set: {hidden: false}});
      }
      else Clients.insert(data);
      client_name.value="";
    }
  }});
  
  /*******************************
   * drink_table Template stuff  *
   *******************************/
  Template.drink_table.clients = function() {
    var clientElement = $("[name='client']");
    day = Session.get("day");
    
    clients = getActiveClients();
    clients.forEach( function(client){
      if(client.drinks){
		var now = new Date();
		var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, now.getDate()+1).getTime();
	
		var newDrinks = client.drinks.slice();

		client.drinks.forEach( function(drink,index){
		  if(!drink["day"]) drink["day"] = new Date();
		  if( drink["day"].getDate() !== day || drink.day.getTime() < aMonthBack) newDrinks.splice(newDrinks.indexOf(drink),1);
		});
		
		client.drinks = newDrinks;

		//clip credit to two decimals
		client.credit = client.credit.toFixed(2);
      }
    });
    return clients;
    
  };

  /******************************
   * main Template stuff        *
   *****************************/  
  Template.main.is_user = function(){
	return isUser();
  };
  
  Template.main.is_mobile = function(){
	return isMobile();
  };
  
  Template.main.has_funds = function(){
    // if( getActiveClients().length == 0 ) return true;
    user = Meteor.users.find().fetch()[0];
    var client = null;

    if( user ) {userId = user._id
				client = Clients.find({user_id: userId}).fetch()[0];
			   }
    if( client ){
      return verifyFunds([client],0.01,true);
    }
    return true;
  };


  /**************************
   * add_cash Template stuff*
   *************************/
  Template.add_cash.events({'keypress #add_cash' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#add_cash");
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("Put a number in!!!!");
      }else{
	clients = getActiveClients();
	hash = Session.get("activeClients");
	$.each(clients,function(index,client){
	  Clients.update(client["_id"],{$inc: {credit: value}});
	  hash[client._id] = false;
	});
	$.each($("[name='drink'][class='active']"),function(index,drink){
	  drinkId = $(drink).attr("drink_id");
	  Drinks.update(drinkId,{$inc: {available: parseFloat(value.toFixed(0))}});
	});

	Session.set("activeClients",hash);
	
      }
      credit.value = "";
      
    }
    
  }});

  Template.add_cash.hidden = function(e){
    if ( isAdminMode() ){
      return "";
    }
    return "hidden";
  };


  Template.inc_price.events({'keypress #inc_price' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#inc_price");
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("Put a number in!!!!");
      }else{
	$.each($("[name='drink'][class='active']"),function(index,drink){
	  drinkId = $(drink).attr("drink_id");
	    price = Drinks.find(drinkId).fetch()[0].price;
	    priceNew = parseFloat(price) + parseFloat(value);
	    Drinks.update(drinkId,{$set: {price: priceNew.toFixed(2)}});
	});
	
      }
      credit.value = "";
      
    }
    
  }});

  Template.inc_price.hidden = function(e){
    if ( isAdminMode() ){
      return "";
    }
    return "hidden";
  };

  Template.delete_stuff.hidden = function(e){
    if ( isAdminMode() ){
      return "";
    }
    return "hidden";
  };

  /********************************
   * dates_selector template stuff*
   *******************************/

  Template.dates_selector.dates = function(){
    return getDates();
  };

  Template.dates_selector.events({'change select, select' : function(event,template){
    index = template.find(".form-control").selectedIndex;
    date = new Date(template.find(".form-control").options[index].value).getDate();
    
    Session.set("day",parseFloat(date));
  }});

  
  /**********************************************************
   * Functions that change when their database calls change *
   * Be careful with this stuff, can create laggy loops!    *
   *********************************************************/
  Deps.autorun(function(e){

	function isMobile(){
      return $(window).width() < 650;
	}
	
	if(Meteor.userId() && (Clients.find().fetch().length > 1) && Session.get("data-loaded")){
	  console.log(Clients.find().fetch().length);
	  users = Meteor.users.find({}).fetch();
	  // XXX Do form validation
	  users.forEach(function(user){

		var data = {
		  client_name: user.profile.name,
		  timestamp: new Date(),
		  credit: 0,
		  active: "",
		  drinks: [],
		  user_id: user._id,
		  hidden: false
		};
		//note, this was a race condition for the page to load, it was using bad information because
		//the page hadn't loaded yet

		//$(document).load(function(){

		// while(!(Clients.find().fetch().length != 0 )){
		// Thread.sleep(200);
		// }

		//setTimeout(addUsers, 5000)
		//function addUsers(){
		if( Clients.find().fetch().length !=0 ){
		  if (user.profile.name === "")
			alert("Put an actual name in. Go home Bobby, you're drunk");
		  else if( Clients.find({user_id: user._id}).fetch()[0] ) {
			console.log("found me" );
			clientId = Clients.find({user_id: user._id}).fetch()[0]._id;
			if( Clients.find(clientId).fetch()[0].hidden )
			  Clients.update(clientId,{$set: {hidden: false}});
		  }
		  else if( Clients.find({client_name: user.profile.name}).fetch()[0] ){
			clientId = Clients.find({client_name: user.profile.name}).fetch()[0]._id;
			if( Clients.find(clientId).fetch()[0].hidden )
			  Clients.update(clientId,{$set: {hidden: false}});
		  }
		  else if ( Clients.find({client_name: user.profile.name.split(" ")[0]}).fetch()[0] &&!("user_id" in Clients.find({client_name: user.profile.name.split(" ")[0]}).fetch()[0]) ){
			oldUser = Clients.find({client_name: user.profile.name.split(" ")[0]}).fetch()[0];
			var stringy = "Are you the user named " + oldUser.client_name + " that is already in the system?"
			var retVal = confirm( stringy );
			if( retVal == true ){
			  clientId = oldUser._id
			  Clients.update(clientId,{$set: {hidden: false,client_name: user.profile.name,user_id: user._id}});
			}
			if ( !retVal ) {
			  Clients.insert(data);
			}
		  }
		  else if ( Clients.find({}).fetch()[0] ) {
			Clients.insert(data);
			Console.log("Made a new one for no goddamn reason");
		  }
		}



		Session.set("user",user._id);
		Session.set("user_name",user.profile.name);

		//}
	  });
	}


	if( isMobile() ){
	  user = Meteor.users.find().fetch()[0];
	  client = null;
	  if( user ) {
		userId = user._id
		client = Clients.find({user_id: userId}).fetch()[0];
	  }

	  if(client){
		var string = client._id;
		hash = Session.get("activeClients");
		hash[string] = true;
		Session.set("activeClients",hash);
	  }
	}
	getActiveClients().forEach( function(client){
	  $("[name='client'][client_id='"+client._id+"']").addClass("active");
	});

	getInactiveClients().forEach( function(client){
	  $("[name='client'][client_id='"+client._id+"']").removeClass("active");
	});
  });


  

	/************************************************************************************
* jquery stuff which attaches all of the main (non changing) buttons click events   *
************************************************************************************/
  $(function () {

		//IGNORE ALL OF THIS, IT IS FILESAVER.JS, look it up online
		var saveAs = saveAs
		// IE 10+ (native saveAs)
		// || (navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
		// Everyone else
			|| (function(view) {
					"use strict";
					// IE <10 is explicitly unsupported
					// if (/MSIE [1-9]\./.test(navigator.userAgent)) {
					// return;
					// }
					var
					doc = view.document
					// only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
					, get_URL = function() {
						return view.URL || view.webkitURL || view;
					}
					, URL = view.URL || view.webkitURL || view
					, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
					, can_use_save_link = !view.externalHost && "download" in save_link
					, click = function(node) {
						var event = doc.createEvent("MouseEvents");
						event.initMouseEvent(
							"click", true, false, view, 0, 0, 0, 0, 0
							, false, false, false, false, 0, null
						);
						node.dispatchEvent(event);
					}
					, webkit_req_fs = view.webkitRequestFileSystem
					, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
					, throw_outside = function(ex) {
						(view.setImmediate || view.setTimeout)(function() {
																   throw ex;
															   }, 0);
					}
					, force_saveable_type = "application/octet-stream"
					, fs_min_size = 0
					, deletion_queue = []
					, process_deletion_queue = function() {
						var i = deletion_queue.length;
						while (i--) {
							var file = deletion_queue[i];
							if (typeof file === "string") { // file is an object URL
								URL.revokeObjectURL(file);
							} else { // file is a File
								file.remove();
							}
						}
						deletion_queue.length = 0; // clear queue
					}
					, dispatch = function(filesaver, event_types, event) {
						event_types = [].concat(event_types);
						var i = event_types.length;
						while (i--) {
							var listener = filesaver["on" + event_types[i]];
							if (typeof listener === "function") {
								try {
									listener.call(filesaver, event || filesaver);
								} catch (ex) {
									throw_outside(ex);
								}
							}
						}
					}
					, FileSaver = function(blob, name) {
						// First try a.download, then web filesystem, then object URLs
						var
						filesaver = this
						, type = blob.type
						, blob_changed = false
						, object_url
						, target_view
						, get_object_url = function() {
							var object_url = get_URL().createObjectURL(blob);
							deletion_queue.push(object_url);
							return object_url;
						}
						, dispatch_all = function() {
							dispatch(filesaver, "writestart progress write writeend".split(" "));
						}
						// on any filesys errors revert to saving with object URLs
						, fs_error = function() {
							// don't create more object URLs than needed
							if (blob_changed || !object_url) {
								object_url = get_object_url(blob);
							}
							if (target_view) {
								target_view.location.href = object_url;
							} else {
								window.open(object_url, "_blank");
							}
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						}
						, abortable = function(func) {
							return function() {
								if (filesaver.readyState !== filesaver.DONE) {
									return func.apply(this, arguments);
								}
							};
						}
						, create_if_not_found = {create: true, exclusive: false}
						, slice
						;
						filesaver.readyState = filesaver.INIT;
						if (!name) {
							name = "download";
						}
						if (can_use_save_link) {
							object_url = get_object_url(blob);
							// FF for Android has a nasty garbage collection mechanism
							// that turns all objects that are not pure javascript into 'deadObject'
							// this means `doc` and `save_link` are unusable and need to be recreated
							// `view` is usable though:
							doc = view.document;
							save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
							save_link.href = object_url;
							save_link.download = name;
							var event = doc.createEvent("MouseEvents");
							event.initMouseEvent(
								"click", true, false, view, 0, 0, 0, 0, 0
								, false, false, false, false, 0, null
							);
							save_link.dispatchEvent(event);
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
							return;
						}
						// Object and web filesystem URLs have a problem saving in Google Chrome when
						// viewed in a tab, so I force save with application/octet-stream
						// http://code.google.com/p/chromium/issues/detail?id=91158
						if (view.chrome && type && type !== force_saveable_type) {
							slice = blob.slice || blob.webkitSlice;
							blob = slice.call(blob, 0, blob.size, force_saveable_type);
							blob_changed = true;
						}
						// Since I can't be sure that the guessed media type will trigger a download
						// in WebKit, I append .download to the filename.
						// https://bugs.webkit.org/show_bug.cgi?id=65440
						if (webkit_req_fs && name !== "download") {
							name += ".download";
						}
						if (type === force_saveable_type || webkit_req_fs) {
							target_view = view;
						}
						if (!req_fs) {
							fs_error();
							return;
						}
						fs_min_size += blob.size;
						req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
																		  fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
																																		   var save = function() {
																																			   dir.getFile(name, create_if_not_found, abortable(function(file) {
																																																	file.createWriter(abortable(function(writer) {
																																																									writer.onwriteend = function(event) {
																																																										target_view.location.href = file.toURL();
																																																										deletion_queue.push(file);
																																																										filesaver.readyState = filesaver.DONE;
																																																										dispatch(filesaver, "writeend", event);
																																																									};
																																																									writer.onerror = function() {
																																																										var error = writer.error;
																																																										if (error.code !== error.ABORT_ERR) {
																																																											fs_error();
																																																										}
																																																									};
																																																									"writestart progress write abort".split(" ").forEach(function(event) {
																																																																							 writer["on" + event] = filesaver["on" + event];
																																																																						 });
																																																									writer.write(blob);
																																																									filesaver.abort = function() {
																																																										writer.abort();
																																																										filesaver.readyState = filesaver.DONE;
																																																									};
																																																									filesaver.readyState = filesaver.WRITING;
																																																								}), fs_error);
																																																}), fs_error);
																																		   };
																																		   dir.getFile(name, {create: false}, abortable(function(file) {
																																															// delete file if it already exists
																																															file.remove();
																																															save();
																																														}), abortable(function(ex) {
																																																		  if (ex.code === ex.NOT_FOUND_ERR) {
																																																			  save();
																																																		  } else {
																																																			  fs_error();
																																																		  }
																																																	  }));
																																	   }), fs_error);
																	  }), fs_error);
					}
					, FS_proto = FileSaver.prototype
					, saveAs = function(blob, name) {
						return new FileSaver(blob, name);
					}
					;
					FS_proto.abort = function() {
						var filesaver = this;
						filesaver.readyState = filesaver.DONE;
						dispatch(filesaver, "abort");
					};
					FS_proto.readyState = FS_proto.INIT = 0;
					FS_proto.WRITING = 1;
					FS_proto.DONE = 2;

					FS_proto.error =
						FS_proto.onwritestart =
						FS_proto.onprogress =
						FS_proto.onwrite =
						FS_proto.onabort =
						FS_proto.onerror =
						FS_proto.onwriteend =
						null;

					view.addEventListener("unload", process_deletion_queue, false);
					return saveAs;
				}(
					typeof self !== "undefined" && self
						|| typeof window !== "undefined" && window
						|| this.content
				));
		// `self` is undefined in Firefox for Android content script context
		// while `this` is nsIContentFrameMessageManager
		// with an attribute `content` that corresponds to the window

		if (typeof module !== "undefined") module.exports = saveAs;



	$('#csv_drinks').click(function(e){
	  var data = Drinks.find({},{fields:{ "_id": 0,"active":0,"hidden":0,"timestamp":0 }}).fetch();
	  var newData = new Array(data.length);
	  $.each(data,function(index,value){
		var newStuff = {};
		newStuff["drink_name"] = data[index]["drink_name"];
		newStuff["price"] = data[index]["price"];
		newStuff["available"] = data[index]["available"];
		
		newData[index] = newStuff;
	  });
	  
	  var yourCSVData = JSON2CSV(newData);
	  // data = to_json( data, { utf8 => 1, pretty => 1, convert_blessed => 1, canonical => 1 } );
	  var blob = new Blob([yourCSVData],
						  {type: "text/csv;charset=utf-8"});
	  saveAs(blob, "drinks.csv");
	});

	$('#csv_clients').click(function(e){
	  var data = Clients.find({},{fields:{ "_id": 0,"active":0,"drinks":0,"hidden":0,"timestamp":0,"user_id":0 }}).fetch();
	  var newData = new Array(data.length);
	  $.each(data,function(index,value){
		var newStuff = {};
		newStuff["client_name"] = data[index]["client_name"];
		newStuff["credit"] = data[index]["credit"];
		
		newData[index] = newStuff;
	  });
	  
	  var yourCSVData = JSON2CSV(newData);

	  var blob = new Blob([yourCSVData],
						  {type: "text/csv;charset=utf-8"});
	  saveAs(blob, "clients.csv");
	});

	
    if(Template.main.has_funds){
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

	$.each($("[name='client']"),function(index,element){
	  if($(element).hasClass("active")){
	    var id = $(element).attr("client_id");	   
	    Clients.remove(id);
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

	hash = Session.get("activeClients");
	$.each(getActiveClients(),function(index,client){
	  if(hash[client._id]){
	    Clients.update(client._id,{$set: {hidden:true}});
	    hash[client._id] = false;
	  }
	});
	Session.set("activeClients",hash);
	
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
      clients = Clients.find({hidden: false});
      hash = Session.get("activeClients");
      
      if( $(this).hasClass("active") ){
		clients.forEach(function(client){
		  hash[client._id] = true;
		  $("[client_id='"+client._id+"']").addClass("active");
		});

		Session.set("activeClients",hash);
      }else{
		clients.forEach(function(client){
		  hash[client._id] = false;
		  $("[client_id='"+client._id+"']").removeClass("active");
		});
		
		Session.set("activeClients",hash);
      }
	  
    });
    }
  });
}
  


// code to run on server at startup
  if (Meteor.isServer) {
	Meteor.startup(function () {
    Meteor.publish('clients',function(){
      return Clients.find();
    });

    Meteor.publish('drinks',function(){
      return Drinks.find();
    });
    // if ( Meteor.users.find().count() === 0 ) {
    //   Accounts.createUser({
    // 	username: 'username',
    // 	email: 'email',
    // 	password: 'asdfasdf',
    // 	profile: {
    // 	  first_name: 'fname',
    // 	  last_name: 'lname',
    // 	  company: 'company',
    // 	}
    //   }) //Added close parenthesis.
    // }


    Meteor.publish('users',function(){
      return Meteor.users.find({_id: this.userId});
    });		   

  });

}
