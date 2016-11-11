def can_go_to_admin_page(user_email=None):
    if user_email is None and auth.user:
        user_email=auth.user.email

    pr = db(db.permissions.user_email == user_email).select().first()
    if pr == None:
        return False

    logger.info("pr in z_access: %r", pr)

    return pr.permission_type in ['admin','read-write']

def can_change_permissions(user_email=None):
    if user_email is None and auth.user:
        user_email = auth.user.email

    pr = db(db.permissions.user_email == user_email).select().first()

    if pr == None:
        return False

    return pr.permission_type in ['admin']