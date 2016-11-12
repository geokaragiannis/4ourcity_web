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

    mun_name = request.vars.mun_name if request.vars.mun_name is not None else None

    mun_rows = db().select(db.municipalities.ALL)

    mun_id = None

    for m in mun_rows:
        if mun_name == m.mun_name:
            mun_id=m.id
            break

    logger.info("municipality name is: %r", mun_name)
    logger.info("mun_id is: %r", mun_id)

    reports = []

    # only iterate on accepted reports
    #rows = db(db.reports.status_id == 2).select()

    # query over the searched municipality (i.e the mun_name we get from the request.vars).
    # we get the id of the requested municipality and return the list of reports that belong to it
    rows = db(db.reports.mun_id == mun_id).select()
    #rows = db().select(db.reports.ALL)

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

    municipality = request.vars.municipality
    category = request.vars.category
    cat_id = None
    mun_id = None

    cat_rows = db().select(db.categories.ALL)
    mun_rows = db().select(db.municipalities.ALL)

    logger.info("user id is: %r", auth.user_id)
    logger.info("municipality in api: %r", municipality)

    for c in cat_rows:
        if category == c.cat_title:
            cat_id=c.id
            break

    for m in mun_rows:
        if municipality == m.mun_name:
            mun_id=m.id
            break


    logger.info("cat id in api is: %r", cat_id)
    logger.info("mun_id in api: %r", mun_id )

    p_id = db.reports.insert(
        latitude=request.vars.latitude,
        longitude=request.vars.longitude,
        cat_id=cat_id,
        description=request.vars.description,
        pretty_address=request.vars.pretty_address,
        want_updates=request.vars.want_updates,
        mun_id=mun_id
        #user_id=auth.user_id #if auth.user else None
    )

    return 'ok'


def get_reports_admin():
    # the current logged in user
    logged_user = auth.user.email if auth.user else None

    row = db(db.permissions.user_email == logged_user).select().first()

    # this is the mun id of the municipality that the logged user (employee) belongs
    mun_id = row.mun_id

    #now send reports of mun_id
    rows = db(db.reports.mun_id == mun_id).select()
    reports=[]
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
    is_admin = can_change_permissions(logged_user)

    return response.json(dict(
        reports=reports,
        logged_in=logged_in,
        logged_user=logged_user,
        is_admin=is_admin
    ))

def get_progress_status():
    progress = db(db.progress).select(db.progress.ALL)
    status = db(db.status).select(db.status.ALL)
    return response.json(dict(progress=progress, status=status))
