var app = function(){

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {e._idx = k++;});
    };


    self.show_map = function() {

         // if(!self.vue.have_searched)
         //     $("#map").hide();

        for (var i = 0; i < self.vue.reports.length; i++) {
            var latLng = new google.maps.LatLng(self.vue.reports[i].lat, self.vue.reports[i].lgn);

            //Creating a marker and putting it on the map
            marker=createMarker(latLng,self.vue.reports[i]._idx);
            //self.vue.markers.unshift(marker);

            marker.setMap(map);
        }
    };

    // helper function that returns a marker of position: location and id: id
    // taken from: https://goo.gl/PmNGud
    function createMarker(location, idx) {

        var marker = new google.maps.Marker({
                position: location,
                id: idx
            });
        google.maps.event.addListener(marker,'click',function(){
            //window.alert(marker.id);
            self.vue.display_selected_report = marker.id;
        });
        return marker;
    }

    // if not -1, then marker is clicked, so display the content of this specific marker with id = idx
    // else either full list of reports, or the report new_form
    self.set_display_selected_report = function (idx){

        self.vue.display_selected_report = idx;
    };


    self.toggle_is_making_report = function() {
      self.vue.is_making_report = !self.vue.is_making_report;

    };

    self.toggle_have_searched = function() {

        self.vue.have_searched = !self.vue.have_searched;
        //$("#map").show();
    };

    // when we click cancel_report, the marker in the map should be removed
    self.remove_marker = function(){
        if (prev_marker !=null){
          prev_marker.setMap(null);
      }
    };


    self.get_reports = function(){

        $.post(get_reports_url, {

            mun_name: self.vue.county_name
        },
         function(data){
            self.vue.reports = data.reports;
            self.vue.logged_in = data.logged_in;
            self.vue.logged_user = data.logged_user;

            enumerate(self.vue.reports);
            self.vue.show_map();
        });

    };

    self.get_categories = function(){
        $.getJSON(categories_url, function(data){
            self.vue.categories = data.categories;
        })
    };




    self.add_report = function() {

        $.post(add_report_url,
            {
                latitude: self.vue.latitude,
                longitude: self.vue.longitude,
                category: self.vue.category_result,
                description: self.vue.form_report_content,
                pretty_address: self.vue.address,
                want_updates: self.vue.want_updates,
                municipality: self.vue.municipality
            },
            function (data) {
                $.web2py.enableElement($("#add_post_submit"));
                // add the new post (get it from api/add_post) to self.vue.posts
                enumerate(self.vue.reports);

            });
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
            want_updates: false,
            reports: [],
            logged_in: false,
            logged_user: null,
            markers:[],
            display_selected_report: -1,
            have_searched: false,
            search_address: null,
            county_name: null

        },
        methods: {
            toggle_is_making_report: self.toggle_is_making_report,
            get_categories: self.get_categories,
            get_reports: self.get_reports,
            add_report: self.add_report,
            show_map: self.show_map,
            remove_marker: self.remove_marker,
            set_display_selected_report: self.set_display_selected_report,
            toggle_have_searched: self.toggle_have_searched

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_categories();
    //self.get_reports();
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
