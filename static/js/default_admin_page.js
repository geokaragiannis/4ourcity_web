/**
 * Created by georgekaragiannis on 08/11/2016.
 */

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

    // add a changed flag, that indicates whether status or progress have been changed.
    // Default value is false
    var add_changed_field = function(y){
      return y.map(function(e) {e.changed = false;});
    };

    function get_reports_url (start_idx,end_idx){
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return reports_url + "?" + $.param(pp);
    }

    self.get_reports = function () {


        $.post(reports_url,
            {
                query_status:JSON.stringify(self.vue.query_status),
                query_progress: JSON.stringify(self.vue.query_progress),
                query_category: JSON.stringify(self.vue.query_category),
                start_idx:0,
                end_idx:5

            }

        , function(data){
            self.vue.reports = data.reports;
            self.vue.logged_user=data.logged_user;
            self.vue.is_admin=data.is_admin;
            self.vue.logged_in=data.logged_in;
            self.vue.has_more_reports= data.has_more;
            enumerate(self.vue.reports);
            add_changed_field(self.vue.reports);
            // generate the image url for each report
            self.vue.generate_image_url();
        });
    };

    self.get_more_reports = function () {

        var num_reports = self.vue.reports.length;

        $.post(reports_url,
            {
                query_status:JSON.stringify(self.vue.query_status),
                query_progress: JSON.stringify(self.vue.query_progress),
                query_category: JSON.stringify(self.vue.query_category),
                start_idx:num_reports,
                end_idx:num_reports+5
            }, function (data) {
                // get the new value of has_more_reports
                self.vue.has_more_reports = data.has_more;
                // append new posts to slef.vue.posts (existing list of posts)
                self.extend(self.vue.reports,data.reports);
                enumerate(self.vue.reports);
                add_changed_field(self.vue.reports);
                // generate the image url for each report
                self.vue.generate_image_url();
            });
    };

    self.get_permissions = function () {

        $.getJSON(get_permissions_url, function(data){
            self.vue.permissions = data.permissions;
            self.vue.permission_types = data.permission_types;
            enumerate(self.vue.permissions);
            add_changed_field(self.vue.permissions);
        })

    };

    self.get_progress_status = function () {
        $.getJSON(get_progress_status_url, function(data){
            self.vue.progress = data.progress;
            self.vue.status=data.status;
        })
    };

    self.get_categories = function(){
        $.getJSON(categories_url, function(data){
            self.vue.categories = data.categories;
        })
    };
    // change the flag of report with _idx = idx
    self.changed_progress_status = function (idx) {

        self.vue.reports[idx].changed = true;
    };

    self.changed_permission_type = function (idx) {
        self.vue.permissions[idx].changed = true;
    };

    self.submit_changes = function () {

        var c = [];
        for(var i=0;i<self.vue.reports.length;i++){
            if(self.vue.reports[i].changed === true){
                c.unshift({
                    id: self.vue.reports[i].id,
                    status: self.vue.reports[i].status,
                    progress: self.vue.reports[i].progress
                });

            }
        }

        console.log(c);

        $.post(post_changes_url,{

            backend_changes: JSON.stringify(c)
        },
        function (data) {

            if(data == 'ok'){
                $.web2py.flash("updates were sucessful");
            } else{
                $.web2py.flash("something went wrong. Try again");
            }

        });
    };

    self.submit_permission_changes = function() {
        var c = [];
        for(var i=0;i<self.vue.permissions.length;i++){
            if(self.vue.permissions[i].changed === true){
                c.unshift({
                    id: self.vue.permissions[i].id,
                    permission_type: self.vue.permissions[i].permission_type
                });

            }
        }

        console.log(c);

        $.post(post_permission_changes_url,{

            permission_changes: JSON.stringify(c)
        },
        function (data) {

            if(data == 'ok'){
                $.web2py.flash("updates were sucessful");
            } else{
                $.web2py.flash("something went wrong. Try again");
            }

        });
    };

    self.show_view_report = function (idx) {

        self.vue.view_report = idx;

        var location = new google.maps.LatLng(self.vue.reports[idx].lat,self.vue.reports[idx].lgn);

        // only way it works
        $("#map2").hide();
        $("#map2").show();
        google.maps.event.trigger(map,'resize');
        map.setZoom(map.getZoom());

        var marker = new google.maps.Marker({
                position: location,
                id: idx
            });

        self.vue.prev_marker = marker;

        // se the center of the map to the location of the clicked report
        map.setCenter(location);
        // draw the marker
        marker.setMap(map);
    };

    self.reset_view_report = function(){

        self.vue.view_report = -1;
        $("#map2").hide();
        // when we go back, we reset the adding_message boolean
        self.vue.is_adding_message = false;

        // when you go back, set the marker to null (remove it)
        self.vue.prev_marker.setMap(null)
    };

    self.toggle_display_admin = function () {

        self.vue.display_admin = !self.vue.display_admin;
    };

    self.toggle_adding_new = function () {

        self.vue.adding_new = !self.vue.adding_new;
    };

    self.add_permission = function () {

        $.post(post_new_permission_url, {

            user_name : self.vue.permission_name,
            user_email: self.vue.permission_email,
            permission_type: self.vue.new_permission_type

        },
        function (data) {
            c = {
                id: data.id,
                user_name: self.vue.permission_name,
                user_email: self.vue.permission_email,
                permission_type: self.vue.new_permission_type
            };
            self.vue.permissions.unshift(c);
            enumerate(self.vue.permissions);
            add_changed_field(self.vue.permissions);
            $.web2py.flash("updates were sucessful");
            $.web2py.enableElement($("#submit_new_permission"));
            // change views
            self.vue.adding_new = false;

        })
    };

    self.delete_permission = function (idx) {

        var id = self.vue.permissions[idx].id;
        $.post(delete_permission_url, {
            id: id
        },
        function (data) {

             if(data == 'ok'){
                self.vue.permissions.splice(idx,1);
                enumerate(self.vue.permissions);


            } else{
                $.web2py.flash("deletion unsuccessful. Try again");
            }
        })
    };

    self.toggle_is_adding_message = function () {

        self.vue.is_adding_message = !self.vue.is_adding_message;
    };

    self.post_message = function (id) {

        $.post(post_message_url, {
            message_content: self.vue.message_content,
            id: id
        }, function (data) {
            // add message to the list of messages
            self.vue.messages.unshift(data.message);
            // clear message content
            self.vue.message_content = '';
        })
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

            // get the new value of has_more_messages
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
                return;
            }
        }

        arr.unshift(id);
    };

    self.generate_image_url = function () {

        for (var i = 0; i < self.vue.reports.length; i++) {

            self.vue.reports[i].image_url = get_image_url + '?' + $.param({report_id: self.vue.reports[i].id});

            // if (self.vue.reports[i].image_url )
        }
    };


    self.vue = new Vue({

        el:"#admin-vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            reports: [],
            logged_user: null,
            is_admin: false,
            logged_in: false,
            progress: [],
            status:[],
            categories: [],
            permissions:[],
            permission_types:[],
            selected_status: null,
            view_report: -1,
            prev_marker: null,
            display_admin: false,
            adding_new: false,
            permission_name: null,
            permission_email: null,
            new_permission_type: null,
            is_adding_message: false,
            message_content: null,
            messages: [],
            has_more_messages: false,
            has_more_reports: false,
            query_status: [],
            query_progress: [],
            query_category: [],
            image_url: null
        },
        methods: {
            get_reports: self.get_reports,
            get_progress_status: self.get_progress_status,
            get_permissions: self.get_permissions,
            changed_progress_status: self.changed_progress_status,
            submit_changes: self.submit_changes,
            show_view_report: self.show_view_report,
            reset_view_report: self.reset_view_report,
            toggle_display_admin: self.toggle_display_admin,
            changed_permission_type: self.changed_permission_type,
            submit_permission_changes: self.submit_permission_changes,
            toggle_adding_new : self.toggle_adding_new,
            add_permission: self.add_permission,
            delete_permission: self.delete_permission,
            toggle_is_adding_message: self.toggle_is_adding_message,
            post_message: self.post_message,
            get_messages: self.get_messages,
            get_more_messages: self.get_more_messages,
            get_more_reports: self.get_more_reports,
            push_query: self.push_query,
            get_categories: self.get_categories,
            generate_image_url: self.generate_image_url
        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.vue.get_reports();
    self.vue.get_progress_status();
    self.vue.get_categories();

    $("#admin-vue-div").show();


    return self;

};


var APP3 = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
// 1 effect: everything i assign in function (starting at line 6)
// , I will be able to access it in js console
// 2 effect: create a private namespace, so that we don't get confused
// by names from different libraries.

// we wrap everything around jQuery(), because jQuery() returns
// once everything has been loaded
jQuery(function(){APP3 = app();});

