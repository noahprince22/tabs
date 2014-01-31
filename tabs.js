//both client and server
// Users = new Meteor.Collection("users");
  Drinks = new Meteor.Collection("drinks");
  Clients = new Meteor.Collection("clients");
// Meteor.absoluteUrl("/",{'rootUrl':"http://tabtest.ngrok.com"});

    Accounts.loginServiceConfiguration.insert({
        service: 'twitter',
        consumerKey: 'ZjSU7uIpDflc1m8sxIH0g',
        secret: 'yIXQyct7B9FU6JHKRJBGGnNAFmB6wcsJvy4QbSV8cGY'
    });

    Accounts.loginServiceConfiguration.insert({
        service: 'facebook',
        consumerKey: '528102830641511',
        secret: 'ab6ee54486e337cf1694c8989aeb3a71'
    });

if (Meteor.isClient) {
  var currentDay;
  Session.set("day",new Date().getDate());
  Session.set("activeClients",{});
  Session.set("confirmActives",[]);
  Session.set("confirmDrink","");
  Session.set("confirmPrice",0);
  Session.set("confirmed",false);

  Meteor.subscribe( 'clients' );
  Meteor.subscribe( 'drinks' );
  Meteor.subscribe( 'users' );
  function isMobile(){
    return $(window).width() < 650;
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


    // if( Meteor.users.find({_id: Session.get("user")}).fetch()[0] )
    // // onlineUsers.forEach(function(user){
    //   if ( Clients.find({client_name: Session.get("user")}).fetch()[0] ){
    // 	clientId = Clients.find({client_name: Session.get("user_name")}).fetch()[0]._id;
    // 	Clients.update(clientId,{$set: {hidden: true}});
    //   }
      
    // });
  function isUser(){
    return !!Meteor.users.find().fetch()[0];
  }
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
  }


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


  function verifyFunds(clients,drinkPrice,quiet){
    if(arguments.length==2) quiet = false;
    var falseFound = false;
    clients.forEach(function(client){
      var newCredit = parseFloat(client.credit)-parseFloat(drinkPrice);
      if( newCredit < 0 ) {

	if( !quiet ){
	  alert("Hey "+client.client_name+" you fucking deadbeat, you're out of credit.");
	}
	
	falseFound=true;
      }
    });
    return !falseFound;

  }
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


  
  function hideMain(f){
    $("#slide_div").promise().done(function(){
      $("#slide_div").toggle("slide",{"direction": "left"});
      $("#hidden_container").toggle("slide",{"direction":"right"})
      // $("#slide_div").animate({"margin-left": '-=2000'});
    });
    $("#slide_div").promise().done(function(){
      // $("#hidden_container").css("z-index", 4);
      $(".confirm").bind("click.confClick", function(){
				
	f();
	showMain();
	$(".confirm").unbind("click.confClick");
	$(".cancel").unbind("click.confClick");
      });

      $(".cancel").bind("click.confClick", function(){
	showMain();
	$(".confirm").unbind("click.confClick");
	$(".cancel").unbind("click.confClick");
      });
    });
  }

  function showMain(){
    
    $("#hidden_container").toggle("slide",{"direction":"right"});
    $("#slide_div").promise().done(function(){
      // will be called when all the animations on the queue finish
      // $("#slide_div").animate({"margin-left": '+=2000'});
      $("#slide_div").toggle("slide",{"direction":"left"});
      // $("#hidden_container").css("z-index", -1);
    });
    // $("#slide_div").promise().done(function(){
    //   $("#hidden_container").toggleClass("hidden");
    // });

  };

  // Template.confirmation.rendered = function(){;
    // var oldWidth = $("#slide_div .container;").heiwidth
					      // var oldWidth = $("#slide_div .container").()width();
					      // $("#confirm_container").height( oldHeig()ht );
    // $("#confirm_container").width( oldWidth+10 );
  // };
  
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

	  // var client = Clients.find(client_id).fetch("client_name")[0]["something"] = "assfuck";
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
	// 	left: parseInt($lefty.css('left'),10) == 0 ?
	// 	  -$lefty.outerWidth() :
	// 	  0
	// });
	// $lefty.animate({
	// 	left: parseInt($lefty.css('left'),10) == 0 ?
	// 	  -$lefty.outerWidth() :
	// 	  0
	// });
	
      });
    }
  }
  
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
  //************************//
  //TYPEAHEAD STUFF        //
  //***********************//

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
      }
      else if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 100)
	alert("You're a cocksucker. Put an actual number in. Go home Bobby, you're drunk");
      else Drinks.insert(data);

      drink_name.value="";
      price.value="";
    }
  }});

  Template.drink.drinks = function() {
    return Drinks.find({hidden: false,available: {$gt: 0}}, {sort: {timestamp: -1, drink_name: 1}});
  };
  
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
	alert("You're a cocksucker. Put an actual name in. Go home Bobby, you're drunk");
      else if ( Clients.find({client_name: client_name.value}).fetch()[0] ){
	clientId = Clients.find({client_name: client_name.value}).fetch()[0]._id;
	Clients.update(clientId,{$set: {hidden: false}});
      }
      else Clients.insert(data);
      client_name.value="";
    }
  }});

  Template.client.clients = function() {
    return Clients.find({hidden: false}, {sort: {client_name: 1}});
  };

  
  
  Template.drink_table.clients = function() {
    //if the day isn't selected, just use the current day
    // if( !Session.get("day") ) 
    var clientElement = $("[name='client']");
    // var ids = [];
    // if ( $(clientElement).find("[input='checkbox']").prop("checked") ){
    //   ids.push( $(element).attr("client_id") ) 
    // }
    day = Session.get("day");
    
    clients = getActiveClients();
    clients.forEach( function(client){
      if(client.drinks){
	var now = new Date();
	var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
	
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

  Template.add_cash.events({'keypress #add_cash' : function(event, template) {
    if(event.which === 13){
      event.preventDefault();
      credit = template.find("#add_cash");
      var value = parseFloat(parseFloat(credit.value).toFixed(2));
      if( isNaN(value) ) {
	alert("You're a cocksucker, put a number in");
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

  function isAdminMode(){
    user = Meteor.users.find({}).fetch()[0];
    if( user && user.profile && user.profile.name === "Noah Prince" ) return true;
    return false;     
  }
  Template.add_cash.hidden = function(e){
    if ( isAdminMode() ){
      return "";
    }
    return "hidden";
  }

  Template.delete_stuff.hidden = function(e){
    if ( isAdminMode() ){
      return "";
    }
    return "hidden";
  }

  function getDates() {
    clients = Clients.find().fetch();
    var dates = [];
    // var displayDates =[];
    clients.forEach( function(client){
      if(client.drinks){
	client.drinks.forEach( function(drink){
	  var now = new Date();
	  var aMonthBack = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
	  if( drink.day && drink.day.getTime() > aMonthBack && !datesHasDate(dates,drink.day) ){
	    dates.push( [drink.day,drink.day.toLocaleDateString()] );
	    // displayDates.push( drink.day.getTime() );	    
	  }

	});
      }
    });

    if( datesHasDate(dates,new Date()) ){
      dates.push([new Date(),(new Date()).toLocaleDateString()]);
    }
    
      return dates.sort(function(arr,arr2){ return arr[0].getTime() - arr2[0].getTime(); } ).reverse();
    // return [displayDates.sort().reverse().map(function(obj){ return ( new Date(obj) ).toLocaleDateString(); }), dates.sort().reverse()]; 
  } 

  function datesHasDate(dates, day){
    bool = false;
    dates.forEach(function(arr){
	if( arr[0].getDate() === day.getDate() ) bool =  true;
    });
    return bool;
  }
  
  Template.dates_selector.dates = function(){
    return getDates();
  };

  Template.dates_selector.events({'change select, select' : function(event,template){
    index = template.find(".form-control").selectedIndex;
    // date = template.find(".form-control").options[index].value.split('/')[1];
      date = new Date(template.find(".form-control").options[index].value).getDate();
      					  
    Session.set("day",parseFloat(date));
  }});

    Deps.autorun(function(e){
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
	$(document).load(function(){
	    if( Clients.find().fetch().length !=0 ){
		if (user.profile.name === "")
		    alert("You're a cocksucker. Put an actual name in. Go home Bobby, you're drunk");
		else if( Clients.find({user_id: user._id}).fetch()[0] ) {
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
		else if ( Clients.find({}).fetch()[0] ) Clients.insert(data);
	    }
	});


      Session.set("user",user._id);
      Session.set("user_name",user.profile.name);
      
    });
      
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

  $(function () {
    if(Template.main.has_funds){
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
	// setAllClients(Clients,{active:"active"});
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


// Handlebars.registerHelper('index_of', function(context,ndx) {
//   return context[ndx];
// });
