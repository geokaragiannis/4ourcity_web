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

db.define_table('employees',
                Field('fname', 'string'),
                Field('lname', 'string'),
                Field('department', 'string')
                )

db.define_table('categories',
                Field('cat_title', 'string'),
                )


# status:   0 --> 'pending'
#           1 --> 'accepted'
#           2 --> 'rejected'

# progress: 0 --> 'N/A'
#           1 --> 'seen'
#           2 --> 'in progress'
#           3 --> 'finished'

db.define_table('reports',
                Field('mun_id', db.municipalities),
                Field('user_id', db.auth_user),
                Field('cat_id', db.categories, label='Categories', requires=IS_NOT_EMPTY()),
                Field('description', 'text', requires=IS_NOT_EMPTY()),
                Field('latitude', 'double'),
                Field('longitude', 'double'),
                Field('lat_long', 'string'),
                Field('square_key', 'integer'),
                Field('created_on', 'datetime', default=datetime.datetime.utcnow()),
                Field('status', 'integer', default=0),
                Field('progress', 'integer', default=0),
                Field('photo','upload'),
                Field('want_updates', 'boolean'),
                )

db.reports.mun_id.readable = db.reports.mun_id.writable = False
db.reports.user_id.readable = db.reports.user_id.writable = False
db.reports.latitude.readable = db.reports.latitude.writable = False
db.reports.longitude.readable = db.reports.longitude.writable = False
db.reports.square_key.readable = db.reports.square_key.writable = False
db.reports.lat_long.readable = db.reports.lat_long.writable = False


db.define_table('progress',
                Field('progress_title', 'string')
                )

db.define_table('messages',
                Field('report_id', db.reports),
                Field('employee_id', db.auth_user),
                Field('title', 'string'),
                Field('msg_content', 'text' , requires=IS_NOT_EMPTY()),
                Field('created_on', 'datetime'),
                )

db.define_table('banana',
                Field('latitude', 'double'),
                Field('longitude', 'double'),
                Field('map_popup', 'string')
                )

db.banana.insert(latitude=36.996164,longitude=-122.058640,map_popup='im here')


db.categories.insert(cat_title='trash')
db.categories.insert(cat_title='graffiti')
db.categories.insert(cat_title='pothole')
db.categories.insert(cat_title='broken light')

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
