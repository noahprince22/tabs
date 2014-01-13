//both client and server
Drinks = new Meteor.Collection("drinks");
Users = new Meteor.Collection("users");
if (Meteor.isClient) {
  Meteor.subscribe( 'users' );
  Meteor.subscribe( 'drinks' );
  
  // $("[name='price']").keypress(function(event) {
  //         console("HIII SHITHEAD");
  //   if (event.which == 13) {
  //     event.preventDefault();
  //     $("#drink_form").submit();
  //   }
  // });
  Template.drink.events = {
    'click [name="drink"]' : function(e){
      $(e.target).parent().toggleClass("active");
      console.log("tits");
    }
  };
  $(function () {
    $("#delete_button").click( function(){ 
      $.each($("[name='drink']"),function(index,element){
	if($(element).hasClass("active")){
	  var id = $(element).attr("drink_id");
	  Drinks.remove(id);
	}  
      });
      $(this).attr("drink_id")
    });
  });

 
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
      console.log(priceFloat);
     
      drink_name.value="";
      price.value="";
      if (isNaN(priceFloat) || priceFloat <= 0 || priceFloat > 100)
	alert("You're a cocksucker. Put an actual number in. Go home Bobby, you're drunk");
      else Drinks.insert(data);
    }
  }});

  Template.drink.drinks = function() {
    return Drinks.find({}, {sort: {timestamp: -1, drink_name: 1}});
  }
  
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
