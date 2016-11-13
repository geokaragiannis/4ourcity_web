def can_go_to_admin_page(user_email=None):
    if user_email is None and auth.user:
        user_email=auth.user.email

    # permission fror logged in user
    pr = db(db.permissions.user_email == user_email).select().first()
    if pr == None:
        return False

    logger.info("pr in z_access: %r", pr)

    # all the permissions
    p_types = db(db.permission_types).select(db.permission_types.ALL)

    # dict that has as keys the permission names and as values the ids in the
    # permission_types table
    types_dict = dict()
    for t in p_types:
        types_dict[t.permission_name] = t.id

    return pr.permission_type in [types_dict['admin'],types_dict['read-write']]

def can_change_permissions(user_email=None):
    if user_email is None and auth.user:
        user_email = auth.user.email

    pr = db(db.permissions.user_email == user_email).select().first()

    if pr == None:
        return False

    # all the permissions
    p_types = db(db.permission_types).select(db.permission_types.ALL)

    # dict that has as keys the permission names and as values the ids in the
    # permission_types table
    types_dict = dict()
    for t in p_types:
        types_dict[t.permission_name] = t.id

    return pr.permission_type in [types_dict['admin']]
