def index():
    pass


def get_coordinates():
    # python list
    locations = db(db.banana).select(db.banana.ALL)

    return response.json(dict(locations=locations))


def get_categories():
    categories = db(db.categories).select(db.categories.ALL)
    return response.json(dict(categories=categories))


def get_reports():

    reports = []
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

    p_id = db.posts.insert(
        latitude=request.vars.latitude,
        longitude=request.vars.longitude,
        category=request.vars.category,
        description=request.vars.post_content,
        pretty_address=request.vars.pretty_address,
        user_email=auth.user.email if auth.user.id else None,
        want_updates=request.vars.want_updates,
    )





