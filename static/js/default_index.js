var app = function(){


    function get_coordinates_url(){

        return api_url;
    }
    
    self.get_coordinates = function(){
      
        $.getJSON(get_coordinates_url(), function (data) {

            self.vue.locations = data.locations;

        })
    };

    self.vue = new Vue({

        el:"#map",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            locations: []
        },
        methods: {

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_coordinates();
    $("#map").show();


    return self;

};


var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
// 1 effect: everything i assign in function (starting at line 6)
// , I will be able to access it in js console
// 2 effect: create a private namespace, so that we don't get confused
// by names from different libraries.

// we wrap everything around jQuery(), because jQuery() returns
// once everything has been loaded
jQuery(function(){APP = app();});
