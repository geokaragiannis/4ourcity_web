import json
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText


def index():
    pass

def send_email(toaddr, subject, body):
    fromaddr = '4ourciti@gmail.com'
    toaddr = toaddr
    msg = MIMEMultipart()
    msg['From'] = fromaddr
    msg['To'] = toaddr
    msg['Subject'] = subject

    body = body
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(fromaddr, "4ourcity13")
        text = msg.as_string()
        server.sendmail(fromaddr, toaddr, text)
        server.quit()
    except smtplib.SMTPException:
        logger.info( "Error: unable to send email")


def get_categories():
    categories = db(db.categories).select(db.categories.ALL)
    return response.json(dict(categories=categories))


def get_reports():

    mun_name = request.vars.mun_name if request.vars.mun_name is not None else None
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    query_category = json.loads(request.vars.query_category)
    show_finished = json.loads(request.vars.show_finished)

    logger.info("mun_name %r", mun_name)
    logger.info("category in api get_reports: %r", query_category)
    logger.info("show_finished: %r", show_finished)

    m_row = db(db.municipalities.mun_name == mun_name).select(db.municipalities.id).first()

    logger.info("m_row %r", m_row)

    # if none, then municipality is not in the table
    if m_row is None:
        return 'nok'

    # mun_id of municipality specified
    mun_id = m_row.id

    # default query:
    # 1) same mun_id
    # 2) status is accepted (id=2)
    # 3) progress is either "seen" or "in progress" (id= 2 or 3)
    #
    # if show_finished is true then also show the progress -->finished (id=4)

    if not show_finished:
        ultimate_query = ((db.reports.mun_id == mun_id) & (db.reports.status_id == 2) & ((db.reports.progress_id == 2) | (db.reports.progress_id == 3)))
    else:
        ultimate_query = ((db.reports.mun_id == mun_id) & (db.reports.status_id == 2) & ((db.reports.progress_id == 2) | (db.reports.progress_id == 3) | (db.reports.progress_id == 4)))

    if len(query_category) != 0:
        qc = (db.reports.cat_id == query_category[0])
        for s in range(1, len(query_category)):
            qc |= (db.reports.cat_id == query_category[s])
        ultimate_query &= qc
    else:
        qc = None


    logger.info("municipality name is: %r", mun_name)
    logger.info("mun_id is: %r", mun_id)

    reports = []
    has_more = False

    logger.info("big daddy in get_reports in api: %r", ultimate_query)

    # query over the searched municipality (i.e the mun_name we get from the request.vars).
    # we get the id of the requested municipality and return the list of reports that belong to it
    # change the status_id == 2 (do not hard code it)
    rows = db(ultimate_query).select(db.reports.ALL, limitby=(start_idx, end_idx + 1), orderby=~db.reports.created_on)
    #rows = db().select(db.reports.ALL)

    for i,r in enumerate(rows):
        if i < end_idx - start_idx:
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
        else:
            has_more = True

    logged_in = auth.user_id is not None
    # the current logged in user
    logged_user = auth.user.email if auth.user else None

    return response.json(dict(
        reports=reports,
        logged_in=logged_in,
        logged_user=logged_user,
        has_more=has_more
    ))


@auth.requires_signature()
def add_report():

    municipality = request.vars.municipality
    category = request.vars.category

    logger.info("user id is: %r", auth.user_id)
    logger.info("municipality in api: %r", municipality)

    cat_row = db(db.categories.cat_title == category).select(db.categories.id).first()
    cat_id = cat_row.id

    mun_row = db(db.municipalities.mun_name == municipality).select(db.municipalities.id).first()
    # mun_id of municipality specified
    mun_id = mun_row.id


    logger.info("2 cat id in api is: %r", cat_id)
    logger.info("2 mun_id in api: %r", mun_id)

    p_id = db.reports.insert(
        latitude=request.vars.latitude,
        longitude=request.vars.longitude,
        cat_id=cat_id,
        description=request.vars.description,
        pretty_address=request.vars.pretty_address,
        want_updates=json.loads(request.vars.want_updates),
        mun_id=mun_id
        #user_id=auth.user_id #if auth.user else None
    )

    logged_user = auth.user.email if auth.user else None

    logger.info('want updates : %r', json.loads(request.vars.want_updates))

    if json.loads(request.vars.want_updates):
        send_email(logged_user,"thank you",'thx')

    return 'ok'


