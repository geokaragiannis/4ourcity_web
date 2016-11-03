var app = function(){

    // self.show_map = function() {
    //
    //       $.getJSON(api_url, function(data) {
    //       $.each(data, function(key, value) {
    //           for (var i = 0; i < value.length; i++) {
    //               var latLng = new google.maps.LatLng(value[i].latitude, value[i].longitude);
    //               //alert(latLng);
    //
    //
    //               // Creating a marker and putting it on the map
    //               var marker = new google.maps.Marker({
    //                   position: latLng,
    //                   title: data.title
    //               });
    //               marker.setMap(map);
    //           }
    //       });
    //     });
    //
    //       var map = new google.maps.Map(document.getElementById('map'), {
    //             zoom: 7,
    //           // center is set for now as the first element in banana table
    //             center: {lat:36.996164, lng:-122.05864}
    //       });
    //
    //       // add a marker on every click. Temporary
    //       google.maps.event.addListener(map, 'click', function(event) {
    //         placeMarker(event.latLng);
    //         });
    //
    //     function placeMarker(location) {
    //         var marker = new google.maps.Marker({
    //             position: location,
    //             map: map
    //         });
    //     }
    //
    //
    // };


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
            //show_map: self.show_map

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_coordinates();
    //self.show_map();
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
