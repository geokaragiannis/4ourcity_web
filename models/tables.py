# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime

db.define_table('municipalities',
                Field('mun_name', 'string'),
                Field('mun_address', 'string')
                )

# check db.py for reputation table

# not used for now
db.define_table('employees',
                Field('fname', 'string'),
                Field('lname', 'string'),
                Field('department', 'string')
                )

db.define_table('categories',
                Field('cat_title', 'string'),
                )

db.define_table('progress',
                Field('progress_title', 'string')
                )

db.define_table('status',
                Field('status_title', 'string')
                )


# status:   1 --> 'pending'
#           2 --> 'accepted'
#           3 --> 'rejected'

# progress: 1 --> 'N/A'
#           2 --> 'seen'
#           3 --> 'in progress'
#           4 --> 'finished'

db.define_table('reports',
                Field('mun_id', db.municipalities),
                Field('user_id', db.auth_user),
                Field('cat_id', 'reference categories', label='Categories', requires=IS_NOT_EMPTY()),
                Field('description', 'text', requires=IS_NOT_EMPTY()),
                Field('latitude', 'double'),
                Field('longitude', 'double'),
                Field('lat_long', 'string'),
                Field('pretty_address', 'string'),
                Field('square_key', 'integer'),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow()),
                Field('status_id', db.status, default=1),
                Field('progress_id', db.progress, default=1),
                Field('has_image','boolean'),
                Field('want_updates', 'boolean'),
                )

db.reports.mun_id.readable = db.reports.mun_id.writable = False
db.reports.user_id.readable = db.reports.user_id.writable = False
db.reports.user_id.default = auth.user_id
db.reports.cat_id.requires = IS_IN_DB(db,'categories.id', '%(cat_title)s', zero=T('choose one'))
db.reports.mun_id.requires = IS_IN_DB(db,'municipalities.id', '%(mun_name)s', zero=T('choose one'))
db.reports.status_id.requires = IS_IN_DB(db,'status.id', '%(status_title)s', zero=T('choose one'))
db.reports.progress_id.requires = IS_IN_DB(db,'progress.id', '%(progress_title)s', zero=T('choose one'))
db.reports.latitude.readable = db.reports.latitude.writable = False
db.reports.longitude.readable = db.reports.longitude.writable = False
db.reports.square_key.readable = db.reports.square_key.writable = False
db.reports.lat_long.readable = db.reports.lat_long.writable = False


db.define_table('images',
                Field('report_id', db.reports),
                Field('original_filename'),
                Field('data_blob', 'blob'),
                Field('mime_type')
                )


db.define_table('permission_types',
                Field('permission_name', 'string'))

db.define_table('permissions',
                Field('user_email', 'string'),
                Field('user_name', 'string'),
                Field('mun_id', db.municipalities),
                Field('permission_type', db.permission_types))

db.permissions.permission_type.requires = IS_IN_DB(db,'permission_types.id', '%(permission_name)s', zero=T('choose one'))
db.permissions.mun_id.requires = IS_IN_DB(db,'municipalities.id', '%(mun_name)s', zero=T('choose one'))

db.define_table('messages',
                Field('report_id', db.reports),
                Field('mun_id', db.municipalities),
                Field('author', db.permissions),
                Field('message_content', 'text' , requires=IS_NOT_EMPTY()),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow()))





#db.permissions.truncate()
# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)

db.auth_user.reputation.readable = db.auth_user.reputation.writable  = False