def get_reports_admin():
    # the current logged in user
    logged_user = auth.user.email if auth.user else None
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    query_status= json.loads(request.vars.query_status)
    query_progress= json.loads(request.vars.query_progress)
    query_category= json.loads(request.vars.query_category)

    auth_row = db(db.auth_user.email == logged_user).select().first()
    #logger.info("reputation of logged user: %r", auth_row)
    auth_rep = auth_row.reputation
    rep_row = db(db.reputation.reputation_scale == auth_rep).select().first()
    logger.info("reputation of logged user: %r", rep_row.reputation_label)


    logger.info("status in api: %r", query_status)
    logger.info("progress in api: %r", query_progress)
    logger.info("category in api: %r", query_category)

    row = db(db.permissions.user_email == logged_user).select().first()
    # this is the mun id of the municipality that the logged user (employee) belongs
    mun_id = row.mun_id

    ultimate_query= (db.reports.mun_id == mun_id)
    # if query_status is empty, then qs (status query) is None
    # Otherwise we initialize qs to be the first query in query_status
    # and then if query_status has more elements, we append to qs
    if len(query_status) != 0:
        qs = (db.reports.status_id == query_status[0])
        for s in range(1,len(query_status)):
            qs |=(db.reports.status_id == query_status[s])
        ultimate_query &= qs
    else:
        qs = None

    if len(query_progress) != 0:
        qp = (db.reports.progress_id == query_progress[0])
        for s in range(1, len(query_progress)):
            qp |= (db.reports.progress_id == query_progress[s])
        ultimate_query &= qp
    else:
        qp = None

    if len(query_category) != 0:
        qc = (db.reports.cat_id == query_category[0])
        for s in range(1, len(query_category)):
            qc |= (db.reports.cat_id == query_category[s])
        ultimate_query &= qc
    else:
        qc = None



    logger.info("qs in api: %r", qs)
    logger.info("qp in api: %r", qp)
    logger.info("qc in api: %r", qc)

    logger.info("big daddy in api: %r", ultimate_query)

    #now send reports of mun_id
    rows = db(ultimate_query).select(db.reports.ALL, limitby=(start_idx, end_idx + 1), orderby=~db.reports.created_on)
    reports=[]
    has_more = False
    for i,r in enumerate(rows):
        if i < end_idx - start_idx:
            user_row = db(db.auth_user.id == r.user_id).select().first()
            rep_row = db(db.reputation.reputation_scale == user_row.reputation).select().first()
            rep_label = rep_row.reputation_label
            logger.info("reputation of %r is: %r", user_row.email, rep_label)
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
                photo = r.photo,
                reputation = rep_label
            )
            reports.append(t)
        else:
            has_more = True

    logged_in = auth.user_id is not None
    is_admin = can_change_permissions(logged_user)
    logger.info("has more: %r", has_more)

    return response.json(dict(
        reports=reports,
        logged_in=logged_in,
        logged_user=logged_user,
        is_admin=is_admin,
        has_more=has_more
    ))

# returns the progress, status tables
def get_progress_status():
    progress = db(db.progress).select(db.progress.ALL)
    status = db(db.status).select(db.status.ALL)
    return response.json(dict(progress=progress, status=status))


def post_backend_changes():
    backend_changes = json.loads(request.vars.backend_changes)

    for b in backend_changes:
        report = db(db.reports.id == b['id']).select().first()
        # status, progress ids that correspond to the title sent by client. Needed to
        # update the db

        # user that made the report
        auth_row = db(db.auth_user.id == report.user_id).select().first()

        status_row = db(db.status.status_title ==b['status']).select(db.status.id).first()
        status_id = status_row.id

        progress_row = db(db.progress.progress_title == b['progress']).select(db.progress.id).first()
        progress_id = progress_row.id

        # if report was pending and it was changed to accepted add one to the reputation of the user
        # if report was pending and it was changed to rejected subtract one from the reputation of the user
        # In either case 1<=reputation<=10

        if report.status_id == 1 and status_id == 2:
            if auth_row.reputation <10:
                new_rep = auth_row.reputation + 1
                auth_row.update_record(reputation=new_rep)

        if report.status_id == 1 and status_id == 3:
            if auth_row.reputation>1:
                new_rep = auth_row.reputation - 1
                auth_row.update_record(reputation=new_rep)

        logger.info("reputation of %r changed to: %r", auth_row.email, auth_row.reputation)
        logger.info("status id: %r", status_id)
        logger.info("rpogress id: %r", progress_id)

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

    for p in permission_changes:
        # record in db before update
        permission = db(db.permissions.id == p['id']).select().first()

        permission_row = db(db.permission_types.permission_name == p['permission_type']).select(db.permission_types.id).first()
        permission_type_id = permission_row.id


        logger.info("2 perm_id: %r", permission_type_id)
        permission.update_record(permission_type=permission_type_id)

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



    # here we just query on the permission_types table to find the row with permission_name = permission_type
    #(gotten from client) and then return the id, so that we insert it to the table permissions
    permission_type_row = db(db.permission_types.permission_name == permission_type).select(db.permission_types.id).first()
    permission_type_id = permission_type_row.id
    logger.info("perm type x is: %r", permission_type_id)

    p_id = db.permissions.insert(
        user_name = user_name,
        user_email = user_email,
        mun_id = mun_id,
        permission_type=permission_type_id
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
    rows = db(db.messages.report_id == report_id).select(db.messages.ALL, limitby=(start_idx, end_idx + 1), orderby=~db.messages.created_on)
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            permission_row = db(db.permissions.id == r.author).select(db.permissions.ALL).first()
            author = permission_row.user_name
            t = dict(
                id=r.id,
                message_author=author,
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

    m = db.messages(m_id)

    author = permission_row.user_name
    message = dict(
        id=m_id,
        message_author=author,
        message_content=m.message_content,
        created_on=m.created_on,
    )

    return response.json(dict(message=message))
