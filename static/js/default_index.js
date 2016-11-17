var app = function(){

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {e._idx = k++;});
    };

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };


    self.show_map = function() {

         // if(!self.vue.have_searched)
         //     $("#map").hide();

        for (var i = 0; i < self.vue.reports.length; i++) {
            var latLng = new google.maps.LatLng(self.vue.reports[i].lat, self.vue.reports[i].lgn);

            //Creating a marker and putting it on the map
            marker=createMarker(latLng,self.vue.reports[i]._idx,self.vue.reports[i].progress);
            //self.vue.markers.unshift(marker);

            marker.setMap(map);
        }
    };

    // helper function that returns a marker of position: location and id: id
    // taken from: https://goo.gl/PmNGud
    function createMarker(location, idx,progress) {

        if(progress === "finished"){
            var icon = {
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // url
                    scaledSize: new google.maps.Size(40, 40) // scaled size
                };
        }

        var marker = new google.maps.Marker({
                position: location,
                id: idx,
                icon: icon
            });
        google.maps.event.addListener(marker,'click',function(){
            //window.alert(marker.id);
            self.vue.display_selected_report = marker.id;
            self.vue.get_messages(self.vue.reports[self.vue.display_selected_report].id)
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

    function get_reports_url (start_idx,end_idx){
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return reports_url + "?" + $.param(pp);
    }


    self.get_reports = function(){

        $.post(get_reports_url(0,5), {

            mun_name: self.vue.county_name
        },
         function(data){

             if(data == "nok"){
                 $.web2py.flash("municipality not registered. Please see registered municipalities and " +
                     "refine your search");
             } else{
                 self.vue.reports = data.reports;
                 self.vue.logged_in = data.logged_in;
                 self.vue.logged_user = data.logged_user;
                 self.vue.has_more_reports=data.has_more;

                enumerate(self.vue.reports);
                self.vue.show_map();
             }

        });

    };

    self.get_more_reports = function () {

        var num_reports = self.vue.reports.length;

        $.post(get_reports_url(num_reports,num_reports + 5), {
             mun_name: self.vue.county_name

        }, function (data) {
            if(data == "nok"){
                 $.web2py.flash("municipality not registered. Please see registered municipalities and " +
                     "refine your search");
             } else{
                // get the new value of has_more_reports
                self.vue.has_more_reports = data.has_more;
                // append new posts to slef.vue.posts (existing list of posts)
                var old_length = self.vue.reports.length;
                self.extend(self.vue.reports,data.reports);
                enumerate(self.vue.reports);
                var new_length = self.vue.reports.length;
                // display the new markers on the map

                // iterate through the new elements added to reports list
                // and display them on the map
                for(var i=old_length; i<new_length; i++){

                    var latLng = new google.maps.LatLng(self.vue.reports[i].lat, self.vue.reports[i].lgn);

                    //Creating a marker and putting it on the map
                    marker=createMarker(latLng,self.vue.reports[i]._idx,self.vue.reports[i].progress);
                    //self.vue.markers.unshift(marker);

                    marker.setMap(map);

                }


            }
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

    // returns url
    function get_messages_url(start_idx, end_idx,id) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx,
            report_id: id
        };
        return messages_url + "?" + $.param(pp);
    }

    self.get_messages = function (id) {

        $.getJSON(get_messages_url(0,4,id), function(data){
            self.vue.messages = data.messages;
            self.vue.has_more_messages = data.has_more;
        })
    };

    self.get_more_messages = function(id){
        var num_messages = self.vue.messages.length;
        $.getJSON(get_messages_url(num_messages, num_messages+4,id), function(data){

            // get the new value of has_more
            self.vue.has_more_messages = data.has_more;
            // append new posts to slef.vue.posts (existing list of posts)
            self.extend(self.vue.messages,data.messages);
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
            county_name: null,
            messages: [],
            has_more_messages: false,
            has_more_reports: false

        },
        methods: {
            toggle_is_making_report: self.toggle_is_making_report,
            get_categories: self.get_categories,
            get_reports: self.get_reports,
            add_report: self.add_report,
            show_map: self.show_map,
            remove_marker: self.remove_marker,
            set_display_selected_report: self.set_display_selected_report,
            toggle_have_searched: self.toggle_have_searched,
            get_messages: self.get_messages,
            get_more_messages: self.get_more_messages,
            get_more_reports: self.get_more_reports

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
