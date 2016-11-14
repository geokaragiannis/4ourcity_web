import json


def index():
    pass


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
    # change the status_id == 2 (do not hard code it)
    query = ((db.reports.mun_id == mun_id) & (db.reports.status_id == 2))
    rows = db(query).select()
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

# returns the progress, status tables
def get_progress_status():
    progress = db(db.progress).select(db.progress.ALL)
    status = db(db.status).select(db.status.ALL)
    return response.json(dict(progress=progress, status=status))


def post_backend_changes():
    backend_changes = json.loads(request.vars.backend_changes)

    # status_dict is a dictionary that holds the values of the status titles and the
    # corresponding ids as keys
    status_rows=db().select(db.status.ALL)
    status_dict = dict()
    for s in status_rows:
        status_dict[s.status_title] = s.id

    # progress_dict is a dictionary that holds the values of the progress titles and the
    # corresponding ids as keys
    progress_rows = db().select(db.progress.ALL)
    progress_dict = dict()
    for p in progress_rows:
        progress_dict[p.progress_title] = p.id

    for b in backend_changes:
        report = db(db.reports.id == b['id']).select().first()
        # status, progress ids that correspond to the title sent by client. Needed to
        # update the db
        status_id = status_dict[b['status']]
        progress_id = progress_dict[b['progress']]
        report.update_record(status_id=status_id,progress_id=progress_id)

    return 'ok'

def get_permissions():

    user_email = auth.user.email if auth.user else None

    row = db(db.permissions.user_email == user_email).select().first()
    mun_id = row.mun_id

    # permission people of mun_id
    permission_rows = db(db.permissions.mun_id == mun_id).select()
    permissions = []
    for i,r in enumerate(permission_rows):
        t = dict(
            id = r.id,
            user_email = r.user_email,
            user_name = r.user_name,
            permission_type = r.permission_type.permission_name,
        )
        permissions.append(t)

    #permission types
    permission_types = db(db.permission_types).select(db.permission_types.ALL)

    return response.json(dict(permissions=permissions, permission_types=permission_types))

def post_permission_changes():
    permission_changes = json.loads(request.vars.permission_changes)

    # permission_type_dict is a dictionary that holds the values of the status titles and the
    # corresponding ids as keys
    permission_types_rows = db().select(db.permission_types.ALL)
    permission_type_dict = dict()
    for t in permission_types_rows:
        permission_type_dict[t.permission_name] = t.id


    for p in permission_changes:
        # record in db before update
        permission = db(db.permissions.id == p['id']).select().first()
        # permission_type (id --> int) that corresponds to the permission_type (string) sent by client. Needed to
        # update the db.
        permission_type = permission_type_dict[p['permission_type']]
        permission.update_record(permission_type=permission_type)

    return 'ok'


def post_new_permission():

    # get the email of logged in user
    logged_email = auth.user.email if auth.user else None

    row = db(db.permissions.user_email == logged_email).select().first()
    # mun_id of the logged in user is the mun id of the new user we want to add
    mun_id = row.mun_id


    # posted data from client
    user_name = request.vars.user_name
    user_email = request.vars.user_email
    permission_type = request.vars.permission_type

    permission_types_rows = db().select(db.permission_types.ALL)
    permission_type_dict = dict()
    for t in permission_types_rows:
        permission_type_dict[t.permission_name] = t.id

    # here we just query on the permission_types table to find the row with permission_name = permission_type
    #(gotten from client) and then return the id, so that we insert it to the table permissions
    x = db(db.permission_types.permission_name == permission_type).select(db.permission_types.id).first()
    logger.info("perm type x is: %r", x.id)
    logger.info("permission type is: %r" ,permission_type_dict[permission_type])

    p_id = db.permissions.insert(
        user_name = user_name,
        user_email = user_email,
        mun_id = mun_id,
        permission_type=permission_type_dict[permission_type]
    )

    return response.json(dict(id=p_id))


def delete_permission():

    id = request.vars.id

    db(db.permissions.id == id).delete()
    return 'ok'

def get_messages():
    # get the report_id start_idx, end_idx from client
    report_id = int(request.vars.report_id) if request.vars.report_id is not None else -1
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0

    messages = []
    has_more = False
    rows = db(db.messages.report_id == report_id).select(db.messages.ALL, limitby=(start_idx, end_idx + 1), orderby=~db.posts.created_on)
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            t = dict(
                id=r.id,
                message_author=r.author,
                message_content=r.message_content,
                created_on=r.created_on,
            )
            messages.append(t)
        else:
            has_more = True

    return response.json(dict(
        messages=messages,
        has_more=has_more
    ))

def post_message():
    report_id = request.vars.id
    message_content = request.vars.message_content

    user_email = auth.user.email if auth.user else None
    # return it so we can display it
    user_name_row = db(db.auth_user.email == user_email).select(db.auth_user.first_name)
    #user_name = user_name_row.first_name
    logger.info('user_name: %r', user_name_row)

    # permission_rows = db().select(db.permissions.ALL)
    # permission_dict = dict()
    # for p in permission_rows:
    #     permission_dict[p.user_email] = p.id
    #
    # # integer id, which is a fk to permissions (author which points to permissions table)
    # author = permission_dict[user_email]
    # logger.info("author id is: %r", author)

    permission_row = db(db.permissions.user_email == user_email).select(db.permissions.ALL).first()

    # get the id from the row above
    author_id = permission_row.id
    logger.info("author_id is: %r", author_id)

    # get the mun_id from the row above
    mun_id = permission_row.mun_id
    logger.info("mun_id is: %r", mun_id)

    m_id = db.messages.insert(
        author=author_id,
        report_id=report_id,
        mun_id=mun_id,
        message_content=message_content,

    )

    return 'ok'
