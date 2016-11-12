/**
 * Created by georgekaragiannis on 08/11/2016.
 */

var app = function(){


    self.get_reports = function () {

        $.getJSON(get_reports_url, function(data){
            self.vue.reports = data.reports;
            self.vue.logged_user=data.logged_user;
            self.vue.is_admin=data.is_admin;
            self.vue.logged_in=data.logged_in;
        })
    };

    self.get_progress_status = function () {
        $.getJSON(get_progress_status_url, function(data){
            self.vue.progress = data.progress;
            self.vue.status=data.status;
        })
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
            aaa: true
        },
        methods: {
            get_reports: self.get_reports,
            get_progress_status: self.get_progress_status


        }
    });

    // initiate that in the beginning. Fetch the stuff from the server
    // happens once in the beginning.
    self.vue.get_reports();
    self.vue.get_progress_status();

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

