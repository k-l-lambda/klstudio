
import types
import string
import datetime

from google.appengine.api import users
from google.appengine.ext import db


class PlainText:
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return self.value


def save(data):
    t = type(data)
    if t is types.ListType:
        return '{%s}' % string.join([save(elem) for elem in data], ',')
    if t is types.DictType:
        return '{%s}' % string.join(['%s=%s' % (key, save(data[key])) for key in data], ',')
    elif (t in [types.StringType, types.UnicodeType]) or isinstance(data, db.Text):
        return '"%s"' % data
    elif t is types.BooleanType:
        return data and 'true' or 'false'
    elif t is types.NoneType:
        return 'nil'
    elif t in [types.IntType, types.LongType, types.FloatType] or isinstance(data, PlainText):
        return str(data)
    elif isinstance(data, datetime.datetime):
        return '"%s"' % str(data)
    elif isinstance(data, users.User):
        return '{nickname="%s",email="%s",user_id="%s"}' % (data.nickname(), data.email(), data.user_id())
    else:
        raise RuntimeError('unsupported type: %s' % t)


def saveTuple(*datas):
    return tuple([save(d) for d in datas])