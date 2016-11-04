var app = function(){

    self.show_map = function() {

        $.getJSON(api_url, function(data) {
         $.each(data, function(key, value) {
             for (var i = 0; i < value.length; i++) {
                 var latLng = new google.maps.LatLng(value[i].latitude, value[i].longitude);

                 // Creating a marker and putting it on the map
                 var marker = new google.maps.Marker({
                     position: latLng,
                     title: data.title
                 });
                 marker.setMap(map);
             }
         });
       });
    };

    self.add_report_div = function() {
      self.vue.is_making_report = !self.vue.is_making_report;
    };


    function get_coordinates_url(){

        return api_url;
    }
    
    self.get_coordinates = function(){
      
        $.getJSON(get_coordinates_url(), function (data) {

            self.vue.locations = data.locations;

        })
    };

    self.vue = new Vue({

        el:"#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            locations: [],
            is_making_report: false,
            form_report_content: null
        },
        methods: {
            add_report_div: self.add_report_div

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_coordinates();
    self.show_map();
    $("#vue-div").show();


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
