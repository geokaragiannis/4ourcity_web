/**
 * Created by georgekaragiannis on 08/11/2016.
 */

var app = function(){

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {e._idx = k++;});
    };

    // add a changed flag, that indicates whether status or progress have been changed.
    // Default value is false
    var add_changed_field = function(y){
      return y.map(function(e) {e.changed = false;});
    };

    self.get_reports = function () {

        $.getJSON(get_reports_url, function(data){
            self.vue.reports = data.reports;
            self.vue.logged_user=data.logged_user;
            self.vue.is_admin=data.is_admin;
            self.vue.logged_in=data.logged_in;
            enumerate(self.vue.reports);
            add_changed_field(self.vue.reports);
        });

    };

    self.get_progress_status = function () {
        $.getJSON(get_progress_status_url, function(data){
            self.vue.progress = data.progress;
            self.vue.status=data.status;
        })
    };

    // change the flag of report with _idx = idx
    self.changed_progress_status = function (idx) {

        self.vue.reports[idx].changed = true;
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
            aaa: true,
            selected_status: null
        },
        methods: {
            get_reports: self.get_reports,
            get_progress_status: self.get_progress_status,
            changed_progress_status: self.changed_progress_status,
            submit_changes: self.submit_changes


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

