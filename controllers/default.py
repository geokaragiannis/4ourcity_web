# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

# -------------------------------------------------------------------------
# This is a sample controller
# - index is the default action of any application
# - user is required for authentication and authorization
# - download is for downloading files uploaded in the db (does streaming)
# -------------------------------------------------------------------------

import json

def index():
    """
    example action using the internationalization operator T and flash
    rendered by views/default/index.html or views/generic.html

    if you need a simple wiki simply replace the two lines below with:
    return auth.wiki()
    """
    reports = db(db.reports).select(db.reports.ALL)

    for r in reports:
        logger.info("user_id: %r", r.user_id)
        logger.info("cat_id: %r", r.cat_id)

    # python list
    locations = db(db.banana).select(db.banana.ALL)

    lat_json = json.dumps((locations[0].latitude))
    long_json = json.dumps((locations[0].longitude))

    logger.info("location in python list:  %r %r", locations[0].latitude, locations[0].longitude)


    return dict(locations=locations, lat_json=lat_json, long_json=long_json, reports = reports)

@auth.requires_login()
def submit():

    db.reports.created_on.readable = db.reports.created_on.writable = False
    db.reports.status.readable = db.reports.status.writable = False
    db.reports.progress.readable = db.reports.progress.writable = False

    form = SQLFORM(db.reports)


    if form.process().accepted:
        # At this point, the record has already been inserted.
        session.flash = T("cool")
        redirect(URL('default', 'index'))
    elif form.errors:
        session.flash = T('Please enter correct values.')

    return dict(form=form)

def search():



    return dict()


def view():

    reports = db(db.reports).select(db.reports.ALL)

    for r in reports:
        logger.info("category id is: %r ", r.description)
    return dict(reports=reports)


def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    http://..../[app]/default/user/bulk_register
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    also notice there is http://..../[app]/appadmin/manage/auth to allow administrator to manage users
    """
    return dict(form=auth())


@cache.action()
def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()


