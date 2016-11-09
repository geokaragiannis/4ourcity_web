/**
 * Created by georgekaragiannis on 08/11/2016.
 */

var app = function(){



    self.search = function () {

        // self.vue.searched_results=geocodeAddress(geocoder);
        self.vue.search_completed = false;

        var address = self.vue.search_query;
        geocoder.geocode({'address': address}, function(results, status) {
          if (status === 'OK') {
            self.vue.searched_results = [];
          var n=0;
          for (var i=0;i<results.length;i++){
            var small_list=[];
            for(var j=0; j<results[i].address_components.length; j++){
                for(var k=0 ; k < results[i].address_components[j].types.length; k++){
                    if(results[i].address_components[j].types[k] === "administrative_area_level_2") {
                        //window.alert("municipality name: ", results[i].address_components[j].long_name);
                        self.vue.searched_results[n++] = {'county': results[i].address_components[j].long_name,
                                                  'latitude': results[i].geometry.location.lat(),
                                                    'longitude': results[i].geometry.location.lng()};
                        break;
                    }
                }
            }
        }

        self.vue.search_completed = true;

          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });


        self.vue.have_searched = true;

    };



    self.vue = new Vue({

        el:"#search-vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            search_query: null,
            geocode_results: null,
            searched_results: [],
            have_searched: false,
            search_completed: false

        },
        methods: {

            search: self.search


        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.

    $("#search-vue-div").show();


    return self;

};


var APP2 = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
// 1 effect: everything i assign in function (starting at line 6)
// , I will be able to access it in js console
// 2 effect: create a private namespace, so that we don't get confused
// by names from different libraries.

// we wrap everything around jQuery(), because jQuery() returns
// once everything has been loaded
jQuery(function(){APP2 = app();});

