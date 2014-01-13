if (Meteor.isClient) {
  Meteor.subscribe( 'users' );
  Meteor.subscribe( 'drinks' );

  Template.drink.events({'submit form' : function(event, template) {
    event.preventDefault();

    name = template.find("input[name=name]");
    price = template.find("input[name=price]");

    // XXX Do form validation

    var data = {
      name: name.value,
      price: price.value,
    };

    name.value="";
    price.value="0";

    Drinks.insert(data, function(err) { alert('bat data') });
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
