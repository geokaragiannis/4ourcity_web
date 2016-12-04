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

        for (var i = 0; i < self.vue.reports.length; i++) {
            var latLng = new google.maps.LatLng(self.vue.reports[i].lat, self.vue.reports[i].lgn);

            //Creating a marker and putting it on the map
            marker=createMarker(latLng,self.vue.reports[i]._idx,self.vue.reports[i].progress);

            self.vue.markers.unshift(marker);

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
            self.vue.set_display_selected_report(marker.id);
            self.vue.get_messages(self.vue.reports[self.vue.display_selected_report].id)
        });
        return marker;
    }

    // if not -1, then marker is clicked, so display the content of this specific marker with id = idx
    // else either full list of reports, or the report new_form
    self.set_display_selected_report = function (idx){

        self.vue.display_selected_report = idx;

        // if we display a selected report hide the dropzone div
        if(self.vue.display_selected_report !==-1){
            $("#uploader_div").hide();
        }

        if(self.vue.display_selected_report === -1 && self.vue.is_making_report){
            $("#uploader_div").show();

        }


        // if the window is small:
        // if the index is not -1 (ie we want to show a report), then give the class mobile_map
        // else (ie we hit the cancel) do not display the div
        if ($(window).width() < 700) {
            if(idx !== -1) {
                $("#map-plus-panel").removeClass("no-display");
                $("#map-plus-panel").addClass("mobile_map");
                google.maps.event.trigger(map, 'resize');
            } else{
                $("#map-plus-panel").addClass("no-display");
            }
        }

        for(var k=0;k<self.vue.markers.length; k++) {
            self.vue.markers[k].setOpacity(1);
        }


        // if we hit the cancel button, then reset the opacity back to 1.
        // if we click the GO button to display a specific report, then
        // make all the other markers have opacity .5
        if(idx === -1){
            for(var i=0;i<self.vue.markers.length; i++) {
                self.vue.markers[i].setOpacity(1);
            }
        }else{
            for(var j=0;j<self.vue.markers.length; j++){
                if(self.vue.markers[j].id !== idx){
                    self.vue.markers[j].setOpacity(0.5);
                }
            }
            var latlgn = new google.maps.LatLng(self.vue.reports[self.vue.display_selected_report].lat, self.vue.reports[self.vue.display_selected_report].lgn);
            map.setCenter(latlgn);
        }

        //if user is making a report, then set the center to the new marker location
        if(self.vue.is_making_report){
            var latlgn = new google.maps.LatLng(self.vue.latitude, self.vue.longitude);
            map.setCenter(latlgn);
        }

        // when we hit the cancel (i.e display_selected_report = -1), do not center the map
        if(self.vue.display_selected_report !== -1) {
            var latlgn = new google.maps.LatLng(self.vue.reports[self.vue.display_selected_report].lat, self.vue.reports[self.vue.display_selected_report].lgn);
            map.setCenter(latlgn);
        }


    };


    self.toggle_is_making_report = function() {

        if(!self.vue.is_making_report){
            $("#uploader_div").show();
        } else{
            $("#uploader_div").hide();
        }

        self.vue.is_making_report = !self.vue.is_making_report;

    };

    self.toggle_have_searched = function() {

        self.vue.have_searched = !self.vue.have_searched;
    };

    // when we click cancel_report, the marker in the map should be removed
    self.remove_marker = function(){
        if (prev_marker !=null){
          prev_marker.setMap(null);
      }
    };

    self.get_reports = function(){

        self.vue.county_name = parsed_county_name;
        $.post(reports_url, {

            mun_name: self.vue.county_name,
            query_category: JSON.stringify(self.vue.query_category),
            start_idx:0,
            end_idx:5,
            show_finished: JSON.stringify(self.vue.show_finished)

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
                 // generate the image url for each report
                 self.vue.generate_image_url();
             }

        });

    };

    self.get_more_reports = function () {

        var num_reports = self.vue.reports.length;

        $.post(reports_url, {
            mun_name: self.vue.county_name,
            query_category: JSON.stringify(self.vue.query_category),
            start_idx:num_reports,
            end_idx:num_reports+5,
            show_finished: JSON.stringify(self.vue.show_finished)

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
                // generate the image url for each report
                 self.vue.generate_image_url();

                var new_length = self.vue.reports.length;
                // display the new markers on the map

                // iterate through the new elements added to reports list
                // and display them on the map
                for(var i=old_length; i<new_length; i++){

                    var latLng = new google.maps.LatLng(self.vue.reports[i].lat, self.vue.reports[i].lgn);

                    //Creating a marker and putting it on the map
                    marker=createMarker(latLng,self.vue.reports[i]._idx,self.vue.reports[i].progress);
                    // update the markers array
                    self.vue.markers.unshift(marker);

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
                want_updates: JSON.stringify(self.vue.want_updates),
                municipality: self.vue.municipality
            },
            function (data) {
                $.web2py.enableElement($("#add_post_submit"));
                // add the new post (get it from api/add_post) to self.vue.posts
                enumerate(self.vue.reports);
                self.vue.form_report_content = null;
                self.vue.category_result = null;
                self.vue.want_updates = false;


                // do the image url
                self.upload_url = upload_url + '?' + $.param({report_id: data.report_id});
                // make dropzone call
                myDropzone.processQueue();

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


    self.push_query = function (arr,id) {

        // check if id is already in the array. If yes, delete the id
        // b/c the user unclicked the checkbox. Else just add the id to
        // the array
        for(var i=0;i<arr.length;i++){
            if(id === arr[i]){
                arr.splice(i,1);
                var deleting_element = true;
            }
        }

        if(! deleting_element)
            arr.unshift(id);
        // now the array passed is populated. So make the call

        // clear the already existing markers from the map and
        // call get reports to get the queried results
        for(var k=0; k< self.vue.markers.length; k++){
            self.vue.markers[k].setMap(null);
        }
        self.vue.get_reports();

    };


    self.toggle_show_finished = function () {

        self.vue.show_finished = !self.vue.show_finished;

        // clear the already existing markers from the map and
        // call get reports to get the queried results
        for(var k=0; k< self.vue.markers.length; k++){
            self.vue.markers[k].setMap(null);
        }

        self.vue.get_reports();
    };

    self.generate_image_url = function () {

        for(var i=0;i<self.vue.reports.length; i++){

            self.vue.reports[i].image_url= get_image_url + '?' + $.param({report_id:self.vue.reports[i].id});

        }

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
            has_more_reports: false,
            query_category: [],
            show_finished: false,
            image_url: null

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
            get_more_reports: self.get_more_reports,
            push_query: self.push_query,
            toggle_show_finished: self.toggle_show_finished,
            generate_image_url: self.generate_image_url

        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.get_categories();
    self.get_reports();
    $("#vue-div").show();


    return self;

};


var APP = null;

jQuery(function(){APP = app();});
