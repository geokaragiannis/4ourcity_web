def index():
    pass


# def get_coordinates():
#     # python list
#     rows = db().select(db.reports.ALL)
#     locations=[]
#
#     for i, r in enumerate(rows):
#         t = dict()


    #return response.json(dict(locations=locations))


def get_categories():
    categories = db(db.categories).select(db.categories.ALL)
    return response.json(dict(categories=categories))


def get_reports():

    reports = []
    # only iterate on accepted reports
    #rows = db(db.reports.status_id == 2).select()
    rows = db().select(db.reports.ALL)

    for i,r in enumerate(rows):
        t = dict(
            id = r.id,
            lat = r.latitude,
            lgn = r.longitude,
            email = r.user_id.user_email,
            category = r.cat_id.cat_title,
            description = r.description,
            pretty_address = r.pretty_address,
            created_on = r.created_on,
            status = r.status_id.status_title,
            progress = r.progress_id.progress_title,
            photo = r.photo
        )
        reports.append(t)

    logged_in = auth.user_id is not None
    # the current logged in user
    logged_user = auth.user.email if auth.user else None

    return response.json(dict(
        reports=reports,
        logged_in=logged_in,
        logged_user=logged_user
    ))


@auth.requires_signature()
def add_report():

    category = request.vars.category
    cat_id = None

    rows = db().select(db.categories.ALL)

    logger.info("user id is: %r", auth.user_id)

    for c in rows:
        if category == c.cat_title:
            cat_id=c.id
            break

    logger.info("cat id in api is: %r", cat_id)

    p_id = db.reports.insert(
        latitude=request.vars.latitude,
        longitude=request.vars.longitude,
        cat_id=cat_id,
        description=request.vars.description,
        pretty_address=request.vars.pretty_address,
        want_updates=request.vars.want_updates,
        #user_id=auth.user_id #if auth.user else None
    )

    return 'ok'




