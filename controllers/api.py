def index():
    pass


def get_coordinates():
    # python list
    locations = db(db.banana).select(db.banana.ALL)

    return response.json(dict(locations=locations))