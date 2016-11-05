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

    self.get_reports = function(){
        $.getJSON(get_reports_url, function (data) {

            self.vue.reports = data.reports;
            self.vue.logged_in = data.logged_in;
            self.vue.logged_user = data.logged_user;

        })
    };

    self.get_categories = function(){
        $.getJSON(categories_url, function(data){
            self.vue.categories = data.categories;
        })
    };




    self.add_report = function() {


    };





    self.vue = new Vue({

        el:"#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            locations: [],
            is_making_report: false,
            form_report_content: null,
            municipality: null,
            categories: null,
            category_result: null,
            latitude: null,
            longitude: null,
            // will be a dict with full_address,number,street, city, county,state,county. Now full address
            address: null,
            want_updates: null,
            reports: [],
            logged_in: false,
            logged_user: null


        },
        methods: {
            add_report_div: self.add_report_div,
            get_categories: self.get_categories,
            get_reports: self.get_reports,
            add_report: self.add_report

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_coordinates();
    self.get_categories();
    self.get_reports();
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
