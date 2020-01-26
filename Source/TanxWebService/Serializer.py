
import types
import string
import datetime

from django.utils import simplejson
from google.appengine.api import users
from google.appengine.ext import db


class PlainText:
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return self.value


def normalizeData(data):
    t = type(data)
    if t is types.ListType:
        return map(lambda elem: normalizeData(elem), data)
    elif t is types.DictType:
        return dict(map(lambda elem: (elem, normalizeData(data[elem])), data))
    elif t is types.DictType \
        or (t in [types.StringType, types.UnicodeType]) or isinstance(data, db.Text) \
        or t is types.BooleanType \
        or t is types.NoneType \
        or t in [types.IntType, types.LongType, types.FloatType]:
        return data
    elif isinstance(data, PlainText):
        return unicode(data)
    elif isinstance(data, datetime.datetime):
        return str(data)
    elif isinstance(data, users.User):
        return {'nickname': data.nickname(), 'email': data.email(), 'user_id': data.user_id()}
    else:
        raise RuntimeError('unsupported type: %s' % t)


def save(data):
    return simplejson.dumps(normalizeData(data))


def saveTuple(*datas):
    return tuple([save(d) for d in datas])
