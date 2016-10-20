# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime

auth.settings.extra_fields['auth_user'] =[Field('is_employee')]

db.define_table('municipalities',
                Field('mun_name', 'string'),
                Field('mun_address', 'string')
                )

db.define_table('employees',
                Field('fname', 'string'),
                Field('lname', 'string'),
                Field('department', 'string')
                )

db.define_table('categories',
                Field('cat_title', 'string')
                )

db.define_table('reports',
                Field('mun_id', db.municipalities),
                Field('user_id', db.auth_user),
                Field('cat_id', db.categories),
                Field('description', 'text'),
                Field('latitude', 'double'),
                Field('longitude', 'double'),
                Field('lat_long', 'string'),
                Field('square_key', 'integer'),
                Field('want_updates', 'boolean'),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow()),
                Field('status', 'integer'),
                Field('progress', 'integer'),
                )

db.define_table('progress',
                Field('progress_title', 'string')
                )











# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
